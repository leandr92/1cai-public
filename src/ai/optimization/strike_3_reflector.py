"""
Strike 3 Reflector
------------------

Implements the "Strike 3" self-critique pattern:
1. Generate initial response (Strike 1)
2. Critique the response (Strike 2)
3. Generate refined response (Strike 3)

Part of Phase 2: The Brain (Meta-Optimizer).
"""

import logging
from typing import Dict, Any, Optional, List

from src.ai.strategies.base import AIStrategy
from src.utils.structured_logging import StructuredLogger

logger = StructuredLogger(__name__).logger


class Strike3Reflector:
    """
    Refines AI responses using a 3-step critique loop.
    """

    def __init__(self, llm_strategy: AIStrategy):
        """
        Args:
            llm_strategy: The LLM strategy to use for critique and refinement.
        """
        self.llm_strategy = llm_strategy

    async def refine(
        self, query: str, initial_response: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Refines the initial response.

        Args:
            query: The original user query.
            initial_response: The response from Strike 1.
            context: Execution context.

        Returns:
            Dict containing the final response and the critique process.
        """
        context = context or {}

        # Strike 2: Critique
        critique = await self._generate_critique(query, initial_response, context)

        # If critique is minimal or positive, return initial response
        if self._is_critique_positive(critique):
            logger.info("Strike 3: Critique was positive, keeping initial response")
            return {
                "response": initial_response,
                "refinement_process": {
                    "strike_1": initial_response,
                    "strike_2_critique": critique,
                    "strike_3_verdict": "kept_initial",
                },
            }

        # Strike 3: Refine
        final_response = await self._generate_refinement(query, initial_response, critique, context)

        logger.info("Strike 3: Response refined based on critique")
        return {
            "response": final_response,
            "refinement_process": {
                "strike_1": initial_response,
                "strike_2_critique": critique,
                "strike_3_verdict": "refined",
                "strike_3_response": final_response,
            },
        }

    async def _generate_critique(self, query: str, response: str, context: Dict) -> str:
        """Generates a critique of the response."""
        prompt = f"""
        [SYSTEM]: You are a critical code reviewer and AI safety expert.
        
        [USER QUERY]: {query}
        
        [AI RESPONSE]: {response}
        
        [TASK]: Critique the AI RESPONSE. Look for:
        1. Security vulnerabilities (SQLi, XSS, Secrets).
        2. Logical errors or hallucinations.
        3. Missing requirements from the query.
        4. Code style violations (Clean Architecture).
        
        If the response is good, just say "LGTM".
        Otherwise, list specific issues concisely.
        """

        # We use the strategy to generate the critique
        # Note: In a real implementation, we might want a different/stronger model for critique
        result = await self.llm_strategy.execute(prompt, context)
        if isinstance(result, dict):
            return result.get("response", str(result))
        return str(result)

    async def _generate_refinement(self, query: str, initial_response: str, critique: str, context: Dict) -> str:
        """Generates a refined response based on critique."""
        prompt = f"""
        [SYSTEM]: You are an expert developer. Fix the code based on the critique.
        
        [USER QUERY]: {query}
        
        [INITIAL RESPONSE]: {initial_response}
        
        [CRITIQUE]: {critique}
        
        [TASK]: Rewrite the INITIAL RESPONSE to address the CRITIQUE. 
        Provide ONLY the corrected response/code.
        """

        result = await self.llm_strategy.execute(prompt, context)
        if isinstance(result, dict):
            return result.get("response", str(result))
        return str(result)

    def _is_critique_positive(self, critique: str) -> bool:
        """Checks if the critique indicates the response is good."""
        positive_markers = ["lgtm", "looks good", "no issues", "correct", "optimal"]
        critique_lower = critique.lower()

        # If critique is very short and contains positive marker
        if len(critique) < 50 and any(m in critique_lower for m in positive_markers):
            return True

        return False
