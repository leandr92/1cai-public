"""
Natural Language to Cypher Query Generator
Converts plain language queries to Neo4j Cypher
"""

import re
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)


class NLToCypherConverter:
    """Converts natural language to Cypher queries"""
    
    # Common patterns and their Cypher equivalents
    PATTERNS = [
        # Show/Find/List patterns
        (r'show\s+(?:me\s+)?all\s+(\w+)', r'MATCH (n:\1) RETURN n LIMIT 100'),
        (r'find\s+all\s+(\w+)', r'MATCH (n:\1) RETURN n LIMIT 100'),
        (r'list\s+(?:all\s+)?(\w+)', r'MATCH (n:\1) RETURN n LIMIT 100'),
        
        # Count patterns
        (r'how\s+many\s+(\w+)', r'MATCH (n:\1) RETURN count(n) AS total'),
        (r'count\s+(\w+)', r'MATCH (n:\1) RETURN count(n) AS total'),
        
        # Search patterns
        (r'search\s+(\w+)\s+(?:for|with|containing)\s+["\']([^"\']+)["\']',
         r'MATCH (n:\1) WHERE n.name CONTAINS "\2" RETURN n LIMIT 50'),
        
        # Relationship patterns
        (r'(?:show|find)\s+(\w+)\s+(?:that\s+)?(?:depends on|related to)\s+["\']([^"\']+)["\']',
         r'MATCH (n:\1)-[r]->(m) WHERE m.name = "\2" RETURN n, r, m'),
        
        # Property search
        (r'(\w+)\s+where\s+(\w+)\s*=\s*["\']([^"\']+)["\']',
         r'MATCH (n:\1 {\2: "\3"}) RETURN n'),
    ]
    
    def convert(self, natural_query: str) -> Dict[str, Any]:
        """
        Convert natural language to Cypher
        
        Args:
            natural_query: Natural language query
            
        Returns:
            Dict with cypher query, confidence, and explanation
        """
        query_lower = natural_query.lower().strip()
        
        logger.info(f"Converting NL query: {natural_query}")
        
        # Try each pattern
        for pattern, cypher_template in self.PATTERNS:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                try:
                    # Replace capture groups
                    cypher = cypher_template
                    for i, group in enumerate(match.groups(), 1):
                        cypher = cypher.replace(f'\\{i}', group.capitalize())
                    
                    logger.info(f"Matched pattern, generated Cypher: {cypher}")
                    
                    return {
                        "cypher": cypher,
                        "confidence": 0.85,
                        "explanation": f"Converted '{natural_query}' to Cypher query",
                        "pattern_matched": pattern,
                        "safe": True
                    }
                except Exception as e:
                    logger.error(f"Error applying pattern: {e}")
                    continue
        
        # No pattern matched - try intelligent fallback
        return self._intelligent_fallback(natural_query)
    
    def _intelligent_fallback(self, query: str) -> Dict[str, Any]:
        """
        Intelligent fallback for queries that don't match patterns
        
        Uses keyword extraction and heuristics
        """
        query_lower = query.lower()
        
        # Extract potential node labels
        common_labels = ['Module', 'Function', 'Procedure', 'Configuration', 'Document', 'Register']
        found_label = None
        
        for label in common_labels:
            if label.lower() in query_lower:
                found_label = label
                break
        
        if found_label:
            # Generic query for this label
            cypher = f"MATCH (n:{found_label}) RETURN n LIMIT 50"
            
            # Add WHERE clause if searching for something
            if 'name' in query_lower or 'called' in query_lower:
                # Try to extract name from quotes
                name_match = re.search(r'["\']([^"\']+)["\']', query)
                if name_match:
                    name = name_match.group(1)
                    cypher = f"MATCH (n:{found_label}) WHERE n.name CONTAINS '{name}' RETURN n"
            
            return {
                "cypher": cypher,
                "confidence": 0.6,
                "explanation": f"Generic query for {found_label}",
                "pattern_matched": "intelligent_fallback",
                "safe": True
            }
        
        # Ultimate fallback - safe generic query
        return {
            "cypher": "MATCH (n) RETURN n LIMIT 10",
            "confidence": 0.3,
            "explanation": "Generic query - please refine your question",
            "pattern_matched": "generic_fallback",
            "safe": True,
            "suggestion": "Try: 'show all Modules' or 'find Function called XXX'"
        }
    
    def validate_cypher(self, cypher: str) -> bool:
        """
        Validate that Cypher query is safe (no DELETE, DROP, etc.)
        
        Args:
            cypher: Cypher query to validate
            
        Returns:
            bool: True if safe, False if dangerous
        """
        cypher_upper = cypher.upper()
        
        # Blacklist dangerous operations
        dangerous_keywords = [
            'DELETE', 'REMOVE', 'DROP', 'CREATE', 'SET',
            'MERGE', 'DETACH DELETE'
        ]
        
        for keyword in dangerous_keywords:
            if keyword in cypher_upper:
                logger.warning(f"Dangerous keyword detected: {keyword}")
                return False
        
        return True


# Global converter instance
_converter = None

def get_nl_to_cypher_converter() -> NLToCypherConverter:
    """Get singleton converter instance"""
    global _converter
    if _converter is None:
        _converter = NLToCypherConverter()
    return _converter


# Examples of supported queries:
"""
Supported Natural Language Queries:

1. "show all Modules"
   → MATCH (n:Module) RETURN n LIMIT 100

2. "find all Functions"
   → MATCH (n:Function) RETURN n LIMIT 100

3. "how many Modules"
   → MATCH (n:Module) RETURN count(n) AS total

4. "search Module for 'DocumentFlow'"
   → MATCH (n:Module) WHERE n.name CONTAINS "DocumentFlow" RETURN n LIMIT 50

5. "show Functions that depends on 'CoreModule'"
   → MATCH (n:Function)-[r]->(m) WHERE m.name = "CoreModule" RETURN n, r, m

6. "Module where name = 'SalesModule'"
   → MATCH (n:Module {name: "SalesModule"}) RETURN n

More examples can be added easily!
"""


