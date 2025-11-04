"""
Feature Flags Service
Iteration 2 Priority #3: Safe feature releases
"""

import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class FeatureState(Enum):
    DISABLED = "disabled"
    ENABLED = "enabled"
    BETA = "beta"  # Enabled for beta users only
    PERCENTAGE = "percentage"  # Rollout percentage


class FeatureFlag:
    """Single feature flag"""
    
    def __init__(
        self,
        key: str,
        name: str,
        description: str,
        state: FeatureState = FeatureState.DISABLED,
        percentage: int = 0,
        beta_users: list = None
    ):
        self.key = key
        self.name = name
        self.description = description
        self.state = state
        self.percentage = percentage
        self.beta_users = beta_users or []


class FeatureFlagService:
    """
    Feature flag management
    
    Usage:
        flags = FeatureFlagService()
        
        if flags.is_enabled('new_ai_model', user_id='user-123'):
            # Use new model
        else:
            # Use old model
    """
    
    def __init__(self):
        self.flags: Dict[str, FeatureFlag] = {}
        self._init_flags()
    
    def _init_flags(self):
        """Initialize default flags"""
        
        # AI Features
        self.register(FeatureFlag(
            key='ai_response_caching',
            name='AI Response Caching',
            description='Cache AI responses for similar queries',
            state=FeatureState.ENABLED
        ))
        
        self.register(FeatureFlag(
            key='advanced_code_review',
            name='Advanced Code Review',
            description='Enhanced code review with auto-fix',
            state=FeatureState.BETA
        ))
        
        self.register(FeatureFlag(
            key='copilot_v2',
            name='Copilot V2',
            description='Next generation Copilot with better suggestions',
            state=FeatureState.PERCENTAGE,
            percentage=20  # 20% rollout
        ))
        
        # UI Features
        self.register(FeatureFlag(
            key='realtime_updates',
            name='Real-Time Updates',
            description='WebSocket-based real-time notifications',
            state=FeatureState.ENABLED
        ))
        
        self.register(FeatureFlag(
            key='dark_mode_v2',
            name='Dark Mode V2',
            description='Improved dark mode with more themes',
            state=FeatureState.DISABLED
        ))
        
        # Infrastructure
        self.register(FeatureFlag(
            key='distributed_tracing',
            name='Distributed Tracing',
            description='OpenTelemetry tracing',
            state=FeatureState.ENABLED
        ))
    
    def register(self, flag: FeatureFlag):
        """Register a feature flag"""
        self.flags[flag.key] = flag
        logger.info(f"Feature flag registered: {flag.key} ({flag.state.value})")
    
    def is_enabled(
        self,
        flag_key: str,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None
    ) -> bool:
        """
        Check if feature is enabled
        
        Args:
            flag_key: Feature flag key
            user_id: User ID (for beta/percentage checks)
            tenant_id: Tenant ID (for tenant-specific flags)
        
        Returns:
            True if feature is enabled for this user
        """
        
        if flag_key not in self.flags:
            logger.warning(f"Unknown feature flag: {flag_key}")
            return False
        
        flag = self.flags[flag_key]
        
        # Simple enabled/disabled
        if flag.state == FeatureState.ENABLED:
            return True
        
        if flag.state == FeatureState.DISABLED:
            return False
        
        # Beta users only
        if flag.state == FeatureState.BETA:
            if user_id and user_id in flag.beta_users:
                return True
            return False
        
        # Percentage rollout
        if flag.state == FeatureState.PERCENTAGE:
            if not user_id:
                return False
            
            # Consistent hashing (same user always gets same result)
            hash_val = hash(f"{flag_key}:{user_id}") % 100
            return hash_val < flag.percentage
        
        return False
    
    def get_all_flags(self, user_id: Optional[str] = None) -> Dict[str, bool]:
        """Get all flags and their status for user"""
        return {
            key: self.is_enabled(key, user_id=user_id)
            for key in self.flags.keys()
        }
    
    def update_flag(
        self,
        flag_key: str,
        state: FeatureState = None,
        percentage: int = None,
        beta_users: list = None
    ):
        """Update feature flag at runtime"""
        
        if flag_key not in self.flags:
            raise ValueError(f"Unknown flag: {flag_key}")
        
        flag = self.flags[flag_key]
        
        if state:
            flag.state = state
        
        if percentage is not None:
            flag.percentage = percentage
        
        if beta_users is not None:
            flag.beta_users = beta_users
        
        logger.info(f"Feature flag updated: {flag_key} → {flag.state.value}")


# Global instance
_feature_flags = None


def get_feature_flags() -> FeatureFlagService:
    """Get singleton feature flags service"""
    global _feature_flags
    if _feature_flags is None:
        _feature_flags = FeatureFlagService()
    return _feature_flags


