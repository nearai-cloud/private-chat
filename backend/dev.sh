export CORS_ALLOW_ORIGIN=http://localhost:5173
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openwebui
export ENABLE_CHAT_ENCRYPTION=true
export KEY_SERVICE_BASE_URL=https://ef7528d8170e073fcab30444702dbd2b5707a20d-3001.dstack-eth-prod7.phala.network
export MODELS_CACHE_TTL=300

# RewRelic
export ENABLE_OTEL=true
export OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net:4317
export NEW_RELIC_LICENSE_KEY=$NEW_RELIC_LICENSE_KEY
export OTEL_SERVICE_NAME=private-chat-dev
export OTEL_LOG_LEVEL=DEBUG
export OTEL_PYTHON_LOG_LEVEL=DEBUG

PORT="${PORT:-8080}"
uvicorn open_webui.main:app --port $PORT --host 0.0.0.0 --forwarded-allow-ips '*' --reload
