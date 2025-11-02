# Development Setup Guide

## Overview

This guide covers setting up a development environment for Clout Careers with a separate Docker-based database for testing new features like the internal job board without affecting production data.

## Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git

## Quick Start

### 1. Start the Development Database

```bash
# Start PostgreSQL container for development
docker-compose -f docker-compose.dev.yml up -d

# Verify the container is running
docker ps | grep clout-dev-db
```

The development database will be available at:
- **Host**: `localhost`
- **Port**: `5433` (note: not the default 5432)
- **Database**: `clout_internal_dev`
- **User**: `dev_user`
- **Password**: `dev_password`

### 2. Configure Environment

```bash
# Copy the development environment file
cp .env.development .env.local

# Or if you want to use specific variables for development:
export DATABASE_URL="postgresql://dev_user:dev_password@localhost:5433/clout_internal_dev"
export DIRECT_URL="postgresql://dev_user:dev_password@localhost:5433/clout_internal_dev"
```

### 3. Set Up Database Schema

```bash
# Create migrations based on Prisma schema
npx prisma migrate deploy

npx prisma generate

# Seed development data
npx prisma db seed
```


Actually this.

```bash
mv .env .env.production && \
export DATABASE_URL="postgresql://dev_user:dev_password@localhost:5433/clout_internal_dev" && \
export DIRECT_URL="postgresql://dev_user:dev_password@localhost:5433/clout_internal_dev" && \
npx prisma db push --skip-generate && \
#mv .env.production .env
echo "above"
```

Might also want to do this to regenerate Prisma types.

```bash
npm run postinstall 2>&1
```


### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser.

## Database Commands

### Run Migrations

```bash
# Create new migration based on schema changes
npx prisma migrate dev --name <migration_name>

# Apply existing migrations
npx prisma migrate deploy

# Reset database (clears all data)
npx prisma migrate reset
```

### Seed Data

```bash
# Run the seed script
npx prisma db seed

# The seed script creates:
# - 3 sample companies with different configurations
# - Multiple users (admin, employees, freelancers)
# - Sample jobs with different visibility levels
```

### Database CLI

```bash
# Open interactive Prisma Studio (UI for database)
npx prisma studio
```

## Internal Job Board Features

### Company Configuration

When creating a company, set the internal job board mode:

- **`PARTITIONED`**: Jobs are completely isolated from the Clout network. No crossover unless explicitly enabled.
- **`OPTIONAL`**: Company members can choose per-job whether to include Clout network referrals. Default is network-only.
- **`OPEN_TO_NETWORK`**: Jobs are visible and open to Clout network by default, but can be restricted to company-only on specific jobs.

### Job Visibility Levels

- **`PUBLIC`**: Visible to entire Clout network
- **`COMPANY_ONLY`**: Visible only to company members
- **`COMPANY_AND_NETWORK`**: Visible to company members and Clout network

### User Profile Visibility

- **`COMPANY_ONLY`**: Profile only visible within their company
- **`NETWORK`**: Profile visible within Clout network (default)
- **`PUBLIC`**: Profile visible to everyone

## Stopping the Database

```bash
# Stop containers without removing them
docker-compose -f docker-compose.dev.yml stop

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Clean up volumes (WARNING: deletes all data)
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### Port Already in Use

If port 5433 is already in use:

```bash
# Find process using port 5433
lsof -i :5433

# Or modify docker-compose.dev.yml to use a different port:
ports:
  - "5434:5432"  # Change 5433 to 5434
```

### Connection Refused

```bash
# Check if container is running
docker ps | grep clout-dev-db

# View logs
docker logs clout-dev-db

# Restart the container
docker-compose -f docker-compose.dev.yml restart
```

### Permission Issues

```bash
# On Linux, you may need to use sudo
sudo docker-compose -f docker-compose.dev.yml up -d
```

## Test Accounts

After seeding, use these accounts to test:

| Email | Company | Role | Visibility |
|-------|---------|------|------------|
| `admin@techcorp.com` | TechCorp Inc | Admin | Company Only |
| `engineer@techcorp.com` | TechCorp Inc | Employee | Network |
| `designer@techcorp.com` | TechCorp Inc | Employee | Company Only |
| `admin@designstudio.com` | Design Studio | Admin | Company Only |
| `artist@designstudio.com` | Design Studio | Employee | Network |
| `freelancer@network.com` | None | Freelancer | Network |

## Schema Updates

When the Prisma schema changes:

1. Update `prisma/schema.prisma` with your changes
2. Create a migration: `npx prisma migrate dev --name <description>`
3. Run migrations on dev database
4. Test thoroughly before deploying to production

## Notes

- The dev database is **not synced with production**. It's a completely separate instance.
- Use `DEVELOPMENT.md` as a reference for local development only.
- Never commit `.env.local` - it's in `.gitignore`.
- The seed script is idempotent and can be run multiple times safely.
