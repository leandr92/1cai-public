"""
Unit tests for Hybrid Search Service
"""

import pytest
from unittest.mock import Mock, AsyncMock
from src.services.hybrid_search import HybridSearchService


class TestHybridSearchService:
    """Test hybrid search combining vector and full-text"""
    
    @pytest.fixture
    def mock_clients(self):
        """Mock Qdrant and Elasticsearch clients"""
        qdrant = Mock()
        elasticsearch = Mock()
        embeddings = Mock()
        
        embeddings.encode.return_value = [0.1] * 384
        
        return qdrant, elasticsearch, embeddings
    
    @pytest.mark.asyncio
    async def test_search_both_sources(self, mock_clients):
        """Test search from both sources"""
        qdrant, elasticsearch, embeddings = mock_clients
        
        # Mock Qdrant results
        qdrant.search_code.return_value = [
            {'id': '1', 'score': 0.95, 'payload': {'name': 'Func1'}},
            {'id': '2', 'score': 0.85, 'payload': {'name': 'Func2'}}
        ]
        
        # Mock Elasticsearch results
        async def mock_es_search(*args, **kwargs):
            return [
                {'id': '1', 'score': 8.5, 'source': {'name': 'Func1'}},
                {'id': '3', 'score': 7.2, 'source': {'name': 'Func3'}}
            ]
        
        elasticsearch.search_code = mock_es_search
        
        service = HybridSearchService(qdrant, elasticsearch, embeddings)
        results = await service.search("test query", limit=10)
        
        # Should combine results from both sources
        assert len(results) > 0
        
        # ID '1' should be ranked higher (found in both)
        ids = [r['id'] for r in results]
        assert '1' in ids
    
    def test_reciprocal_rank_fusion(self, mock_clients):
        """Test RRF algorithm"""
        qdrant, elasticsearch, embeddings = mock_clients
        service = HybridSearchService(qdrant, elasticsearch, embeddings)
        
        vector_results = [
            {'id': 'doc1', 'score': 0.9, 'payload': {}},
            {'id': 'doc2', 'score': 0.8, 'payload': {}}
        ]
        
        text_results = [
            {'id': 'doc1', 'score': 10.0, 'payload': {}},  # Same doc
            {'id': 'doc3', 'score': 9.0, 'payload': {}}
        ]
        
        merged = service._reciprocal_rank_fusion(vector_results, text_results, k=60)
        
        # doc1 should be first (found in both)
        assert merged[0]['id'] == 'doc1'
        assert 'vector' in merged[0]['sources']
        assert 'fulltext' in merged[0]['sources']
        
        # Should have all docs
        ids = [r['id'] for r in merged]
        assert set(ids) == {'doc1', 'doc2', 'doc3'}
    
    def test_rrf_scoring(self, mock_clients):
        """Test RRF score calculation"""
        qdrant, elasticsearch, embeddings = mock_clients
        service = HybridSearchService(qdrant, elasticsearch, embeddings)
        
        # Single result list
        vector_results = [
            {'id': 'doc1', 'score': 0.9, 'payload': {}}
        ]
        
        text_results = []
        
        merged = service._reciprocal_rank_fusion(vector_results, text_results, k=60)
        
        # RRF score for rank 1: 1/(60+1) ≈ 0.0164
        assert merged[0]['rrf_score'] == pytest.approx(1.0/61, rel=0.01)
        assert merged[0]['vector_rank'] == 1





