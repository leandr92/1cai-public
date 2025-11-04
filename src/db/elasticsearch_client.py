"""
Elasticsearch Client for Full-text Search
Stage 1: Foundation - Elasticsearch Integration
"""

import os
import logging
from typing import Dict, List, Any, Optional

try:
    from elasticsearch import AsyncElasticsearch
    ELASTICSEARCH_AVAILABLE = True
except ImportError:
    logger.warning("elasticsearch not installed. Run: pip install elasticsearch")
    ELASTICSEARCH_AVAILABLE = False

logger = logging.getLogger(__name__)


class ElasticsearchClient:
    """Elasticsearch client for full-text search"""
    
    INDEX_CODE = "1c_code"
    INDEX_DOCS = "1c_documentation"
    
    def __init__(self, 
                 host: str = "localhost",
                 port: int = 9200,
                 user: Optional[str] = None,
                 password: Optional[str] = None):
        """Initialize Elasticsearch client"""
        
        if not ELASTICSEARCH_AVAILABLE:
            raise ImportError("elasticsearch not available")
        
        self.host = host
        self.port = port
        self.user = user or os.getenv("ELASTIC_USER")
        self.password = password or os.getenv("ELASTIC_PASSWORD")
        self.client: Optional[AsyncElasticsearch] = None
    
    async def connect(self) -> bool:
        """Connect to Elasticsearch"""
        try:
            if self.user and self.password:
                self.client = AsyncElasticsearch(
                    [f"http://{self.host}:{self.port}"],
                    basic_auth=(self.user, self.password)
                )
            else:
                self.client = AsyncElasticsearch(
                    [f"http://{self.host}:{self.port}"]
                )
            
            # Test connection
            info = await self.client.info()
            logger.info(f"Connected to Elasticsearch {info['version']['number']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Elasticsearch: {e}")
            return False
    
    async def create_indexes(self):
        """Create indexes with mappings"""
        try:
            # Code index
            if not await self.client.indices.exists(index=self.INDEX_CODE):
                await self.client.indices.create(
                    index=self.INDEX_CODE,
                    body={
                        "settings": {
                            "number_of_shards": 1,
                            "number_of_replicas": 0,
                            "analysis": {
                                "analyzer": {
                                    "bsl_analyzer": {
                                        "type": "standard",
                                        "stopwords": "_russian_"
                                    }
                                }
                            }
                        },
                        "mappings": {
                            "properties": {
                                "code": {
                                    "type": "text",
                                    "analyzer": "bsl_analyzer"
                                },
                                "function_name": {"type": "keyword"},
                                "module_name": {"type": "keyword"},
                                "configuration": {"type": "keyword"},
                                "object_type": {"type": "keyword"},
                                "description": {
                                    "type": "text",
                                    "analyzer": "bsl_analyzer"
                                },
                                "is_exported": {"type": "boolean"},
                                "complexity": {"type": "integer"}
                            }
                        }
                    }
                )
                logger.info(f"Created index: {self.INDEX_CODE}")
        
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    async def index_code(self, 
                        doc_id: str,
                        code: str,
                        metadata: Dict[str, Any]):
        """Index code for full-text search"""
        try:
            document = {
                'code': code,
                **metadata
            }
            
            await self.client.index(
                index=self.INDEX_CODE,
                id=doc_id,
                document=document
            )
            return True
            
        except Exception as e:
            logger.error(f"Error indexing code: {e}")
            return False
    
    async def search_code(self, 
                         query: str,
                         config_filter: Optional[str] = None,
                         limit: int = 10) -> List[Dict[str, Any]]:
        """Full-text search for code"""
        try:
            # Build query
            must_queries = [
                {
                    "multi_match": {
                        "query": query,
                        "fields": ["code^2", "description", "function_name"],
                        "type": "best_fields"
                    }
                }
            ]
            
            # Add configuration filter
            if config_filter:
                must_queries.append({
                    "term": {"configuration": config_filter}
                })
            
            # Execute search
            response = await self.client.search(
                index=self.INDEX_CODE,
                body={
                    "query": {
                        "bool": {
                            "must": must_queries
                        }
                    },
                    "size": limit,
                    "highlight": {
                        "fields": {
                            "code": {},
                            "description": {}
                        }
                    }
                }
            )
            
            # Format results
            results = []
            for hit in response['hits']['hits']:
                results.append({
                    'id': hit['_id'],
                    'score': hit['_score'],
                    'source': hit['_source'],
                    'highlight': hit.get('highlight', {})
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get index statistics"""
        try:
            stats = {}
            
            if await self.client.indices.exists(index=self.INDEX_CODE):
                count = await self.client.count(index=self.INDEX_CODE)
                stats[self.INDEX_CODE] = {
                    'document_count': count['count']
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Statistics error: {e}")
            return {}
    
    async def close(self):
        """Close connection"""
        if self.client:
            await self.client.close()
            logger.info("Elasticsearch connection closed")





