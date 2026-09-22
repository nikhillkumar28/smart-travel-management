# Journo - Travel Planner

A full-stack, AI-powered travel planning and decision platform that generates personalized, multi-day itineraries based on user destination, duration, budget, and travel interests. The platform combines multi-stage LLM prompt chaining, live weather forecasting, rule-based crowd prediction, destination discovery with MongoDB compound indexing, user authentication, and persistent trip management.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [AI Architecture & Prompt Chaining](#ai-architecture--prompt-chaining)
- [Backend Architecture](#backend-architecture)
- [Authentication Flow](#authentication-flow)
- [MongoDB Data Models & Indexing](#mongodb-data-models--indexing)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Automated Testing](#automated-testing)
- [Continuous Integration (CI)](#continuous-integration-ci)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)

---

## Overview

Planning a trip typically requires cross-referencing multiple disparate sources: researching attractions, estimating daily budgets, checking weather conditions, anticipating crowd levels, and organizing day-by-day schedules.

The **Smart Travel Planning and Decision Platform** consolidates this entire workflow into a single cohesive interface:
1. Users enter their travel constraints: **Destination**, **Number of Days**, **Budget**, and **Interests**.
2. The platform queries **Google Gemini** using a structured 3-stage prompt chain to analyze requirements, identify candidate activities, and synthesize a structured day-by-day itinerary.
3. Simultaneously, it fetches real-time weather forecasts via **OpenWeather** and computes crowd-level estimates.
4. Authenticated users can save, retrieve, and delete trips from their personal dashboard.
5. Travelers can also explore curated Indian destinations filtered by city, category, budget level, and rating powered by an optimized MongoDB compound index.

---

## Features

- **User Authentication:** Registration, login, password hashing with bcrypt, and stateless session management with JWT.
- **AI-Powered Itinerary Generation:** Multi-day travel itineraries tailored to user duration, budget constraints, and interests.
- **Multi-Stage LLM Prompt Chaining:** 3-step reasoning chain (Requirements Analysis &rarr; Activity Candidates &rarr; Final Structured Itinerary) with schema validation.
- **Structured JSON Output:** Strict JSON schema enforcement on model responses ensuring consistent UI rendering without parsing errors.
- **Trip Persistence & Dashboard:** Save generated trips to MongoDB, view saved itineraries, and manage trips under **My Trips**.
- **Live Weather Information:** City weather forecasts (temperature, conditions, weather description) with in-memory caching to minimize external API calls.
- **Rule-Based Crowd-Level Estimation:** Algorithmic crowd level predictions (High / Medium / Low) calculated from destination, day of the week, and travel time.
- **Destination Place Discovery:** Search and browse curated places across major Indian cities (Jaipur, Goa, Delhi, Mumbai, Udaipur, Manali).
- **MongoDB Compound Indexing:** Optimized multi-criteria query execution (`city + category + rating + priceLevel`) following the ESR (Equality, Sort, Range) rule.
- **Request Input Validation:** Strict parameter and type validation across authentication, itinerary creation, and place search endpoints.
- **Query Execution Explanations:** Built-in support for MongoDB `explain('executionStats')` on place search to verify index utilization (`IXSCAN`).
- **Automated Backend Testing:** 17 unit and integration tests using Jest and Supertest with mock external services.
- **Continuous Integration:** Automated GitHub Actions workflow covering linting, test execution against a MongoDB service container, and frontend builds.

---

## Tech Stack

### Frontend
- **Framework:** React 18 (SPA)
- **Build Tool:** Vite 5
- **Routing:** React Router DOM 6
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion 12
- **Maps:** Embedded OpenStreetMap previews

### Backend
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js 4
- **Database:** MongoDB 6+
- **ODM:** Mongoose 8
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcrypt`
- **CORS:** `cors` middleware with configurable allowed origins

### External APIs
- **LLM / AI:** Google Gemini API (`gemini-2.5-flash` with automatic fallback to `gemini-2.0-flash` / `gemini-1.5-flash`, exponential backoff retry for transient 503/429 errors)
- **Weather:** OpenWeather API (Direct Geocoding + Current Weather Data v2.5)

### Testing & DevOps
- **Testing Framework:** Jest 30 & Supertest 7
- **Code Quality:** ESLint 10 (Flat Config)
- **CI / Pipeline:** GitHub Actions

---

## AI Architecture & Prompt Chaining

Rather than sending a single unstructured prompt to the LLM, the platform decomposes itinerary creation into a **3-stage prompt chain** with intermediate JSON schema enforcement:

```
User Input (Destination, Days, Budget, Interests)
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Stage 1: Requirements Analysis Prompt        │
│  - Identifies travel style                   │
│  - Extracts priority categories              │
│  - Outlines budget & practical constraints   │
└──────────────────────┬───────────────────────┘
                       │ Validated JSON Schema
                       ▼
┌──────────────────────────────────────────────┐
│  Stage 2: Candidate Activities Prompt         │
│  - Generates balanced candidate attractions  │
│  - Proposes food and cultural experiences     │
│  - Estimates time and cost per activity      │
└──────────────────────┬───────────────────────┘
                       │ Validated JSON Schema
                       ▼
┌──────────────────────────────────────────────┐
│  Stage 3: Final Itinerary Synthesis Prompt   │
│  - Assembles exact day-by-day schedule       │
│  - Morning / Afternoon / Evening split       │
│  - Adds travel tips, costs, and rationale    │
└──────────────────────┬───────────────────────┘
                       │ Validated Final Schema
                       ▼
           Persistence to MongoDB
                       │
                       ▼
            Rendered in React UI
```

### Why Prompt Chaining Instead of a Single Prompt?
1. **Separates itinerary generation into smaller, easier-to-validate steps:** Asking a model to simultaneously analyze constraints, pick realistic attractions, stay within budget, and assemble a multi-day schedule in one shot frequently leads to rushed schedules, budget violations, or invented locations. Stage 1 grounds the constraints before any activities are selected.
2. **More consistent structured output:** Large, monolithic JSON outputs often run into token exhaustion or format degradation. Breaking the synthesis into discrete stages with smaller, explicit JSON schemas guarantees valid JSON structure at every step.
3. **Early Validation & Error Isolation:** The pipeline inspects intermediate outputs (`isValidRequirementsAnalysis`, `isValidCandidates`). If a stage produces malformed data, it is rejected immediately before wasting downstream tokens.

---

## Backend Architecture

The backend follows a layered MVC/Service pattern:

```
┌─────────────────────────────────────────────────────────┐
│                       React UI                          │
│        (Vite Dev Proxy locally / Vercel in prod)        │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server                        │
│          - CORS & JSON parsing middleware               │
│          - JWT Authentication middleware                │
└──────┬──────────────┬──────────────┬──────────────┬─────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  /api/auth      /api/trips     /api/places   /api/itinerary
  (User Auth)    (Trip CRUD)    (Search &     & /api/weather
                                Compound       /api/crowd
                                Indexing)
       │              │              │              │
       ▼              ▼              ▼              ▼
  ┌─────────┐    ┌─────────┐    ┌─────────┐   ┌──────────────┐
  │  User   │    │  Trip   │    │  Place  │   │  Services:   │
  │  Model  │    │  Model  │    │  Model  │   │ - Gemini API │
  └────┬────┘    └────┬────┘    └────┬────┘   │ - OpenWeather│
       │              │              │        └──────────────┘
       └──────────────┴──────────────┘
                      │
                      ▼
               MongoDB Database
```

---

## Authentication Flow

Authentication uses stateless **JSON Web Tokens (JWT)**:

1. **Registration (`POST /api/auth/register`):**
   - Validates `name`, `email`, and `password`.
   - Checks for existing user email (returns `409 Conflict` if duplicate).
   - Hashes password using `bcrypt` with a salt factor of `12`.
   - Saves user and signs a JWT containing `{ id, email }` with a 7-day expiration.
2. **Login (`POST /api/auth/login`):**
   - Looks up user by normalized lowercase email.
   - Compares plaintext password against stored hash with `bcrypt.compare`.
   - Issues a signed JWT on match (returns `401 Unauthorized` on mismatch).
3. **Protected Requests (`middleware/auth.js`):**
   - Client sends `Authorization: Bearer <token>` in request headers.
   - Middleware verifies the token using `process.env.JWT_SECRET`.
   - Attaches decoded user payload (`req.user`) to request context.
   - Rejects unauthenticated requests with `401 Unauthorized`.
4. **Current User (`GET /api/auth/me`):**
   - Protected endpoint returning user profile with the password field stripped (`-password`).
5. **Client-Side State:**
   - Managed via React Context (`AuthContext.jsx`), persisting token in `localStorage`.

---

## MongoDB Data Models & Indexing

### 1. User Model (`models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  timestamps: true
}
```

### 2. Trip Model (`models/Trip.js`)
```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true, trim: true },
  days: { type: Number, required: true, min: 1 },
  budget: { type: Number, required: true, min: 0 },
  interests: { type: String, required: true, trim: true },
  itinerary: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamps: true
}
```

### 3. Place Model (`models/Place.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['historical', 'nature', 'food', 'adventure', 'cultural', 'religious']
  },
  priceLevel: { type: Number, required: true, min: 1, max: 4 }, // 1=Budget, 4=Luxury
  rating: { type: Number, required: true, min: 0, max: 5 },
  tags: [{ type: String, trim: true, lowercase: true }],
  description: { type: String, required: true, trim: true },
  image: { type: String, trim: true },
  timestamps: true
}
```

### Compound Index & ESR Rule Rationale

The `places` collection uses a single, carefully engineered compound index:

```javascript
placeSchema.index({ city: 1, category: 1, rating: -1, priceLevel: 1 });
```

This index is designed according to MongoDB's **ESR (Equality, Sort, Range)** principle:
- **E (Equality):** `city: 1` and `category: 1` come first. Queries match these fields with exact equality, narrowing the search space immediately.
- **S (Sort):** `rating: -1` is placed before the range field. Because index keys are ordered by rating descending, MongoDB returns documents already in sort order, completely avoiding an in-memory `SORT` stage.
- **R (Range):** `priceLevel: 1` comes last to evaluate range queries (`priceLevel <= maxPrice`) while preserving the index-provided sort order.

#### Verifying with Explain:
Pass `?explain=true` to `GET /api/places?city=Jaipur&category=historical&maxPrice=2&explain=true`. The API returns `winningStages: ["IXSCAN", "FETCH"]`, verifying that index scan is utilized with zero collection scan (`COLLSCAN`) and zero in-memory sort.

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new user; returns JWT token and user info |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns JWT token and user info |
| `GET` | `/api/auth/me` | Protected | Returns the authenticated user profile (excludes password) |

### Itinerary & AI Planning
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/itinerary/generate` | Protected | Generates a multi-day itinerary using Gemini prompt chaining, persists it, and returns the result |

### Saved Trips (`/api/trips`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/trips` | Protected | Retrieves all trips belonging to the authenticated user |
| `GET` | `/api/trips/:id` | Protected | Retrieves a single trip by ID (enforcing user ownership) |
| `DELETE` | `/api/trips/:id` | Protected | Deletes a trip by ID (enforcing user ownership) |

### Destination Places (`/api/places`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/places` | Public | Searches places with filters: `city`, `category`, `maxPrice`, `minRating`, `page`, `limit`, `explain` |

### Weather & Crowd Estimation
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/weather` | Public | Fetches weather for a destination (`?destination=CityName`) with 10-min cache |
| `GET` | `/api/weather/:city` | Public | Fetches weather by URL city parameter |
| `POST` | `/api/crowd/predict` | Public | Predicts crowd level (`High`, `Medium`, `Low`) based on location, date, and time |

---

## Security

- **Password Hashing:** Passwords are never stored in plaintext; hashed using `bcrypt` with 12 salt rounds.
- **Stateless Authentication:** JWT authentication with expiration (`7d`).
- **Data Isolation:** Trips queries strictly enforce `userId: req.user.id` on read and delete operations, preventing unauthorized cross-user data access.
- **Input Validation:**
  - Place queries validate allowed category enums, number boundaries (`minRating` 0–5, `maxPrice` 1–4), and pagination bounds (`limit <= 50`).
  - Itinerary input requires positive integer `days >= 1`, non-negative numeric `budget >= 0`, and non-empty destination and interests strings.
  - Trip IDs are checked using `mongoose.isValidObjectId`.
- **CORS Protection:** Configured via `cors` middleware using `CLIENT_URL` environment variable to restrict API access to the approved frontend origin.
- **Secrets Management:** Secrets (`JWT_SECRET`, `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`, `MONGODB_URI`) are loaded via environment variables and excluded from version control via `.gitignore`.
- **Rate & Bounds Protection:** Bounded query pagination (`limit` capped at 50 to prevent unbounded memory queries).

---

## Automated Testing

The project includes an automated test suite implemented with **Jest** and **Supertest**:

```
tests/
├── helpers/
│   └── db.js            # Isolated test database helper (express_auth_test)
├── auth.test.js         # 6 tests: registration, duplicate emails, login, bad creds, /me
├── trips.test.js        # 4 tests: fetch trips, cross-user isolation, deletion, unauthorized
├── validation.test.js   # 4 tests: missing destination, invalid days, invalid budget, bad interests
└── places.test.js       # 3 tests: city filter, multi-criteria compound search, query validation
```

### Mocking External APIs in Tests
To run tests reliably offline and without burning API credits:
- In `tests/validation.test.js`, the Gemini service is mocked using Jest module mocking (`jest.mock('../services/geminiItineraryService')`). Calls resolve deterministic mock itinerary data in memory.
- Tests connect to an isolated test database (`express_auth_test`), wiping collections between tests without affecting development data.
- **Total Tests:** 17 tests across 4 test suites. Zero failures.

---

## Continuous Integration (CI)

A GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

### Pipeline Trigger & Flow:
Triggers on any `push` or `pull_request` to `main` or `master`:

```
Code Push / Pull Request
           │
           ▼
┌──────────────────────────────────────┐
│  1. Spin up MongoDB 6.0 Service     │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  2. Checkout Code & Setup Node 20   │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  3. npm ci (Backend & Frontend)      │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  4. Run ESLint (npm run lint)        │  ──► (Fails on syntax/lint error)
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  5. Run Tests (npm test)             │  ──► (Fails on broken test)
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│  6. Build Frontend (npm run build)   │  ──► (Fails on bundle error)
└──────────────────────────────────────┘
```

The pipeline runs completely offline using mock API variables and the containerized MongoDB service.

---

## Local Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or v20 recommended)
- [MongoDB](https://www.mongodb.com) running locally on port 27017 (or a MongoDB Atlas URI)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/nikhillkumar28/smart-travel-management.git
cd smart-travel-management

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

Create `.env` in the project root:

```bash
cp .env.example .env
```

Edit `.env` and provide your credentials:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/express_auth
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
OPENWEATHER_API_KEY=your_openweather_api_key
CLIENT_URL=http://localhost:5173
```

### 3. Seed Places Database (Optional)
The server automatically seeds 20 Indian places on startup if the collection is empty. You can also seed manually:
```bash
npm run seed
```

### 4. Run the Application

In **Terminal 1** (Backend):
```bash
npm run dev
# Backend runs at http://localhost:3000
```

In **Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173 (proxies /api to localhost:3000)
```

### 5. Run Automated Tests & Linter

```bash
# Run backend tests
npm test

# Run linter
npm run lint

# Verify index with query execution explanation
npm run explain
```

---
