"""
MCP Server for IDE Integration (Cursor, VSCode)
Model Context Protocol implementation
"""

import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio

from src.ai.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)

app = FastAPI(title="1C MCP Server")

# Orchestrator
orchestrator = AIOrchestrator()


# MCP Protocol Types
class MCPTool:
    """MCP Tool definition"""
    
    def __init__(self, name: str, description: str, input_schema: Dict):
        self.name = name
        self.description = description
        self.input_schema = input_schema
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema
        }


# Define MCP Tools
TOOLS = [
    MCPTool(
        name="search_metadata",
        description="Поиск объектов метаданных 1С по структурным свойствам, связям и отношениям. Использует граф метаданных в Neo4j.",
        input_schema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Запрос для поиска (например: 'Найди все документы связанные с регистром Продажи')"
                },
                "configuration": {
                    "type": "string",
                    "description": "Фильтр по конфигурации (DO, ERP, ZUP, BUH)",
                    "enum": ["DO", "ERP", "ZUP", "BUH"]
                },
                "object_type": {
                    "type": "string",
                    "description": "Тип объекта (Документ, Справочник, Регистр, и т.д.)"
                }
            },
            "required": ["query"]
        }
    ),
    
    MCPTool(
        name="search_code_semantic",
        description="Семантический поиск процедур и функций по их описаниям и содержанию. Использует векторный поиск в Qdrant.",
        input_schema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Описание искомой функциональности"
                },
                "configuration": {
                    "type": "string",
                    "description": "Фильтр по конфигурации"
                },
                "limit": {
                    "type": "integer",
                    "description": "Количество результатов",
                    "default": 10
                }
            },
            "required": ["query"]
        }
    ),
    
    MCPTool(
        name="generate_bsl_code",
        description="Генерация BSL кода на основе описания. Использует Qwen3-Coder для создания функций и процедур.",
        input_schema={
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "Описание требуемой функциональности"
                },
                "function_name": {
                    "type": "string",
                    "description": "Имя функции"
                },
                "parameters": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Список параметров"
                },
                "context": {
                    "type": "object",
                    "description": "Дополнительный контекст (модуль, объект)"
                }
            },
            "required": ["description"]
        }
    ),
    
    MCPTool(
        name="analyze_dependencies",
        description="Анализ зависимостей функции или модуля. Строит граф вызовов и показывает все связи.",
        input_schema={
            "type": "object",
            "properties": {
                "module_name": {
                    "type": "string",
                    "description": "Полное имя модуля"
                },
                "function_name": {
                    "type": "string",
                    "description": "Имя функции"
                }
            },
            "required": ["module_name", "function_name"]
        }
    )
]


# MCP Endpoints
@app.get("/mcp")
async def mcp_root():
    """MCP server info"""
    return {
        "name": "1C AI Assistant MCP Server",
        "version": "1.0.0",
        "protocol": "mcp/1.0",
        "capabilities": {
            "tools": True,
            "prompts": False,
            "resources": False
        }
    }


@app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools"""
    return {
        "tools": [tool.to_dict() for tool in TOOLS]
    }


@app.post("/mcp/tools/call")
async def call_tool(request: Request):
    """Execute MCP tool"""
    try:
        body = await request.json()
        
        tool_name = body.get("name")
        arguments = body.get("arguments", {})
        
        logger.info(f"MCP tool called: {tool_name}")
        
        # Route to appropriate handler
        if tool_name == "search_metadata":
            result = await handle_search_metadata(arguments)
        
        elif tool_name == "search_code_semantic":
            result = await handle_search_code(arguments)
        
        elif tool_name == "generate_bsl_code":
            result = await handle_generate_code(arguments)
        
        elif tool_name == "analyze_dependencies":
            result = await handle_analyze_dependencies(arguments)
        
        else:
            return JSONResponse(
                status_code=404,
                content={"error": f"Tool not found: {tool_name}"}
            )
        
        return {"result": result}
        
    except Exception as e:
        logger.error(f"Tool execution error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# Tool handlers
async def handle_search_metadata(args: Dict) -> Dict:
    """Handle metadata search"""
    query = args.get("query")
    
    response = await orchestrator.process_query(
        query,
        context={"type": "metadata_search", **args}
    )
    
    return response


async def handle_search_code(args: Dict) -> Dict:
    """Handle semantic code search"""
    query = args.get("query")
    
    response = await orchestrator.process_query(
        query,
        context={"type": "semantic_search", **args}
    )
    
    return response


async def handle_generate_code(args: Dict) -> Dict:
    """Handle code generation"""
    description = args.get("description")
    
    response = await orchestrator.process_query(
        f"Создай функцию: {description}",
        context={"type": "code_generation", **args}
    )
    
    return response


async def handle_analyze_dependencies(args: Dict) -> Dict:
    """Handle dependency analysis"""
    module = args.get("module_name")
    function = args.get("function_name")
    
    response = await orchestrator.process_query(
        f"Покажи зависимости функции {function} в модуле {module}",
        context={"type": "dependency_analysis", **args}
    )
    
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6001)





