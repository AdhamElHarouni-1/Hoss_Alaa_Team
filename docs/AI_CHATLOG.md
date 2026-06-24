# AI Chatlog

This file documents how AI assistance was used during development, as required by the Milestone 2 guidelines.

## Prompt

I have this project for software engineering course. I need you to explain it to me and help me implement it and explain every step how it's done. Do the same as required in the PDFs.

## AI Assistance Summary

The AI assistant read the Milestone 2 guidelines and user journey PDFs, extracted the requirements, and helped create a full-stack event management application.

The assistant explained that the project needs:

- a React frontend,
- a Node.js backend,
- a database with realistic dummy data,
- implementation of the provided user journeys,
- a README file,
- GitHub collaboration commits,
- and an AI usage chatlog.

The assistant then scaffolded:

- a Node.js server in `backend/server.js`,
- a React frontend in `frontend/src/app.js`,
- styling in `frontend/public/style.css`,
- dummy seed data in `scripts/seed.js`,
- the seeded database in `data/db.json`,
- project documentation in `README.md`.

## How The AI Output Was Reviewed

The generated code should be reviewed by the team before submission. Team members should run the project locally, test the user journeys, update names/contributions in the README, and make meaningful commits using their own GitHub accounts.

## Follow-Up Prompt

The user asked whether the implementation followed the provided user journeys and requested that the website be made closer to the PDF by adding login/register, separate pages, venue listing pages, drag-and-drop floor plan behavior, and report/export buttons.

## Follow-Up AI Assistance Summary

The assistant updated the frontend so the application now opens with login/register, then shows page-based navigation for each role instead of only role tabs. The organizer journey now has separate pages for dashboard, venue search, planning, vendor coordination, guest management, day-of operations, and reports. Staff, vendor, guest, and venue owner journeys were also split into dedicated pages. The update added client-side CSV/JSON exports, print report buttons, venue listing cards, a draggable floor plan editor, and clearer role-specific workflows.

## Missing Requirements Follow-Up

The user reported that requirements were still missing. The assistant added more journey coverage: organizer stakeholder account management, staff filtering, task creation, budget/expense creation, sourcing request creation, guest/vendor filtering, invoice approval/payment, dashboard notifications, guest message seen status, vendor delivery filtering and delay notes, venue availability editing, listing removal, booking request filtering, and a requirements coverage document.

## Full Requirements Follow-Up

The user asked to include everything without simplifying. The assistant added backend password authentication, server report generation, communication outbox records, real venue photo/floor-plan file uploads stored in the database, scannable QR-code images, floor-plan SVG image export, calendar views, and updated seed data with password hashes and upload-ready venue records. The assistant noted that actual external email/SMS delivery requires provider credentials.

## Button Functionality Fix

The user reported that some buttons did not work. The assistant audited the frontend and found three placeholder actions: organizer follow-up messages, vendor clarification notes, and venue-owner counter proposals. These were replaced with persistent API/database operations, UI refreshes, outbox records, and visible saved details. The flows were tested against a temporary server and the database was restored after testing.
