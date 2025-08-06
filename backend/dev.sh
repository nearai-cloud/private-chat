export CORS_ALLOW_ORIGIN=http://localhost:5173
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openwebui
export ENABLE_CHAT_ENCRYPTION=true
export KEY_SERVICE_BASE_URL=https://b675e3b1f7ddff112ca2248523f184ac7ff698fa-3001.dstack-prod7.phala.network

PORT="${PORT:-8080}"
uvicorn open_webui.main:app --port $PORT --host 0.0.0.0 --forwarded-allow-ips '*' --reload
