# Big Picture Auction

A full-stack application with React frontend and Express backend, containerized with Docker.

## Project Structure

```
.
├── api/                  # Express API with TypeScript
│   ├── src/
│   │   └── index.ts     # API entry point
│   ├── Dockerfile
│   └── package.json
├── ui/                   # React frontend with TypeScript
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml    # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running with Docker (Recommended)

1. Build and start all services:
```bash
docker compose up -d
```

2. Access the application:
   - UI: http://localhost:8081
   - API: http://localhost:8080
   - API Health Check: http://localhost:8080/api/health

3. View logs:
```bash
docker compose logs -f
```

4. Stop services:
```bash
docker compose down
```

### Local Development

#### API

```bash
cd api
npm install
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production build
```

The API runs on port 5000 by default.

#### UI

```bash
cd ui
npm install
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

The UI development server runs on port 3000 by default.

## API Endpoints

- `GET /api/health` - Health check endpoint

## Environment Variables

### API
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (production/development)

## Docker Configuration

The application uses multi-stage Docker builds for optimized production images:

- **API**: Node.js Alpine image with TypeScript compilation
- **UI**: React build served with Nginx
- **Networking**: Both services communicate via a shared Docker network

## Development Notes

- The UI nginx configuration proxies `/api` requests to the API service
- Both services are configured with `restart: unless-stopped` for reliability
- Production builds are optimized and use minimal Alpine-based images
