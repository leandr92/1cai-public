"""
Qdrant Client for Vector Search
Semantic search for 1C code and documentation
"""

import os
import logging
from typing import Dict, List, Any, Optional

try:
    from qdrant_client import QdrantClient as QdrantSDK
    from qdrant_client.models import (
        Distance, VectorParams, PointStruct,
        Filter, FieldCondition, MatchValue
    )
    QDRANT_AVAILABLE = True
except ImportError:
    print("[WARN] qdrant-client not installed. Run: pip install qdrant-client")
    QDRANT_AVAILABLE = False

logger = logging.getLogger(__name__)


class QdrantClient:
    """Qdrant client for vector search"""
    
    COLLECTION_CODE = "1c_code"
    COLLECTION_DOCS = "1c_documentation"
    VECTOR_SIZE = 384  # For sentence-transformers/all-MiniLM-L6-v2
    
    def __init__(self, 
                 host: str = "localhost",
                 port: int = 6333,
                 api_key: Optional[str] = None):
        """Initialize Qdrant client"""
        
        if not QDRANT_AVAILABLE:
            raise ImportError("qdrant-client not available")
        
        self.host = host
        self.port = port
        self.api_key = api_key or os.getenv("QDRANT_API_KEY")
        self.client: Optional[QdrantSDK] = None
    
    def connect(self) -> bool:
        """Establish connection to Qdrant"""
        try:
            self.client = QdrantSDK(
                host=self.host,
                port=self.port,
                api_key=self.api_key
            )
            # Test connection
            self.client.get_collections()
            logger.info(f"Connected to Qdrant at {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            return False
    
    def create_collections(self):
        """Create collections for code and documentation"""
        try:
            # Collection for code
            self.client.recreate_collection(
                collection_name=self.COLLECTION_CODE,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created collection: {self.COLLECTION_CODE}")
            
            # Collection for documentation
            self.client.recreate_collection(
                collection_name=self.COLLECTION_DOCS,
                vectors_config=VectorParams(
                    size=self.VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created collection: {self.COLLECTION_DOCS}")
            
        except Exception as e:
            logger.error(f"Error creating collections: {e}")
    
    def add_code(self, code_id: str, embedding: List[float], metadata: Dict[str, Any]):
        """Add code embedding to collection"""
        try:
            point = PointStruct(
                id=code_id,
                vector=embedding,
                payload=metadata
            )
            
            self.client.upsert(
                collection_name=self.COLLECTION_CODE,
                points=[point]
            )
            return True
        except Exception as e:
            logger.error(f"Error adding code: {e}")
            return False
    
    def search_code(self, query_vector: List[float], 
                    config_filter: Optional[str] = None,
                    limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar code"""
        try:
            query_filter = None
            if config_filter:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="configuration",
                            match=MatchValue(value=config_filter)
                        )
                    ]
                )
            
            results = self.client.search(
                collection_name=self.COLLECTION_CODE,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit
            )
            
            return [
                {
                    'id': hit.id,
                    'score': hit.score,
                    'payload': hit.payload
                }
                for hit in results
            ]
        except Exception as e:
            logger.error(f"Error searching code: {e}")
            return []
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            collections = self.client.get_collections()
            
            stats = {}
            for collection in collections.collections:
                info = self.client.get_collection(collection.name)
                stats[collection.name] = {
                    'vectors_count': info.vectors_count,
                    'points_count': info.points_count,
                    'status': info.status
                }
            
            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}
    
    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        # Qdrant client doesn't need explicit disconnect
        pass





