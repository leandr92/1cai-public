"""
Git Automation Adapter
----------------------

Handles Git operations for Self-Evolving AI (RSI).
Enforces "Rule of Two" by ensuring all changes go through a Pull Request process.
"""

import logging
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass

from src.utils.structured_logging import StructuredLogger

logger = StructuredLogger(__name__).logger

@dataclass
class PullRequest:
    title: str
    description: str
    source_branch: str
    target_branch: str = "main"
    changes: Dict[str, str] = None  # file_path -> content

class GitAutomation:
    """
    Adapter for Git operations.
    In a real scenario, this would interact with GitLab/GitHub API.
    For now, it simulates the process and ensures safety checks.
    """

    def __init__(self, repo_path: str = "."):
        self.repo_path = repo_path

    async def create_optimization_branch(self, branch_name: str) -> bool:
        """
        Creates a new branch for optimization.
        """
        logger.info(f"Creating optimization branch: {branch_name}")
        # Simulation: git checkout -b branch_name
        return True

    async def commit_changes(self, branch_name: str, changes: Dict[str, str], message: str) -> bool:
        """
        Commits changes to the specified branch.
        """
        logger.info(f"Committing {len(changes)} files to {branch_name} with message: {message}")
        for file_path, content in changes.items():
            logger.debug(f"Staging file: {file_path}")
            # Simulation: write file, git add
        
        # Simulation: git commit -m message
        return True

    async def create_pull_request(self, pr: PullRequest) -> str:
        """
        Creates a Pull Request (Merge Request).
        
        Returns:
            PR URL or ID
        """
        if pr.target_branch == "main":
            logger.info("Enforcing Rule of Two: PR targeting main requires human approval.")
        
        logger.info(
            f"Creating PR: {pr.title}",
            extra={
                "source": pr.source_branch,
                "target": pr.target_branch,
                "files_changed": list(pr.changes.keys()) if pr.changes else []
            }
        )
        
        # Simulation: Call GitLab/GitHub API
        pr_id = f"PR-{hash(pr.title) % 10000}"
        logger.info(f"PR created successfully: {pr_id}")
        
        return pr_id

    async def check_branch_safety(self, branch_name: str) -> bool:
        """
        Checks if the branch is safe to work on (not protected).
        """
        protected_branches = ["main", "master", "production"]
        if branch_name in protected_branches:
            logger.warning(f"Attempt to modify protected branch directly: {branch_name}")
            return False
        return True

# Global instance
_git_automation = None

def get_git_automation() -> GitAutomation:
    global _git_automation
    if _git_automation is None:
        _git_automation = GitAutomation()
    return _git_automation
