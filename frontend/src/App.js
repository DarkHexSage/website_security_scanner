import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8000';

  // Check if logged in on mount
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
    // At least 8 characters
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

  // ===== REGISTER =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!validateEmail(email)) {
      setError('Invalid email format. Example: user@example.com');
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registering:', email);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      console.log('✅ Registration successful');

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ Registration error:', err.response?.data);
      setError(err.response?.data?.detail || 'Registration failed');
    }

    setLoading(false);
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setError('Invalid password');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Logging in:', email);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      console.log('✅ Login successful');

      const newToken = response.data.access_token;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user_email', email);
      
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ Login error:', err.response?.data);
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
    setFindings([]);
  };

  // ===== START SCAN =====
  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate URL
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

      console.log('🔍 Starting scan for:', url);

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

      console.log('✅ Scan created');

      setScanId(response.data.scan_id);
      setScanStatus('running');
      setUrl('');
      pollScan(response.data.scan_id, currentToken);
    } catch (err) {
      console.error('❌ Scan error:', err);
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
          console.log('✅ Scan complete');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('❌ Poll error:', err);
        clearInterval(interval);
      }
    }, 2000);
  };

  // ===== LOGIN/REGISTER SCREEN =====
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.authBox}>
          <h1>🛡️ Security Audit Platform</h1>
          <p>eWPTX-Level Vulnerability Scanner</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <h2>Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <hr style={{ margin: '20px 0' }} />

          <p style={{ textAlign: 'center', marginBottom: '10px' }}>
            Don't have an account?
          </p>
          <button
            onClick={handleRegister}
            style={styles.registerButton}
            disabled={loading || !email || !password}
          >
            {loading ? 'Registering...' : 'Register New Account'}
          </button>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p><strong>Requirements:</strong></p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Email: Valid format (user@example.com)</li>
              <li>Password: At least 8 characters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD SCREEN =====
  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <div style={styles.header}>
        <h1>🛡️ Security Audit Platform</h1>
        <div>
          <span>{localStorage.getItem('user_email')}</span>
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
            <h2>New Scan</h2>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleScan} style={styles.form}>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={styles.input}
                required
              />
              <button
                type="submit"
                style={styles.button}
                disabled={loading || scanStatus === 'running'}
              >
                {loading ? 'Starting...' : scanStatus === 'running' ? 'Scanning...' : 'Start Scan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Results */}
        <div style={styles.rightColumn}>
          {!scanId ? (
            <div style={styles.card}>
              <h2>Welcome</h2>
              <p>Enter a website URL to scan for vulnerabilities</p>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                Test URLs:
              </p>
              <ul style={{ fontSize: '14px', color: '#666', marginLeft: '20px' }}>
                <li>http://testphp.vulnweb.com/ (Has vulnerabilities)</li>
                <li>https://www.google.com (Secure site)</li>
                <li>https://www.wikipedia.org (Secure site)</li>
              </ul>
            </div>
          ) : (
            <div style={styles.card}>
              <h2>Scan Results</h2>

              {scanStatus === 'running' ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: '24px' }}>⏳ Scanning...</p>
                  <p>Please wait while we assess the security of your website</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards - ALL SEVERITY LEVELS */}
                  <div style={styles.summary}>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryNumber}>
                        {findings.filter((f) => f.severity === 'CRITICAL').length}
                      </div>
                      <div>Critical</div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryNumber}>
                        {findings.filter((f) => f.severity === 'HIGH').length}
                      </div>
                      <div>High</div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryNumber}>
                        {findings.filter((f) => f.severity === 'MEDIUM').length}
                      </div>
                      <div>Medium</div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryNumber}>
                        {findings.filter((f) => f.severity === 'LOW').length}
                      </div>
                      <div>Low</div>
                    </div>
                    <div style={styles.summaryCard}>
                      <div style={styles.summaryNumber}>{findings.length}</div>
                      <div>Total</div>
                    </div>
                  </div>

                  {findings.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'green', marginTop: '20px' }}>
                      ✅ No vulnerabilities found!
                    </p>
                  ) : (
                    <div style={styles.findingsList}>
                      {findings.map((finding, idx) => (
                        <div key={idx} style={styles.findingCard}>
                          <h3>{finding.type}</h3>
                          <p>
                            <strong>Severity:</strong> {finding.severity}
                          </p>
                          <p>
                            <strong>CVSS:</strong> {finding.cvss_score}
                          </p>
                          <p>
                            <strong>Remediation:</strong> {finding.remediation}
                          </p>
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
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  authBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
  },
  dashboard: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    background: '#2c3e50',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '20px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  leftColumn: {
    minHeight: '100vh',
  },
  rightColumn: {
    minHeight: '100vh',
  },
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    padding: '10px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: '8px 16px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  error: {
    background: '#ffe6e6',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '20px',
  },
  summaryCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  summaryNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  findingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  findingCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '4px',
    borderLeft: '4px solid #e74c3c',
  },
};

export default App;