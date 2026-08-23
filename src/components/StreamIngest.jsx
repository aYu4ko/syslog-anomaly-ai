import React, { useState } from 'react';
import axios from 'axios';

const SAMPLE_NORMAL_LOG = `[2026-08-23 10:00:01] INFO systemd[1]: Started Daily Cleanup of Temporary Directories.
[2026-08-23 10:00:02] INFO kernel: [    0.123] Memory: 16384MB available
[2026-08-23 10:00:05] INFO cron[432]: (root) CMD (/usr/local/bin/metrics_collector.sh)
[2026-08-23 10:00:10] INFO nginx: 192.168.1.50 - "GET /health HTTP/1.1" 200 45`;

const SAMPLE_ANOMALY_LOG = `[2026-08-23 10:15:20] ERROR kernel: [ 452.12] cpu0: Core temperature above threshold, cpu throttling enabled
[2026-08-23 10:15:21] ERROR kernel: [ 452.13] cpu1: Core temperature above threshold, cpu throttling enabled
[2026-08-23 10:15:22] ERROR kernel: [ 452.14] cpu2: Core temperature above threshold, cpu throttling enabled
[2026-08-23 10:15:23] ERROR kernel: [ 452.15] cpu3: Core temperature above threshold, cpu throttling enabled
[2026-08-23 10:15:24] CRITICAL systemd-journald: failed to write entry, disk full panic
[2026-08-23 10:15:25] ERROR systemd-udevd: Worker [1204] failed with exit code 1
[2026-08-23 10:15:26] ERROR app-backend: database connection error: connection timeout panic
[2026-08-23 10:15:27] PANIC kernel: Out of memory: Kill process 8914 (postgres) score 920
[2026-08-23 10:15:28] ERROR kernel: cpu load 98.4%, disk io saturated, fail read sector 450123`;

const StreamIngest = ({ onPredictionResult }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeFileName, setActiveFileName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setActiveFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/predict', formData);
      const data = response.data;
      const pred = data.prediction || (data.is_anomaly ? 'Anomaly Detected' : 'Normal');
      setResult(pred);
      if (onPredictionResult) {
        onPredictionResult({
          source: file.name,
          timestamp: new Date().toLocaleTimeString(),
          prediction: pred,
          riskPercentage: data.risk_percentage,
          status: data.status,
        });
      }
    } catch (error) {
      console.error(error);
      setResult('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSample = async (type) => {
    setLoading(true);
    const sampleText = type === 'anomaly' ? SAMPLE_ANOMALY_LOG : SAMPLE_NORMAL_LOG;
    const blob = new Blob([sampleText], { type: 'text/plain' });
    const sampleFile = new File([blob], `sample_${type}_syslog.log`, { type: 'text/plain' });
    setActiveFileName(`sample_${type}_syslog.log`);
    
    const formData = new FormData();
    formData.append('file', sampleFile);
    try {
      const response = await axios.post('/predict', formData);
      const data = response.data;
      const pred = data.prediction || (data.is_anomaly ? 'Anomaly Detected' : 'Normal');
      setResult(pred);
      if (onPredictionResult) {
        onPredictionResult({
          source: `Sample (${type.toUpperCase()})`,
          timestamp: new Date().toLocaleTimeString(),
          prediction: pred,
          riskPercentage: data.risk_percentage,
          status: data.status,
          logExcerpt: sampleText.split('\n')[0],
        });
      }
    } catch (error) {
      console.error(error);
      setResult('Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ingest-card">
      <div className="ingest-header">
        <h3>Log File Ingestion & Stream Analysis</h3>
      </div>

      <div className="file-input-wrapper">
        <input type="file" id="log-file-input" onChange={handleFileChange} />
        {activeFileName && <div className="selected-file">Selected: <strong>{activeFileName}</strong></div>}
      </div>

      <div className="action-row">
        <button id="upload-predict-btn" onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Evaluating...' : 'Upload and Predict'}
        </button>

        <div className="sample-buttons">
          <span className="sample-label">Or test sample syslog:</span>
          <button
            type="button"
            className="sample-btn"
            id="sample-normal-btn"
            onClick={() => handleRunSample('normal')}
            disabled={loading}
          >
            Normal Syslog
          </button>
          <button
            type="button"
            className="sample-btn sample-btn-danger"
            id="sample-anomaly-btn"
            onClick={() => handleRunSample('anomaly')}
            disabled={loading}
          >
            Anomaly Syslog
          </button>
        </div>
      </div>

      {result && (
        <div className={`prediction-banner ${result === 'Anomaly Detected' ? 'banner-anomaly' : 'banner-normal'}`}>
          <div className="prediction-label">Prediction:</div>
          <div className="prediction-value">{result}</div>
        </div>
      )}
    </div>
  );
};

export default StreamIngest;
