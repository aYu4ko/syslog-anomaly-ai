#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== 1/3: Installing Node dependencies & Building React Frontend ==="
npm install
npm run build

echo "=== 2/3: Installing Python Dependencies ==="
pip install -r api/requirements.txt

echo "=== 3/3: Build complete! Static assets ready in /dist ==="
