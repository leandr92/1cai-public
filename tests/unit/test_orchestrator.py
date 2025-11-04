"""
Unit tests for AI Orchestrator
"""

import pytest
from src.ai.orchestrator import (
    QueryClassifier, AIOrchestrator, QueryType, AIService
)


class TestQueryClassifier:
    """Test query classification"""
    
    def test_classify_standard_1c(self):
        """Test classification of standard 1C query"""
        classifier = QueryClassifier()
        
        query = "Как в типовой УТ реализован расчет себестоимости?"
        intent = classifier.classify(query)
        
        assert intent.query_type == QueryType.STANDARD_1C
        assert intent.confidence > 0.5
        assert AIService.NAPARNIK in intent.preferred_services
    
    def test_classify_graph_query(self):
        """Test classification of graph query"""
        classifier = QueryClassifier()
        
        query = "Где используется функция РассчитатьНДС?"
        intent = classifier.classify(query)
        
        assert intent.query_type == QueryType.GRAPH_QUERY
        assert intent.confidence > 0.5
        assert AIService.NEO4J in intent.preferred_services
    
    def test_classify_code_generation(self):
        """Test classification of code generation query"""
        classifier = QueryClassifier()
        
        query = "Создай функцию для расчета скидки"
        intent = classifier.classify(query)
        
        assert intent.query_type == QueryType.CODE_GENERATION
        assert intent.confidence > 0.5
        assert AIService.QWEN_CODER in intent.preferred_services
    
    def test_classify_semantic_search(self):
        """Test classification of semantic search query"""
        classifier = QueryClassifier()
        
        query = "Найди похожий код для проверки прав доступа"
        intent = classifier.classify(query)
        
        assert intent.query_type == QueryType.SEMANTIC_SEARCH
        assert intent.confidence > 0.5
        assert AIService.QDRANT in intent.preferred_services
    
    def test_classify_optimization(self):
        """Test classification of optimization query"""
        classifier = QueryClassifier()
        
        query = "Оптимизируй эту функцию"
        intent = classifier.classify(query)
        
        assert intent.query_type == QueryType.OPTIMIZATION
        assert intent.confidence > 0.5
        assert AIService.QWEN_CODER in intent.preferred_services


class TestAIOrchestrator:
    """Test AI orchestration"""
    
    def test_register_client(self):
        """Test registering AI service client"""
        orchestrator = AIOrchestrator()
        mock_client = Mock()
        
        orchestrator.register_client(AIService.NEO4J, mock_client)
        
        assert AIService.NEO4J in orchestrator.clients
        assert orchestrator.clients[AIService.NEO4J] == mock_client
    
    @pytest.mark.asyncio
    async def test_process_query_caching(self):
        """Test query result caching"""
        orchestrator = AIOrchestrator()
        
        query = "Test query"
        # First call
        result1 = await orchestrator.process_query(query)
        
        # Second call (should be cached)
        result2 = await orchestrator.process_query(query)
        
        assert result1 == result2
        # Cache key should exist
        cache_key = f"{query}:{{}}"
        assert cache_key in orchestrator.cache





