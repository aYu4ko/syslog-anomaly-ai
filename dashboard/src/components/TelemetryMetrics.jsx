import React from 'react';
import StreamIngest from './StreamIngest';
import AnomalyInspector from './AnomalyInspector';

const TelemetryMetrics = () => {
  return (
    <div className="dashboard">
      <h1>AI DevOps Predictor TelemetryMetrics</h1>
      <StreamIngest />
      <AnomalyInspector />
    </div>
  );
};

export default TelemetryMetrics;
