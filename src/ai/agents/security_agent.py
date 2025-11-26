"""
Security AI Agent

Специализированный агент для security audit, vulnerability scanning,
и compliance checking.
"""

import re
from typing import Any, Dict, List, Optional
from datetime import datetime

from src.ai.agents.base_agent import BaseAgent, AgentCapability, AgentStatus
from src.security.ai_security_layer import AISecurityLayer, AgentRuleOfTwoConfig


class SecurityAgent(BaseAgent):
    """
    Security AI Agent для автоматического security audit.
    
    Capabilities:
    - Vulnerability scanning
    - Dependency audit
    - Secret detection
    - Code security analysis
    - Compliance checking
    """
    
    # Known vulnerability patterns
    VULNERABILITY_PATTERNS = {
        "sql_injection": [
            r"execute\s*\(\s*['\"].*\+.*['\"]",
            r"query\s*=\s*['\"].*\+.*['\"]",
            r"SELECT.*FROM.*WHERE.*\+",
        ],
        "xss": [
            r"innerHTML\s*=",
            r"document\.write\s*\(",
            r"eval\s*\(",
        ],
        "hardcoded_secrets": [
            r"password\s*=\s*['\"][^'\"]+['\"]",
            r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]",
            r"secret\s*=\s*['\"][^'\"]+['\"]",
            r"token\s*=\s*['\"][^'\"]+['\"]",
        ],
        "insecure_crypto": [
            r"MD5\s*\(",
            r"SHA1\s*\(",
            r"DES\s*\(",
        ],
        "path_traversal": [
            r"\.\./",
            r"\.\.\\\\",
        ],
    }
    
    # Compliance frameworks
    COMPLIANCE_FRAMEWORKS = [
        "OWASP_TOP_10",
        "CWE_TOP_25",
        "PCI_DSS",
        "GDPR",
        "SOC2",
    ]
    
    def __init__(self):
        super().__init__(
            agent_name="security_agent",
            capabilities=[
                AgentCapability.SECURITY_AUDIT,
                AgentCapability.CODE_REVIEW,
            ]
        )
        
        self.security_layer = AISecurityLayer()
        
        # Rule of Two: [AB] - can process untrusted code, can access sensitive data
        self.rule_of_two = AgentRuleOfTwoConfig(
            can_process_untrusted=True,  # [A] - анализирует любой код
            can_access_sensitive=True,   # [B] - видит security данные
            can_change_state=False,      # [C] - НЕ может изменять код
        )
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process security audit request.
        
        Args:
            input_data: {
                "code": str,  # Code to analyze
                "scan_type": str,  # vulnerability_scan, dependency_audit, etc.
                "framework": str,  # Compliance framework (optional)
            }
            
        Returns:
            Security audit results
        """
        code = input_data.get("code", "")
        scan_type = input_data.get("scan_type", "vulnerability_scan")
        framework = input_data.get("framework")
        
        if scan_type == "vulnerability_scan":
            return await self._scan_vulnerabilities(code)
        elif scan_type == "dependency_audit":
            return await self._audit_dependencies(input_data.get("dependencies", []))
        elif scan_type == "secret_detection":
            return await self._detect_secrets(code)
        elif scan_type == "compliance_check":
            return await self._check_compliance(code, framework)
        else:
            return {"error": f"Unknown scan type: {scan_type}"}
    
    async def _scan_vulnerabilities(self, code: str) -> Dict[str, Any]:
        """
        Scan code for vulnerabilities.
        
        Args:
            code: Code to scan
            
        Returns:
            Vulnerability report
        """
        vulnerabilities = []
        
        for vuln_type, patterns in self.VULNERABILITY_PATTERNS.items():
            for pattern in patterns:
                matches = re.finditer(pattern, code, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    # Find line number
                    line_num = code[:match.start()].count('\n') + 1
                    
                    vulnerabilities.append({
                        "type": vuln_type,
                        "severity": self._get_severity(vuln_type),
                        "line": line_num,
                        "code_snippet": match.group(0),
                        "description": self._get_vulnerability_description(vuln_type),
                        "recommendation": self._get_recommendation(vuln_type),
                    })
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(vulnerabilities)
        
        return {
            "vulnerabilities": vulnerabilities,
            "total_count": len(vulnerabilities),
            "risk_score": risk_score,
            "severity_breakdown": self._get_severity_breakdown(vulnerabilities),
            "scan_timestamp": datetime.utcnow().isoformat(),
        }
    
    async def _audit_dependencies(self, dependencies: List[Dict]) -> Dict[str, Any]:
        """
        Audit dependencies for known vulnerabilities.
        
        Args:
            dependencies: List of dependencies with versions
            
        Returns:
            Dependency audit report
        """
        vulnerable_deps = []
        
        for dep in dependencies:
            name = dep.get("name", "")
            version = dep.get("version", "")
            
            # Check against known vulnerabilities (placeholder)
            # В production: интеграция с CVE database, Snyk, etc.
            if self._is_vulnerable_version(name, version):
                vulnerable_deps.append({
                    "name": name,
                    "version": version,
                    "vulnerability": "Known CVE",
                    "severity": "high",
                    "recommendation": f"Update {name} to latest version",
                })
        
        return {
            "vulnerable_dependencies": vulnerable_deps,
            "total_dependencies": len(dependencies),
            "vulnerable_count": len(vulnerable_deps),
            "audit_timestamp": datetime.utcnow().isoformat(),
        }
    
    async def _detect_secrets(self, code: str) -> Dict[str, Any]:
        """
        Detect hardcoded secrets in code.
        
        Args:
            code: Code to scan
            
        Returns:
            Secret detection report
        """
        secrets_found = []
        
        for pattern in self.VULNERABILITY_PATTERNS["hardcoded_secrets"]:
            matches = re.finditer(pattern, code, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                line_num = code[:match.start()].count('\n') + 1
                
                secrets_found.append({
                    "type": "hardcoded_secret",
                    "line": line_num,
                    "severity": "critical",
                    "recommendation": "Move secrets to environment variables or secret manager",
                })
        
        return {
            "secrets_found": secrets_found,
            "total_count": len(secrets_found),
            "scan_timestamp": datetime.utcnow().isoformat(),
        }
    
    async def _check_compliance(
        self,
        code: str,
        framework: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check code compliance with security frameworks.
        
        Args:
            code: Code to check
            framework: Compliance framework (OWASP, CWE, etc.)
            
        Returns:
            Compliance report
        """
        framework = framework or "OWASP_TOP_10"
        
        if framework not in self.COMPLIANCE_FRAMEWORKS:
            return {"error": f"Unknown framework: {framework}"}
        
        # Scan vulnerabilities
        vuln_results = await self._scan_vulnerabilities(code)
        
        # Map to framework
        compliance_issues = self._map_to_framework(
            vuln_results["vulnerabilities"],
            framework
        )
        
        return {
            "framework": framework,
            "compliance_issues": compliance_issues,
            "compliance_score": self._calculate_compliance_score(compliance_issues),
            "scan_timestamp": datetime.utcnow().isoformat(),
        }
    
    def _get_severity(self, vuln_type: str) -> str:
        """Get vulnerability severity"""
        severity_map = {
            "sql_injection": "critical",
            "xss": "high",
            "hardcoded_secrets": "critical",
            "insecure_crypto": "medium",
            "path_traversal": "high",
        }
        return severity_map.get(vuln_type, "medium")
    
    def _get_vulnerability_description(self, vuln_type: str) -> str:
        """Get vulnerability description"""
        descriptions = {
            "sql_injection": "SQL Injection vulnerability detected",
            "xss": "Cross-Site Scripting (XSS) vulnerability detected",
            "hardcoded_secrets": "Hardcoded secret detected",
            "insecure_crypto": "Insecure cryptographic algorithm detected",
            "path_traversal": "Path traversal vulnerability detected",
        }
        return descriptions.get(vuln_type, "Security vulnerability detected")
    
    def _get_recommendation(self, vuln_type: str) -> str:
        """Get remediation recommendation"""
        recommendations = {
            "sql_injection": "Use parameterized queries or ORM",
            "xss": "Sanitize user input and use Content Security Policy",
            "hardcoded_secrets": "Move secrets to environment variables",
            "insecure_crypto": "Use SHA-256 or stronger algorithms",
            "path_traversal": "Validate and sanitize file paths",
        }
        return recommendations.get(vuln_type, "Review and fix security issue")
    
    def _calculate_risk_score(self, vulnerabilities: List[Dict]) -> float:
        """Calculate overall risk score (0-100)"""
        if not vulnerabilities:
            return 0.0
        
        severity_weights = {
            "critical": 10,
            "high": 7,
            "medium": 4,
            "low": 1,
        }
        
        total_score = sum(
            severity_weights.get(v["severity"], 1)
            for v in vulnerabilities
        )
        
        # Normalize to 0-100
        return min(100.0, total_score * 5)
    
    def _get_severity_breakdown(self, vulnerabilities: List[Dict]) -> Dict[str, int]:
        """Get count by severity"""
        breakdown = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        for vuln in vulnerabilities:
            severity = vuln.get("severity", "medium")
            breakdown[severity] = breakdown.get(severity, 0) + 1
        
        return breakdown
    
    def _is_vulnerable_version(self, name: str, version: str) -> bool:
        """Check if dependency version is vulnerable (placeholder)"""
        # В production: интеграция с CVE database
        return False
    
    def _map_to_framework(
        self,
        vulnerabilities: List[Dict],
        framework: str
    ) -> List[Dict]:
        """Map vulnerabilities to compliance framework"""
        # Placeholder mapping
        return [
            {
                **vuln,
                "framework_id": f"{framework}-{i+1}",
            }
            for i, vuln in enumerate(vulnerabilities)
        ]
    
    def _calculate_compliance_score(self, issues: List[Dict]) -> float:
        """Calculate compliance score (0-100)"""
        if not issues:
            return 100.0
        
        # Deduct points for each issue
        deduction = len(issues) * 5
        return max(0.0, 100.0 - deduction)


__all__ = ["SecurityAgent"]
