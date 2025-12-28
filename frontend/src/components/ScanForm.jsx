// components/ScanForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export function ScanForm({ onScanStart }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/scans/create`,
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onScanStart(response.data.scan_id);
      setUrl('');
    } catch (error) {
      alert('Error starting scan: ' + error.response.data.detail);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Security Audit</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Scanning...' : 'Start Scan'}
        </button>
      </form>
    </div>
  );
}