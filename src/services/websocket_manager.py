"""
WebSocket Manager for Real-Time Updates
Iteration 2 Priority #2: Instant UX
"""

import logging
import json
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    WebSocket connection manager
    
    Features:
    - Connection pooling by user/tenant
    - Broadcast to all connections
    - Send to specific user/tenant
    - Room-based messaging
    """
    
    def __init__(self):
        # Active connections
        self.active_connections: Set[WebSocket] = set()
        
        # User connections (user_id → WebSocket)
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        
        # Tenant connections (tenant_id → WebSocket)
        self.tenant_connections: Dict[str, Set[WebSocket]] = {}
        
        # Room connections (room_id → WebSocket)
        self.room_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        user_id: str = None,
        tenant_id: str = None
    ):
        """Accept new WebSocket connection"""
        await websocket.accept()
        
        self.active_connections.add(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)
        
        if tenant_id:
            if tenant_id not in self.tenant_connections:
                self.tenant_connections[tenant_id] = set()
            self.tenant_connections[tenant_id].add(websocket)
        
        logger.info(f"WebSocket connected: user={user_id}, tenant={tenant_id}")
    
    def disconnect(
        self,
        websocket: WebSocket,
        user_id: str = None,
        tenant_id: str = None
    ):
        """Remove WebSocket connection"""
        
        self.active_connections.discard(websocket)
        
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        if tenant_id and tenant_id in self.tenant_connections:
            self.tenant_connections[tenant_id].discard(websocket)
            if not self.tenant_connections[tenant_id]:
                del self.tenant_connections[tenant_id]
        
        logger.info(f"WebSocket disconnected: user={user_id}, tenant={tenant_id}")
    
    async def send_personal_message(self, message: Dict[str, Any], user_id: str):
        """Send message to specific user (all their connections)"""
        
        if user_id in self.user_connections:
            for websocket in self.user_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except:
                    # Connection closed
                    pass
    
    async def send_to_tenant(self, message: Dict[str, Any], tenant_id: str):
        """Send message to all users in tenant"""
        
        if tenant_id in self.tenant_connections:
            for websocket in self.tenant_connections[tenant_id]:
                try:
                    await websocket.send_json(message)
                except:
                    pass
    
    async def send_to_room(self, message: Dict[str, Any], room_id: str):
        """Send message to all connections in room"""
        
        if room_id in self.room_connections:
            for websocket in self.room_connections[room_id]:
                try:
                    await websocket.send_json(message)
                except:
                    pass
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all active connections"""
        
        for websocket in self.active_connections:
            try:
                await websocket.send_json(message)
            except:
                pass
    
    def join_room(self, websocket: WebSocket, room_id: str):
        """Add connection to room"""
        if room_id not in self.room_connections:
            self.room_connections[room_id] = set()
        self.room_connections[room_id].add(websocket)
    
    def leave_room(self, websocket: WebSocket, room_id: str):
        """Remove connection from room"""
        if room_id in self.room_connections:
            self.room_connections[room_id].discard(websocket)
    
    def get_stats(self) -> Dict:
        """Get connection statistics"""
        return {
            'total_connections': len(self.active_connections),
            'users_connected': len(self.user_connections),
            'tenants_connected': len(self.tenant_connections),
            'active_rooms': len(self.room_connections)
        }


# Global instance
manager = ConnectionManager()


# Example WebSocket endpoint:
"""
from fastapi import WebSocket, WebSocketDisconnect
from src.services.websocket_manager import manager

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id=user_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Process message
            if data['type'] == 'subscribe':
                manager.join_room(websocket, data['room_id'])
            
            elif data['type'] == 'message':
                # Broadcast to room
                await manager.send_to_room({
                    'type': 'message',
                    'from': user_id,
                    'text': data['text']
                }, data['room_id'])
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
"""


