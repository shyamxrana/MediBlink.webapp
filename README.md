# Add MongoDB to this Project

This project currently uses browser `localStorage` for persistence (see `src/utils/storage.ts`).
The following README explains how to replace localStorage with a MongoDB-backed API and what files/changes to add.

## Overview
- Create a small backend (Node + Express) that connects to MongoDB using Mongoose.
- Add REST endpoints for auth, users, doctors, and appointments.
- Update the frontend to call the new API instead of using `localStorage`.

## Prerequisites
- Node.js (14+)
- npm or yarn
- A MongoDB database (MongoDB Atlas or local `mongod`)

## Quick setup (commands)

1. Create a `server/` folder at the repo root and init a new Node project there:

```bash
cd server
npm init -y
```

2. Install server dependencies:

```bash
npm install express mongoose dotenv cors bcrypt jsonwebtoken
npm install -D nodemon
```

## Environment
Create a `.env` file in `server/` with:

```env
PORT=4000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=some_long_secret
```

## Recommended server structure

- server/
  - package.json
  - tsconfig.json (optional if using TypeScript)
  - .env
  - src/
    - index.js (or index.ts)
    - config/db.js
    - models/User.js
    - models/Doctor.js
    - models/Appointment.js
    - routes/auth.js
    - routes/users.js
    - routes/doctors.js
    - routes/appointments.js
    - controllers/

### Example: `src/config/db.js`

```js
const mongoose = require('mongoose');
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('MongoDB connected');
};
module.exports = connectDB;
```

### Example Mongoose model: `src/models/Appointment.js`

```js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: String },
  patientName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  doctor: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending','confirmed','cancelled','rejected'], default: 'pending' },
  createdAt: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
```

## API endpoints (suggested)
- POST `/api/auth/login` — authenticate user (returns JWT)
- POST `/api/auth/register` — create user
- GET `/api/users` — list users (admin)
- GET `/api/doctors` — list doctors
- POST `/api/doctors` — create doctor (admin)
- GET `/api/appointments` — list appointments (filter by user or date)
- POST `/api/appointments` — create appointment
- PATCH `/api/appointments/:id` — update appointment status

Protect routes using JWT middleware for authenticated actions.

## Frontend changes

1. Add a base API URL to the frontend env: create `.env` (root) or `.env.local` with:

```env
VITE_API_URL=http://localhost:4000/api
```

2. Replace `src/utils/storage.ts` calls with fetch/axios requests to the server. Example client wrapper `src/utils/api.ts`:

```ts
const API = import.meta.env.VITE_API_URL;

export const fetchDoctors = async () => {
  const res = await fetch(`${API}/doctors`);
  return res.json();
};

export const createAppointment = async (payload) => {
  const res = await fetch(`${API}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};
```

3. Update components to call new API functions and handle authentication (store JWT in `localStorage` or cookie).

## Data migration
- If you have existing data in `localStorage`, export it (open DevTools -> Application -> localStorage -> copy JSON) and POST it to an import endpoint on the server or write a small migration script that reads the JSON and inserts into MongoDB.

## Running locally

1. Start server:

```bash
cd server
npx nodemon src/index.js
```

2. Start frontend (from project root):

```bash
npm run dev
```

## Security & production
- Use HTTPS and secure cookies for production.
- Store `MONGODB_URI` and `JWT_SECRET` in env vars (never commit them).
- Add input validation (e.g., `express-validator`), rate limiting, and sanitized DB queries.
- Use MongoDB Atlas for a managed DB in production.

## Extras & tips
- Use TypeScript on the server for better DX and alignment with the frontend.
- Consider using Prisma as an alternative ORM/DB layer if you prefer typed models and migrations.
- Write unit/integration tests for the API endpoints.

---

If you want, I can scaffold the `server/` folder and create basic models and routes for you — should I generate those files now? 
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
  `npm install`
2. (Optional) Create a `.env.local` file for environment variables such as `APP_URL`.
3. Run the app:
  `npm run dev`

## Deploy to Vercel

This project is ready to deploy as a static site on Vercel.

1. Push your repository to GitHub, GitLab, or Bitbucket and connect it in the Vercel dashboard.
2. In Vercel's project settings set the **Build Command** to:

  `npm run vercel-build`

  and the **Output Directory** to:

  `dist`

3. Add any environment variables in the Vercel dashboard (e.g., `APP_URL`).
4. Trigger a deployment — Vercel will run the build and serve the `dist` folder.

Local test before deploying:

```bash
npm run clean
npm run vercel-build
npm run preview
```

If you later add server-side APIs, place them under an `api/` or `serverless/` folder and configure Vercel Functions accordingly.
