import os
import sys

# Ensure api directory is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.detector import AnomalyDetector
from services.log_parser import LogParser

class LogEvaluator:
    def __init__(self):
        self.parser = LogParser()
        self.detector = AnomalyDetector()

    def evaluate(self, log_content):
        features = self.parser.parse(log_content)
        return self.detector.predict([features])[0]

    def evaluate_detailed(self, log_content):
        features = self.parser.parse(log_content)
        details = self.detector.predict_detailed([features])[0]
        details['metrics'] = {
            'errors': features[0],
            'cpu': features[1],
            'disk': features[2]
        }
        return details

    def evaluate_metrics(self, errors, cpu, disk):
        features = [errors, cpu, disk]
        details = self.detector.predict_detailed([features])[0]
        details['metrics'] = {
            'errors': errors,
            'cpu': cpu,
            'disk': disk
        }
        return details

