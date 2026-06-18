const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db.json");

const db = {
  users: [
    { id: "user-1", name: "Mariam Hassan", role: "Organizer", email: "mariam@events.example", status: "Active" },
    { id: "user-2", name: "Omar Adel", role: "Staff", email: "omar@events.example", status: "Active", speciality: "Logistics" },
    { id: "user-3", name: "Nour Samy", role: "Vendor", email: "nour@cairoflorals.example", status: "Active" },
    { id: "user-4", name: "Laila Fouad", role: "Guest", email: "laila@example.com", status: "Active" },
    { id: "user-5", name: "Karim Youssef", role: "Venue Owner", email: "karim@venues.example", status: "Active" }
  ],
  venues: [
    {
      id: "venue-1",
      name: "Nile Glass Hall",
      location: "Cairo",
      capacity: 450,
      dimensions: "950 sqm",
      amenities: ["Stage", "AV", "Parking", "Catering kitchen"],
      pricePerDay: 90000,
      unavailableDates: ["2026-06-20"],
      active: true,
      ownerId: "user-5"
    },
    {
      id: "venue-2",
      name: "Zamalek Garden Court",
      location: "Cairo",
      capacity: 180,
      dimensions: "420 sqm",
      amenities: ["Outdoor area", "Lighting", "Security"],
      pricePerDay: 42000,
      unavailableDates: ["2026-06-18"],
      active: true,
      ownerId: "user-5"
    },
    {
      id: "venue-3",
      name: "Alexandria Harbor Loft",
      location: "Alexandria",
      capacity: 260,
      dimensions: "610 sqm",
      amenities: ["Sea view", "AV", "Loading bay"],
      pricePerDay: 65000,
      unavailableDates: [],
      active: true,
      ownerId: "user-5"
    }
  ],
  bookings: [
    {
      id: "booking-1",
      venueId: "venue-1",
      organizerId: "user-1",
      eventName: "Tech Founders Summit",
      eventType: "Conference",
      date: "2026-06-18",
      attendees: 320,
      status: "Approved",
      requirements: "Stage, registration desks, lunch area",
      price: 90000
    },
    {
      id: "booking-2",
      venueId: "venue-3",
      organizerId: "user-1",
      eventName: "Summer Product Showcase",
      eventType: "Product launch",
      date: "2026-06-28",
      attendees: 220,
      status: "Pending",
      requirements: "Demo booths and storage room",
      price: 65000
    }
  ],
  events: [
    {
      id: "event-1",
      name: "Tech Founders Summit",
      date: "2026-06-18",
      time: "10:00",
      venueId: "venue-1",
      organizerId: "user-1",
      dressCode: "Business casual",
      agenda: "Keynotes, demos, networking"
    },
    {
      id: "event-2",
      name: "Summer Product Showcase",
      date: "2026-06-28",
      time: "17:00",
      venueId: "venue-3",
      organizerId: "user-1",
      dressCode: "Smart casual",
      agenda: "Product demos and reception"
    }
  ],
  tasks: [
    { id: "task-1", eventId: "event-1", title: "Prepare registration desk", status: "In Progress", dueDate: "2026-06-18", assignedTo: "user-2", speciality: "Logistics" },
    { id: "task-2", eventId: "event-1", title: "Confirm catering count", status: "Pending", dueDate: "2026-06-17", assignedTo: "", speciality: "Catering" },
    { id: "task-3", eventId: "event-1", title: "Set up seating rows", status: "Pending", dueDate: "2026-06-18", assignedTo: "user-2", speciality: "Seating" },
    { id: "task-4", eventId: "event-2", title: "Arrange demo booths", status: "Pending", dueDate: "2026-06-27", assignedTo: "", speciality: "Logistics" }
  ],
  budgets: [
    { id: "budget-1", eventId: "event-1", category: "Venue", planned: 90000 },
    { id: "budget-2", eventId: "event-1", category: "Catering", planned: 65000 },
    { id: "budget-3", eventId: "event-1", category: "Decor", planned: 24000 },
    { id: "budget-4", eventId: "event-2", category: "Venue", planned: 65000 }
  ],
  expenses: [
    { id: "expense-1", eventId: "event-1", category: "Venue", description: "Venue deposit", amount: 45000 },
    { id: "expense-2", eventId: "event-1", category: "Decor", description: "Stage flowers", amount: 12000 },
    { id: "expense-3", eventId: "event-1", category: "Printing", description: "Badges and signage", amount: 8500 }
  ],
  vendors: [
    { id: "vendor-1", name: "Cairo Florals", supplies: "Flowers and stage decor", location: "Cairo", pricing: "Centerpieces from 900 EGP", status: "Active" },
    { id: "vendor-2", name: "Delta Catering", supplies: "Buffet and beverages", location: "Giza", pricing: "Packages from 550 EGP per guest", status: "Active" },
    { id: "vendor-3", name: "Bright AV", supplies: "Screens, microphones, lighting", location: "Cairo", pricing: "Full AV from 35000 EGP", status: "Active" }
  ],
  sourcingRequests: [
    {
      id: "request-1",
      vendorId: "vendor-1",
      eventId: "event-1",
      items: "Stage flowers and 25 table centerpieces",
      quantity: "1 package",
      deliveryDate: "2026-06-18",
      location: "Nile Glass Hall",
      status: "Accepted",
      note: "Use white and green palette."
    },
    {
      id: "request-2",
      vendorId: "vendor-2",
      eventId: "event-1",
      items: "Lunch buffet",
      quantity: "320 guests",
      deliveryDate: "2026-06-18",
      location: "Nile Glass Hall",
      status: "Pending",
      note: "Include vegetarian options."
    }
  ],
  deliveries: [
    { id: "delivery-1", requestId: "request-1", vendorId: "vendor-1", eventId: "event-1", status: "Out for Delivery", delayNote: "" },
    { id: "delivery-2", requestId: "request-2", vendorId: "vendor-2", eventId: "event-1", status: "Preparing", delayNote: "" }
  ],
  invoices: [
    { id: "invoice-1", vendorId: "vendor-1", eventId: "event-1", amount: 24000, status: "Pending Review", breakdown: "Decor package and delivery" }
  ],
  guests: [
    { id: "guest-1", eventId: "event-1", name: "Laila Fouad", email: "laila@example.com", rsvp: "Attending", dietary: "Vegetarian", checkInStatus: "Arrived", invitationSent: true },
    { id: "guest-2", eventId: "event-1", name: "Youssef Amin", email: "youssef@example.com", rsvp: "Maybe", dietary: "No nuts", checkInStatus: "Not Arrived", invitationSent: true },
    { id: "guest-3", eventId: "event-1", name: "Salma Reda", email: "salma@example.com", rsvp: "Attending", dietary: "None", checkInStatus: "Not Arrived", invitationSent: false },
    { id: "guest-4", eventId: "event-2", name: "Hana Nabil", email: "hana@example.com", rsvp: "Not Attending", dietary: "None", checkInStatus: "Not Arrived", invitationSent: true }
  ],
  messages: [
    { id: "message-1", eventId: "event-1", body: "Welcome! Registration opens at 9:30 near Gate A.", audience: "Guests", status: "Sent", seenBy: ["guest-1"] }
  ],
  feedback: [
    { id: "feedback-1", eventId: "event-1", guestId: "guest-1", rating: 5, food: 4, venue: 5, organization: 5, comments: "Smooth check-in and useful sessions." },
    { id: "feedback-2", eventId: "event-1", guestId: "guest-2", rating: 2, food: 3, venue: 4, organization: 2, comments: "Agenda updates were late." }
  ],
  layouts: [
    {
      id: "layout-1",
      eventId: "event-1",
      name: "Main hall layout",
      elements: [
        { type: "stage", x: 40, y: 30, label: "Stage" },
        { type: "table", x: 30, y: 58, label: "VIP" },
        { type: "booth", x: 68, y: 60, label: "Demo booths" }
      ],
      sharedWithSetupTeam: true
    }
  ],
  notifications: [
    { id: "notification-1", userId: "user-1", text: "Catering task is due tomorrow.", read: false },
    { id: "notification-2", userId: "vendor-1", text: "Invoice invoice-1 is pending organizer review.", read: false }
  ]
};

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Seeded database at ${dbPath}`);
