import React from 'react';
import { Trash2, AlertOctagon, CheckCircle2 } from 'lucide-react';

const AnomalyInspector = ({ history = [], onClear }) => {
  return (
    <div className="inspector-card">
      <div className="inspector-header">
        <div>
          <h2>Evaluation & Anomaly History</h2>
          <p>Historical audit log of real-time stream anomalies and batch file evaluations.</p>
        </div>
        {history.length > 0 && onClear && (
          <button
            type="button"
            className="clear-history-btn"
            onClick={onClear}
            title="Clear all recorded history"
          >
            <Trash2 size={13} /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          No anomaly incidents recorded in this session yet. Live stream anomalies or uploaded log detections will appear here automatically.
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source / Stream</th>
                <th>Risk Score</th>
                <th>Prediction Verdict</th>
                <th>Action Required</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => {
                const isAnomaly = item.prediction === 'Anomaly Detected';
                const riskPct = item.riskPercentage !== undefined ? `${item.riskPercentage}%` : (isAnomaly ? '95.0%' : '5.0%');
                return (
                  <tr key={idx} className={isAnomaly ? 'row-anomaly' : 'row-normal'}>
                    <td>{item.timestamp}</td>
                    <td>
                      <div className="history-source-cell">
                        <strong>{item.source}</strong>
                        {item.logExcerpt && (
                          <div className="history-log-preview" title={item.logExcerpt}>
                            {item.logExcerpt}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`risk-badge ${isAnomaly ? 'risk-badge-danger' : 'risk-badge-normal'}`}>
                        {riskPct}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${isAnomaly ? 'pill-danger' : 'pill-success'}`}>
                        {isAnomaly ? <AlertOctagon size={12} /> : <CheckCircle2 size={12} />}
                        {item.prediction}
                      </span>
                    </td>
                    <td>
                      {isAnomaly ? (
                        <span className="action-tag action-danger">⚠️ Triage Required</span>
                      ) : (
                        <span className="action-tag action-normal">✓ Healthy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnomalyInspector;
