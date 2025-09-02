# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
- `npm run dev` - Start development server (with pyodide fetch)
- `npm run dev:5050` - Start development server on port 5050
- `npm run build` - Build the project for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run all linting (frontend, types, backend)
- `npm run lint:frontend` - ESLint frontend code with auto-fix
- `npm run lint:types` - TypeScript type checking via svelte-check
- `npm run lint:backend` - Pylint backend Python code
- `npm run format` - Format frontend code with Prettier
- `npm run format:backend` - Format backend code with Black

### Testing
- `npm run test:frontend` - Run frontend tests with Vitest
- `npm run cy:open` - Open Cypress for integration testing
- Backend tests: `python -m pytest backend/open_webui/test/` from project root

### Backend Development
- `cd backend && ./start.sh` - Start backend server (production mode)
- `cd backend && ./dev.sh` - Start backend in development mode
- `pip install -r backend/requirements.txt` - Install Python dependencies

## Project Architecture

This is a Near AI fork of Open WebUI with significant privacy and security enhancements.

### High-Level Architecture
- **Frontend**: SvelteKit application with TypeScript
- **Backend**: FastAPI Python application with SQLAlchemy/Peewee ORM
- **Database**: Supports SQLite, PostgreSQL, MySQL
- **Authentication**: JWT + API Key + OAuth/LDAP support

### Key Privacy/Security Features Added
This fork enhances the original Open WebUI with:

1. **Per-User Data Encryption** (`backend/open_webui/utils/user_encryption.py`)
   - AES-256-GCM encryption for chat data, titles, and sensitive content
   - External key service integration with caching
   - Configurable via `ENABLE_CHAT_ENCRYPTION` environment variable

2. **ECDSA Message Signature Verification** (`src/lib/utils/signature.ts`)
   - Ethereum-compatible message signing using secp256k1 curve
   - Public key recovery from signatures
   - Built-in message verification tool for privacy-focused applications

3. **Enhanced Authentication**
   - Multiple token types (JWT, API Key) with role-based access control
   - Configurable API key endpoint restrictions
   - HMAC signature verification for internal operations

### Directory Structure

#### Backend (`backend/open_webui/`)
- `main.py` - FastAPI application entry point and configuration
- `models/` - Database models (SQLAlchemy/Peewee)
- `routers/` - API route handlers organized by domain
- `utils/` - Utilities including encryption, security headers, telemetry
- `retrieval/` - RAG system with vector databases (Chroma, Qdrant, Milvus, etc.)
- `internal/` - Internal utilities and database migration system

#### Frontend (`src/`)
- `routes/` - SvelteKit pages and API routes
- `lib/components/` - Reusable Svelte components organized by domain
- `lib/utils/` - Frontend utilities including signature verification
- `lib/apis/` - API client functions

### Database Architecture
- **Primary**: SQLAlchemy with Alembic migrations
- **Legacy**: Peewee ORM with custom migration system in `internal/migrations/`
- **Vector Storage**: Multiple providers (Chroma, Qdrant, Milvus, pgvector, etc.)

### Key Configuration Files
- `pyproject.toml` - Python project configuration and dependencies
- `package.json` - Node.js dependencies and scripts
- `backend/start.sh` - Production startup script with environment setup
- `backend/dev.sh` - Development startup script

### Privacy-First Features
- User data encryption with configurable external key management
- ECDSA signature verification for message integrity
- Secure token-based authentication with granular permissions
- Optional chat encryption that preserves backward compatibility

### Development Notes
- Backend uses both SQLAlchemy (new) and Peewee (legacy) - prefer SQLAlchemy for new features
- Frontend leverages SvelteKit's full-stack capabilities
- Privacy enhancements are designed to be non-intrusive to existing functionality
- Encryption is opt-in via environment variables to maintain compatibility
- remember that when running backend for local dev, always do 'conda activate open-webui'