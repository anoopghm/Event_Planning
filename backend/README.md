Backend API (Express + TypeScript)

Quick start

1. Copy `.env.example` to `.env`, then supply your MySQL password and a long random `JWT_SECRET`.

```

2. Install:

```bash
cd backend
npm install
```

3. Run in development:

```bash
npm run dev
```

Auth endpoints

- POST `/api/auth/register` { name, email, password }
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me` with `Authorization: Bearer <token>`

Database schema (example SQL):

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```