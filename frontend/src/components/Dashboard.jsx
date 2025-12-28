// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScanForm from './ScanForm';
import ScanResults from './ScanResults';

export default function Dashboard() {
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeScan, setActiveScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setCurrentUser({ email: localStorage.getItem('user_email') });
    }
  }, []);

  // ===== AUTHENTICATION =====

  const handleRegister = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        { email, password }
      );

      const { access_token } = response.data;

      // Save token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_email', email);

      setIsLoggedIn(true);
      setCurrentUser({ email });
      setShowRegister(false);
      setShowLogin(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }

    setLoading(false);
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password }
      );

      const { access_token } = response.data;

      // Save token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_email', email);

      setIsLoggedIn(true);
      setCurrentUser({ email });
      setShowLogin(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveScan(null);
    setScanHistory([]);
    setShowLogin(true);
  };

  // ===== SCAN MANAGEMENT =====

  const handleScanStart = async (url) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/scans/create`,
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const scanId = response.data.scan_id;

      // Set as active scan
      setActiveScan({
        id: scanId,
        url,
        status: 'running',
        startTime: new Date()
      });

      // Add to history
      setScanHistory([
        {
          id: scanId,
          url,
          status: 'running',
          startTime: new Date()
        },
        ...scanHistory
      ]);

      // Poll for completion
      pollScanStatus(scanId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start scan');
    }

    setLoading(false);
  };

  const pollScanStatus = (scanId) => {
    const token = localStorage.getItem('token');

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/scans/status/${scanId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update active scan
        if (activeScan?.id === scanId) {
          setActiveScan(prev => ({
            ...prev,
            status: response.data.status,
            findings: response.data.findings,
            criticalCount: response.data.critical_count
          }));
        }

        // Update history
        setScanHistory(prev =>
          prev.map(scan =>
            scan.id === scanId
              ? {
                  ...scan,
                  status: response.data.status,
                  findings: response.data.findings,
                  criticalCount: response.data.critical_count
                }
              : scan
          )
        );

        // Stop polling when done
        if (response.data.status !== 'running') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling scan status:', err);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleScanSelect = (scan) => {
    setActiveScan(scan);
  };

  // ===== RENDER AUTHENTICATION SCREENS =====

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">
              🛡️ Security Audit
            </h1>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {showLogin && !showRegister ? (
              <LoginForm onLogin={handleLogin} loading={loading} />
            ) : (
              <RegisterForm onRegister={handleRegister} loading={loading} />
            )}

            <div className="text-center mt-6">
              {showLogin && !showRegister ? (
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                    setError(null);
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Need an account? Register here
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                    setError(null);
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Already have an account? Login here
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER MAIN DASHBOARD =====

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🛡️ Web Security Audit</h1>
            <p className="text-gray-400">eWPTX-Level Vulnerability Scanner</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-300">{currentUser?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Form & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scan Form */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">New Scan</h2>
              <ScanForm onScanStart={handleScanStart} loading={loading} />
            </div>

            {/* Scan History */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Scan History</h2>

              {scanHistory.length === 0 ? (
                <p className="text-gray-400">No scans yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scanHistory.map(scan => (
                    <button
                      key={scan.id}
                      onClick={() => handleScanSelect(scan)}
                      className={`w-full text-left p-3 rounded transition ${
                        activeScan?.id === scan.id
                          ? 'bg-blue-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold text-sm truncate">
                        {scan.url}
                      </div>
                      <div className="text-xs text-gray-300">
                        {scan.status === 'running' ? (
                          <span className="inline-block">
                            ⏳ Scanning...
                          </span>
                        ) : (
                          <span>
                            ✅ {scan.findings?.length || 0} findings
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {activeScan ? (
              <ScanResults scan={activeScan} />
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome</h2>
                <p className="text-gray-400 mb-6">
                  Start a new security scan or select a previous scan from the history
                </p>
                <p className="text-gray-500 text-sm">
                  Scans include: SQL Injection, XSS, CSRF, Authentication Bypass,
                  Business Logic Flaws, API Vulnerabilities, and more
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-16 py-6 text-center text-gray-400">
        <p>eWPTX-Level Web Application Security Assessment</p>
        <p className="text-sm mt-2">DarkHexSage • Security Engineer</p>
      </footer>
    </div>
  );
}

// ===== LOGIN COMPONENT =====

function LoginForm({ onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition font-semibold"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// ===== REGISTER COMPONENT =====

function RegisterForm({ onRegister, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    onRegister(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition font-semibold"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}