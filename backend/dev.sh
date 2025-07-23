export CORS_ALLOW_ORIGIN=http://localhost:4173
export DATABASE_URL=postgresql://backend:backend@localhost:5432/openwebui
PORT="${PORT:-8080}"
uvicorn open_webui.main:app --port $PORT --host 0.0.0.0 --forwarded-allow-ips '*' --reload
