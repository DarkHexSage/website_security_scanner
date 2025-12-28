// frontend/src/components/ScanResults.jsx
import React from 'react';

export default function ScanResults({ scan }) {
  if (!scan) {
    return <div>No scan selected</div>;
  }

  const findings = scan.findings || [];
  const criticalCount = scan.criticalCount || 0;
  const isRunning = scan.status === 'running';

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900 border-red-700 text-red-100';
      case 'HIGH':
        return 'bg-orange-900 border-orange-700 text-orange-100';
      case 'MEDIUM':
        return 'bg-yellow-900 border-yellow-700 text-yellow-100';
      case 'LOW':
        return 'bg-blue-900 border-blue-700 text-blue-100';
      default:
        return 'bg-gray-700 border-gray-600 text-gray-100';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-2">{scan.url}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Status: {scan.status === 'running' ? '⏳ Scanning...' : '✅ Completed'}</span>
          <span>Findings: {findings.length}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-700">
        <div className="bg-red-900 p-4 rounded border border-red-700">
          <div className="text-3xl font-bold text-red-100">{criticalCount}</div>
          <div className="text-sm text-red-300">Critical</div>
        </div>

        <div className="bg-orange-900 p-4 rounded border border-orange-700">
          <div className="text-3xl font-bold text-orange-100">
            {findings.filter(f => f.severity === 'HIGH').length}
          </div>
          <div className="text-sm text-orange-300">High</div>
        </div>

        <div className="bg-blue-900 p-4 rounded border border-blue-700">
          <div className="text-3xl font-bold text-blue-100">{findings.length}</div>
          <div className="text-sm text-blue-300">Total</div>
        </div>
      </div>

      {/* Findings List */}
      <div className="p-6">
        {isRunning ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-gray-400 mt-4">Scanning website for vulnerabilities...</p>
          </div>
        ) : findings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-green-400 text-lg font-semibold">✅ No vulnerabilities found!</p>
            <p className="text-gray-400 mt-2">This application appears to be secure.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding, idx) => (
              <FindingCard key={idx} finding={finding} getSeverityColor={getSeverityColor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Finding Card Component
function FindingCard({ finding, getSeverityColor }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`border rounded p-4 cursor-pointer transition ${getSeverityColor(finding.severity)}`}
         onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{finding.type}</h3>
          <p className="text-sm opacity-75">{finding.severity} • CVSS {finding.cvss}</p>
        </div>
        <span className="text-xl">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm opacity-90">
          {finding.endpoint && (
            <div>
              <strong>Endpoint:</strong>
              <p className="font-mono text-xs bg-black bg-opacity-30 p-2 rounded mt-1">
                {finding.endpoint}
              </p>
            </div>
          )}

          {finding.payload && (
            <div>
              <strong>Payload:</strong>
              <p className="font-mono text-xs bg-black bg-opacity-30 p-2 rounded mt-1">
                {finding.payload}
              </p>
            </div>
          )}

          {finding.remediation && (
            <div>
              <strong>Remediation:</strong>
              <p className="mt-1">{finding.remediation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}