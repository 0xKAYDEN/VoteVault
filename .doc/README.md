# VoteVault

A modern, high-performance server ranking and voting platform.

## Features

- **Server Rankings:** Comprehensive list of servers with voting and ranking system.
- **User Authentication:** Secure login and registration with 2FA support.
- **Reviews & Ratings:** User-driven feedback for servers.
- **Analytics:** Server owners can track votes and profile visits.
- **API Keys:** Secure API access for external integrations.
- **Premium Features:** Boost servers, featured listings, and advanced analytics.
- **Dynamic Themes:** Customizable color themes via themes.json.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI, Vite.
- **Backend:** Node.js, Express, MySQL.
- **Database:** MySQL.
- **Security:** reCAPTCHA v2, JWT authentication, rate limiting.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL

### Backend Setup

1. `cd server`
2. `npm install`
3. Create a `.env` file in the project root (see .env.example).
4. Import the schema from `server/db/mysql_schema.sql` into your MySQL database.
5. `npm run dev`

### Frontend Setup

1. `npm install`
2. Configure `.env` file with `VITE_API_URL=http://localhost:5000/api`.
3. `npm run dev`

## Security Features

- **Helmet:** Secure HTTP headers.
- **CORS:** Restricted origins.
- **Rate Limiting:** Prevention of brute-force and DoS attacks.
- **Input Validation:** Zod schemas for all API requests.
- **reCAPTCHA v2:** Bot protection on login, registration, and voting.
- **Secrets Management:** Environment variables for sensitive data.

## License

MIT
