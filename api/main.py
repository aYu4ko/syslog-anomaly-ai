import os
import sys
import time
import json
import random
from datetime import datetime

# Ensure api directory is in python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, CURRENT_DIR)

from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS
from services.evaluator import LogEvaluator

DIST_DIR = os.path.join(PROJECT_ROOT, 'dist')

app = Flask(
    __name__,
    static_folder=DIST_DIR if os.path.exists(DIST_DIR) else None,
    static_url_path=''
)
CORS(app)

evaluator = LogEvaluator()

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'syslog-anomaly-ai-flask',
        'dist_present': os.path.exists(DIST_DIR)
    })

@app.route('/predict', methods=['POST'])
@app.route('/api/predict', methods=['POST'])
def predict():
    log_text = ""
    source_name = "syslog_stream.log"
    if 'file' in request.files:
        file = request.files['file']
        source_name = file.filename
        log_text = file.read().decode('utf-8', errors='ignore')
    elif request.is_json and request.json:
        if 'content' in request.json:
            log_text = request.json['content']
            source_name = request.json.get('source', 'raw_input')
        elif 'metrics' in request.json:
            m = request.json['metrics']
            res = evaluator.evaluate_metrics(
                int(m.get('errors', 0)),
                int(m.get('cpu', 0)),
                int(m.get('disk', 0))
            )
            return jsonify(res)
    else:
        return jsonify({'error': 'No log file or content provided'}), 400

    details = evaluator.evaluate_detailed(log_text)
    details['source'] = source_name
    return jsonify(details)

@app.route('/telemetry/evaluate', methods=['POST'])
@app.route('/api/telemetry/evaluate', methods=['POST'])
def evaluate_telemetry():
    data = request.get_json(silent=True) or {}
    errors = int(data.get('errors', 0))
    cpu = int(data.get('cpu', 0))
    disk = int(data.get('disk', 0))
    details = evaluator.evaluate_metrics(errors, cpu, disk)
    details['timestamp'] = datetime.utcnow().isoformat() + 'Z'
    return jsonify(details)

@app.route('/stream/telemetry', methods=['GET'])
@app.route('/api/stream/telemetry', methods=['GET'])
def stream_telemetry():
    """Server-Sent Events (SSE) live telemetry and risk score stream."""
    scenario = request.args.get('scenario', 'normal')  # 'normal', 'chaos', 'intermittent'
    interval = float(request.args.get('interval', '1.0'))

    def generate_events():
        tick_count = 0
        while True:
            tick_count += 1
            now = datetime.now()

            # Dynamic metric generation based on scenario
            if scenario == 'chaos':
                errors = random.randint(8, 22)
                cpu = random.randint(10, 24)
                disk = random.randint(5, 16)
                log_sample = f"[{now.strftime('%H:%M:%S')}] PANIC kernel: memory saturation, cpu throttle, disk io fail"
            elif scenario == 'intermittent':
                is_spike = (tick_count % 7 >= 5) or random.random() < 0.15
                if is_spike:
                    errors = random.randint(9, 20)
                    cpu = random.randint(12, 22)
                    disk = random.randint(6, 14)
                    log_sample = f"[{now.strftime('%H:%M:%S')}] ERROR app-backend: connection pool exhausted (retry {random.randint(1,5)})"
                else:
                    errors = random.randint(0, 2)
                    cpu = random.randint(1, 4)
                    disk = random.randint(0, 2)
                    log_sample = f"[{now.strftime('%H:%M:%S')}] INFO worker[{random.randint(10,99)}]: processed batch successfully"
            else:
                # Normal operational jitter
                errors = random.choice([0, 0, 0, 1, 0, 0, 2])
                cpu = random.randint(1, 4)
                disk = random.choice([0, 1, 0, 2, 0])
                log_sample = f"[{now.strftime('%H:%M:%S')}] INFO healthcheck: probe passed, latency {random.randint(12, 38)}ms"

            eval_res = evaluator.evaluate_metrics(errors, cpu, disk)
            
            payload = {
                'id': f"tick-{tick_count}-{int(time.time() * 1000)}",
                'timestamp': now.strftime('%H:%M:%S'),
                'isoTimestamp': now.isoformat(),
                'metrics': {
                    'errors': errors,
                    'cpu': cpu,
                    'disk': disk,
                    'cpuUsagePercent': min(100, round(cpu * 4.2 + random.uniform(5.0, 12.0), 1)),
                    'memoryUsagePercent': round(random.uniform(42.0, 78.0) if not eval_res['is_anomaly'] else random.uniform(88.0, 99.2), 1),
                    'diskLatencyMs': round(disk * 3.5 + random.uniform(1.2, 8.4), 1)
                },
                'riskScore': eval_res['risk_score'],
                'riskPercentage': eval_res['risk_percentage'],
                'prediction': eval_res['prediction'],
                'isAnomaly': eval_res['is_anomaly'],
                'status': eval_res['status'],
                'logExcerpt': log_sample
            }

            yield f"data: {json.dumps(payload)}\n\n"
            time.sleep(interval)

    return Response(
        stream_with_context(generate_events()),
        content_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    )

# Static Frontend SPA Serving (Catch-all)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path != '' and os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(DIST_DIR, path)
        index_file = os.path.join(DIST_DIR, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(DIST_DIR, 'index.html')
    return jsonify({
        'status': 'online',
        'message': 'Syslog Anomaly AI Python REST & SSE Backend is active.',
        'tip': 'To serve the React UI from Flask, build with `npm run build` so dist/ is present.'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('FLASK_PORT', 5000)))
    app.run(host='0.0.0.0', port=port, threaded=True)
