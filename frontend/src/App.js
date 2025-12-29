import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [scanId, setScanId] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setIsLoggedIn(true);
    }
  }, []);

  // ===== VALIDATION FUNCTIONS =====
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // ===== GET COLOR BY SEVERITY =====
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ff1a2dff'; // Vibrant red
      case 'HIGH':
        return 'rgb(238, 123, 14)'; // Vibrant orange
      case 'MEDIUM':
        return 'color: rgb(255, 240, 114);'; // Vibrant yellow-orange
      case 'LOW':
        return '#54a0ff'; // Vibrant blue
      default:
        return '#ffffffff'; // Gray
    }
  };

  const getSeverityBgColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'rgba(255, 71, 87, 0.1)';
      case 'HIGH':
        return 'rgba(255, 159, 67, 0.1)';
      case 'MEDIUM':
        return 'rgba(255, 165, 2, 0.1)';
      case 'LOW':
        return 'rgba(84, 160, 255, 0.1)';
      default:
        return 'rgba(164, 176, 189, 0.1)';
    }
  };

  // ===== REGISTER =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email format. Example: user@example.com');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }

    setLoading(false);
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    if (!validatePassword(password)) {
      setError('Invalid password');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }

    setLoading(false);
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setScanId(null);
    setScannedUrl(null);
    setFindings([]);
  };

  // ===== START SCAN =====
  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateUrl(url)) {
      setError('Invalid URL. Use: https://example.com or http://example.com');
      return;
    }

    setLoading(true);

    try {
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/api/scans/create`,
        { url },
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setScanId(response.data.scan_id);
      setScannedUrl(url);
      setScanStatus('running');
      setUrl('');
      pollScan(response.data.scan_id, currentToken);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start scan');
    }

    setLoading(false);
  };

  // ===== POLL SCAN STATUS =====
  const pollScan = (id, currentToken) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/scans/status/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setScanStatus(response.data.status);
        setFindings(response.data.findings || []);

        if (response.data.status !== 'running') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Poll error:', err);
        clearInterval(interval);
      }
    }, 2000);
  };

  // ===== LOGIN/REGISTER SCREEN =====
  if (!isLoggedIn) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authOverlay} />
        
        <div style={styles.authBox}>
          <div style={styles.authHeader}>
            <h1 style={styles.authTitle}>Security Audit Platform</h1>
            <p style={styles.authSubtitle}>Advanced Vulnerability Scanner</p>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.authTabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(authMode === 'login' ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(authMode === 'register' ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {authMode === 'login' ? 'Logging in...' : 'Registering...'}
                </>
              ) : (
                authMode === 'login' ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <div style={styles.authFooter}>
            <p style={styles.footerText}>
              <strong>Requirements:</strong>
            </p>
            <ul style={styles.requirementsList}>
              <li>✓ Valid email address</li>
              <li>✓ Password: 8+ characters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD SCREEN =====
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardOverlay} />
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>Security Audit Platform</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{localStorage.getItem('user_email')}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left: Form */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Scan Website</h2>
            <p style={styles.cardSubtitle}>Enter a URL to scan for vulnerabilities</p>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleScan} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Target URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button
                type="submit"
                style={styles.scanButton}
                disabled={loading || scanStatus === 'running'}
              >
                {loading ? 'Starting scan...' : scanStatus === 'running' ? 'Scanning...' : 'Start Security Scan'}
              </button>
            </form>

            <div style={styles.testUrls}>
              <p style={styles.testUrlsTitle}>Test URLs</p>
              <div style={styles.testUrlsList}>
                <code style={styles.testUrl}>http://testphp.vulnweb.com/</code>
                <code style={styles.testUrl}>https://www.google.com</code>
                <code style={styles.testUrl}>https://www.wikipedia.org</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div style={styles.rightColumn}>
          {!scanId ? (
            <div style={styles.card}>
              <div style={styles.welcomeBox}>
                <h2 style={styles.cardTitle}>Welcome</h2>
                <p style={styles.cardSubtitle}>Secure your web applications with comprehensive vulnerability scanning</p>
                
                <div style={styles.featuresGrid}>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>SQL Injection</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>XSS Attacks</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Security Headers</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Directory Listing</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Server Info Disclosure</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Access Control</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Security Scan Results</h2>
                <p style={styles.urlDisplay}>{scannedUrl}</p>
              </div>

              {scanStatus === 'running' ? (
                <div style={styles.scanningState}>
                  <div style={styles.scanningAnimation}>
                    <div style={styles.scanningDot}></div>
                  </div>
                  <p style={styles.scanningText}>Analyzing website security...</p>
                  <p style={styles.scanningSubtext}>This may take a moment</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div style={styles.summaryGrid}>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('CRITICAL')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('CRITICAL')}}>
                        {findings.filter((f) => f.severity === 'CRITICAL').length}
                      </div>
                      <div style={styles.summaryLabel}>Critical</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('HIGH')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('HIGH')}}>
                        {findings.filter((f) => f.severity === 'HIGH').length}
                      </div>
                      <div style={styles.summaryLabel}>High</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('MEDIUM')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('MEDIUM')}}>
                        {findings.filter((f) => f.severity === 'MEDIUM').length}
                      </div>
                      <div style={styles.summaryLabel}>Medium</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('LOW')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('LOW')}}>
                        {findings.filter((f) => f.severity === 'LOW').length}
                      </div>
                      <div style={styles.summaryLabel}>Low</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: '#3b82f6'}}>
                      <div style={{...styles.summaryCount, color: '#3b82f6'}}>
                        {findings.length}
                      </div>
                      <div style={styles.summaryLabel}>Total</div>
                    </div>
                  </div>

                  {findings.length === 0 ? (
                    <div style={styles.noFindingsBox}>
                      <p style={styles.noFindingsText}>No vulnerabilities detected!</p>
                      <p style={styles.noFindingsSubtext}>This website appears to be secure</p>
                    </div>
                  ) : (
                    <div style={styles.findingsList}>
                      {findings.map((finding, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            ...styles.findingCard,
                            backgroundColor: getSeverityBgColor(finding.severity),
                            borderLeftColor: getSeverityColor(finding.severity)
                          }}
                        >
                          <div style={styles.findingHeader}>
                            <h3 style={styles.findingType}>{finding.type}</h3>
                            <span style={{
                              background: getSeverityColor(finding.severity),
                              color: 'white',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>
                              {finding.severity}
                            </span>
                          </div>
                          
                          {finding.endpoint && (
                            <p style={styles.findingDetail}>
                              <strong>Endpoint:</strong> 
                              <code style={styles.endpoint}>{finding.endpoint}</code>
                            </p>
                          )}
                          
                          <div style={styles.cvssContainer}>
                            <strong>CVSS Score:</strong>
                            <div style={{...styles.cvssBar, width: `${(finding.cvss_score / 10) * 100}%`, backgroundColor: getSeverityColor(finding.severity)}}>
                              {finding.cvss_score}/10
                            </div>
                          </div>
                          
                          <p style={styles.findingDetail}>
                            <strong>Remediation:</strong> {finding.remediation}
                          </p>
                          
                          {finding.payload && (
                            <p style={styles.payloadDetail}>
                              <strong>Payload:</strong> <code style={styles.payloadCode}>{finding.payload}</code>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // AUTH CONTAINER
  authContainer: {
    minHeight: '100vh',
    backgroundImage: 'url("https://wallpapers.com/images/hd/honeycomb-cyber-security-de1nra84qghymwjm.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: 'relative',
  },

  authOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1,
  },

  authBox: {
    background: 'rgba(20, 30, 60, 0.3)',
    padding: '50px 40px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
    width: '100%',
    maxWidth: '420px',
    zIndex: 2,
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  authHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },

  authTitle: {
    margin: '0 0 10px 0',
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  authSubtitle: {
    margin: 0,
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  authTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },

  tabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  tabButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
  },

  tabButtonInactive: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  authFooter: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(59, 130, 246, 0.3)',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  footerText: {
    margin: '0 0 10px 0',
    fontWeight: '600',
    color: '#ffffff',
  },

  requirementsList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    listStyle: 'none',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // DASHBOARD
  dashboardContainer: {
    minHeight: '100vh',
    backgroundImage: 'url("https://www.pixelstalk.net/wp-content/uploads/2016/05/Futuristic-Computer-Wallpapers.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: 'relative',
  },

  dashboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 0,
  },

  // HEADER
  header: {
    background: 'rgba(26, 58, 82, 0.35)',
    color: 'white',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    position: 'relative',
    zIndex: 10,
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },

  userEmail: {
    fontSize: '15px',
    fontWeight: '500',
    opacity: 0.9,
  },

  // MAIN CONTENT
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '35% 1fr',
    gap: '25px',
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 5,
  },

  leftColumn: {
    minHeight: 'calc(100vh - 200px)',
  },

  rightColumn: {
    minHeight: 'calc(100vh - 200px)',
  },

  // CARDS
  card: {
    background: 'rgba(20, 30, 60, 0.25)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '26px',
    fontWeight: '700',
    color: '#ffffff',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  cardSubtitle: {
    margin: '0 0 25px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // FORMS
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  },

  input: {
    padding: '13px 16px',
    border: '2px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    outline: 'none',
    background: 'rgba(20, 30, 60, 0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#ffffff',
  },

  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },

  // BUTTONS
  submitButton: {
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '10px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
  },

  scanButton: {
    padding: '13px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
  },

  logoutButton: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  },

  // ERRORS
  errorAlert: {
    background: 'rgba(255, 71, 87, 0.2)',
    color: '#ff6b7a',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
    borderLeft: '4px solid #ff6b7a',
  },

  // TEST URLS
  testUrls: {
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  testUrlsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  testUrlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  testUrl: {
    padding: '9px 12px',
    background: 'rgba(20, 30, 60, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#a8c5f7',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    fontFamily: 'Courier New, monospace',
    wordBreak: 'break-all',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },

  // WELCOME BOX
  welcomeBox: {
    textAlign: 'center',
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginTop: '25px',
  },

  feature: {
    padding: '15px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  featureName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  },

  // RESULTS HEADER
  resultsHeader: {
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
  },

  urlDisplay: {
    fontSize: '13px',
    color: '#a8c5f7',
    margin: '10px 0 0 0',
    fontFamily: 'Courier New, monospace',
    wordBreak: 'break-all',
    fontWeight: '500',
  },

  // SCANNING STATE
  scanningState: {
    textAlign: 'center',
    padding: '60px 20px',
  },

  scanningAnimation: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },

  scanningDot: {
    width: '12px',
    height: '12px',
    background: '#a8c5f7',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },

  scanningText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },

  scanningSubtext: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },

  // SUMMARY GRID
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '25px',
  },

  summaryCard: {
    background: 'rgba(59, 130, 246, 0.15)',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    borderTop: '4px solid',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  summaryCount: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#a8c5f7',
  },

  summaryLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // NO FINDINGS
  noFindingsBox: {
    textAlign: 'center',
    padding: '50px 20px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '12px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
  },

  noFindingsText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#a8c5f7',
    margin: '0 0 8px 0',
  },

  noFindingsSubtext: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },

  // FINDINGS LIST
  findingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  findingCard: {
    padding: '18px',
    borderRadius: '10px',
    borderLeft: '5px solid',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  findingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    gap: '15px',
  },

  findingType: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },

  findingDetail: {
    margin: '8px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  endpoint: {
    fontSize: '13px',
    background: 'rgba(59, 130, 246, 0.2)',
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#a8c5f7',
    fontFamily: 'Courier New, monospace',
    marginLeft: '8px',
  },

  cvssContainer: {
    margin: '12px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  cvssBar: {
    height: '24px',
    marginTop: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'width 0.3s ease',
  },

  payloadDetail: {
    margin: '12px 0 0 0',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.75)',
    fontStyle: 'italic',
  },

  payloadCode: {
    fontSize: '12px',
    background: 'rgba(20, 30, 60, 0.3)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'Courier New, monospace',
    marginLeft: '6px',
    wordBreak: 'break-all',
    color: '#a8c5f7',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },

  spinner: {
    display: 'inline-block',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'white',
    animation: 'spin 0.6s infinite',
  },
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  input:focus {
    outline: none;
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    div[style*="gridTemplateColumns"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default App;
import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [scanId, setScanId] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setIsLoggedIn(true);
    }
  }, []);

  // ===== VALIDATION FUNCTIONS =====
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // ===== GET COLOR BY SEVERITY =====
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ff1a2dff'; // Vibrant red
      case 'HIGH':
        return 'rgb(238, 123, 14)'; // Vibrant orange
      case 'MEDIUM':
        return 'color: rgb(255, 240, 114);'; // Vibrant yellow-orange
      case 'LOW':
        return '#54a0ff'; // Vibrant blue
      default:
        return '#ffffffff'; // Gray
    }
  };

  const getSeverityBgColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'rgba(255, 71, 87, 0.1)';
      case 'HIGH':
        return 'rgba(255, 159, 67, 0.1)';
      case 'MEDIUM':
        return 'rgba(255, 165, 2, 0.1)';
      case 'LOW':
        return 'rgba(84, 160, 255, 0.1)';
      default:
        return 'rgba(164, 176, 189, 0.1)';
    }
  };

  // ===== REGISTER =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email format. Example: user@example.com');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }

    setLoading(false);
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    if (!validatePassword(password)) {
      setError('Invalid password');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }

    setLoading(false);
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setScanId(null);
    setScannedUrl(null);
    setFindings([]);
  };

  // ===== START SCAN =====
  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateUrl(url)) {
      setError('Invalid URL. Use: https://example.com or http://example.com');
      return;
    }

    setLoading(true);

    try {
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/api/scans/create`,
        { url },
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setScanId(response.data.scan_id);
      setScannedUrl(url);
      setScanStatus('running');
      setUrl('');
      pollScan(response.data.scan_id, currentToken);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start scan');
    }

    setLoading(false);
  };

  // ===== POLL SCAN STATUS =====
  const pollScan = (id, currentToken) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/scans/status/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setScanStatus(response.data.status);
        setFindings(response.data.findings || []);

        if (response.data.status !== 'running') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Poll error:', err);
        clearInterval(interval);
      }
    }, 2000);
  };

  // ===== LOGIN/REGISTER SCREEN =====
  if (!isLoggedIn) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authOverlay} />
        
        <div style={styles.authBox}>
          <div style={styles.authHeader}>
            <h1 style={styles.authTitle}>Security Audit Platform</h1>
            <p style={styles.authSubtitle}>Advanced Vulnerability Scanner</p>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.authTabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(authMode === 'login' ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(authMode === 'register' ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {authMode === 'login' ? 'Logging in...' : 'Registering...'}
                </>
              ) : (
                authMode === 'login' ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <div style={styles.authFooter}>
            <p style={styles.footerText}>
              <strong>Requirements:</strong>
            </p>
            <ul style={styles.requirementsList}>
              <li>✓ Valid email address</li>
              <li>✓ Password: 8+ characters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD SCREEN =====
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardOverlay} />
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>Security Audit Platform</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{localStorage.getItem('user_email')}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left: Form */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Scan Website</h2>
            <p style={styles.cardSubtitle}>Enter a URL to scan for vulnerabilities</p>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleScan} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Target URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button
                type="submit"
                style={styles.scanButton}
                disabled={loading || scanStatus === 'running'}
              >
                {loading ? 'Starting scan...' : scanStatus === 'running' ? 'Scanning...' : 'Start Security Scan'}
              </button>
            </form>

            <div style={styles.testUrls}>
              <p style={styles.testUrlsTitle}>Test URLs</p>
              <div style={styles.testUrlsList}>
                <code style={styles.testUrl}>http://testphp.vulnweb.com/</code>
                <code style={styles.testUrl}>https://www.google.com</code>
                <code style={styles.testUrl}>https://www.wikipedia.org</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div style={styles.rightColumn}>
          {!scanId ? (
            <div style={styles.card}>
              <div style={styles.welcomeBox}>
                <h2 style={styles.cardTitle}>Welcome</h2>
                <p style={styles.cardSubtitle}>Secure your web applications with comprehensive vulnerability scanning</p>
                
                <div style={styles.featuresGrid}>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>SQL Injection</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>XSS Attacks</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Security Headers</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Directory Listing</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Server Info Disclosure</div>
                  </div>
                  <div style={styles.feature}>
                    <div style={styles.featureName}>Access Control</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Security Scan Results</h2>
                <p style={styles.urlDisplay}>{scannedUrl}</p>
              </div>

              {scanStatus === 'running' ? (
                <div style={styles.scanningState}>
                  <div style={styles.scanningAnimation}>
                    <div style={styles.scanningDot}></div>
                  </div>
                  <p style={styles.scanningText}>Analyzing website security...</p>
                  <p style={styles.scanningSubtext}>This may take a moment</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div style={styles.summaryGrid}>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('CRITICAL')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('CRITICAL')}}>
                        {findings.filter((f) => f.severity === 'CRITICAL').length}
                      </div>
                      <div style={styles.summaryLabel}>Critical</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('HIGH')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('HIGH')}}>
                        {findings.filter((f) => f.severity === 'HIGH').length}
                      </div>
                      <div style={styles.summaryLabel}>High</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('MEDIUM')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('MEDIUM')}}>
                        {findings.filter((f) => f.severity === 'MEDIUM').length}
                      </div>
                      <div style={styles.summaryLabel}>Medium</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: getSeverityColor('LOW')}}>
                      <div style={{...styles.summaryCount, color: getSeverityColor('LOW')}}>
                        {findings.filter((f) => f.severity === 'LOW').length}
                      </div>
                      <div style={styles.summaryLabel}>Low</div>
                    </div>
                    <div style={{...styles.summaryCard, borderTopColor: '#3b82f6'}}>
                      <div style={{...styles.summaryCount, color: '#3b82f6'}}>
                        {findings.length}
                      </div>
                      <div style={styles.summaryLabel}>Total</div>
                    </div>
                  </div>

                  {findings.length === 0 ? (
                    <div style={styles.noFindingsBox}>
                      <p style={styles.noFindingsText}>No vulnerabilities detected!</p>
                      <p style={styles.noFindingsSubtext}>This website appears to be secure</p>
                    </div>
                  ) : (
                    <div style={styles.findingsList}>
                      {findings.map((finding, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            ...styles.findingCard,
                            backgroundColor: getSeverityBgColor(finding.severity),
                            borderLeftColor: getSeverityColor(finding.severity)
                          }}
                        >
                          <div style={styles.findingHeader}>
                            <h3 style={styles.findingType}>{finding.type}</h3>
                            <span style={{
                              background: getSeverityColor(finding.severity),
                              color: 'white',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>
                              {finding.severity}
                            </span>
                          </div>
                          
                          {finding.endpoint && (
                            <p style={styles.findingDetail}>
                              <strong>Endpoint:</strong> 
                              <code style={styles.endpoint}>{finding.endpoint}</code>
                            </p>
                          )}
                          
                          <div style={styles.cvssContainer}>
                            <strong>CVSS Score:</strong>
                            <div style={{...styles.cvssBar, width: `${(finding.cvss_score / 10) * 100}%`, backgroundColor: getSeverityColor(finding.severity)}}>
                              {finding.cvss_score}/10
                            </div>
                          </div>
                          
                          <p style={styles.findingDetail}>
                            <strong>Remediation:</strong> {finding.remediation}
                          </p>
                          
                          {finding.payload && (
                            <p style={styles.payloadDetail}>
                              <strong>Payload:</strong> <code style={styles.payloadCode}>{finding.payload}</code>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // AUTH CONTAINER
  authContainer: {
    minHeight: '100vh',
    backgroundImage: 'url("https://wallpapers.com/images/hd/honeycomb-cyber-security-de1nra84qghymwjm.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: 'relative',
  },

  authOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1,
  },

  authBox: {
    background: 'rgba(20, 30, 60, 0.3)',
    padding: '50px 40px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
    width: '100%',
    maxWidth: '420px',
    zIndex: 2,
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  authHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },

  authTitle: {
    margin: '0 0 10px 0',
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  authSubtitle: {
    margin: 0,
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  authTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },

  tabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  tabButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
  },

  tabButtonInactive: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  authFooter: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(59, 130, 246, 0.3)',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  footerText: {
    margin: '0 0 10px 0',
    fontWeight: '600',
    color: '#ffffff',
  },

  requirementsList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    listStyle: 'none',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // DASHBOARD
  dashboardContainer: {
    minHeight: '100vh',
    backgroundImage: 'url("https://www.pixelstalk.net/wp-content/uploads/2016/05/Futuristic-Computer-Wallpapers.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: 'relative',
  },

  dashboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 0,
  },

  // HEADER
  header: {
    background: 'rgba(26, 58, 82, 0.35)',
    color: 'white',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    position: 'relative',
    zIndex: 10,
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },

  userEmail: {
    fontSize: '15px',
    fontWeight: '500',
    opacity: 0.9,
  },

  // MAIN CONTENT
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '35% 1fr',
    gap: '25px',
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 5,
  },

  leftColumn: {
    minHeight: 'calc(100vh - 200px)',
  },

  rightColumn: {
    minHeight: 'calc(100vh - 200px)',
  },

  // CARDS
  card: {
    background: 'rgba(20, 30, 60, 0.25)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },

  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '26px',
    fontWeight: '700',
    color: '#ffffff',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },

  cardSubtitle: {
    margin: '0 0 25px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // FORMS
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  },

  input: {
    padding: '13px 16px',
    border: '2px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    outline: 'none',
    background: 'rgba(20, 30, 60, 0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#ffffff',
  },

  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },

  // BUTTONS
  submitButton: {
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '10px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
  },

  scanButton: {
    padding: '13px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
  },

  logoutButton: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  },

  // ERRORS
  errorAlert: {
    background: 'rgba(255, 71, 87, 0.2)',
    color: '#ff6b7a',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
    borderLeft: '4px solid #ff6b7a',
  },

  // TEST URLS
  testUrls: {
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  testUrlsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  testUrlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  testUrl: {
    padding: '9px 12px',
    background: 'rgba(20, 30, 60, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#a8c5f7',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    fontFamily: 'Courier New, monospace',
    wordBreak: 'break-all',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },

  // WELCOME BOX
  welcomeBox: {
    textAlign: 'center',
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginTop: '25px',
  },

  feature: {
    padding: '15px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  featureName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  },

  // RESULTS HEADER
  resultsHeader: {
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
  },

  urlDisplay: {
    fontSize: '13px',
    color: '#a8c5f7',
    margin: '10px 0 0 0',
    fontFamily: 'Courier New, monospace',
    wordBreak: 'break-all',
    fontWeight: '500',
  },

  // SCANNING STATE
  scanningState: {
    textAlign: 'center',
    padding: '60px 20px',
  },

  scanningAnimation: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },

  scanningDot: {
    width: '12px',
    height: '12px',
    background: '#a8c5f7',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },

  scanningText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },

  scanningSubtext: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },

  // SUMMARY GRID
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '25px',
  },

  summaryCard: {
    background: 'rgba(59, 130, 246, 0.15)',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    borderTop: '4px solid',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  summaryCount: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#a8c5f7',
  },

  summaryLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // NO FINDINGS
  noFindingsBox: {
    textAlign: 'center',
    padding: '50px 20px',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '12px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
  },

  noFindingsText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#a8c5f7',
    margin: '0 0 8px 0',
  },

  noFindingsSubtext: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },

  // FINDINGS LIST
  findingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  findingCard: {
    padding: '18px',
    borderRadius: '10px',
    borderLeft: '5px solid',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  findingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    gap: '15px',
  },

  findingType: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },

  findingDetail: {
    margin: '8px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  endpoint: {
    fontSize: '13px',
    background: 'rgba(59, 130, 246, 0.2)',
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#a8c5f7',
    fontFamily: 'Courier New, monospace',
    marginLeft: '8px',
  },

  cvssContainer: {
    margin: '12px 0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  cvssBar: {
    height: '24px',
    marginTop: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'width 0.3s ease',
  },

  payloadDetail: {
    margin: '12px 0 0 0',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.75)',
    fontStyle: 'italic',
  },

  payloadCode: {
    fontSize: '12px',
    background: 'rgba(20, 30, 60, 0.3)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'Courier New, monospace',
    marginLeft: '6px',
    wordBreak: 'break-all',
    color: '#a8c5f7',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },

  spinner: {
    display: 'inline-block',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'white',
    animation: 'spin 0.6s infinite',
  },
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  input:focus {
    outline: none;
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    div[style*="gridTemplateColumns"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default App;
