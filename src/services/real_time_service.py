"""
Real-Time Service
WebSocket manager for live updates to dashboards
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class RealTimeManager:
    """
    Manages WebSocket connections and broadcasts updates
    
    Features:
    - Connection management
    - Topic-based subscriptions
    - Broadcast to specific topics
    - Automatic reconnection handling
    """
    
    def __init__(self):
        # Active connections: topic → set of websockets
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, topic: str = "general"):
        """
        Accept new WebSocket connection
        
        Args:
            websocket: WebSocket connection
            topic: Topic to subscribe to
        """
        await websocket.accept()
        
        if topic not in self.connections:
            self.connections[topic] = set()
        
        self.connections[topic].add(websocket)
        self.connection_metadata[websocket] = {
            'topic': topic,
            'connected_at': datetime.now(),
            'messages_sent': 0
        }
        
        logger.info(f"Client connected to topic '{topic}'. Total: {len(self.connections[topic])}")
        
        # Send welcome message
        await self.send_to_client(websocket, {
            'type': 'connected',
            'topic': topic,
            'timestamp': datetime.now().isoformat()
        })
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect client"""
        try:
            topic = self.connection_metadata.get(websocket, {}).get('topic')
            
            if topic and topic in self.connections:
                self.connections[topic].discard(websocket)
                
                if not self.connections[topic]:
                    del self.connections[topic]
            
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            
            logger.info(f"Client disconnected from '{topic}'")
            
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
    
    async def send_to_client(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
            
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]['messages_sent'] += 1
                
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
            await self.disconnect(websocket)
    
    async def broadcast_to_topic(self, topic: str, message: Dict[str, Any]):
        """
        Broadcast message to all clients subscribed to topic
        
        Args:
            topic: Topic name
            message: Message to broadcast
        """
        if topic not in self.connections:
            return
        
        # Add metadata
        message['topic'] = topic
        message['timestamp'] = datetime.now().isoformat()
        
        # Broadcast to all clients
        disconnected = []
        
        for websocket in self.connections[topic].copy():
            try:
                await websocket.send_json(message)
                
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]['messages_sent'] += 1
                    
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for ws in disconnected:
            await self.disconnect(ws)
        
        logger.info(f"Broadcasted to {len(self.connections[topic])} clients on topic '{topic}'")
    
    async def broadcast_dashboard_update(self, dashboard_type: str, data: Dict[str, Any]):
        """
        Broadcast dashboard data update
        
        Args:
            dashboard_type: owner, executive, pm, developer, team_lead, ba
            data: Dashboard data
        """
        await self.broadcast_to_topic(f"dashboard_{dashboard_type}", {
            'type': 'dashboard_update',
            'dashboard': dashboard_type,
            'data': data
        })
    
    async def broadcast_notification(self, user_id: str, notification: Dict[str, Any]):
        """Send notification to specific user"""
        await self.broadcast_to_topic(f"user_{user_id}", {
            'type': 'notification',
            'notification': notification
        })
    
    async def broadcast_system_alert(self, alert: Dict[str, Any]):
        """Broadcast system-wide alert"""
        await self.broadcast_to_topic("system", {
            'type': 'alert',
            'alert': alert
        })
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        total_connections = sum(len(clients) for clients in self.connections.values())
        
        return {
            'total_connections': total_connections,
            'topics': list(self.connections.keys()),
            'connections_per_topic': {
                topic: len(clients) 
                for topic, clients in self.connections.items()
            },
            'total_messages_sent': sum(
                meta['messages_sent'] 
                for meta in self.connection_metadata.values()
            )
        }


# Global instance
real_time_manager = RealTimeManager()


# Helper for background tasks
async def start_dashboard_updater():
    """
    Background task that periodically updates dashboards
    Broadcasts to all connected clients
    """
    from src.api.dashboard_api import (
        get_owner_dashboard,
        get_executive_dashboard,
        get_pm_dashboard,
        get_developer_dashboard,
        get_team_lead_dashboard,
        get_ba_dashboard
    )
    from src.database import get_pool
    
    while True:
        try:
            await asyncio.sleep(30)  # Update every 30 seconds
            
            pool = get_pool()
            
            # Update each dashboard type
            dashboards = {
                'owner': get_owner_dashboard,
                'executive': get_executive_dashboard,
                'pm': get_pm_dashboard,
                'developer': get_developer_dashboard,
                'team_lead': get_team_lead_dashboard,
                'ba': get_ba_dashboard
            }
            
            for dashboard_type, fetch_func in dashboards.items():
                try:
                    if dashboard_type in ['owner', 'executive', 'pm', 'team_lead', 'ba']:
                        data = await fetch_func(pool)
                    else:
                        data = await fetch_func()
                    
                    # Broadcast update
                    await real_time_manager.broadcast_dashboard_update(dashboard_type, data)
                    
                except Exception as e:
                    logger.error(f"Error updating {dashboard_type} dashboard: {e}")
            
            logger.debug("Dashboard updates broadcasted")
            
        except Exception as e:
            logger.error(f"Dashboard updater error: {e}")
            await asyncio.sleep(60)  # Wait longer on error


