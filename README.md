# Startup & Innovation Collaboration Portal — Professional Edition

A college DBMS project built as a simplified startup ecosystem: Student/Innovator → Collaboration → Mentorship → Incubation → Fundraising → Investment → Growth.

## Stack
- Frontend: React 18 + Vite + React Router
- Backend: Node.js + Express
- Database: MySQL 8
- DB tool: MySQL Workbench
- Authentication: JWT + bcrypt
- Real-time foundation: Socket.IO
- Document upload foundation: Multer

## Roles
1. Student / Innovator
2. Mentor
3. Startup / Founder
4. Investor
5. Incubator
6. Admin

Each role gets its own navigation and dashboard context. Global messaging, notifications and profile remain available from the sidebar footer/top bar.

## Major workflows
- Idea Lab → collaborative project
- Project board: Backlog → In Progress → Review → Completed
- Mentor discovery → mentorship request → sessions → evaluation
- Startup journey: Idea → Validation → Prototype → MVP → Traction → Fundraising → Growth
- Incubation: program discovery → applications → screening → shortlist → interview → accepted
- Investor deal flow: New Opportunity → Screening → Review → Due Diligence → Term Sheet → Negotiation → Invested / Passed
- Due diligence document records and upload endpoint
- Innovation challenges → submissions
- Messaging, notifications, search and audit records

## Database setup
Open MySQL Workbench and run:
1. `database/schema.sql`
2. `database/seed.sql`

The schema creates `startup_portal` and the seed file creates demo data.

## Demo credentials
All demo users use password: `password`

- student@startup.local
- mentor@startup.local
- startup@startup.local
- investor@startup.local
- incubator@startup.local
- admin@startup.local

## Backend setup
```bash
cd server
copy .env.example .env
```
Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=startup_portal
JWT_SECRET=change-this-secret
CLIENT_URL=http://localhost:5173
```
Then:
```bash
npm install
npm run dev
```

## Frontend setup
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`.

## Review/demo flow
For a college review, demonstrate:
1. Login as Student → Idea Lab → Projects → Project Board → Mentor Network.
2. Login as Startup → Startup Workspace → Incubation → Fundraising → Deal Room.
3. Login as Investor → Discover Startups → Deal Flow → Due Diligence → Portfolio.
4. Login as Incubator → Programs → Applications → Cohorts.
5. Login as Admin → Users → Applications → Deals → Audit Logs.

## Notes
The project intentionally simplifies real-world platforms instead of cloning LinkedIn, GitHub or an investment platform. It demonstrates relational DBMS concepts, role-based access, workflows, many-to-many relationships, search/filtering, notifications, messaging, document records, dashboards and audit logs.
