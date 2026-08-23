import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Zap,
  Flame,
  RotateCcw,
  Cpu,
  HardDrive,
  ShieldAlert,
  Server
} from 'lucide-react';
import axios from 'axios';

const MAX_BUFFER = 24;

const LiveTelemetryStream = ({ onAnomalyDetected }) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [scenario, setScenario] = useState('normal'); // 'normal', 'intermittent', 'chaos'
  const [intervalSec, setIntervalSec] = useState('1.0');
  const [currentTick, setCurrentTick] = useState(null);
  const [historyBuffer, setHistoryBuffer] = useState([]);
  const [stats, setStats] = useState({
    totalTicks: 0,
    anomaliesDetected: 0,
    peakRiskScore: 0,
    avgRiskScore: 0,
  });

  const eventSourceRef = useRef(null);
  const runningSumRef = useRef(0);

  // Initialize or re-connect EventSource stream
  useEffect(() => {
    if (!isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const streamUrl = `/stream/telemetry?scenario=${scenario}&interval=${intervalSec}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentTick(data);

        setHistoryBuffer((prev) => {
          const next = [...prev, data];
          if (next.length > MAX_BUFFER) {
            return next.slice(next.length - MAX_BUFFER);
          }
          return next;
        });

        // Update aggregate statistics
        setStats((prev) => {
          const newTotal = prev.totalTicks + 1;
          const newAnomalies = prev.anomaliesDetected + (data.isAnomaly ? 1 : 0);
          const newPeak = Math.max(prev.peakRiskScore, data.riskPercentage);
          runningSumRef.current += data.riskPercentage;
          const newAvg = Math.round((runningSumRef.current / newTotal) * 10) / 10;

          return {
            totalTicks: newTotal,
            anomaliesDetected: newAnomalies,
            peakRiskScore: newPeak,
            avgRiskScore: newAvg,
          };
        });

        if (data.isAnomaly && onAnomalyDetected) {
          onAnomalyDetected({
            timestamp: data.timestamp,
            source: `Live Stream (${data.status})`,
            prediction: 'Anomaly Detected',
            riskPercentage: data.riskPercentage,
            logExcerpt: data.logExcerpt,
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect on network interruptions
    };

    return () => {
      es.close();
    };
  }, [isStreaming, scenario, intervalSec, onAnomalyDetected]);

  // Manual Anomaly Injection Trigger
  const handleInjectAnomaly = async () => {
    try {
      const res = await axios.post('/telemetry/evaluate', {
        errors: 16,
        cpu: 18,
        disk: 12,
      });

      const syntheticTick = {
        id: `inject-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        metrics: {
          errors: 16,
          cpu: 18,
          disk: 12,
          cpuUsagePercent: 96.4,
          memoryUsagePercent: 94.8,
          diskLatencyMs: 46.2,
        },
        riskScore: res.data.risk_score,
        riskPercentage: res.data.risk_percentage,
        prediction: res.data.prediction,
        isAnomaly: true,
        status: 'CRITICAL',
        logExcerpt: `[${new Date().toLocaleTimeString()}] MANUAL_INJECTION: Emergency kernel memory overload & disk saturation panic`,
      };

      setCurrentTick(syntheticTick);
      setHistoryBuffer((prev) => [...prev.slice(-MAX_BUFFER + 1), syntheticTick]);

      setStats((prev) => ({
        ...prev,
        totalTicks: prev.totalTicks + 1,
        anomaliesDetected: prev.anomaliesDetected + 1,
        peakRiskScore: Math.max(prev.peakRiskScore, syntheticTick.riskPercentage),
      }));

      if (onAnomalyDetected) {
        onAnomalyDetected({
          timestamp: syntheticTick.timestamp,
          source: 'Manual Anomaly Injection',
          prediction: 'Anomaly Detected',
          riskPercentage: syntheticTick.riskPercentage,
          logExcerpt: syntheticTick.logExcerpt,
        });
      }
    } catch (e) {
      console.error('Failed to inject anomaly:', e);
    }
  };

  const handleResetStats = () => {
    runningSumRef.current = 0;
    setStats({
      totalTicks: 0,
      anomaliesDetected: 0,
      peakRiskScore: 0,
      avgRiskScore: 0,
    });
    setHistoryBuffer([]);
  };

  const riskPct = currentTick ? currentTick.riskPercentage : 0;
  const isAnomaly = currentTick ? currentTick.isAnomaly : false;
  const riskStatus = currentTick ? currentTick.status : 'NORMAL';

  // Determine risk level coloring
  let riskColorClass = 'risk-normal';
  let gaugeColor = '#10b981';
  if (riskPct >= 70) {
    riskColorClass = 'risk-critical';
    gaugeColor = '#ef4444';
  } else if (riskPct >= 35) {
    riskColorClass = 'risk-elevated';
    gaugeColor = '#f59e0b';
  }

  // Calculate sparkline polyline points
  const renderSparkline = (key, maxVal = 100, strokeColor = '#38bdf8') => {
    if (historyBuffer.length < 2) return null;
    const width = 280;
    const height = 48;
    const step = width / (MAX_BUFFER - 1);

    const points = historyBuffer
      .map((item, idx) => {
        const val =
          key.includes('.')
            ? key.split('.').reduce((acc, part) => (acc ? acc[part] : 0), item)
            : item[key] || 0;
        const normalized = Math.min(1, Math.max(0, val / maxVal));
        const x = (idx + (MAX_BUFFER - historyBuffer.length)) * step;
        const y = height - normalized * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" points={points} />
      </svg>
    );
  };

  return (
    <div className="live-telemetry-card">
      {/* Stream Controls Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="pulse-indicator">
            <span className={`pulse-dot ${isStreaming ? 'pulse-on' : 'pulse-off'}`} />
            <h3>Live Telemetry & Risk Scores</h3>
          </div>
          <span className="stream-status-tag">
            {isStreaming ? `Streaming active (${scenario})` : 'Stream Paused'}
          </span>
        </div>

        <div className="stream-controls">
          <button
            type="button"
            id="stream-toggle-btn"
            className={`ctrl-btn ${isStreaming ? 'ctrl-btn-pause' : 'ctrl-btn-play'}`}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? (
              <>
                <Pause size={14} /> Pause Stream
              </>
            ) : (
              <>
                <Play size={14} /> Resume Stream
              </>
            )}
          </button>

          <div className="select-wrapper">
            <select
              id="stream-scenario-select"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="scenario-select"
            >
              <option value="normal">Scenario: Normal Baseline</option>
              <option value="intermittent">Scenario: Intermittent Bursts</option>
              <option value="chaos">Scenario: Chaos / Stress Test</option>
            </select>
          </div>

          <div className="select-wrapper">
            <select
              id="stream-speed-select"
              value={intervalSec}
              onChange={(e) => setIntervalSec(e.target.value)}
              className="speed-select"
            >
              <option value="0.5">0.5s rate</option>
              <option value="1.0">1.0s rate</option>
              <option value="2.0">2.0s rate</option>
            </select>
          </div>

          <button
            type="button"
            id="inject-anomaly-btn"
            className="inject-btn"
            onClick={handleInjectAnomaly}
            title="Inject an immediate anomaly burst into the stream"
          >
            <Zap size={14} /> Inject Anomaly
          </button>
        </div>
      </div>

      {/* Main Real-Time Telemetry Grid */}
      <div className="telemetry-grid">
        {/* Risk Score Meter & Prediction */}
        <div className={`risk-card ${riskColorClass}`}>
          <div className="risk-card-header">
            <span className="risk-label">Real-Time Risk Score</span>
            <span className={`risk-status-pill ${riskColorClass}`}>
              {isAnomaly ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
              {riskStatus}
            </span>
          </div>

          <div className="risk-meter-display">
            <div className="risk-score-value">
              <span className="score-num">{riskPct.toFixed(1)}</span>
              <span className="score-pct">%</span>
            </div>
            <div className="risk-prediction-verdict">
              Verdict: <strong>{currentTick ? currentTick.prediction : 'Normal'}</strong>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="risk-progress-track">
            <div
              className="risk-progress-bar"
              style={{
                width: `${Math.min(100, Math.max(4, riskPct))}%`,
                backgroundColor: gaugeColor,
              }}
            />
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="metrics-chip-row">
            <div className="metric-chip">
              <AlertTriangle size={13} />
              <span>Errors: {currentTick?.metrics?.errors ?? 0}</span>
            </div>
            <div className="metric-chip">
              <Cpu size={13} />
              <span>CPU: {currentTick?.metrics?.cpuUsagePercent ?? 0}%</span>
            </div>
            <div className="metric-chip">
              <HardDrive size={13} />
              <span>Disk I/O: {currentTick?.metrics?.diskLatencyMs ?? 0}ms</span>
            </div>
          </div>
        </div>

        {/* Live Sparkline Waveforms */}
        <div className="sparklines-card">
          <div className="sparklines-header">
            <h4>Live Metric Telemetry Signals</h4>
            <span className="sparklines-note">Rolling past {MAX_BUFFER} ticks</span>
          </div>

          <div className="sparkline-item">
            <div className="sparkline-info">
              <span className="sparkline-title">
                <Cpu size={13} /> CPU Load %
              </span>
              <span className="sparkline-val">{currentTick?.metrics?.cpuUsagePercent ?? 0}%</span>
            </div>
            {renderSparkline('metrics.cpuUsagePercent', 100, '#38bdf8')}
          </div>

          <div className="sparkline-item">
            <div className="sparkline-info">
              <span className="sparkline-title">
                <AlertTriangle size={13} /> Error Rate Burst
              </span>
              <span className="sparkline-val">{currentTick?.metrics?.errors ?? 0} err/s</span>
            </div>
            {renderSparkline('metrics.errors', 20, '#f87171')}
          </div>

          <div className="sparkline-item">
            <div className="sparkline-info">
              <span className="sparkline-title">
                <HardDrive size={13} /> Disk Latency
              </span>
              <span className="sparkline-val">{currentTick?.metrics?.diskLatencyMs ?? 0} ms</span>
            </div>
            {renderSparkline('metrics.diskLatencyMs', 50, '#eab308')}
          </div>
        </div>
      </div>

      {/* Aggregate Stats Summary Strip */}
      <div className="stats-strip">
        <div className="stat-box">
          <span className="stat-label">Total Telemetry Ticks</span>
          <span className="stat-val">{stats.totalTicks}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Anomalies Detected</span>
          <span className={`stat-val ${stats.anomaliesDetected > 0 ? 'text-danger' : ''}`}>
            {stats.anomaliesDetected}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Peak Risk Score</span>
          <span className="stat-val">{stats.peakRiskScore}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Average Risk Score</span>
          <span className="stat-val">{stats.avgRiskScore}%</span>
        </div>
        <button
          type="button"
          onClick={handleResetStats}
          className="reset-stats-btn"
          title="Reset stream statistics"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Live Stream Ticker / Recent Excerpt */}
      {currentTick?.logExcerpt && (
        <div className="live-ticker-box">
          <div className="ticker-label">
            <Activity size={13} /> Latest Ingested Syslog Stream Ticker:
          </div>
          <code className="ticker-code">{currentTick.logExcerpt}</code>
        </div>
      )}
    </div>
  );
};

export default LiveTelemetryStream;
