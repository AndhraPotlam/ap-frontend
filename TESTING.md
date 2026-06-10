# Andhra Potlam Frontend Testing Guide

This document outlines the testing strategy, tools, local environment setup, and CI configurations for the `ap-frontend` Next.js application.

---

## 1. Testing Strategy

We follow a two-tier testing strategy for the user interface:

```
┌───────────────────────────────────────────────┐
│              Playwright Browser E2E           │   <-- Tests full user journeys (Nginx + FE + BE + DB)
└───────────────────────┬───────────────────────┘
                        │
┌───────────────────────▼───────────────────────┐
│          Jest + React Testing Library         │   <-- Tests UI component rendering and states
└───────────────────────────────────────────────┘
```

1. **Component/Unit Tests (Jest + React Testing Library)**: Isolated rendering tests for react components. They verify document layout, interactive elements, custom hooks, and correct visual text states under mock data (e.g., verifying footer links or button clicks).
2. **End-to-End Tests (Playwright Browser Tests)**: Automation tests that launch a headless Chromium browser. They interact with the actual application via Nginx, testing client-server user flows (e.g., submitting auth forms, form validation error rendering, and API communication).

---

## 2. Tools & Stack

- **Jest**: Core test runner.
- **React Testing Library**: Renders and queries components in a jsdom environment.
- **Playwright Test**: Browser automation client that runs tests against Chrome/Webkit engines.
- **Docker Compose**: Sets up the entire Andhra Potlam full-stack ecosystem (MongoDB + Backend API + Next.js App + Nginx Reverse Proxy).
- **Nginx (Test Configuration)**: Routes frontend paths and API endpoints correctly within the Docker container bridge network.

---

## 3. Directory Structure

```
ap-frontend/
├── .github/workflows/
│   └── test.yml                 # CI Actions workflow configuration
├── tests/
│   ├── unit/
│   │   └── Footer.test.tsx      # RTL component test for Footer
│   └── e2e/
│       └── auth.spec.ts         # Playwright E2E browser tests
├── nginx/
│   └── nginx.test.conf          # Test-specific Nginx configuration using service names
├── docker-compose.test.yml      # Full-stack docker orchestration for local/CI runs
├── jest.config.ts               # Next.js Jest configuration
├── jest.setup.ts                # Import @testing-library/jest-dom matchers
└── playwright.config.ts         # Playwright browser configurations
```

---

## 4. Local Setup & Execution

### Prerequisites
- Node.js (v20+)
- Docker and Docker Compose (if running full E2E suites locally)

### Step 1: Install Dependencies
Ensure all development and test dependencies are installed:
```bash
npm install
```

### Step 2: Running Unit/Component Tests
Runs the RTL component test suite:
```bash
npm run test:unit
```

### Step 3: Running E2E Browser Tests Locally

Because E2E tests require both the frontend, backend, database, and proxy to be running:

1. **Spin up the isolated full-stack testing environment**:
   ```bash
   docker-compose -f docker-compose.test.yml up -d --build
   ```
   This builds/pulls and starts:
   - `mongodb-test` (Port 27017)
   - `backend-test` (internal only)
   - `frontend-test` (Port 3000)
   - `nginx-test` (Port 8080)

2. **Wait for Nginx to be ready**:
   Check health via:
   ```bash
   curl http://localhost:8080/health
   ```

3. **Seed the database**:
   Since the database container is exposed on `27017`, seed the initial state:
   ```bash
   cd ../ap-backend
   NODE_ENV=test MONGODB_URI=mongodb://localhost:27017/andhra-potlam npx ts-node tests/setup/seed.ts
   cd ../ap-frontend
   ```

4. **Run Playwright E2E Tests**:
   Run the browser tests against the Nginx port 8080 entrypoint:
   ```bash
   TEST_APP_URL=http://localhost:8080 npm run test:e2e
   ```

5. **Clean up/Tear down**:
   ```bash
   docker-compose -f docker-compose.test.yml down -v
   ```

### Overriding Ports on the Fly
If port `8080` or `27017` is already allocated, you can change them dynamically using environment variables:
```bash
# Start full stack with custom ports
TEST_NGINX_PORT=8082 TEST_MONGO_PORT=27018 docker-compose -f docker-compose.test.yml up -d --build

# Run seed script against custom database port
cd ../ap-backend
NODE_ENV=test MONGODB_URI=mongodb://localhost:27018/andhra-potlam npx ts-node tests/setup/seed.ts
cd ../ap-frontend

# Run E2E tests against custom Nginx proxy port
TEST_APP_URL=http://localhost:8082 npm run test:e2e

# Clean up
TEST_NGINX_PORT=8082 TEST_MONGO_PORT=27018 docker-compose -f docker-compose.test.yml down -v
```

---

## 5. Nginx & Network Parity

### Nginx Test Configurations (`nginx/nginx.test.conf`)
The production Nginx proxy uses `host.docker.internal` to route `/api` requests to the host machine. However, on Linux CI runners (like GitHub Actions), `host.docker.internal` does not resolve by default.
To maintain identical networking behaviour on both local and CI machines, `nginx.test.conf` explicitly proxies requests using Docker Compose bridge service network names:
- Routes `/` traffic to `http://frontend-test:3000`
- Routes `/api` traffic to `http://backend-test:8000`

---

## 6. GitHub Actions CI Pipeline

The frontend CI workflow `.github/workflows/test.yml` operates as follows:
1. **Sibling Checkouts**: Checks out both `ap-frontend` and `ap-backend` repositories into sibling folders. This is required because the frontend's Docker Compose file builds the backend container using relative paths (`../ap-backend`).
2. **Jest component tests**: Runs Jest RTL component tests first.
3. **Compose Spin-up**: Launches MongoDB, Backend, Frontend, and Nginx.
4. **Nginx health wait**: Blocks until Nginx returns a healthy status on port `8080`.
5. **Database Seeding**: Runs the backend database seeder on the host machine to populate MongoDB before starting E2E scripts.
6. **Playwright E2E Tests**: Downloads chromium engines and runs E2E tests against `http://localhost:8080`.
7. **Upload Playwright Report**: Packages and archives the entire HTML test report containing generated videos and trace logs as action artifacts (retained for 30 days, available on both pass and failure).
8. **Clean up**: Tears down all containers and networks, ensuring no resource leakage.
