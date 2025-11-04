"""
Hybrid Search Service
Combines vector search (Qdrant) + full-text search (Elasticsearch)
Using Reciprocal Rank Fusion (RRF) for result merging
"""

import logging
from typing import List, Dict, Any, Optional
import asyncio

logger = logging.getLogger(__name__)


class HybridSearchService:
    """Hybrid search combining Qdrant and Elasticsearch"""
    
    def __init__(self, qdrant_client, elasticsearch_client, embedding_service):
        """
        Initialize hybrid search
        
        Args:
            qdrant_client: QdrantClient instance
            elasticsearch_client: ElasticsearchClient instance
            embedding_service: EmbeddingService instance
        """
        self.qdrant = qdrant_client
        self.elasticsearch = elasticsearch_client
        self.embeddings = embedding_service
    
    async def search(self,
                    query: str,
                    config_filter: Optional[str] = None,
                    limit: int = 10,
                    rrf_k: int = 60) -> List[Dict[str, Any]]:
        """
        Hybrid search combining vector and full-text
        
        Args:
            query: Search query
            config_filter: Filter by configuration
            limit: Number of results
            rrf_k: RRF k parameter (default 60)
            
        Returns:
            Merged and ranked results
        """
        try:
            # Generate query embedding for vector search
            query_vector = self.embeddings.encode(query)
            
            # Execute both searches in parallel
            vector_task = self._vector_search(query_vector, config_filter, limit * 2)
            text_task = self._fulltext_search(query, config_filter, limit * 2)
            
            vector_results, text_results = await asyncio.gather(
                vector_task,
                text_task,
                return_exceptions=True
            )
            
            # Handle errors
            if isinstance(vector_results, Exception):
                logger.error(f"Vector search failed: {vector_results}")
                vector_results = []
            
            if isinstance(text_results, Exception):
                logger.error(f"Text search failed: {text_results}")
                text_results = []
            
            # Merge results using RRF
            merged = self._reciprocal_rank_fusion(
                vector_results,
                text_results,
                k=rrf_k
            )
            
            # Return top N
            return merged[:limit]
            
        except Exception as e:
            logger.error(f"Hybrid search error: {e}")
            return []
    
    async def _vector_search(self, 
                            query_vector: List[float],
                            config_filter: Optional[str],
                            limit: int) -> List[Dict[str, Any]]:
        """Execute vector search in Qdrant"""
        try:
            results = self.qdrant.search_code(
                query_vector=query_vector,
                config_filter=config_filter,
                limit=limit
            )
            
            # Normalize format
            normalized = []
            for r in results:
                normalized.append({
                    'id': r['id'],
                    'score': r['score'],
                    'source': 'vector',
                    'payload': r['payload']
                })
            
            return normalized
            
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            return []
    
    async def _fulltext_search(self,
                              query: str,
                              config_filter: Optional[str],
                              limit: int) -> List[Dict[str, Any]]:
        """Execute full-text search in Elasticsearch"""
        try:
            results = await self.elasticsearch.search_code(
                query=query,
                config_filter=config_filter,
                limit=limit
            )
            
            # Normalize format
            normalized = []
            for r in results:
                normalized.append({
                    'id': r['id'],
                    'score': r['score'],
                    'source': 'fulltext',
                    'payload': r['source'],
                    'highlight': r.get('highlight', {})
                })
            
            return normalized
            
        except Exception as e:
            logger.error(f"Full-text search error: {e}")
            return []
    
    def _reciprocal_rank_fusion(self,
                                vector_results: List[Dict],
                                text_results: List[Dict],
                                k: int = 60) -> List[Dict[str, Any]]:
        """
        Reciprocal Rank Fusion algorithm
        
        RRF formula: score(d) = Σ 1/(k + rank(d))
        
        Args:
            vector_results: Results from vector search
            text_results: Results from text search
            k: Constant (typically 60)
            
        Returns:
            Merged and re-ranked results
        """
        # Build unified result set
        all_results = {}
        
        # Add vector results with ranks
        for rank, result in enumerate(vector_results, 1):
            doc_id = result['id']
            rrf_score = 1.0 / (k + rank)
            
            if doc_id not in all_results:
                all_results[doc_id] = {
                    'id': doc_id,
                    'payload': result['payload'],
                    'rrf_score': 0.0,
                    'vector_rank': rank,
                    'vector_score': result['score'],
                    'sources': []
                }
            
            all_results[doc_id]['rrf_score'] += rrf_score
            all_results[doc_id]['sources'].append('vector')
        
        # Add text results with ranks
        for rank, result in enumerate(text_results, 1):
            doc_id = result['id']
            rrf_score = 1.0 / (k + rank)
            
            if doc_id not in all_results:
                all_results[doc_id] = {
                    'id': doc_id,
                    'payload': result['payload'],
                    'rrf_score': 0.0,
                    'sources': []
                }
            else:
                # Document found in both searches - bonus!
                all_results[doc_id]['rrf_score'] *= 1.2
            
            all_results[doc_id]['rrf_score'] += rrf_score
            all_results[doc_id]['sources'].append('fulltext')
            
            if 'fulltext_rank' not in all_results[doc_id]:
                all_results[doc_id]['fulltext_rank'] = rank
                all_results[doc_id]['fulltext_score'] = result['score']
            
            if 'highlight' in result:
                all_results[doc_id]['highlight'] = result['highlight']
        
        # Convert to list and sort by RRF score
        merged = list(all_results.values())
        merged.sort(key=lambda x: x['rrf_score'], reverse=True)
        
        # Add final ranks
        for rank, result in enumerate(merged, 1):
            result['final_rank'] = rank
        
        return merged





