#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill 0 2>/dev/null
  wait 2>/dev/null
  echo "All services stopped."
}
trap cleanup EXIT INT TERM

echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend" && npm install

echo "Installing embedded app dependencies..."
cd "$ROOT_DIR/embedded-app" && npm install

echo "Starting backend (port 8080)..."
cd "$ROOT_DIR/backend" && ./gradlew bootRun &

echo "Starting embedded app (port 4201)..."
cd "$ROOT_DIR/embedded-app" && npm run dev &

echo "Waiting for backend to be ready on port 8080..."
until curl -so /dev/null -w '' http://localhost:8080 2>/dev/null; do
  sleep 1
done
echo "Backend is ready."

echo "Starting frontend (port 4200)..."
cd "$ROOT_DIR/frontend" && npx ng serve --port 4200 &

echo ""
echo "All services starting..."
echo "  Frontend:     http://localhost:4200"
echo "  Backend API:  http://localhost:8080"
echo "  Embedded App: http://localhost:4201"
echo ""
echo "Press Ctrl+C to stop all services."

wait
