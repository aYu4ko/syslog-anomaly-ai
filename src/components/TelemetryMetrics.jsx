import React, { useState } from 'react';
import LiveTelemetryStream from './LiveTelemetryStream';
import StreamIngest from './StreamIngest';
import AnomalyInspector from './AnomalyInspector';
import { Activity, UploadCloud, ListFilter } from 'lucide-react';

const TelemetryMetrics = () => {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'upload'

  const handleNewPrediction = (item) => {
    setHistory((prev) => [item, ...prev]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-top-bar">
        <h1>Syslog Anomaly AI</h1>

        {/* Mode Switcher */}
        <div className="tab-switcher">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'live' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={15} /> Live Telemetry & Risk Stream
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'upload' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloud size={15} /> File & Sample Ingestion
          </button>
        </div>
      </div>

      {/* Main Mode Content */}
      {activeTab === 'live' ? (
        <LiveTelemetryStream onAnomalyDetected={handleNewPrediction} />
      ) : (
        <StreamIngest onPredictionResult={handleNewPrediction} />
      )}

      {/* Historical Anomaly Inspector */}
      <AnomalyInspector history={history} onClear={handleClearHistory} />
    </div>
  );
};

export default TelemetryMetrics;
