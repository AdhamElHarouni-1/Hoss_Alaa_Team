# Event Management Platform

A full-stack web application for Milestone 2 of the Software Engineering course. The app translates the provided user journeys into a working event management platform for event organizers, staff, vendors, guests, and venue owners.

## Team Members

- Add team member name: contribution
- Add team member name: contribution
- Add team member name: contribution

Each team member should make at least one meaningful GitHub commit before submission.

## Technologies Used

- Frontend: React
- Backend: Node.js
- Database: JSON file database stored in `data/db.json`
- Version control: Git and GitHub

## How To Run

1. Install Node.js if it is not already installed.
2. Open the project folder.
3. Reset or insert dummy data:

```bash
npm run seed
```

4. Start the backend and frontend server:

```bash
npm start
```

5. Open:

```text
http://localhost:3000
```

The Node.js server serves both the API and the React frontend.

## Project Structure

```text
backend/
  server.js          Node.js HTTP server and API routes
data/
  db.json            Seeded JSON database
docs/
  AI_CHATLOG.md      Required AI usage chatlog
frontend/
  public/
    index.html       React entry page
    style.css        Application styles
  src/
    app.js           React application
scripts/
  seed.js            Dummy data generator/reset script
README.md
package.json
```

## Implemented User Journeys

- Organizer: account data, venue search, venue booking request, dashboard, task assignment, budget view, expense tracking, floor plan view, vendor data, guest data, day-of messages, feedback metrics.
- Staff: login-style role workspace, assigned events/tasks, task progress updates, shared floor plan, guest check-in, vendor arrival status, day-of operations dashboard.
- Vendor: profile/vendor listing, sourcing request review, accept/decline requests, delivery status updates, invoice submission and invoice status tracking.
- Guest: invitation details, RSVP update, dietary preference update, day-of messages, check-in code, post-event feedback form.
- Venue owner: venue listing creation, listing overview, booking request approval/decline, confirmed booking/revenue summary.

## API Overview

The backend exposes generic REST endpoints for each database collection:

```text
GET    /api/:resource
POST   /api/:resource
PATCH  /api/:resource/:id
DELETE /api/:resource/:id
GET    /api/summary
```

Examples:

```text
GET /api/venues?location=Cairo&minCapacity=200&date=2026-06-18
POST /api/bookings
PATCH /api/tasks/task-1
GET /api/summary
```

## Database And Dummy Data

The database is stored in `data/db.json`. It contains generated dummy records for:

- users
- venues
- bookings
- events
- tasks
- budgets
- expenses
- vendors
- sourcing requests
- deliveries
- invoices
- guests
- messages
- feedback
- layouts
- notifications

To reset the database at any time, run:

```bash
npm run seed
```

## Assumptions

- Authentication is represented by role workspaces instead of a full password login system, because the milestone focuses on implementing user journeys and data handling.
- Email and messaging integrations are simulated by storing invitations and messages in the database.
- QR check-in is represented by a generated textual code that staff can confirm.
- Floor plan export is represented by a shareable visual layout in the app; a production app would add image or PDF export.
- The JSON file database is used to keep setup simple for local evaluation. It can be replaced by MongoDB, PostgreSQL, or SQLite later without changing the user journey structure.

## Submission Checklist

- React frontend implemented.
- Node.js backend implemented.
- Frontend communicates with backend APIs.
- Database has dummy data and a reset seed script.
- README includes setup, run commands, assumptions, and implemented journeys.
- AI chatlog included in `docs/AI_CHATLOG.md`.
- Team GitHub repository should include meaningful commits from each team member.
