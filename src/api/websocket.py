"""
WebSocket API Endpoints
Real-time communication
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from src.services.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time notifications
    
    Client connects and receives:
    - Build status updates
    - Code review notifications
    - Team activity
    - System alerts
    """
    
    await manager.connect(websocket, user_id=user_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            'type': 'connected',
            'message': f'Connected to notifications for user {user_id}'
        })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get('type') == 'ping':
                await websocket.send_json({'type': 'pong'})
            
            elif data.get('type') == 'subscribe':
                # Subscribe to specific events
                room_id = data.get('room_id')
                if room_id:
                    manager.join_room(websocket, room_id)
                    await websocket.send_json({
                        'type': 'subscribed',
                        'room_id': room_id
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
        logger.info(f"WebSocket disconnected: {user_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id=user_id)


# Helper function to send notifications
async def notify_user(user_id: str, notification_type: str, data: dict):
    """Send notification to user via WebSocket"""
    
    message = {
        'type': notification_type,
        'data': data,
        'timestamp': 'now'  # TODO: actual timestamp
    }
    
    await manager.send_personal_message(message, user_id)


