import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

class AnomalyDetector:
    def __init__(self):
        self.model = RandomForestClassifier(random_state=42)
        self._train()

    def _train(self):
        possible_paths = [
            os.path.join(os.path.dirname(__file__), '../../samples/training_data.csv'),
            os.path.join(os.path.dirname(__file__), '../samples/training_data.csv'),
            'samples/training_data.csv',
            '../samples/training_data.csv'
        ]
        csv_path = None
        for p in possible_paths:
            if os.path.exists(p):
                csv_path = p
                break
        
        if csv_path is None:
            raise FileNotFoundError("Could not find samples/training_data.csv")

        df = pd.read_csv(csv_path)
        
        # Support both 'errors,cpu,disk' and 'error_count,cpu_usage,disk_usage'
        if 'errors' in df.columns:
            feature_cols = ['errors', 'cpu', 'disk']
        else:
            feature_cols = ['error_count', 'cpu_usage', 'disk_usage']

        X = df[feature_cols]
        y = df['label']
        self.model.fit(X, y)

    def predict(self, features):
        preds = self.model.predict(features)
        results = []
        for p in preds:
            if str(p) in ['1', '1.0', 'Anomaly', 'Anomaly Detected']:
                results.append('Anomaly Detected')
            else:
                results.append('Normal')
        return results

    def predict_detailed(self, features):
        preds = self.predict(features)
        # Probabilities
        try:
            probas = self.model.predict_proba(features)
            # Find anomaly class column index
            classes = list(self.model.classes_)
            anomaly_idx = -1
            for idx, c in enumerate(classes):
                if str(c) in ['1', '1.0', 'Anomaly', 'Anomaly Detected']:
                    anomaly_idx = idx
                    break
            if anomaly_idx == -1 and len(classes) > 1:
                anomaly_idx = 1
            elif anomaly_idx == -1:
                anomaly_idx = 0

            results = []
            for i, p in enumerate(preds):
                if len(classes) > 1:
                    risk_score = round(float(probas[i][anomaly_idx]), 4)
                else:
                    risk_score = 1.0 if p == 'Anomaly Detected' else 0.0

                if risk_score >= 0.7:
                    status = 'CRITICAL'
                elif risk_score >= 0.35:
                    status = 'ELEVATED'
                else:
                    status = 'NORMAL'

                results.append({
                    'prediction': p,
                    'is_anomaly': p == 'Anomaly Detected',
                    'risk_score': risk_score,
                    'risk_percentage': round(risk_score * 100, 1),
                    'status': status
                })
            return results
        except Exception as e:
            # Fallback
            return [{
                'prediction': p,
                'is_anomaly': p == 'Anomaly Detected',
                'risk_score': 0.95 if p == 'Anomaly Detected' else 0.05,
                'risk_percentage': 95.0 if p == 'Anomaly Detected' else 5.0,
                'status': 'CRITICAL' if p == 'Anomaly Detected' else 'NORMAL'
            } for p in preds]

