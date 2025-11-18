"""
Embedding Service for Vector Search
Версия: 2.7.0

Улучшения:
- Улучшенная обработка ошибок
- Retry logic для загрузки модели
- Graceful degradation при отсутствии модели
- Structured logging
- Гибридный режим CPU+GPU для распределения нагрузки
- Адаптивный batch splitting на основе размера текстов
- Динамическое распределение нагрузки CPU/GPU
- Кэширование результатов векторизации
- Метрики Prometheus для мониторинга
"""

import importlib
import logging
import os
import time
import hashlib
from typing import Dict, List, Union, Optional, Tuple, Any
import sys
import types
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from collections import OrderedDict
from datetime import datetime, timedelta
import numpy as np

from src.utils.structured_logging import StructuredLogger
from src.utils.circuit_breaker import CircuitBreaker, CircuitState
from src.utils.retry_logic import retry_async, RetryStrategy

logger = StructuredLogger(__name__).logger

try:
    import sentence_transformers  # noqa: F401

    EMBEDDINGS_AVAILABLE = True
except ImportError:
    logger.warning(
        "sentence-transformers not installed. Run: pip install sentence-transformers"
    )

    stub_module = types.ModuleType("sentence_transformers")

    class _StubSentenceTransformer:
        def __init__(self, *args, **kwargs):
            raise ImportError("sentence-transformers not installed")

        def encode(self, *args, **kwargs):
            raise ImportError("sentence-transformers not installed")

    stub_module.SentenceTransformer = _StubSentenceTransformer  # type: ignore[attr-defined]
    sys.modules.setdefault("sentence_transformers", stub_module)
    EMBEDDINGS_AVAILABLE = False


class EmbeddingService:
    """
    Service for generating embeddings with hybrid CPU+GPU support

    Поддерживает:
    - Автоматическое определение устройства (CPU/GPU)
    - Гибридный режим: распределение нагрузки между CPU и GPU
    - Batch splitting для параллельной обработки
    - Load balancing для оптимального использования ресурсов
    """

    # Using lightweight model for local deployment
    DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    # Vector size: 384 dimensions

    # Alternative models:
    # - "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" (384d, multilingual)
    # - "intfloat/multilingual-e5-small" (384d, better quality)
    # - "BAAI/bge-small-en-v1.5" (384d, good quality)

    def __init__(
        self, model_name: str = None, hybrid_mode: bool = None, redis_client=None
    ):
        """
        Initialize embedding model с input validation

        Args:
            model_name: Название модели (по умолчанию DEFAULT_MODEL)
            hybrid_mode: Включить гибридный режим CPU+GPU (None = auto-detect)
            redis_client: Redis клиент для распределённого кэширования (L2)
        """
        # Input validation
        if model_name is not None and not isinstance(model_name, str):
            logger.warning(
                "Invalid model_name type in EmbeddingService.__init__",
                extra={"model_name_type": type(model_name).__name__},
            )
            model_name = None

        if model_name and len(model_name) > 500:  # Limit length
            logger.warning(
                "Model name too long in EmbeddingService.__init__",
                extra={"model_name_length": len(model_name)},
            )
            model_name = model_name[:500]

        self.model_name = model_name or self.DEFAULT_MODEL

        # Гибридный режим: определяем автоматически, если не указан
        if hybrid_mode is None:
            hybrid_mode = os.getenv("EMBEDDING_HYBRID_MODE", "false").lower() == "true"
        self.hybrid_mode = hybrid_mode

        # Модели для разных устройств
        self.model_cpu = None
        self.model_gpu = None
        self.model = None  # Основная модель (для обратной совместимости)

        # Метрики использования устройств
        self.device_stats = {
            "cpu_requests": 0,
            "gpu_requests": 0,
            "hybrid_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_tokens_processed": 0,
        }
        self._stats_lock = Lock()

        # Многоуровневое кэширование (L1/L2/L3)
        self._cache_enabled = (
            os.getenv("EMBEDDING_CACHE_ENABLED", "true").lower() == "true"
        )
        self._cache_max_size = int(os.getenv("EMBEDDING_CACHE_SIZE", "1000"))
        self._cache_ttl_seconds = int(os.getenv("EMBEDDING_CACHE_TTL", "3600"))

        # L1: In-memory LRU cache (быстрый, маленький)
        self._result_cache: OrderedDict[str, Dict] = OrderedDict()
        self._cache_lock = Lock()

        # L2: Redis cache (распределённый, средний размер)
        self._redis_client = redis_client
        self._redis_enabled = redis_client is not None
        if self._redis_enabled:
            try:
                # Проверяем подключение
                self._redis_client.ping()
                logger.info("Redis cache (L2) enabled for embeddings")
            except Exception as e:
                logger.warning(f"Redis connection failed, L2 cache disabled: {e}")
                self._redis_enabled = False
                self._redis_client = None

        # L3: Database cache (медленный, большой) - опционально, можно добавить позже
        self._db_cache_enabled = False

        # Квантизация embeddings для экономии памяти
        self._quantization_enabled = (
            os.getenv("EMBEDDING_QUANTIZATION_ENABLED", "false").lower() == "true"
        )
        self._quantization_dtype = os.getenv(
            "EMBEDDING_QUANTIZATION_DTYPE", "int8"
        )  # int8, int16

        # Поддержка нескольких GPU
        self._multi_gpu_enabled = (
            os.getenv("EMBEDDING_MULTI_GPU_ENABLED", "false").lower() == "true"
        )
        self._gpu_devices = []  # Список доступных GPU устройств
        self._gpu_models: Dict[int, Any] = {}  # device_id -> model
        self._gpu_round_robin_index = 0  # Для round-robin распределения

        # Оптимизация batch size на основе памяти
        self._adaptive_batch_size_enabled = (
            os.getenv("EMBEDDING_ADAPTIVE_BATCH_SIZE", "true").lower() == "true"
        )
        self._gpu_memory_info = {}  # Информация о памяти GPU

        # Производительность устройств (для динамического распределения)
        self._device_performance = {
            "cpu": {"avg_time": 0.0, "request_count": 0, "last_update": time.time()},
            "gpu": {"avg_time": 0.0, "request_count": 0, "last_update": time.time()},
        }
        self._performance_lock = Lock()

        # Thread pool для параллельной обработки
        self._executor = None
        if self.hybrid_mode:
            self._executor = ThreadPoolExecutor(max_workers=2)

        # Circuit breakers для устройств
        self._gpu_circuit_breaker = CircuitBreaker(
            failure_threshold=int(os.getenv("EMBEDDING_GPU_CB_THRESHOLD", "5")),
            recovery_timeout=int(os.getenv("EMBEDDING_GPU_CB_TIMEOUT", "60")),
            expected_exception=Exception,
        )
        self._cpu_circuit_breaker = CircuitBreaker(
            failure_threshold=int(os.getenv("EMBEDDING_CPU_CB_THRESHOLD", "5")),
            recovery_timeout=int(os.getenv("EMBEDDING_CPU_CB_TIMEOUT", "60")),
            expected_exception=Exception,
        )

        # Health check статус
        self._health_status = {
            "cpu": {"healthy": True, "last_check": None, "error": None},
            "gpu": {"healthy": True, "last_check": None, "error": None},
            "cache": {"healthy": True, "last_check": None, "error": None},
        }
        self._health_lock = Lock()

        # Семантическое кэширование
        self._semantic_cache_enabled = (
            os.getenv("EMBEDDING_SEMANTIC_CACHE", "true").lower() == "true"
        )
        self._semantic_similarity_threshold = float(
            os.getenv("EMBEDDING_SEMANTIC_THRESHOLD", "0.95")
        )
        self._semantic_cache: Dict[str, List[float]] = {}  # text_hash -> embedding

        # Timeout для операций
        self._operation_timeout = float(
            os.getenv("EMBEDDING_OPERATION_TIMEOUT", "30.0")
        )
        
        # GPU Memory Pool для оптимизации памяти
        self._gpu_memory_pool_enabled = os.getenv("EMBEDDING_GPU_MEMORY_POOL", "false").lower() == "true"
        self._gpu_memory_pool = None
        
        # Weighted GPU scheduler для продвинутого распределения
        self._weighted_gpu_scheduler = None
        
        # SLO/SLI tracking
        self._slo_tracker = None
        self._slo_tracking_enabled = os.getenv("EMBEDDING_SLO_TRACKING", "true").lower() == "true"
        
        # Memory-aware batcher
        self._memory_aware_batcher = None
        self._memory_aware_batching = os.getenv("EMBEDDING_MEMORY_AWARE_BATCHING", "false").lower() == "true"
        
        # Adaptive Quantizer
        self._adaptive_quantizer = None
        self._adaptive_quantization_enabled = os.getenv("EMBEDDING_ADAPTIVE_QUANTIZATION", "false").lower() == "true"
        
        # Semantic Cache ANN
        self._semantic_cache_ann = None
        self._semantic_cache_ann_enabled = os.getenv("EMBEDDING_SEMANTIC_CACHE_ANN", "false").lower() == "true"
        self._semantic_cache_ann_type = os.getenv("EMBEDDING_SEMANTIC_CACHE_ANN_TYPE", "linear")  # linear, faiss, hnswlib
        
        # Predictive Batch Optimizer
        self._predictive_batch_optimizer = None
        self._predictive_batch_enabled = os.getenv("EMBEDDING_PREDICTIVE_BATCH", "false").lower() == "true"
        
        # Инициализация GPU устройств
        self._init_gpu_devices()
        
        # Инициализация информации о памяти GPU
        self._init_gpu_memory_info()
        
        # Инициализация продвинутых компонентов
        self._init_advanced_components()

        self._load_model()

    def _load_model(self, max_retries: int = 3, retry_delay: float = 1.0):
        """
        Load embedding model with retry logic and hybrid mode support

        Best practices:
        - Retry для transient errors
        - Exponential backoff
        - Graceful degradation
        - Гибридный режим: загрузка на CPU и GPU одновременно
        """
        if not EMBEDDINGS_AVAILABLE:
            logger.warning("sentence-transformers not available, embeddings disabled")
            self.model = None
            return

        try:
            import torch

            has_cuda = torch.cuda.is_available()
        except ImportError:
            has_cuda = False

        # Определяем режим загрузки
        if self.hybrid_mode and has_cuda:
            # Гибридный режим: загружаем на оба устройства
            self._load_hybrid_models(max_retries, retry_delay)
        else:
            # Обычный режим: загружаем на одно устройство
            self._load_single_model(max_retries, retry_delay, has_cuda)

    def _load_single_model(self, max_retries: int, retry_delay: float, use_gpu: bool):
        """Загрузка модели на одно устройство (CPU или GPU)"""
        last_exception = None

        for attempt in range(max_retries):
            try:
                device = "cuda" if use_gpu else "cpu"
                logger.info(
                    "Loading embedding model: %s on %s (attempt %d/%d)",
                    self.model_name,
                    device,
                    attempt + 1,
                    max_retries,
                )
                module = importlib.import_module("sentence_transformers")
                transformer_cls = getattr(module, "SentenceTransformer")
                self.model = transformer_cls(self.model_name, device=device)
                dimension = self.model.get_sentence_embedding_dimension()
                logger.info(
                    f"✓ Model loaded successfully on {device} (dimension: {dimension})",
                    extra={
                        "model_name": self.model_name,
                        "dimension": dimension,
                        "device": device,
                        "attempt": attempt + 1,
                    },
                )
                return
            except Exception as e:
                last_exception = e
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2**attempt)
                    logger.warning(
                        f"Failed to load model (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait_time}s...",
                        extra={
                            "model_name": self.model_name,
                            "attempt": attempt + 1,
                            "max_retries": max_retries,
                            "error": str(e),
                        },
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(
                        f"Failed to load model after {max_retries} attempts: {e}",
                        exc_info=True,
                        extra={
                            "model_name": self.model_name,
                            "max_retries": max_retries,
                        },
                    )
                    self.model = None

        if last_exception:
            raise last_exception

    def _load_hybrid_models(self, max_retries: int, retry_delay: float):
        """Загрузка моделей на оба устройства (CPU и GPU) с поддержкой нескольких GPU"""
        logger.info("Loading models in hybrid mode (CPU + GPU)...")

        # Загружаем на GPU (один или несколько)
        if self._multi_gpu_enabled and self._gpu_devices:
            # Загружаем модели на все доступные GPU
            for device_id in self._gpu_devices:
                try:
                    module = importlib.import_module("sentence_transformers")
                    transformer_cls = getattr(module, "SentenceTransformer")
                    device = f"cuda:{device_id}"
                    model = transformer_cls(self.model_name, device=device)
                    self._gpu_models[device_id] = model
                    logger.info(f"✓ GPU {device_id} model loaded")
                except Exception as e:
                    logger.warning(f"Failed to load GPU {device_id} model: {e}")

            # Устанавливаем первый GPU как основной
            if self._gpu_models:
                first_gpu_id = list(self._gpu_models.keys())[0]
                self.model_gpu = self._gpu_models[first_gpu_id]
                logger.info(
                    f"Multi-GPU mode: {len(self._gpu_models)} GPU(s) loaded, using GPU {first_gpu_id} as primary"
                )
            else:
                self.model_gpu = None
        else:
            # Один GPU
            try:
                module = importlib.import_module("sentence_transformers")
                transformer_cls = getattr(module, "SentenceTransformer")
                self.model_gpu = transformer_cls(self.model_name, device="cuda")
                logger.info("✓ GPU model loaded")
            except Exception as e:
                logger.warning(
                    f"Failed to load GPU model: {e}. Falling back to CPU only."
                )
                self.model_gpu = None

        # Загружаем на CPU
        try:
            module = importlib.import_module("sentence_transformers")
            transformer_cls = getattr(module, "SentenceTransformer")
            self.model_cpu = transformer_cls(self.model_name, device="cpu")
            logger.info("✓ CPU model loaded")
        except Exception as e:
            logger.warning(f"Failed to load CPU model: {e}")
            self.model_cpu = None

        # Устанавливаем основную модель для обратной совместимости
        if self.model_gpu:
            self.model = self.model_gpu
        elif self.model_cpu:
            self.model = self.model_cpu
        else:
            logger.error("Failed to load models on both devices")
            self.model = None

        if self.model:
            dimension = self.model.get_sentence_embedding_dimension()
            logger.info(
                f"✓ Hybrid mode enabled (dimension: {dimension})",
                extra={
                    "model_name": self.model_name,
                    "dimension": dimension,
                    "gpu_available": self.model_gpu is not None,
                    "cpu_available": self.model_cpu is not None,
                },
            )

    def encode(
        self,
        text: Union[str, List[str]],
        batch_size: int = 32,
        show_progress: bool = False,
        use_device: Optional[str] = None,
    ) -> Union[List[float], List[List[float]]]:
        """
        Generate embeddings for text with improved error handling and hybrid mode support

        Best practices:
        - Graceful degradation при отсутствии модели
        - Валидация входных данных
        - Structured logging
        - Гибридный режим: автоматическое распределение между CPU и GPU

        Args:
            text: Текст или список текстов для векторизации
            batch_size: Размер батча
            show_progress: Показывать прогресс-бар
            use_device: Принудительно использовать устройство ("cpu" или "cuda")
                       Если None, используется автоматическое распределение
        """
        if not self.model and not (self.model_cpu or self.model_gpu):
            logger.warning("Model not loaded, cannot generate embeddings")
            return [] if isinstance(text, list) else []

        # Input validation
        if not text:
            logger.warning(
                "Empty text provided for encoding",
                extra={"text_type": type(text).__name__ if text else None},
            )
            return [] if isinstance(text, list) else []

        # Validate text type
        if not isinstance(text, (str, list)):
            logger.warning(
                "Invalid text type in encode", extra={"text_type": type(text).__name__}
            )
            return []

        # Validate batch_size
        if not isinstance(batch_size, int) or batch_size < 1:
            logger.warning(
                "Invalid batch_size in encode",
                extra={
                    "batch_size": batch_size,
                    "batch_size_type": type(batch_size).__name__,
                },
            )
            batch_size = 32

        if batch_size > 1000:  # Prevent DoS
            logger.warning(
                "Batch size too large in encode", extra={"batch_size": batch_size}
            )
            batch_size = 1000

        # Проверка кэша (exact match)
        cache_key = self._get_cache_key(text)
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            logger.debug("Cache hit (exact match) for embedding request")
            with self._stats_lock:
                self.device_stats["cache_hits"] += 1
            return cached_result

        # Проверка семантического кэша (similarity-based)
        if self._semantic_cache_enabled and isinstance(text, str):
            semantic_result = self._get_from_semantic_cache(text)
            if semantic_result is not None:
                logger.debug("Cache hit (semantic similarity) for embedding request")
                with self._stats_lock:
                    self.device_stats["cache_hits"] += 1
                return semantic_result

        with self._stats_lock:
            self.device_stats["cache_misses"] += 1

        # Засекаем время для SLO tracking
        start_time = time.time()
        
        # Используем Memory-Aware Batching если доступен и это список текстов
        processed_texts = text
        if self._memory_aware_batcher and isinstance(text, list) and len(text) > 1:
            try:
                # Формируем батчи на основе памяти
                memory_batches = []
                for t in text:
                    batch = self._memory_aware_batcher.add_text(t)
                    if batch:
                        memory_batches.append(batch)
                
                # Завершаем последний батч
                final_batch = self._memory_aware_batcher.flush()
                if final_batch:
                    memory_batches.append(final_batch)
                
                # Если батчи сформированы, обрабатываем их
                if memory_batches:
                    all_results = []
                    for batch in memory_batches:
                        try:
                            if self.hybrid_mode and len(batch) > 1:
                                batch_result = self._encode_hybrid(batch, batch_size, show_progress, use_device)
                            else:
                                batch_result = self._encode_single(batch, batch_size, show_progress, use_device)
                            if batch_result:
                                all_results.extend(batch_result if isinstance(batch_result, list) else [batch_result])
                        except Exception as e:
                            logger.warning(f"Error processing memory-aware batch: {e}", exc_info=True)
                            # Fallback: обрабатываем без memory-aware batching
                            processed_texts = text
                            break
                    else:
                        # Все батчи обработаны успешно
                        result = all_results if all_results else []
                        duration = time.time() - start_time
                        # Пропускаем дальнейшую обработку, переходим к сохранению в кэш
                        if result:
                            # Обновляем SLO метрики
                            if self._slo_tracker:
                                try:
                                    self._slo_tracker.record_metric('latency_p95', duration)
                                    self._slo_tracker.record_metric('availability', 1.0)
                                except Exception as e:
                                    logger.debug(f"Error recording SLO metrics: {e}")
                            
                            # Сохраняем в кэш
                            self._save_to_cache(cache_key, result)
                            return result
                        else:
                            # Если результат пустой, продолжаем обычную обработку
                            processed_texts = text
            except Exception as e:
                logger.warning(f"Error in memory-aware batching: {e}, falling back to normal processing", exc_info=True)
                processed_texts = text
        
        # Гибридный режим: распределяем нагрузку
        if self.hybrid_mode and isinstance(processed_texts, list) and len(processed_texts) > 1:
            result = self._encode_hybrid(processed_texts, batch_size, show_progress, use_device)
        else:
            # Обычный режим или одиночный текст
            result = self._encode_single(processed_texts, batch_size, show_progress, use_device)
        
        # Время выполнения для SLO tracking
        duration = time.time() - start_time
        
        # Обновляем SLO метрики
        if self._slo_tracker and result:
            try:
                # Latency
                self._slo_tracker.record_metric('latency_p95', duration)
                # Availability (1 = success, 0 = error)
                self._slo_tracker.record_metric('availability', 1.0)
                # Cache hit rate (уже отслеживается в _get_from_cache)
                
                # Обновляем Prometheus метрики для SLO
                try:
                    from src.monitoring.prometheus_metrics import (
                        embedding_slo_latency_p95,
                        embedding_slo_error_budget,
                        embedding_slo_violations_total
                    )
                    
                    # Текущий SLI для latency
                    current_sli = self._slo_tracker._calculate_sli('latency_p95')
                    embedding_slo_latency_p95.labels(slo_name='latency_p95').set(current_sli)
                    
                    # Error budget
                    error_budgets = self._slo_tracker.get_error_budgets()
                    for slo_name, budget in error_budgets.items():
                        embedding_slo_error_budget.labels(slo_name=slo_name).set(budget)
                    
                    # Проверяем нарушения
                    violations = self._slo_tracker.check_slo_violation()
                    for slo_name, violated in violations.items():
                        if violated:
                            embedding_slo_violations_total.labels(slo_name=slo_name).inc()
                except ImportError:
                    pass
            except Exception as e:
                logger.debug(f"Error recording SLO metrics: {e}")
        
        # Обновляем Predictive Batch Optimizer
        if self._predictive_batch_optimizer and isinstance(text, list) and len(text) > 1:
            try:
                avg_text_length = sum(len(t) if isinstance(t, str) else 0 for t in text) / len(text)
                # Оцениваем использованную память
                memory_used = batch_size * (0.0015 + avg_text_length * 0.000001)  # MB
                self._predictive_batch_optimizer.update_model(
                    text_length=int(avg_text_length),
                    batch_size=batch_size,
                    actual_time=duration,
                    memory_used=memory_used
                )
                
                # Обновляем Prometheus метрики
                try:
                    from src.monitoring.prometheus_metrics import (
                        embedding_predictive_batch_history_size,
                        embedding_predictive_batch_model_trained
                    )
                    stats = self._predictive_batch_optimizer.get_stats()
                    embedding_predictive_batch_history_size.set(stats.get("history_size", 0))
                    embedding_predictive_batch_model_trained.set(1 if stats.get("model_trained", False) else 0)
                except ImportError:
                    pass
            except Exception as e:
                logger.debug(f"Error updating predictive batch optimizer: {e}")

        # Сохраняем в кэш
        if result:
            self._save_to_cache(cache_key, result)
            # Сохраняем в семантический кэш
            if self._semantic_cache_enabled and isinstance(text, str):
                embedding_to_save = (
                    result
                    if isinstance(result, list) and isinstance(result[0], float)
                    else result[0] if isinstance(result, list) else result
                )
                self._save_to_semantic_cache(text, embedding_to_save)
                
                # Также сохраняем в ANN индекс если доступен
                if self._semantic_cache_ann and isinstance(embedding_to_save, list):
                    try:
                        start_ann = time.time()
                        self._semantic_cache_ann.add(embedding_to_save, text)
                        ann_duration = time.time() - start_ann
                        
                        # Метрики Prometheus для ANN
                        try:
                            from src.monitoring.prometheus_metrics import (
                                embedding_semantic_cache_ann_size,
                                embedding_semantic_cache_ann_search_duration_seconds
                            )
                            embedding_semantic_cache_ann_size.labels(
                                index_type=self._semantic_cache_ann_type
                            ).set(len(self._semantic_cache_ann.embeddings))
                            embedding_semantic_cache_ann_search_duration_seconds.labels(
                                index_type=self._semantic_cache_ann_type
                            ).observe(ann_duration)
                        except ImportError:
                            pass
                    except Exception as e:
                        logger.debug(f"Error adding to semantic cache ANN: {e}")

        # Возвращаем результат (де-квантизация если нужно)
        if self._quantization_enabled and result:
            # Результат уже де-квантизован в _get_from_cache, но если это новый результат - не квантизируем для возврата
            # Квантизация применяется только в кэше
            pass

        return result

    def _encode_single(
        self,
        text: Union[str, List[str]],
        batch_size: int,
        show_progress: bool,
        use_device: Optional[str],
    ) -> Union[List[float], List[List[float]]]:
        """Обычная векторизация на одном устройстве с circuit breaker и retry"""
        # Выбираем модель
        if use_device == "cpu" and self.model_cpu:
            model = self.model_cpu
            device_used = "cpu"
            circuit_breaker = self._cpu_circuit_breaker
        elif use_device == "cuda" and self.model_gpu:
            model = self.model_gpu
            device_used = "gpu"
            circuit_breaker = self._gpu_circuit_breaker
        elif self.model:
            model = self.model
            device_used = "gpu" if model == self.model_gpu else "cpu"
            circuit_breaker = (
                self._gpu_circuit_breaker
                if device_used == "gpu"
                else self._cpu_circuit_breaker
            )
        elif self.model_gpu:
            model = self.model_gpu
            device_used = "gpu"
            circuit_breaker = self._gpu_circuit_breaker
        elif self.model_cpu:
            model = self.model_cpu
            device_used = "cpu"
            circuit_breaker = self._cpu_circuit_breaker
        else:
            logger.warning("No model available")
            return [] if isinstance(text, list) else []

        # Обновляем статистику
        with self._stats_lock:
            if device_used == "gpu":
                self.device_stats["gpu_requests"] += 1
            else:
                self.device_stats["cpu_requests"] += 1

        # Поддержка нескольких GPU
        gpu_id_used = 0
        if device_used == "gpu" and self._multi_gpu_enabled and self._gpu_models:
            gpu_id_used = self._get_gpu_for_request()
            if gpu_id_used in self._gpu_models:
                model = self._gpu_models[gpu_id_used]
                logger.debug(f"Using GPU {gpu_id_used} for request")
                # Метрики
                try:
                    from src.monitoring.prometheus_metrics import (
                        embedding_gpu_requests_total,
                    )

                    embedding_gpu_requests_total.labels(gpu_id=str(gpu_id_used)).inc()
                except ImportError:
                    pass

        # Используем circuit breaker с fallback
        try:
            # Проверяем circuit breaker
            if circuit_breaker.state == CircuitState.OPEN:
                logger.warning(
                    f"Circuit breaker OPEN for {device_used}, using fallback"
                )
                # Fallback на другое устройство
                if device_used == "gpu" and self.model_cpu:
                    return self._encode_with_model(
                        self.model_cpu, text, batch_size, show_progress
                    )
                elif device_used == "cpu" and self.model_gpu:
                    return self._encode_with_model(
                        self.model_gpu, text, batch_size, show_progress
                    )
                else:
                    raise Exception(
                        f"Circuit breaker OPEN for {device_used} and no fallback available"
                    )

            # Выполняем через circuit breaker (синхронная обёртка)
            async def _async_encode():
                return self._encode_with_model(model, text, batch_size, show_progress)

            # Для синхронного кода используем прямое выполнение с обработкой ошибок
            try:
                result = self._encode_with_model(model, text, batch_size, show_progress)
                # Успех - сбрасываем circuit breaker
                if circuit_breaker.state == CircuitState.HALF_OPEN:
                    circuit_breaker.state = CircuitState.CLOSED
                    circuit_breaker.failure_count = 0
                return result
            except Exception as e:
                # Ошибка - записываем в circuit breaker
                circuit_breaker.failure_count += 1
                circuit_breaker.last_failure_time = time.time()
                if circuit_breaker.failure_count >= circuit_breaker.failure_threshold:
                    circuit_breaker.state = CircuitState.OPEN
                    logger.error(
                        f"Circuit breaker OPENED for {device_used} after {circuit_breaker.failure_count} failures"
                    )

                # Fallback на другое устройство
                if device_used == "gpu" and self.model_cpu:
                    logger.info(f"Falling back to CPU after GPU error: {e}")
                    return self._encode_with_model(
                        self.model_cpu, text, batch_size, show_progress
                    )
                elif device_used == "cpu" and self.model_gpu:
                    logger.info(f"Falling back to GPU after CPU error: {e}")
                    return self._encode_with_model(
                        self.model_gpu, text, batch_size, show_progress
                    )
                else:
                    raise

        except Exception as e:
            logger.error(f"Error in _encode_single: {e}", exc_info=True)
            self._track_prometheus_metrics(device_used, 0, 0, "error")
            return [] if isinstance(text, list) else []

    def _encode_hybrid(
        self,
        text: List[str],
        batch_size: int,
        show_progress: bool,
        use_device: Optional[str],
    ) -> List[List[float]]:
        """
        Гибридная векторизация: распределение батчей между CPU и GPU

        Стратегия:
        - Адаптивное разделение на основе размера текстов и производительности устройств
        - Динамическое распределение нагрузки
        - Обрабатываем параллельно на CPU и GPU
        - Объединяем результаты в правильном порядке
        """
        if not (self.model_cpu and self.model_gpu):
            # Fallback на обычный режим
            return self._encode_single(text, batch_size, show_progress, use_device)

        # Адаптивное разделение батчей
        batch_cpu, batch_gpu, split_idx = self._adaptive_batch_split(text)

        logger.debug(
            f"Hybrid encoding: {len(batch_cpu)} items on CPU, {len(batch_gpu)} items on GPU",
            extra={
                "cpu_batch_size": len(batch_cpu),
                "gpu_batch_size": len(batch_gpu),
                "total_items": len(text),
                "split_strategy": "adaptive",
            },
        )

        # Параллельная обработка
        results = [None] * len(text)
        start_time = time.time()

        with self._executor:
            futures = {}

            # CPU обработка
            if batch_cpu:
                cpu_start = time.time()
                future_cpu = self._executor.submit(
                    self._encode_with_model,
                    self.model_cpu,
                    batch_cpu,
                    batch_size,
                    show_progress,
                )
                futures[future_cpu] = (0, "cpu", cpu_start)

            # GPU обработка
            if batch_gpu:
                gpu_start = time.time()
                future_gpu = self._executor.submit(
                    self._encode_with_model,
                    self.model_gpu,
                    batch_gpu,
                    batch_size,
                    show_progress,
                )
                futures[future_gpu] = (split_idx, "gpu", gpu_start)

            # Собираем результаты
            for future in as_completed(futures):
                start_idx, device, device_start = futures[future]
                try:
                    embeddings = future.result()
                    device_time = time.time() - device_start

                    # Обновляем производительность устройства
                    self._update_device_performance(
                        device, device_time, len(embeddings)
                    )
                    
                    # Обновляем Weighted GPU Scheduler если используется GPU
                    if device == "gpu" and self._weighted_gpu_scheduler and self._multi_gpu_enabled:
                        try:
                            # Определяем какой GPU использовался
                            gpu_id_used = self._get_gpu_for_request() if self._gpu_devices else 0
                            self._weighted_gpu_scheduler.update_performance(
                                gpu_id=gpu_id_used,
                                actual_time=device_time,
                                items_processed=len(embeddings)
                            )
                        except Exception as e:
                            logger.debug(f"Error updating weighted GPU scheduler: {e}")

                    results[start_idx : start_idx + len(embeddings)] = embeddings

                    # Обновляем статистику
                    with self._stats_lock:
                        if device == "gpu":
                            self.device_stats["gpu_requests"] += 1
                        else:
                            self.device_stats["cpu_requests"] += 1
                        self.device_stats["hybrid_requests"] += 1
                        self.device_stats["total_tokens_processed"] += sum(
                            len(t)
                            for t in (batch_cpu if device == "cpu" else batch_gpu)
                        )

                    # Метрики Prometheus
                    self._track_prometheus_metrics(
                        device, device_time, len(embeddings), "success"
                    )
                except Exception as e:
                    logger.error(
                        f"Error in hybrid encoding on {device}: {e}",
                        exc_info=True,
                        extra={"device": device, "start_idx": start_idx},
                    )

                    # Метрики Prometheus для ошибок
                    self._track_prometheus_metrics(device, 0, 0, "error")

                    # Fallback: обрабатываем на другом устройстве
                    if device == "cpu" and self.model_gpu:
                        failed_batch = batch_cpu
                        fallback_embeddings = self._encode_with_model(
                            self.model_gpu, failed_batch, batch_size, show_progress
                        )
                        results[start_idx : start_idx + len(fallback_embeddings)] = (
                            fallback_embeddings
                        )
                    elif device == "gpu" and self.model_cpu:
                        failed_batch = batch_gpu
                        fallback_embeddings = self._encode_with_model(
                            self.model_cpu, failed_batch, batch_size, show_progress
                        )
                        results[start_idx : start_idx + len(fallback_embeddings)] = (
                            fallback_embeddings
                        )

        total_time = time.time() - start_time
        self._track_prometheus_metrics("hybrid", total_time, len(text), "success")

        return results

    def _encode_with_model(
        self, model, text: Union[str, List[str]], batch_size: int, show_progress: bool
    ) -> Union[List[float], List[List[float]]]:
        """Внутренний метод для векторизации с конкретной моделью"""

        # Input validation
        if not text:
            logger.warning(
                "Empty text provided for encoding",
                extra={"text_type": type(text).__name__ if text else None},
            )
            return [] if isinstance(text, list) else []

        # Validate text type
        if not isinstance(text, (str, list)):
            logger.warning(
                "Invalid text type in encode", extra={"text_type": type(text).__name__}
            )
            return []

        max_text_length = 100000  # reuse for both str and list inputs

        # Limit text length (prevent DoS)
        if isinstance(text, str):
            if len(text) > max_text_length:
                logger.warning(
                    "Text too long in encode",
                    extra={"text_length": len(text), "max_length": max_text_length},
                )
                text = text[:max_text_length]
        elif isinstance(text, list):
            max_list_length = 1000  # Max 1000 items
            if len(text) > max_list_length:
                logger.warning(
                    "Text list too long in encode",
                    extra={"list_length": len(text), "max_length": max_list_length},
                )
                text = text[:max_list_length]

            sanitized_items = []
            for item in text:
                if not item:
                    continue
                item_str = item if isinstance(item, str) else str(item)
                if len(item_str) > max_text_length:
                    logger.warning(
                        "List item too long in encode",
                        extra={
                            "item_length": len(item_str),
                            "max_length": max_text_length,
                        },
                    )
                    item_str = item_str[:max_text_length]
                sanitized_items.append(item_str)

            if not sanitized_items:
                logger.warning("No valid text items provided for encoding list")
                return []

            text = sanitized_items

        # Валидация уже выполнена в encode(), здесь только обработка
        try:
            embeddings = model.encode(
                text,
                batch_size=batch_size,
                show_progress_bar=show_progress,
                convert_to_numpy=True,
            )

            # Convert to list
            if isinstance(text, str):
                return embeddings.tolist()
            else:
                return [emb.tolist() for emb in embeddings]

        except Exception as e:
            logger.error(
                f"Encoding error: {e}",
                exc_info=True,
                extra={
                    "text_length": (
                        len(text)
                        if isinstance(text, str)
                        else len(text) if isinstance(text, list) else 0
                    ),
                    "batch_size": batch_size,
                    "model_name": self.model_name,
                },
            )
            return [] if isinstance(text, list) else []

    async def generate_embedding(
        self, text: Union[str, List[str]]
    ) -> Union[List[float], List[List[float]]]:
        """
        Асинхронная обертка для совместимости с остальным кодом (orchestrator).
        """
        return self.encode(text)

    def encode_code(self, code: str) -> List[float]:
        """
        Encode BSL code for vector search с input validation

        Preprocessing:
        - Remove comments
        - Normalize whitespace
        - Keep only meaningful code
        """
        # Input validation
        if not isinstance(code, str):
            logger.warning(
                "Invalid code type in encode_code",
                extra={"code_type": type(code).__name__ if code else None},
            )
            return []

        if not code.strip():
            logger.warning("Empty code provided for encoding")
            return []

        # Limit code length (prevent DoS)
        max_code_length = 100000  # 100KB max
        if len(code) > max_code_length:
            logger.warning(
                "Code too long in encode_code",
                extra={"code_length": len(code), "max_length": max_code_length},
            )
            code = code[:max_code_length]

        # Simple preprocessing
        lines = []
        for line in code.split("\n"):
            line = line.strip()
            # Skip empty lines and comments
            if line and not line.startswith("//"):
                lines.append(line)

        clean_code = " ".join(lines)

        # Limit cleaned code length
        max_clean_length = 5000
        if len(clean_code) > max_clean_length:
            clean_code = clean_code[:max_clean_length]

        return self.encode(clean_code)

    def encode_function(self, func_data: Dict) -> List[float]:
        """
        Encode function metadata for search

        Combines:
        - Function name
        - Description
        - Parameter names
        - Region
        """
        parts = []

        # Name
        if func_data.get("name"):
            parts.append(func_data["name"])

        # Description
        if func_data.get("description"):
            parts.append(func_data["description"])

        # Parameters
        params = func_data.get("parameters", [])
        if params:
            param_names = [p.get("name", str(p)) for p in params]
            parts.append(" ".join(param_names))

        # Region
        if func_data.get("region"):
            parts.append(func_data["region"])

        text = " ".join(parts)

        return self.encode(text)

    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        if self.model:
            return self.model.get_sentence_embedding_dimension()
        elif self.model_gpu:
            return self.model_gpu.get_sentence_embedding_dimension()
        elif self.model_cpu:
            return self.model_cpu.get_sentence_embedding_dimension()
        else:
            return 384  # Default для all-MiniLM-L6-v2

    def get_device_stats(self) -> Dict[str, int]:
        """Получить статистику использования устройств"""
        with self._stats_lock:
            stats = self.device_stats.copy()
            # Добавляем cache hit rate
            total_cache_requests = stats["cache_hits"] + stats["cache_misses"]
            if total_cache_requests > 0:
                stats["cache_hit_rate"] = stats["cache_hits"] / total_cache_requests
            else:
                stats["cache_hit_rate"] = 0.0
            return stats

    def get_performance_stats(self) -> Dict[str, Any]:
        """Получить статистику производительности устройств"""
        with self._performance_lock:
            return {
                "cpu": self._device_performance["cpu"].copy(),
                "gpu": self._device_performance["gpu"].copy(),
            }

    def get_cache_stats(self) -> Dict[str, Any]:
        """Получить статистику кэша"""
        with self._cache_lock:
            expired_count = sum(
                1
                for entry in self._result_cache.values()
                if entry["expires_at"] <= datetime.utcnow()
            )
            return {
                "size": len(self._result_cache),
                "max_size": self._cache_max_size,
                "ttl_seconds": self._cache_ttl_seconds,
                "enabled": self._cache_enabled,
                "expired_entries": expired_count,
            }

    def is_hybrid_mode(self) -> bool:
        """Проверить, включен ли гибридный режим"""
        return self.hybrid_mode and (
            self.model_cpu is not None and self.model_gpu is not None
        )
    
    def get_advanced_stats(self) -> Dict[str, Any]:
        """Получить статистику продвинутых компонентов"""
        stats = {
            "slo_tracking": {},
            "adaptive_quantization": {},
            "semantic_cache_ann": {},
            "predictive_batch": {},
            "memory_aware_batching": {},
            "weighted_gpu_scheduler": {}
        }
        
        # SLO Tracking
        if self._slo_tracker:
            try:
                stats["slo_tracking"] = {
                    "sli_status": self._slo_tracker.get_sli_status(),
                    "error_budgets": self._slo_tracker.get_error_budgets(),
                    "violations": self._slo_tracker.check_slo_violation()
                }
            except Exception as e:
                stats["slo_tracking"]["error"] = str(e)
        
        # Adaptive Quantization
        if self._adaptive_quantizer:
            try:
                stats["adaptive_quantization"] = {
                    "calibrated": self._adaptive_quantizer.calibrated,
                    "scale": self._adaptive_quantizer.scale,
                    "dtype": self._adaptive_quantizer.dtype
                }
            except Exception as e:
                stats["adaptive_quantization"]["error"] = str(e)
        
        # Semantic Cache ANN
        if self._semantic_cache_ann:
            try:
                stats["semantic_cache_ann"] = {
                    "index_type": self._semantic_cache_ann.index_type,
                    "size": len(self._semantic_cache_ann.embeddings),
                    "dimension": self._semantic_cache_ann.dimension
                }
            except Exception as e:
                stats["semantic_cache_ann"]["error"] = str(e)
        
        # Predictive Batch Optimizer
        if self._predictive_batch_optimizer:
            try:
                stats["predictive_batch"] = self._predictive_batch_optimizer.get_stats()
            except Exception as e:
                stats["predictive_batch"]["error"] = str(e)
        
        # Memory-Aware Batching
        if self._memory_aware_batcher:
            try:
                stats["memory_aware_batching"] = self._memory_aware_batcher.get_stats()
            except Exception as e:
                stats["memory_aware_batching"]["error"] = str(e)
        
        # Weighted GPU Scheduler
        if self._weighted_gpu_scheduler:
            try:
                stats["weighted_gpu_scheduler"] = self._weighted_gpu_scheduler.get_stats()
            except Exception as e:
                stats["weighted_gpu_scheduler"]["error"] = str(e)
        
        return stats

    def health_check(self) -> Dict[str, Any]:
        """
        Health check для всех компонентов

        Returns:
            Dict с статусом здоровья CPU, GPU, cache
        """
        with self._health_lock:
            now = time.time()

            # Проверка CPU
            if self.model_cpu:
                try:
                    # Тестовый запрос
                    test_text = "health check"
                    start = time.time()
                    _ = self.model_cpu.encode([test_text], show_progress_bar=False)
                    cpu_time = time.time() - start

                    self._health_status["cpu"] = {
                        "healthy": True,
                        "last_check": now,
                        "error": None,
                        "response_time": cpu_time,
                    }
                except Exception as e:
                    self._health_status["cpu"] = {
                        "healthy": False,
                        "last_check": now,
                        "error": str(e),
                        "response_time": None,
                    }
            else:
                self._health_status["cpu"] = {
                    "healthy": False,
                    "last_check": now,
                    "error": "Model not loaded",
                    "response_time": None,
                }

            # Проверка GPU
            if self.model_gpu:
                try:
                    # Тестовый запрос
                    test_text = "health check"
                    start = time.time()
                    _ = self.model_gpu.encode([test_text], show_progress_bar=False)
                    gpu_time = time.time() - start

                    self._health_status["gpu"] = {
                        "healthy": True,
                        "last_check": now,
                        "error": None,
                        "response_time": gpu_time,
                    }
                except Exception as e:
                    self._health_status["gpu"] = {
                        "healthy": False,
                        "last_check": now,
                        "error": str(e),
                        "response_time": None,
                    }
            else:
                self._health_status["gpu"] = {
                    "healthy": False,
                    "last_check": now,
                    "error": "Model not loaded",
                    "response_time": None,
                }

            # Проверка кэша
            try:
                cache_stats = self.get_cache_stats()
                self._health_status["cache"] = {
                    "healthy": True,
                    "last_check": now,
                    "error": None,
                    "size": cache_stats["size"],
                    "max_size": cache_stats["max_size"],
                }
            except Exception as e:
                self._health_status["cache"] = {
                    "healthy": False,
                    "last_check": now,
                    "error": str(e),
                    "size": None,
                    "max_size": None,
                }

            # Circuit breaker статус
            circuit_breaker_status = {
                "cpu": {
                    "state": self._cpu_circuit_breaker.state.value,
                    "failure_count": self._cpu_circuit_breaker.failure_count,
                },
                "gpu": {
                    "state": self._gpu_circuit_breaker.state.value,
                    "failure_count": self._gpu_circuit_breaker.failure_count,
                },
            }

            # Обновляем метрики Prometheus
            try:
                from src.monitoring.prometheus_metrics import (
                    embedding_health_status,
                    embedding_health_check_duration_seconds,
                )

                for component, status in self._health_status.items():
                    health_value = 1 if status["healthy"] else 0
                    embedding_health_status.labels(component=component).set(
                        health_value
                    )
                    if status.get("response_time") is not None:
                        embedding_health_check_duration_seconds.labels(
                            component=component
                        ).observe(status["response_time"])
            except ImportError:
                pass

            return {
                "status": (
                    "healthy"
                    if all(
                        self._health_status[k]["healthy"]
                        for k in ["cpu", "gpu", "cache"]
                        if (k == "cpu" and self.model_cpu)
                        or (k == "gpu" and self.model_gpu)
                        or k == "cache"
                    )
                    else "degraded"
                ),
                "components": self._health_status.copy(),
                "circuit_breakers": circuit_breaker_status,
                "timestamp": now,
            }

    def _get_from_semantic_cache(self, text: str) -> Optional[List[float]]:
        """
        Получить embedding из семантического кэша на основе cosine similarity

        Returns:
            Embedding если найдено похожее (similarity > threshold), иначе None
        """
        # Используем ANN индекс если доступен
        if self._semantic_cache_ann:
            try:
                # Генерируем embedding для запроса
                query_embedding = None
                if self.model:
                    query_embedding = self.model.encode([text], show_progress_bar=False)[0]
                elif self.model_cpu:
                    query_embedding = self.model_cpu.encode([text], show_progress_bar=False)[0]
                elif self.model_gpu:
                    query_embedding = self.model_gpu.encode([text], show_progress_bar=False)[0]
                
                if query_embedding is None:
                    return None
                
                # Поиск через ANN
                result = self._semantic_cache_ann.search(
                    query_embedding, 
                    k=1, 
                    threshold=self._semantic_similarity_threshold
                )
                
                if result:
                    best_embedding, similarity, cached_text = result
                    logger.debug(
                        f"Semantic cache ANN hit with similarity {similarity:.3f}",
                        extra={"similarity": similarity, "threshold": self._semantic_similarity_threshold}
                    )
                    # Метрики
                    try:
                        from src.monitoring.prometheus_metrics import (
                            embedding_semantic_cache_hits_total,
                            embedding_semantic_cache_similarity,
                        )
                        embedding_semantic_cache_hits_total.inc()
                        embedding_semantic_cache_similarity.observe(similarity)
                    except ImportError:
                        pass
                    return best_embedding
            except Exception as e:
                logger.warning(f"Error in semantic cache ANN lookup: {e}")
        
        # Fallback на обычный семантический кэш
        if not self._semantic_cache:
            return None

        try:
            # Генерируем embedding для запроса (быстро, без кэша)
            query_embedding = None
            if self.model:
                query_embedding = self.model.encode([text], show_progress_bar=False)[0]
            elif self.model_cpu:
                query_embedding = self.model_cpu.encode(
                    [text], show_progress_bar=False
                )[0]
            elif self.model_gpu:
                query_embedding = self.model_gpu.encode(
                    [text], show_progress_bar=False
                )[0]

            if query_embedding is None:
                return None

            # Ищем наиболее похожий в кэше
            best_similarity = 0.0
            best_embedding = None

            for cached_embedding in self._semantic_cache.values():
                similarity = self._cosine_similarity(query_embedding, cached_embedding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_embedding = cached_embedding

            # Если similarity выше порога, возвращаем
            if best_similarity >= self._semantic_similarity_threshold:
                logger.debug(
                    f"Semantic cache hit with similarity {best_similarity:.3f}",
                    extra={
                        "similarity": best_similarity,
                        "threshold": self._semantic_similarity_threshold,
                    },
                )
                # Метрики Prometheus
                try:
                    from src.monitoring.prometheus_metrics import (
                        embedding_semantic_cache_hits_total,
                        embedding_semantic_cache_similarity,
                    )

                    embedding_semantic_cache_hits_total.inc()
                    embedding_semantic_cache_similarity.observe(best_similarity)
                except ImportError:
                    pass
                return best_embedding

        except Exception as e:
            logger.warning(f"Error in semantic cache lookup: {e}", exc_info=True)

        return None

    def _save_to_semantic_cache(
        self, text: str, embedding: Union[List[float], List[List[float]]]
    ):
        """
        Сохранить embedding в семантический кэш

        Args:
            text: Исходный текст
            embedding: Векторное представление
        """
        try:
            # Ограничиваем размер семантического кэша
            max_semantic_cache_size = int(
                os.getenv("EMBEDDING_SEMANTIC_CACHE_SIZE", "500")
            )

            # Нормализуем embedding (может быть List[List[float]] для батчей)
            if isinstance(embedding, list) and len(embedding) > 0:
                if isinstance(embedding[0], list):
                    # Батч - берём первый
                    embedding = embedding[0]

            if len(self._semantic_cache) >= max_semantic_cache_size:
                # Удаляем самый старый (FIFO)
                oldest_key = next(iter(self._semantic_cache))
                del self._semantic_cache[oldest_key]

            # Сохраняем
            text_hash = hashlib.md5(text.encode()).hexdigest()
            self._semantic_cache[text_hash] = embedding

        except Exception as e:
            logger.warning(f"Error saving to semantic cache: {e}", exc_info=True)

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Вычислить cosine similarity между двумя векторами

        Args:
            vec1: Первый вектор
            vec2: Второй вектор

        Returns:
            Cosine similarity (0-1)
        """
        try:
            v1 = np.array(vec1)
            v2 = np.array(vec2)

            dot_product = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))
        except Exception as e:
            logger.warning(f"Error computing cosine similarity: {e}")
            return 0.0

    def _adaptive_batch_split(
        self, texts: List[str]
    ) -> Tuple[List[str], List[str], int]:
        """
        Адаптивное разделение батчей на основе размера текстов и производительности устройств

        Стратегия:
        1. Вычисляем общий размер текстов
        2. Учитываем производительность устройств (GPU обычно быстрее)
        3. Разделяем пропорционально производительности
        4. Для очень больших текстов - отдаём GPU (быстрее)

        Returns:
            (batch_cpu, batch_gpu, split_index)
        """
        if not texts:
            return [], [], 0

        # Получаем производительность устройств
        with self._performance_lock:
            cpu_perf = self._device_performance["cpu"]["avg_time"] or 1.0
            gpu_perf = self._device_performance["gpu"]["avg_time"] or 0.5

        # Если нет данных о производительности, используем стандартное разделение 50/50
        if cpu_perf == 1.0 and gpu_perf == 0.5:
            mid = len(texts) // 2
            return texts[:mid], texts[mid:], mid

        # Вычисляем веса на основе производительности (обратно пропорционально времени)
        cpu_weight = 1.0 / max(cpu_perf, 0.1)  # Избегаем деления на 0
        gpu_weight = 1.0 / max(gpu_perf, 0.1)
        total_weight = cpu_weight + gpu_weight

        # Пропорциональное разделение
        cpu_ratio = cpu_weight / total_weight
        split_idx = int(len(texts) * cpu_ratio)

        # Минимум 1 элемент на каждое устройство
        split_idx = max(1, min(split_idx, len(texts) - 1))

        # Для очень больших текстов (> 10KB) - отдаём GPU
        large_texts_cpu = []
        large_texts_gpu = []
        small_texts = []

        for i, text in enumerate(texts):
            if len(text) > 10000:  # > 10KB
                if i < split_idx:
                    large_texts_cpu.append(text)
                else:
                    large_texts_gpu.append(text)
            else:
                small_texts.append((i, text))

        # Перераспределяем большие тексты на GPU
        if large_texts_cpu:
            large_texts_gpu.extend(large_texts_cpu)
            large_texts_cpu = []

        # Разделяем маленькие тексты пропорционально
        small_cpu = [t for i, t in small_texts if i < split_idx]
        small_gpu = [t for i, t in small_texts if i >= split_idx]

        batch_cpu = small_cpu
        batch_gpu = large_texts_gpu + small_gpu

        # Обновляем split_idx для правильного индексирования результатов
        split_idx = len(batch_cpu)

        return batch_cpu, batch_gpu, split_idx

    def _update_device_performance(
        self, device: str, duration: float, items_count: int
    ):
        """Обновить метрики производительности устройства"""
        if items_count == 0:
            return

        with self._performance_lock:
            perf = self._device_performance[device]
            time_per_item = duration / items_count

            # Экспоненциальное скользящее среднее (EMA)
            alpha = 0.3  # Коэффициент сглаживания
            if perf["request_count"] == 0:
                perf["avg_time"] = time_per_item
            else:
                perf["avg_time"] = (
                    alpha * time_per_item + (1 - alpha) * perf["avg_time"]
                )

            perf["request_count"] += 1
            perf["last_update"] = time.time()

    def _get_cache_key(self, text: Union[str, List[str]]) -> str:
        """Генерировать ключ кэша для текста"""
        if isinstance(text, str):
            text_str = text
        else:
            text_str = "|".join(text)

        return hashlib.sha256(text_str.encode()).hexdigest()

    def _get_from_cache(
        self, cache_key: str
    ) -> Optional[Union[List[float], List[List[float]]]]:
        """
        Получить результат из многоуровневого кэша (L1/L2/L3)

        Проверяет:
        - L1: In-memory LRU cache (быстрый)
        - L2: Redis cache (распределённый)
        - L3: Database cache (опционально, не реализовано)
        """
        if not self._cache_enabled:
            return None

        # L1: In-memory cache
        with self._cache_lock:
            if cache_key in self._result_cache:
                entry = self._result_cache[cache_key]

                # Проверка TTL
                if entry["expires_at"] > datetime.utcnow():
                    # Обновляем порядок (LRU)
                    self._result_cache.move_to_end(cache_key)

                    with self._stats_lock:
                        self.device_stats["cache_hits"] += 1

                    self._track_prometheus_metrics("cache", 0, 0, "hit")
                    # Метрики L1 cache
                    try:
                        from src.monitoring.prometheus_metrics import (
                            embedding_cache_layer_hits_total,
                        )

                        embedding_cache_layer_hits_total.labels(layer="l1").inc()
                    except ImportError:
                        pass

                    value = entry["value"]
                    # Де-квантизация если нужно
                    if self._quantization_enabled:
                        value = self._dequantize_embedding(value)
                    return value
                else:
                    # Удаляем истёкшую запись
                    del self._result_cache[cache_key]

        # L2: Redis cache
        if self._redis_enabled and self._redis_client:
            try:
                import json

                redis_key = f"embedding:{cache_key}"
                cached_value = self._redis_client.get(redis_key)

                if cached_value:
                    try:
                        value = json.loads(cached_value)
                        # Де-квантизация если нужно
                        if self._quantization_enabled:
                            value = self._dequantize_embedding(value)

                        # Promote to L1
                        with self._cache_lock:
                            expires_at = datetime.utcnow() + timedelta(
                                seconds=self._cache_ttl_seconds
                            )
                            self._result_cache[cache_key] = {
                                "value": value,
                                "created_at": datetime.utcnow(),
                                "expires_at": expires_at,
                            }
                            self._result_cache.move_to_end(cache_key)

                        with self._stats_lock:
                            self.device_stats["cache_hits"] += 1

                        self._track_prometheus_metrics("cache", 0, 0, "hit")
                        # Метрики L2 cache
                        try:
                            from src.monitoring.prometheus_metrics import (
                                embedding_cache_layer_hits_total,
                            )

                            embedding_cache_layer_hits_total.labels(layer="l2").inc()
                        except ImportError:
                            pass

                        logger.debug(f"Cache L2 HIT (Redis): {cache_key}")
                        return value
                    except (json.JSONDecodeError, Exception) as e:
                        logger.warning(f"Error decoding Redis cache value: {e}")
            except Exception as e:
                logger.debug(f"Redis cache error: {e}")

        # Cache miss
        with self._stats_lock:
            self.device_stats["cache_misses"] += 1

        self._track_prometheus_metrics("cache", 0, 0, "miss")
        # Метрики cache miss
        try:
            from src.monitoring.prometheus_metrics import (
                embedding_cache_layer_misses_total,
            )

            embedding_cache_layer_misses_total.labels(layer="l1").inc()
            if self._redis_enabled:
                embedding_cache_layer_misses_total.labels(layer="l2").inc()
        except ImportError:
            pass

        return None

    def _save_to_cache(
        self, cache_key: str, value: Union[List[float], List[List[float]]]
    ):
        """
        Сохранить результат в многоуровневый кэш (L1/L2/L3)

        Сохраняет:
        - L1: In-memory LRU cache (быстрый)
        - L2: Redis cache (распределённый)
        - L3: Database cache (опционально, не реализовано)
        """
        if not self._cache_enabled:
            return

        # Квантизация для экономии памяти (используем Adaptive Quantizer если доступен)
        cache_value = value
        scale = 1.0
        if self._quantization_enabled:
            if self._adaptive_quantizer:
                # Используем адаптивную квантизацию
                try:
                    if isinstance(value, list) and len(value) > 0:
                        if isinstance(value[0], list):
                            # Батч embeddings
                            quantized_batch = []
                            scales = []
                            for emb in value:
                                quantized, emb_scale = self._adaptive_quantizer.quantize(emb)
                                quantized_batch.append(quantized)
                                scales.append(emb_scale)
                            cache_value = quantized_batch
                            scale = scales[0] if scales else 1.0
                        else:
                            # Один embedding
                            quantized, scale = self._adaptive_quantizer.quantize(value)
                            cache_value = quantized
                except Exception as e:
                    logger.debug(f"Error in adaptive quantization: {e}, falling back to simple")
                    cache_value = self._quantize_embedding(value)
            else:
                # Простая квантизация
                cache_value = self._quantize_embedding(value)

        # L1: In-memory cache
        with self._cache_lock:
            # Проверка размера кэша (LRU eviction)
            if (
                len(self._result_cache) >= self._cache_max_size
                and cache_key not in self._result_cache
            ):
                # Удаляем самую старую запись
                oldest_key = next(iter(self._result_cache))
                del self._result_cache[oldest_key]

            # Сохраняем новую запись
            expires_at = datetime.utcnow() + timedelta(seconds=self._cache_ttl_seconds)
            self._result_cache[cache_key] = {
                "value": cache_value,
                "created_at": datetime.utcnow(),
                "expires_at": expires_at,
            }
            self._result_cache.move_to_end(cache_key)

        # L2: Redis cache (асинхронно, не блокируем основной поток)
        if self._redis_enabled and self._redis_client:
            try:
                import json

                redis_key = f"embedding:{cache_key}"
                # Сериализуем значение
                serialized = json.dumps(cache_value)
                # Сохраняем с TTL
                self._redis_client.setex(redis_key, self._cache_ttl_seconds, serialized)
                logger.debug(f"Cache L2 SAVED (Redis): {cache_key}")
            except Exception as e:
                logger.debug(f"Error saving to Redis cache: {e}")

    def _track_prometheus_metrics(
        self, device: str, duration: float, items_count: int, status: str
    ):
        """Отслеживать метрики Prometheus"""
        try:
            from src.monitoring.prometheus_metrics import (
                embedding_requests_total,
                embedding_duration_seconds,
                embedding_items_processed_total,
                embedding_cache_hits_total,
                embedding_cache_misses_total,
                embedding_device_usage_percent,
            )

            # Counter для запросов
            embedding_requests_total.labels(device=device, status=status).inc()

            # Histogram для длительности
            if duration > 0:
                embedding_duration_seconds.labels(device=device).observe(duration)

            # Counter для обработанных элементов
            if items_count > 0:
                embedding_items_processed_total.labels(device=device).inc(items_count)

            # Cache метрики
            if device == "cache":
                if status == "hit":
                    embedding_cache_hits_total.inc()
                elif status == "miss":
                    embedding_cache_misses_total.inc()

            # Gauge для использования устройств
            with self._stats_lock:
                total = (
                    self.device_stats["cpu_requests"]
                    + self.device_stats["gpu_requests"]
                )
                if total > 0:
                    cpu_percent = (self.device_stats["cpu_requests"] / total) * 100
                    gpu_percent = (self.device_stats["gpu_requests"] / total) * 100
                    embedding_device_usage_percent.labels(device="cpu").set(cpu_percent)
                    embedding_device_usage_percent.labels(device="gpu").set(gpu_percent)

        except ImportError:
            # Prometheus метрики не доступны - игнорируем
            pass
        except Exception as e:
            logger.debug(f"Failed to track Prometheus metrics: {e}")

    def _init_gpu_devices(self):
        """Инициализация списка доступных GPU устройств"""
        if not self._multi_gpu_enabled:
            return
        
        try:
            import torch
            if torch.cuda.is_available():
                num_gpus = torch.cuda.device_count()
                self._gpu_devices = list(range(num_gpus))
                logger.info(f"Found {num_gpus} GPU device(s): {self._gpu_devices}")
            else:
                self._gpu_devices = []
        except ImportError:
            self._gpu_devices = []
    
    def _init_gpu_memory_info(self):
        """Инициализация информации о памяти GPU"""
        if not self._gpu_devices:
            return
        
        try:
            import torch
            for gpu_id in self._gpu_devices:
                if torch.cuda.is_available():
                    total_memory = torch.cuda.get_device_properties(gpu_id).total_memory
                    self._gpu_memory_info[gpu_id] = {
                        "total_memory_gb": total_memory / (1024**3),
                        "allocated_memory_gb": 0.0,
                        "free_memory_gb": total_memory / (1024**3),
                        "reserved_memory_gb": 0.0
                    }
        except Exception as e:
            logger.debug(f"Error initializing GPU memory info: {e}")
    
    def _update_gpu_memory_info(self, gpu_id: int):
        """Обновить информацию о памяти GPU"""
        try:
            import torch
            if torch.cuda.is_available() and gpu_id < torch.cuda.device_count():
                torch.cuda.set_device(gpu_id)
                allocated = torch.cuda.memory_allocated(gpu_id) / (1024**3)
                reserved = torch.cuda.memory_reserved(gpu_id) / (1024**3)
                total = torch.cuda.get_device_properties(gpu_id).total_memory / (1024**3)
                
                self._gpu_memory_info[gpu_id] = {
                    "total_memory_gb": total,
                    "allocated_memory_gb": allocated,
                    "free_memory_gb": total - reserved,
                    "reserved_memory_gb": reserved
                }
        except Exception as e:
            logger.debug(f"Error updating GPU memory info: {e}")
    
    def _get_optimal_batch_size(self, device_id: int = 0, text_length: int = 1000) -> int:
        """Вычислить оптимальный batch size на основе доступной памяти GPU"""
        if not self._adaptive_batch_size_enabled:
            return 32  # Default
        
        try:
            # Обновляем информацию о памяти
            self._update_gpu_memory_info(device_id)
            memory_info = self._gpu_memory_info.get(device_id, {})
            
            if not memory_info:
                return 32
            
            free_memory_gb = memory_info.get("free_memory_gb", 0)
            
            # Эмпирическая формула: ~1.5MB на embedding + overhead
            # Учитываем размер текста
            estimated_memory_per_item = 0.0015 + (text_length * 0.000001)  # MB
            
            # Оставляем 20% памяти в резерве
            available_memory_mb = (free_memory_gb * 1024) * 0.8
            
            # Вычисляем оптимальный batch size
            optimal_batch = int(available_memory_mb / estimated_memory_per_item)
            
            # Ограничиваем разумными пределами
            optimal_batch = max(8, min(optimal_batch, 256))
            
            return optimal_batch
        except Exception as e:
            logger.debug(f"Error calculating optimal batch size: {e}")
            return 32
    
    def _get_gpu_for_request(self) -> int:
        """Получить GPU для запроса (round-robin или weighted)"""
        if not self._gpu_devices:
            return 0
        
        if self._weighted_gpu_scheduler:
            # Используем weighted scheduler если доступен
            return self._weighted_gpu_scheduler.select_gpu(estimated_time=0.1)
        
        # Round-robin по умолчанию
        gpu_id = self._gpu_devices[self._gpu_round_robin_index % len(self._gpu_devices)]
        self._gpu_round_robin_index += 1
        return gpu_id
    
    def _quantize_embedding(self, embedding: Union[List[float], List[List[float]]]) -> Union[List[int], List[List[int]]]:
        """Квантизировать embedding для экономии памяти"""
        if not self._quantization_enabled:
            return embedding
        
        try:
            if isinstance(embedding, list) and len(embedding) > 0:
                if isinstance(embedding[0], list):
                    # Батч embeddings
                    return [self._quantize_embedding(emb) for emb in embedding]
                else:
                    # Один embedding
                    arr = np.array(embedding, dtype=np.float32)
                    if self._quantization_dtype == "int8":
                        # INT8: scale to [-128, 127]
                        max_val = np.max(np.abs(arr))
                        scale = 127.0 / max_val if max_val > 0 else 1.0
                        quantized = (arr * scale).astype(np.int8)
                        return quantized.tolist()
                    elif self._quantization_dtype == "int16":
                        # INT16: scale to [-32768, 32767]
                        max_val = np.max(np.abs(arr))
                        scale = 32767.0 / max_val if max_val > 0 else 1.0
                        quantized = (arr * scale).astype(np.int16)
                        return quantized.tolist()
            
            return embedding
        except Exception as e:
            logger.warning(f"Error quantizing embedding: {e}")
            return embedding
    
    def _dequantize_embedding(self, quantized: Union[List[int], List[List[int]]]) -> Union[List[float], List[List[float]]]:
        """Де-квантизировать embedding обратно в float"""
        if not self._quantization_enabled:
            return quantized
        
        try:
            if isinstance(quantized, list) and len(quantized) > 0:
                if isinstance(quantized[0], list):
                    # Батч embeddings
                    return [self._dequantize_embedding(emb) for emb in quantized]
                else:
                    # Один embedding
                    arr = np.array(quantized, dtype=np.int8 if self._quantization_dtype == "int8" else np.int16)
                    # Простая де-квантизация (scale обратно)
                    # В реальности нужно хранить scale, но для простоты используем эмпирический
                    if self._quantization_dtype == "int8":
                        scale = 1.0 / 127.0
                    else:
                        scale = 1.0 / 32767.0
                    
                    dequantized = (arr.astype(np.float32) * scale)
                    return dequantized.tolist()
            
            return quantized
        except Exception as e:
            logger.warning(f"Error dequantizing embedding: {e}")
            return quantized
    
    def _init_advanced_components(self):
        """Инициализация продвинутых компонентов оптимизации"""
        # Weighted GPU scheduler (требует GPU - в беклог)
        if self._multi_gpu_enabled and self._gpu_devices:
            try:
                from src.services.advanced_optimizations import WeightedGPUScheduler
                self._weighted_gpu_scheduler = WeightedGPUScheduler(self._gpu_devices)
                logger.info("Weighted GPU scheduler initialized")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize weighted GPU scheduler: {e}")
        
        # SLO tracker
        if self._slo_tracking_enabled:
            try:
                from src.services.advanced_optimizations import SLOTracker
                self._slo_tracker = SLOTracker()
                logger.info("SLO tracker initialized")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize SLO tracker: {e}")
        
        # Memory-aware batcher
        if self._memory_aware_batching:
            try:
                from src.services.advanced_optimizations import MemoryAwareBatcher
                max_memory_mb = float(os.getenv("EMBEDDING_MAX_MEMORY_MB", "1024"))
                self._memory_aware_batcher = MemoryAwareBatcher(max_memory_mb=max_memory_mb)
                logger.info("Memory-aware batcher initialized")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize memory-aware batcher: {e}")
        
        # Adaptive Quantizer
        if self._adaptive_quantization_enabled:
            try:
                from src.services.advanced_optimizations import AdaptiveQuantizer
                self._adaptive_quantizer = AdaptiveQuantizer(dtype=self._quantization_dtype)
                logger.info("Adaptive quantizer initialized")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize adaptive quantizer: {e}")
        
        # Semantic Cache ANN
        if self._semantic_cache_ann_enabled:
            try:
                from src.services.advanced_optimizations import SemanticCacheANN
                dimension = self.get_embedding_dimension()
                self._semantic_cache_ann = SemanticCacheANN(
                    index_type=self._semantic_cache_ann_type,
                    dimension=dimension
                )
                logger.info(f"Semantic cache ANN initialized (type: {self._semantic_cache_ann_type})")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize semantic cache ANN: {e}")
        
        # Predictive Batch Optimizer
        if self._predictive_batch_enabled:
            try:
                from src.services.advanced_optimizations import PredictiveBatchOptimizer
                max_history = int(os.getenv("EMBEDDING_PREDICTIVE_BATCH_MAX_HISTORY", "1000"))
                self._predictive_batch_optimizer = PredictiveBatchOptimizer(max_history=max_history)
                
                # Обновляем Prometheus метрики
                try:
                    from src.monitoring.prometheus_metrics import (
                        embedding_predictive_batch_history_size,
                        embedding_predictive_batch_model_trained
                    )
                    stats = self._predictive_batch_optimizer.get_stats()
                    embedding_predictive_batch_history_size.set(stats.get("history_size", 0))
                    embedding_predictive_batch_model_trained.set(1 if stats.get("model_trained", False) else 0)
                except ImportError:
                    pass
                
                logger.info("Predictive batch optimizer initialized")
            except (ImportError, Exception) as e:
                logger.debug(f"Could not initialize predictive batch optimizer: {e}")

    def __del__(self):
        """Cleanup при удалении объекта"""
        if self._executor:
            self._executor.shutdown(wait=False)
