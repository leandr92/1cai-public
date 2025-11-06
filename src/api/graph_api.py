"""
Graph API - FastAPI endpoints for Neo4j, Qdrant, PostgreSQL
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from src.db.neo4j_client import Neo4jClient
from src.db.qdrant_client import QdrantClient
from src.db.postgres_saver import PostgreSQLSaver
from src.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

app = FastAPI(
    title="1C AI Assistant API",
    description="Enterprise 1C AI Development Stack API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ],  # Only allow specific origins for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Clients
neo4j_client = None
qdrant_client = None
pg_client = None
embedding_service = None


# Models
class SemanticSearchRequest(BaseModel):
    query: str
    configuration: Optional[str] = None
    limit: int = 10


class GraphQueryRequest(BaseModel):
    query: str
    parameters: Dict[str, Any] = {}


class FunctionDependenciesRequest(BaseModel):
    module_name: str
    function_name: str


# Startup/Shutdown
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    global neo4j_client, qdrant_client, pg_client, embedding_service
    
    try:
        # Neo4j
        neo4j_client = Neo4jClient()
        neo4j_client.connect()
        
        # Qdrant
        qdrant_client = QdrantClient()
        qdrant_client.connect()
        
        # PostgreSQL
        pg_client = PostgreSQLSaver()
        pg_client.connect()
        
        # Embeddings
        embedding_service = EmbeddingService()
        
        logger.info("✓ All services initialized")
    except Exception as e:
        logger.error(f"Startup error: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if neo4j_client:
        neo4j_client.disconnect()
    if pg_client:
        pg_client.disconnect()


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "neo4j": neo4j_client is not None,
            "qdrant": qdrant_client is not None,
            "postgres": pg_client is not None
        }
    }


# Graph API endpoints
@app.post("/api/graph/query")
async def execute_graph_query(request: GraphQueryRequest):
    """Execute custom Cypher query"""
    if not neo4j_client:
        raise HTTPException(status_code=503, detail="Neo4j not available")
    
    try:
        with neo4j_client.driver.session() as session:
            result = session.run(request.query, request.parameters)
            records = [dict(record) for record in result]
        return {"results": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph/configurations")
async def get_configurations():
    """Get all configurations"""
    if not neo4j_client:
        raise HTTPException(status_code=503, detail="Neo4j not available")
    
    try:
        with neo4j_client.driver.session() as session:
            result = session.run("""
                MATCH (c:Configuration)
                RETURN c.name as name, c.full_name as full_name, c.version as version
                ORDER BY c.name
            """)
            configs = [dict(record) for record in result]
        return {"configurations": configs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph/objects/{config_name}")
async def get_objects(config_name: str, object_type: Optional[str] = None):
    """Get objects of a configuration"""
    if not neo4j_client:
        raise HTTPException(status_code=503, detail="Neo4j not available")
    
    try:
        if object_type:
            objects = neo4j_client.search_objects_by_type(object_type, config_name)
        else:
            with neo4j_client.driver.session() as session:
                result = session.run("""
                    MATCH (c:Configuration {name: $config})-[:HAS_OBJECT]->(o:Object)
                    RETURN o.type as type, o.name as name, o.description as description
                    ORDER BY o.type, o.name
                """, config=config_name)
                objects = [dict(record) for record in result]
        
        return {"objects": objects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/graph/dependencies")
async def get_function_dependencies(request: FunctionDependenciesRequest):
    """Get function call graph"""
    if not neo4j_client:
        raise HTTPException(status_code=503, detail="Neo4j not available")
    
    try:
        dependencies = neo4j_client.get_function_dependencies(
            request.module_name,
            request.function_name
        )
        
        callers = neo4j_client.get_function_callers(
            request.module_name,
            request.function_name
        )
        
        return {
            "function": {
                "module": request.module_name,
                "name": request.function_name
            },
            "calls_to": dependencies,
            "called_by": callers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Vector search endpoints
@app.post("/api/search/semantic")
async def semantic_search(request: SemanticSearchRequest):
    """Semantic code search using Qdrant"""
    if not qdrant_client or not embedding_service:
        raise HTTPException(status_code=503, detail="Vector search not available")
    
    try:
        # Generate query embedding
        query_vector = embedding_service.encode(request.query)
        
        # Search in Qdrant
        results = qdrant_client.search_code(
            query_vector=query_vector,
            config_filter=request.configuration,
            limit=request.limit
        )
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Statistics endpoints
@app.get("/api/stats/overview")
async def get_stats_overview():
    """Get overall statistics"""
    stats = {}
    
    try:
        if neo4j_client:
            stats['neo4j'] = neo4j_client.get_statistics()
        
        if qdrant_client:
            stats['qdrant'] = qdrant_client.get_statistics()
        
        if pg_client:
            stats['postgresql'] = pg_client.get_statistics()
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)







