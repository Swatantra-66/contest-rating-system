# Contributing to ELONODE

First off, thank you for considering contributing to Elonode!

Our goal is to build a high-octane, competitive programming arena. Whether you're fixing a bug, adding a feature, or improving documentation, your help is welcome.

## Local Development Setup

This project consists of a Next.js frontend and a Go backend.

### Prerequisites

- Node.js (v18+)
- Go (v1.20+)
- PostgreSQL

### Frontend Setup

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Backend Setup

1. Navigate to the backend directory: `cd backend`
2. Install Go modules: `go mod tidy`
3. Setup your `.env` file with your database credentials.
4. Run the server: `go run main.go`

## Pull Request Process

1. Fork the repo and create your branch from `main` (`git checkout -b feature/amazing-feature`).
2. Make sure your code follows the existing style (clean architecture for Go).
3. If you've added code that should be tested, add tests.
4. Issue a Pull Request with a clear description of what you've changed.

## Commit Convention

We follow conventional commits:

- `feat:` A new feature (e.g., `feat: add 3v3 ICPC arena UI`)
- `fix:` A bug fix (e.g., `fix: resolve missing Loader2 import`)
- `style:` UI/CSS changes without logic changes
- `docs:` Documentation updates
