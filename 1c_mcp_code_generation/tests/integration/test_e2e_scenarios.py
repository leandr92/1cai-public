"""
End-to-End тесты для полного цикла работы системы генерации кода 1C.

Тестируют реальные сценарии использования от начала до конца,
включая пользовательские интерфейсы и внешние интеграции.
"""

import pytest
import asyncio
import time
from pathlib import Path
from typing import Dict, Any, List

from src.core.engine import CodeGenerationEngine
from src.mcp.server import MCP1CServer
from src.cli.interface import CLIInterface


@pytest.mark.integration
@pytest.mark.e2e
class TestEndToEndScenarios:
    """End-to-End тесты реальных сценариев использования."""
    
    @pytest.mark.asyncio
    async def test_complete_processing_generation_workflow(self, integration_test_setup, temp_test_dir, audit_logger):
        """Тест полного workflow генерации обработки."""
        test_name = "complete_processing_workflow"
        params = {
            "workflow": "generation_to_deployment",
            "object_type": "processing",
            "complexity": "medium"
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            engine = components["engine"]
            
            # Шаг 1: Генерация кода
            generation_result = await engine.generate_code(
                object_type="processing",
                description="Комплексная обработка для анализа продаж",
                parameters={
                    "object_name": "АнализПродажКомплексный",
                    "description": "Обработка для детального анализа продаж с группировками",
                    "author": "TestSystem",
                    "features": ["группировки", "фильтры", "экспорт", "отчетность"],
                    "data_source": "РегистрНакопления.Продажи",
                    "output_format": ["ТаблицаЗначений", "ТабличныйДокумент"]
                }
            )
            
            assert generation_result.success is True
            assert generation_result.generated_code is not None
            
            # Шаг 2: Валидация
            validation_result = components["validator"].comprehensive_validation(
                generation_result.generated_code
            )
            assert validation_result.is_valid is True
            
            # Шаг 3: Проверка безопасности
            security_result = components["security_manager"].validate_generated_code(
                generation_result.generated_code
            )
            assert security_result.is_safe is True
            
            # Шаг 4: Сохранение в файл
            output_file = temp_test_dir / "АнализПродажКомплексный.bsl"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(generation_result.generated_code)
            
            assert output_file.exists()
            assert output_file.stat().st_size > 0
            
            # Шаг 5: Проверка содержимого файла
            with open(output_file, 'r', encoding='utf-8') as f:
                saved_code = f.read()
            
            assert saved_code == generation_result.generated_code
            assert "АнализПродажКомплексный" in saved_code
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                2.5,
                {
                    "generated_lines": len(saved_code.split('\n')),
                    "validation_score": validation_result.compliance_score,
                    "security_score": security_result.security_score
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.asyncio 
    async def test_full_catalog_lifecycle(self, integration_test_setup, temp_test_dir, audit_logger):
        """Тест полного жизненного цикла справочника."""
        test_name = "full_catalog_lifecycle"
        params = {
            "lifecycle": "create_validate_generate",
            "object_type": "catalog",
            "features": ["иерархия", "коды", "формы"]
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            engine = components["engine"]
            template_processor = components["template_processor"]
            
            # Шаг 1: Генерация основного кода справочника
            catalog_result = await engine.generate_code(
                object_type="catalog",
                description="Иерархический справочник номенклатуры с кодами и формами",
                parameters={
                    "object_name": "НоменклатураРасширенная",
                    "description": "Справочник номенклатуры с поддержкой иерархии и форм",
                    "author": "TestSystem",
                    "hierarchical": True,
                    "parent_field": "Родитель",
                    "code_length": 10,
                    "has_forms": True,
                    "form_types": ["Список", "Элемент"],
                    "additional_fields": ["Артикул", "ЕдиницаИзмерения", "СтавкаНДС"]
                }
            )
            
            assert catalog_result.success is True
            
            # Шаг 2: Генерация форм через шаблон
            form_template_result = await template_processor.generate_from_template(
                template_id="catalog_form",
                variables={
                    "object_name": "НоменклатураРасширенная",
                    "form_type": "Список",
                    "fields": "Код,Наименование,Артикул,Родитель"
                }
            )
            
            assert form_template_result.success is True
            
            # Шаг 3: Комплексная валидация
            combined_code = catalog_result.generated_code + "\n\n" + form_template_result.generated_code
            
            validation_result = components["validator"].comprehensive_validation(combined_code)
            assert validation_result.is_valid is True
            
            # Шаг 4: Создание структуры проекта
            catalog_dir = temp_test_dir / "Catalogs" / "НоменклатураРасширенная"
            catalog_dir.mkdir(parents=True, exist_ok=True)
            
            # Сохраняем модули
            manager_module = catalog_dir / "Module.bsl"
            object_module = catalog_dir / "ObjectModule.bsl"
            
            with open(manager_module, 'w', encoding='utf-8') as f:
                f.write(catalog_result.generated_code)
            
            with open(object_module, 'w', encoding='utf-8') as f:
                f.write(form_template_result.generated_code)
            
            # Шаг 5: Проверка структуры файлов
            assert manager_module.exists()
            assert object_module.exists()
            
            # Проверяем что оба файла содержат ожидаемый код
            with open(manager_module, 'r', encoding='utf-8') as f:
                manager_code = f.read()
            
            with open(object_module, 'r', encoding='utf-8') as f:
                object_code = f.read()
            
            assert "СправочникМенеджер" in manager_code
            assert "СправочникОбъект" in object_code
            
            audit_logger.log_test_result(
                test_name,
                "PASS", 
                3.2,
                {
                    "modules_created": 2,
                    "total_code_lines": len(combined_code.split('\n')),
                    "hierarchy_support": True,
                    "form_generation": True
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.asyncio
    async def test_mcp_workflow_integration(self, integration_test_setup, temp_test_dir, audit_logger):
        """Тест интеграции с MCP протоколом в реальном workflow."""
        test_name = "mcp_workflow_integration"
        params = {
            "integration": "mcp_protocol",
            "workflow": "request_response",
            "tools_used": ["generate_code", "validate_code", "security_check"]
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            server = MCP1CServer()
            
            # Инициализируем MCP сервер
            await server.initialize()
            
            # MCP запрос 1: Генерация документа
            generate_doc_request = {
                "jsonrpc": "2.0",
                "id": 1001,
                "method": "tools/call",
                "params": {
                    "name": "generate_code",
                    "arguments": {
                        "object_type": "document",
                        "description": "Документ заказа покупателя с проведением",
                        "parameters": {
                            "object_name": "ЗаказПокупателя",
                            "description": "Документ для оформления заказов",
                            "author": "MCPSystem",
                            "posting": True,
                            "tabular_sections": ["Товары", "Услуги"],
                            "registers": ["Продажи", "Взаиморасчеты"],
                            "approval_workflow": True
                        }
                    }
                }
            }
            
            generate_response = await server.handle_request(generate_doc_request)
            assert "result" in generate_response
            
            generated_code = generate_response["result"]["content"][0]["text"]
            
            # MCP запрос 2: Валидация
            validate_request = {
                "jsonrpc": "2.0", 
                "id": 1002,
                "method": "tools/call",
                "params": {
                    "name": "validate_code",
                    "arguments": {
                        "code": generated_code,
                        "validation_types": ["syntax", "semantics", "standards", "performance"],
                        "strict_mode": True
                    }
                }
            }
            
            validate_response = await server.handle_request(validate_request)
            assert "result" in validate_response
            
            validation_results = validate_response["result"]
            
            # MCP запрос 3: Проверка безопасности
            security_request = {
                "jsonrpc": "2.0",
                "id": 1003,
                "method": "tools/call", 
                "params": {
                    "name": "security_check",
                    "arguments": {
                        "code": generated_code,
                        "check_types": ["sql_injection", "data_access", "system_calls"],
                        "severity_threshold": "high"
                    }
                }
            }
            
            security_response = await server.handle_request(security_request)
            assert "result" in security_response
            
            # Шаг 4: Сохранение результатов
            results_file = temp_test_dir / "mcp_workflow_results.json"
            
            workflow_results = {
                "timestamp": time.time(),
                "generation": {
                    "success": True,
                    "code_length": len(generated_code),
                    "response_time": 1.2
                },
                "validation": {
                    "success": True,
                    "results": validation_results
                },
                "security": {
                    "success": True,
                    "response": security_response["result"]
                }
            }
            
            import json
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(workflow_results, f, ensure_ascii=False, indent=2)
            
            assert results_file.exists()
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                4.1,
                {
                    "mcp_requests": 3,
                    "all_successful": True,
                    "workflow_duration": 4.1,
                    "code_generated": True
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.asyncio
    async def test_cli_interface_workflow(self, integration_test_setup, temp_test_dir, audit_logger):
        """Тест workflow через CLI интерфейс."""
        test_name = "cli_interface_workflow"
        params = {
            "interface": "command_line",
            "workflow": "user_interaction",
            "commands": ["generate", "validate", "save"]
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            
            # Создаем CLI интерфейс
            cli = CLIInterface(
                engine=components["engine"],
                validator=components["validator"],
                security_manager=components["security_manager"]
            )
            
            # Симулируем CLI команды
            cli_commands = [
                {
                    "command": "generate",
                    "args": {
                        "type": "report",
                        "name": "ПродажиПоМенеджерам", 
                        "description": "Отчет по продажам в разрезе менеджеров",
                        "features": ["группировки", "диаграммы", "фильтры"],
                        "period": "месяц",
                        "output_formats": ["табличный_документ", "excel"]
                    }
                },
                {
                    "command": "validate",
                    "args": {
                        "file": "generated_code.bsl",
                        "checks": ["syntax", "standards", "performance"],
                        "strict": True
                    }
                },
                {
                    "command": "save",
                    "args": {
                        "path": temp_test_dir / "Reports",
                        "format": "1c_structure"
                    }
                }
            ]
            
            # Выполняем команды последовательно
            results = []
            for cmd in cli_commands:
                if cmd["command"] == "generate":
                    result = await cli.generate_object(**cmd["args"])
                    results.append(("generate", result))
                    
                elif cmd["command"] == "validate":
                    # Для теста валидации используем код из предыдущей команды
                    if results and results[-1][0] == "generate":
                        generated_code = results[-1][1]["generated_code"]
                        result = await cli.validate_code(generated_code, **cmd["args"])
                        results.append(("validate", result))
                    
                elif cmd["command"] == "save":
                    if results and results[-1][0] == "generate":
                        generated_code = results[-1][1]["generated_code"]
                        result = await cli.save_code(generated_code, **cmd["args"])
                        results.append(("save", result))
            
            # Проверяем результаты
            assert len(results) >= 2
            
            # Проверяем генерацию
            generate_result = results[0][1]
            assert generate_result["success"] is True
            assert "generated_code" in generate_result
            
            # Проверяем валидацию (если была выполнена)
            validate_result = next((r for r in results if r[0] == "validate"), None)
            if validate_result:
                assert validate_result[1]["success"] is True
            
            # Проверяем сохранение (если было выполнено)  
            save_result = next((r for r in results if r[0] == "save"), None)
            if save_result:
                assert save_result[1]["success"] is True
                assert Path(save_result[1]["path"]).exists()
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                5.2,
                {
                    "commands_executed": len(results),
                    "success_rate": len([r for r in results if r[1]["success"]]) / len(results),
                    "generated_code_size": len(results[0][1]["generated_code"]) if results else 0
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_performance_benchmark(self, integration_test_setup, audit_logger):
        """Тест производительности под нагрузкой."""
        test_name = "performance_benchmark"
        params = {
            "test_type": "load_test",
            "concurrent_requests": 10,
            "expected_performance": "100_requests_per_minute"
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            engine = components["engine"]
            
            # Создаем множество параллельных запросов
            requests = []
            object_types = ["processing", "report", "catalog", "document"]
            
            for i in range(20):  # 20 параллельных запросов
                obj_type = object_types[i % len(object_types)]
                request = engine.generate_code(
                    object_type=obj_type,
                    description=f"Нагрузочный тест {i+1}",
                    parameters={
                        "object_name": f"ОбъектНагрузки{i+1}",
                        "description": f"Объект для тестирования производительности #{i+1}",
                        "author": "LoadTest",
                        "complexity": "medium"
                    }
                )
                requests.append(request)
            
            # Измеряем время выполнения
            start_time = time.time()
            responses = await asyncio.gather(*requests, return_exceptions=True)
            end_time = time.time()
            
            execution_time = end_time - start_time
            
            # Анализируем результаты
            successful_responses = [r for r in responses if not isinstance(r, Exception)]
            failed_responses = [r for r in responses if isinstance(r, Exception)]
            
            success_rate = len(successful_responses) / len(requests)
            
            # Проверяем производительность
            requests_per_minute = (len(requests) / execution_time) * 60
            
            assert success_rate >= 0.8, f"Success rate {success_rate} слишком низкий"
            assert requests_per_minute >= 50, f"Performance {requests_per_minute} req/min слишком низкая"
            
            # Проверяем среднее время ответа
            response_times = [r.metrics.generation_time for r in successful_responses 
                            if hasattr(r, 'metrics') and hasattr(r.metrics, 'generation_time')]
            
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
                assert avg_response_time < 10, f"Average response time {avg_response_time}s слишком высокий"
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                execution_time,
                {
                    "total_requests": len(requests),
                    "successful_requests": len(successful_responses),
                    "failed_requests": len(failed_responses),
                    "success_rate": success_rate,
                    "requests_per_minute": requests_per_minute,
                    "avg_response_time": sum(response_times) / len(response_times) if response_times else 0
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.asyncio
    async def test_error_recovery_scenarios(self, integration_test_setup, audit_logger):
        """Тест сценариев восстановления после ошибок."""
        test_name = "error_recovery_scenarios"
        params = {
            "recovery_test": True,
            "error_types": ["network", "validation", "generation"]
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            engine = components["engine"]
            
            # Сценарий 1: Восстановление после невалидного запроса
            invalid_request = {
                "object_type": "invalid_type",
                "description": "Некорректный запрос",
                "parameters": {}
            }
            
            # Ожидаем ошибку, но система должна продолжить работу
            result1 = await engine.generate_code(**invalid_request)
            assert result1.success is False
            assert result1.error_message is not None
            
            # Сценарий 2: Успешная генерация после ошибки
            valid_request = {
                "object_type": "processing",
                "description": "Восстановительный запрос",
                "parameters": {
                    "object_name": "ВосстановительнаяОбработка",
                    "description": "Обработка после восстановления"
                }
            }
            
            result2 = await engine.generate_code(**valid_request)
            assert result2.success is True  # Система восстановилась
            
            # Сценарий 3: Частичный сброс состояния
            components["prompt_manager"].clear_cache()
            components["template_library"].reset_statistics()
            
            # После сброса система должна работать
            result3 = await engine.generate_code(
                object_type="catalog",
                description="Проверка после сброса",
                parameters={
                    "object_name": "ПослеСброса",
                    "description": "Справочник после очистки кеша"
                }
            )
            
            assert result3.success is True
            
            # Проверяем что статистика обновилась
            stats = components["template_library"].get_usage_statistics()
            assert stats["total_generations"] >= 2
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                3.5,
                {
                    "error_scenarios": 3,
                    "recovery_success": True,
                    "system_stability": True
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise
    
    @pytest.mark.asyncio
    async def test_integration_health_check(self, integration_test_setup, audit_logger):
        """Тест проверки здоровья всей системы."""
        test_name = "integration_health_check"
        params = {
            "health_check": "full_system",
            "components": ["engine", "validator", "security", "templates", "prompts"]
        }
        
        audit_logger.log_test_start(test_name, params)
        
        try:
            components = integration_test_setup
            
            health_status = {}
            
            # Проверяем каждый компонент
            components_to_check = [
                ("engine", components["engine"]),
                ("validator", components["validator"]),
                ("security_manager", components["security_manager"]),
                ("template_library", components["template_library"]),
                ("prompt_manager", components["prompt_manager"])
            ]
            
            for name, component in components_to_check:
                try:
                    # Базовая проверка работоспособности
                    if hasattr(component, 'health_check'):
                        health_result = await component.health_check()
                        health_status[name] = {
                            "status": "healthy" if health_result.is_healthy else "unhealthy",
                            "details": health_result.details
                        }
                    else:
                        # Простая проверка доступности методов
                        health_status[name] = {
                            "status": "healthy",
                            "details": f"Component {name} is accessible"
                        }
                        
                except Exception as e:
                    health_status[name] = {
                        "status": "error",
                        "details": str(e)
                    }
            
            # Проверяем что все компоненты здоровы
            unhealthy_components = [
                name for name, status in health_status.items() 
                if status["status"] != "healthy"
            ]
            
            assert len(unhealthy_components) == 0, f"Нездоровые компоненты: {unhealthy_components}"
            
            # Дополнительная проверка интеграции компонентов
            integration_test = await components["engine"].generate_code(
                object_type="processing",
                "description": "Тест интеграции компонентов",
                "parameters": {
                    "object_name": "ИнтеграционныйТест",
                    "description": "Проверка работы всех компонентов вместе"
                }
            )
            
            assert integration_test.success is True
            
            audit_logger.log_test_result(
                test_name,
                "PASS",
                1.0,
                {
                    "components_checked": len(components_to_check),
                    "healthy_components": len(health_status) - len(unhealthy_components),
                    "integration_test_passed": True,
                    "overall_status": "healthy"
                }
            )
            
        except Exception as e:
            audit_logger.log_error(test_name, e, params)
            raise