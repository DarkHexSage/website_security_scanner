import requests
from urllib.parse import urljoin
import re
import time

class eWPTXScanner:
    """eWPTX-level web application security scanner with real vulnerability detection"""
    
    def __init__(self, target_url: str):
        self.target_url = target_url
        self.findings = []
        self.session = requests.Session()
        self.session.timeout = 10
        self.base_response = None
    
    def get_base_response(self):
        """Get initial response from target"""
        try:
            self.base_response = self.session.get(self.target_url, timeout=5, allow_redirects=True)
            return self.base_response
        except Exception as e:
            return None
    
    def test_ssl_tls(self):
        """Test if using HTTPS"""
        if not self.target_url.startswith('https://'):
            self.findings.append({
                "type": "Unencrypted Connection (HTTP)",
                "severity": "CRITICAL",
                "endpoint": self.target_url,
                "payload": None,
                "cvss": 9.1,
                "remediation": "Use HTTPS instead of HTTP for all traffic"
            })
    
    def test_security_headers(self):
        """Test for missing security headers"""
        try:
            response = self.session.get(self.target_url, timeout=5, allow_redirects=True)
            
            # Map of headers to test
            security_headers = {
                'Strict-Transport-Security': ('HSTS', 6.5, 'HIGH'),
                'X-Content-Type-Options': ('MIME sniffing protection', 5.3, 'MEDIUM'),
                'X-Frame-Options': ('Clickjacking protection', 5.3, 'MEDIUM'),
                'Content-Security-Policy': ('CSP policy', 5.3, 'MEDIUM')
            }
            
            for header, (description, cvss, severity) in security_headers.items():
                if header not in response.headers:
                    self.findings.append({
                        "type": f"Missing {header}",
                        "severity": severity,
                        "endpoint": self.target_url,
                        "payload": None,
                        "cvss": cvss,
                        "remediation": f"Add {header} to HTTP response headers. Example: '{header}: value'"
                    })
        except Exception as e:
            pass
    
    def test_server_info(self):
        """Test for server information disclosure"""
        try:
            response = self.session.get(self.target_url, timeout=5)
            
            if 'Server' in response.headers:
                server = response.headers.get('Server')
                self.findings.append({
                    "type": "Server Information Disclosure",
                    "severity": "LOW",
                    "endpoint": self.target_url,
                    "payload": f"Server: {server}",
                    "cvss": 2.7,
                    "remediation": f"Remove or obfuscate Server header. Currently exposing: {server}"
                })
        except Exception:
            pass
    
    def test_sql_injection(self):
        """Test for SQL Injection vulnerabilities"""
        try:
            # Common SQL injection payloads
            sql_payloads = [
                "' OR '1'='1",
                "1' OR '1'='1' --",
                "admin' --",
                "1 OR 1=1",
                "' UNION SELECT NULL --"
            ]
            
            # Get all links from the page
            response = self.session.get(self.target_url, timeout=5)
            
            # Look for forms or query parameters
            form_pattern = r'<form[^>]*action=["\']?([^"\'>\s]+)'
            forms = re.findall(form_pattern, response.text, re.IGNORECASE)
            
            # Check for query parameters in URLs
            param_pattern = r'[\?&]([a-zA-Z_][a-zA-Z0-9_]*)\s*='
            params = re.findall(param_pattern, response.text)
            
            if params:
                # Try SQL injection on parameters
                for param in set(params[:3]):  # Test first 3 params
                    for payload in sql_payloads:
                        try:
                            test_url = f"{self.target_url}?{param}={payload}"
                            test_response = self.session.get(test_url, timeout=3)
                            
                            # Check for SQL error messages
                            sql_errors = [
                                'SQL syntax',
                                'MySQL',
                                'PostgreSQL',
                                'sqlite',
                                'ORA-',
                                'syntax error',
                                'Warning: mysql_',
                                "You have an error in your SQL"
                            ]
                            
                            if any(error.lower() in test_response.text.lower() for error in sql_errors):
                                self.findings.append({
                                    "type": "SQL Injection",
                                    "severity": "CRITICAL",
                                    "endpoint": test_url,
                                    "payload": payload,
                                    "cvss": 9.8,
                                    "remediation": "Use parameterized queries/prepared statements. Validate and sanitize all inputs."
                                })
                                return
                        except:
                            continue
        except Exception:
            pass
    
    def test_xss(self):
        """Test for XSS vulnerabilities"""
        try:
            xss_payload = '"><script>alert(1)</script>'
            
            # Get page to find forms
            response = self.session.get(self.target_url, timeout=5)
            
            # Look for common XSS vectors
            param_pattern = r'[\?&]([a-zA-Z_][a-zA-Z0-9_]*)\s*='
            params = re.findall(param_pattern, response.text)
            
            if params:
                for param in set(params[:2]):
                    try:
                        test_url = f"{self.target_url}?{param}={xss_payload}"
                        test_response = self.session.get(test_url, timeout=3)
                        
                        # Check if payload is reflected in response
                        if xss_payload in test_response.text or '<script>alert(1)</script>' in test_response.text:
                            self.findings.append({
                                "type": "Reflected XSS",
                                "severity": "HIGH",
                                "endpoint": test_url,
                                "payload": xss_payload,
                                "cvss": 8.2,
                                "remediation": "Output encode all user input. Use Content Security Policy headers."
                            })
                            return
                    except:
                        continue
        except Exception:
            pass
    
    def test_weak_auth(self):
        """Test for weak authentication"""
        try:
            response = self.session.get(self.target_url, timeout=5)
            
            # Check for common weak auth patterns
            weak_patterns = [
                r'password\s*=\s*["\'][^"\']+["\']',  # Hardcoded passwords
                r'api[_-]?key\s*=\s*["\'][^"\']+["\']',  # Hardcoded API keys
                r'Authorization:\s*Bearer\s+[a-zA-Z0-9]{1,10}[^"\']*',  # Weak token format
            ]
            
            for pattern in weak_patterns:
                if re.search(pattern, response.text, re.IGNORECASE):
                    self.findings.append({
                        "type": "Weak Authentication",
                        "severity": "CRITICAL",
                        "endpoint": self.target_url,
                        "payload": "Credentials found in source code",
                        "cvss": 9.1,
                        "remediation": "Never hardcode credentials. Use secure credential management (environment variables, vaults)."
                    })
                    return
        except Exception:
            pass
    
    def test_directory_listing(self):
        """Test for directory listing"""
        try:
            test_dirs = ['/', '/admin/', '/uploads/', '/backup/', '/config/']
            
            for directory in test_dirs:
                try:
                    url = urljoin(self.target_url, directory)
                    response = self.session.get(url, timeout=3)
                    
                    # Check for directory listing indicators
                    if '<title>Index of' in response.text or 'Directory listing for' in response.text:
                        self.findings.append({
                            "type": "Directory Listing Enabled",
                            "severity": "MEDIUM",
                            "endpoint": url,
                            "payload": None,
                            "cvss": 5.3,
                            "remediation": "Disable directory listing in web server configuration (Options -Indexes in Apache)"
                        })
                        break
                except:
                    continue
        except Exception:
            pass
    
    def test_basic_auth(self):
        """Test for missing authentication on sensitive endpoints"""
        try:
            # Common admin/sensitive paths
            sensitive_paths = [
                '/admin',
                '/admin.php',
                '/administrator',
                '/user/profile',
                '/api/users',
                '/config.php',
                '/backup'
            ]
            
            for path in sensitive_paths:
                try:
                    url = urljoin(self.target_url, path)
                    response = self.session.get(url, timeout=3, allow_redirects=False)
                    
                    # If accessible without auth (200 response), it's a vulnerability
                    if response.status_code == 200 and 'admin' in path.lower():
                        self.findings.append({
                            "type": "Broken Access Control",
                            "severity": "CRITICAL",
                            "endpoint": url,
                            "payload": None,
                            "cvss": 9.1,
                            "remediation": "Implement proper authentication and authorization checks on all sensitive endpoints"
                        })
                        return
                except:
                    continue
        except Exception:
            pass
    
    def run_all_tests(self):
        """Run all security tests"""
        self.test_ssl_tls()
        self.test_security_headers()
        self.test_server_info()
        self.test_sql_injection()
        self.test_xss()
        self.test_weak_auth()
        self.test_directory_listing()
        self.test_basic_auth()
        
        return self.findings