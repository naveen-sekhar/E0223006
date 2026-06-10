# Campus Notification Platform

## Project Structure

*   `logging_middleware/` - Reusable log validation and transmission package.
*   `notification_app_be/` - Express backend proxy (running on port `3001`).
*   `notification_app_fe/` - React frontend SPA built with Vite (running on port `3000`).
*   `notification_system_design.md` - System architecture design stages (1–6).
*   `postman.json` - Exported Postman tests/requests.

---

## How to Run

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### 1. Backend Setup & Run
```bash
cd notification_app_be
npm install
node server.js
```
The backend server runs at `http://localhost:3001`.

### 2. Frontend Setup & Run
```bash
cd ../notification_app_fe
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:3000`.

---