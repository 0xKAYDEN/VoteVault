# Conquer Toplist

A modern, high-performance game server listing platform.

## Features

- **Server Listings:** Comprehensive list of game servers with voting and ranking.
- **User Authentication:** Secure login and registration.
- **Reviews & Ratings:** User-driven feedback for servers.
- **Analytics:** Server owners can track votes and profile visits.
- **API Keys:** Secure API access for external integrations.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI, Vite.
- **Backend:** Node.js, Express, MySQL.
- **Database:** MySQL (migrated from Supabase).

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL

### Backend Setup

1. `cd server`
2. `npm install`
3. Create a `.env` file based on `.env.example`.
4. Import the schema from `server/db/mysql_schema.sql` into your MySQL database.
5. `npm run dev`

### Frontend Setup

1. `npm install`
2. Create a `.env` file with `VITE_API_URL=http://localhost:5000/api`.
3. `npm run dev`

## Security Features

- **Helmet:** Secure HTTP headers.
- **CORS:** Restricted origins.
- **Rate Limiting:** Prevention of brute-force and DoS attacks.
- **Input Validation:** Zod schemas for all API requests.
- **Secrets Management:** Environment variables for sensitive data.

## License

MIT
