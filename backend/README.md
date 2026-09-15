# Backend API (Express + TypeScript)

## Project Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and set your MySQL credentials and `JWT_SECRET`:

```bash
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

**Development Mode:**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
npm start
```

## API Documentation (Swagger / OpenAPI 3.0)

Interactive API documentation is powered by Swagger UI and OpenAPI 3.0.

- **Interactive Swagger UI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs) (or [http://localhost:4000/docs](http://localhost:4000/docs))
- **Raw OpenAPI 3.0 Spec (JSON)**: [http://localhost:4000/api/docs.json](http://localhost:4000/api/docs.json)

### Using Swagger UI

1. Start the server (`npm run dev` or `npm start`).
2. Open `http://localhost:4000/api/docs` in your browser.
3. Test public endpoints directly using **Try it out**.
4. For protected endpoints (creating events, deleting events, marking RSVP):
   - Call `POST /api/auth/login` to obtain an `accessToken`.
   - Click the **Authorize** button at the top right of the Swagger page.
   - Enter your token under `bearerAuth` as: `Bearer <your_access_token>`.
   - Click **Authorize** to send the authorization header with your requests.
