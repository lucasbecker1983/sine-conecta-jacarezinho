#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
cd "$ROOT_DIR/frontend"
npm install
npm run build
echo "Frontend buildado em frontend/dist."
