# Barsel Event

A modern event management system with doorprize drawings, built with Ruby on Rails API backend and React TypeScript frontend (SPA).

## Architecture

**Backend (API)**: Ruby on Rails 8.0.2 with PostgreSQL and Redis  
**Frontend (SPA)**: React 19 with TypeScript, Vite, and Tailwind CSS  
**Deployment**: Docker containers with Nginx reverse proxy  

## Requirements

* Docker & Docker Compose
* Node.js 20+ (for local development)
* Ruby 3.3+ (for local development)
* PostgreSQL 15+
* Redis 7+

## Quick Start (Docker - Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/dddd97/barsel-event.git
cd barsel-event-v2
```

2. **Configure environment variables**
Create a `.env` file with the following:
```env
# Database Configuration
DATABASE_NAME=doorprize_app_production
DATABASE_USER=dhan
DATABASE_PASSWORD=elza

# Rails Configuration
RAILS_ENV=production
RAILS_MASTER_KEY=your_master_key_here
SECRET_KEY_BASE=your_secret_key_base_here

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Port Configuration (optional)
API_PORT=3000
```

3. **Build and start the application**
```bash
# Build and start all services
docker-compose -f docker-compose.spa.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.spa.yml up --build -d
```

4. **Access the application**
- **Frontend (SPA)**: http://localhost
- **API Backend**: http://localhost:3000

## Local Development Setup

### Backend (Rails API)

1. **Install dependencies**
```bash
bundle install
```

2. **Setup database**
```bash
rails db:create
rails db:migrate
rails db:seed
```

3. **Start the Rails server**
```bash
rails server -p 3000
```

### Frontend (React SPA)

1. **Navigate to frontend directory**
```bash
cd app/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Access frontend**: http://localhost:5173

## Features

### Core Features
* **Event Management**: Create, update, and manage events with banners
* **Participant Registration**: Public registration with reCAPTCHA protection
* **Prize Management**: Configure multiple prizes per event
* **Live Prize Drawing**: Real-time random drawing with slot machine animation
* **Admin Dashboard**: Complete admin panel with role-based access
* **PDF Export**: Generate winner lists and participant cards

### Technical Features
* **SPA Architecture**: React TypeScript frontend with Rails API backend
* **Real-time Updates**: Server-Sent Events (SSE) for live drawing updates
* **Mobile Responsive**: Optimized for all device sizes
* **Docker Ready**: Complete containerized deployment
* **Security**: CORS, CSRF protection, session-based authentication
* **Performance**: Nginx caching, optimized queries, connection pooling

## API Documentation

Detailed API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Docker Services

The application consists of 4 main services:

1. **PostgreSQL Database** (`db`) - Port 5432
2. **Redis Cache** (`redis`) - Port 6379  
3. **Rails API Backend** (`api`) - Port 3000
4. **React Frontend** (`frontend`) - Port 80

## Environment Configuration

### reCAPTCHA Setup
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site with reCAPTCHA v2 "I'm not a robot" Checkbox
3. Add your domains (`localhost` for development)
4. Copy Site Key and Secret Key to `.env` file

### Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized domains and redirect URIs
4. Copy Client ID to `.env` file

## Testing

```bash
# Backend tests
rails test

# Frontend tests
cd app/frontend && npm run lint
```

## Production Deployment

### Using Docker Compose
```bash
# Production deployment
docker-compose -f docker-compose.spa.yml up -d

# View logs
docker-compose -f docker-compose.spa.yml logs -f

# Stop services
docker-compose -f docker-compose.spa.yml down
```

### Health Checks
- **Frontend**: http://localhost/health
- **API**: http://localhost:3000/health

## License

This project is licensed under the MIT License.
