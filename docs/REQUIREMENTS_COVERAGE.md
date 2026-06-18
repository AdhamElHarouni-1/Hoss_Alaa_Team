# Milestone 2 Requirements Coverage

This document maps the provided user journeys to the implemented website screens.

## Event Organizer

- Account creation/customization: backend password login/register screen and Organizer > Accounts page.
- Create stakeholder accounts: Organizer > Accounts.
- Deactivate stakeholder accounts: Organizer > Accounts.
- Venue search/filter by location, size, date: Organizer > Venue Search.
- Submit booking applications: Organizer > Venue Search.
- View booking status: Organizer > Venue Search.
- Daily dashboard and reminders: Organizer > Dashboard.
- Upcoming events: Organizer > Dashboard.
- Task filtering and assignment: Organizer > Planning.
- Task creation: Organizer > Planning.
- Budget planning and actual expenses: Organizer > Planning.
- Budget difference: Organizer > Dashboard and Reports.
- Digital floor plan: Organizer > Planning.
- Drag-and-drop layout editing: Organizer > Planning.
- Layout export: Organizer > Planning exports JSON and SVG image files.
- Staff filtering/details: Organizer > Planning.
- Vendor directory/search: Organizer > Vendors.
- Sourcing requests: Organizer > Vendors.
- Delivery statuses: Organizer > Vendors and Staff > Operations.
- Invoice review/approval/payment: Organizer > Vendors.
- Guest list/search/filter: Organizer > Guests.
- Send invitations: Organizer > Guests.
- RSVP/dietary status: Organizer > Guests.
- Day-of dashboard/messages/follow-up: Organizer > Day-Of, with communication outbox records.
- Feedback and report export: Organizer > Reports, with CSV and full JSON report export.

## Staff

- Login: login screen.
- Assigned events/tasks and task filtering: Staff > Tasks.
- Task progress updates: Staff > Tasks.
- Shared floor plan: Staff > Floor Plan.
- Guest check-in: Staff > Check-In.
- Vendor arrival coordination: Staff > Operations.
- Day-of operations dashboard: Staff > Operations.

## Vendors

- Register/login/profile: login/register screen and Vendor > Profile.
- Incoming sourcing requests: Vendor > Requests.
- Accept/decline requests and clarification note: Vendor > Requests.
- Delivery list/filter/status updates: Vendor > Deliveries.
- Delay notification: Vendor > Deliveries.
- Invoice submission/status: Vendor > Invoices.

## Guests

- Invitation details: Guest > Invitation.
- RSVP and dietary requirements: Guest > RSVP.
- Day-of messages and seen status: Guest > Messages.
- Scannable QR check-in image: Guest > Invitation.
- Post-event feedback: Guest > Feedback.

## Venue Owners

- Register/login/profile: login/register screen and Venue Owner > Profile.
- Create venue listings: Venue Owner > Listings.
- Manage listing details/status/availability/removal/photo upload/floor-plan upload: Venue Owner > Listings.
- Booking request approve/decline/counter proposal: Venue Owner > Requests.
- Confirmed booking overview: Venue Owner > Bookings.
- Booking filters and calendar view: Venue Owner > Requests and Bookings.
- Performance/revenue reports and export: Venue Owner > Reports.

## External-Service Notes

- Email and messaging are stored as real queued outbox records in the backend. Connecting those queued records to actual external email/SMS delivery requires SMTP/SMS provider credentials.
- QR codes are rendered as actual QR images through a QR-code image endpoint.
- Venue photos and floor-plan files are uploaded into the local database as data URLs.
- Reports export as CSV/JSON files and print through the browser print dialog.
