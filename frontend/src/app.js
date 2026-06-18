const h = React.createElement;
const API = "/api";

function statusClass(status) {
  if (["Approved", "Accepted", "Arrived", "Done", "Delivered", "Paid", "Attending"].includes(status)) return "green";
  if (["Pending", "Maybe", "Preparing", "Pending Review", "In Progress"].includes(status)) return "amber";
  if (["Declined", "Not Attending", "Not Arrived"].includes(status)) return "rose";
  return "";
}

async function api(resource, options) {
  const response = await fetch(`${API}${resource}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Field({ label, children }) {
  return h("label", null, h("span", { className: "muted" }, label), children);
}

function Pill({ children }) {
  return h("span", { className: `pill ${statusClass(children)}` }, children);
}

function Card({ title, meta, children, actions }) {
  return h("article", { className: "card" },
    h("h4", null, title),
    meta ? h("div", { className: "meta" }, meta.map(item => h(Pill, { key: item }, item))) : null,
    children,
    actions ? h("div", { className: "actions" }, actions) : null
  );
}

function Metric({ label, value, detail }) {
  return h("div", { className: "card metric" },
    h("span", { className: "muted" }, label),
    h("strong", null, value),
    detail ? h("span", { className: "muted" }, detail) : null
  );
}

function Organizer({ data, refresh, setNotice }) {
  const [venueQuery, setVenueQuery] = React.useState({ location: "Cairo", minCapacity: 200, date: "2026-06-18" });
  const [taskStatus, setTaskStatus] = React.useState("");
  const venues = data.venues.filter(venue =>
    (!venueQuery.location || venue.location === venueQuery.location) &&
    Number(venue.capacity) >= Number(venueQuery.minCapacity || 0) &&
    !(venue.unavailableDates || []).includes(venueQuery.date)
  );
  const tasks = data.tasks.filter(task => !taskStatus || task.status === taskStatus);
  const layout = data.layouts[0];

  async function createBooking(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/bookings", {
      method: "POST",
      body: JSON.stringify({
        venueId: form.get("venueId"),
        organizerId: "user-1",
        eventName: form.get("eventName"),
        eventType: form.get("eventType"),
        date: form.get("date"),
        attendees: Number(form.get("attendees")),
        status: "Pending",
        requirements: form.get("requirements"),
        price: Number(form.get("price") || 0)
      })
    });
    event.currentTarget.reset();
    setNotice("Booking request submitted.");
    refresh();
  }

  async function assignTask(taskId, assignedTo) {
    await api(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ assignedTo, status: "In Progress" }) });
    setNotice("Task assigned and moved to In Progress.");
    refresh();
  }

  async function sendMessage(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/messages", {
      method: "POST",
      body: JSON.stringify({ eventId: form.get("eventId"), body: form.get("body"), audience: "Guests", status: "Sent", seenBy: [] })
    });
    event.currentTarget.reset();
    setNotice("Day-of communication sent to guests.");
    refresh();
  }

  return h("div", { className: "wide-grid" },
    h("div", { className: "panel" },
      h("div", { className: "section-title" }, h("h2", null, "Organizer Control")),
      h("div", { className: "grid" },
        h(Metric, { label: "Today's events", value: data.summary.todaysEvents.length, detail: "Daily dashboard" }),
        h(Metric, { label: "Arrived guests", value: `${data.summary.operations.arrivedGuests}/${data.summary.operations.totalGuests}`, detail: "Day-of operations" }),
        h(Metric, { label: "Budget difference", value: `${data.summary.budget.difference.toLocaleString()} EGP`, detail: "Planned minus actual" }),
        h(Metric, { label: "Feedback", value: `${data.summary.feedback.positive}+ / ${data.summary.feedback.negative}-`, detail: "Post-event analysis" })
      ),
      h("h3", null, "Search Venues"),
      h("div", { className: "toolbar" },
        h("input", { value: venueQuery.location, onChange: e => setVenueQuery({ ...venueQuery, location: e.target.value }), placeholder: "Location" }),
        h("input", { type: "number", value: venueQuery.minCapacity, onChange: e => setVenueQuery({ ...venueQuery, minCapacity: e.target.value }), placeholder: "Minimum capacity" }),
        h("input", { type: "date", value: venueQuery.date, onChange: e => setVenueQuery({ ...venueQuery, date: e.target.value }) })
      ),
      h("div", { className: "list" }, venues.map(venue => h(Card, {
        key: venue.id,
        title: venue.name,
        meta: [venue.location, `${venue.capacity} guests`, `${venue.pricePerDay.toLocaleString()} EGP/day`]
      }, h("p", null, venue.amenities.join(", "))))),
      h("h3", null, "Submit Venue Application"),
      h("form", { onSubmit: createBooking, className: "form-grid" },
        h(Field, { label: "Venue" }, h("select", { name: "venueId", required: true }, data.venues.map(venue => h("option", { key: venue.id, value: venue.id }, venue.name)))),
        h(Field, { label: "Event name" }, h("input", { name: "eventName", required: true })),
        h(Field, { label: "Type" }, h("input", { name: "eventType", required: true })),
        h(Field, { label: "Date" }, h("input", { name: "date", type: "date", required: true })),
        h(Field, { label: "Attendees" }, h("input", { name: "attendees", type: "number", required: true })),
        h(Field, { label: "Expected price" }, h("input", { name: "price", type: "number", required: true })),
        h(Field, { label: "Requirements" }, h("input", { name: "requirements", required: true })),
        h("button", { className: "primary" }, "Submit")
      )
    ),
    h("div", { className: "panel" },
      h("div", { className: "section-title" }, h("h2", null, "Planning Workspace")),
      h("div", { className: "toolbar" },
        h("select", { value: taskStatus, onChange: e => setTaskStatus(e.target.value) },
          h("option", { value: "" }, "All task statuses"),
          ["Pending", "In Progress", "Done"].map(status => h("option", { key: status, value: status }, status))
        )
      ),
      h("div", { className: "list" }, tasks.map(task => h(Card, {
        key: task.id,
        title: task.title,
        meta: [task.status, task.speciality, task.dueDate],
        actions: [
          h("button", { key: "assign", onClick: () => assignTask(task.id, "user-2") }, "Assign to Omar")
        ]
      }, h("p", null, `Assigned to: ${task.assignedTo || "Not yet assigned"}`)))),
      h("h3", null, "Budget and Expenses"),
      h("div", { className: "grid" },
        ...data.budgets.map(item => h(Card, { key: item.id, title: item.category, meta: [`${item.planned.toLocaleString()} EGP planned`] })),
        ...data.expenses.map(item => h(Card, { key: item.id, title: item.description, meta: [item.category, `${item.amount.toLocaleString()} EGP actual`] }))
      ),
      h("h3", null, "Shared Floor Plan"),
      h("div", { className: "floorplan" }, layout.elements.map((item, index) =>
        h("div", { key: index, className: "floor-item", style: { left: `${item.x}%`, top: `${item.y}%` } }, item.label)
      )),
      h("h3", null, "Send Day-Of Communication"),
      h("form", { onSubmit: sendMessage, className: "form-grid" },
        h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
        h(Field, { label: "Message" }, h("input", { name: "body", required: true, placeholder: "Schedule update or directions" })),
        h("button", { className: "primary" }, "Send")
      )
    )
  );
}

function Staff({ data, refresh, setNotice }) {
  const [status, setStatus] = React.useState("");
  const tasks = data.tasks.filter(task => task.assignedTo === "user-2" && (!status || task.status === status));

  async function updateTask(task, nextStatus) {
    await api(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    setNotice("Task progress updated.");
    refresh();
  }

  async function checkInGuest(guest) {
    await api(`/guests/${guest.id}`, { method: "PATCH", body: JSON.stringify({ checkInStatus: "Arrived" }) });
    setNotice(`${guest.name} checked in.`);
    refresh();
  }

  async function markDelivery(delivery) {
    await api(`/deliveries/${delivery.id}`, { method: "PATCH", body: JSON.stringify({ status: "Delivered" }) });
    setNotice("Vendor arrival marked as delivered.");
    refresh();
  }

  return h("div", { className: "wide-grid" },
    h("div", { className: "panel" },
      h("h2", null, "Staff Operations"),
      h("div", { className: "toolbar" },
        h("select", { value: status, onChange: e => setStatus(e.target.value) },
          h("option", { value: "" }, "All assigned tasks"),
          ["Pending", "In Progress", "Done"].map(item => h("option", { key: item, value: item }, item))
        )
      ),
      h("div", { className: "list" }, tasks.map(task => h(Card, {
        key: task.id,
        title: task.title,
        meta: [task.status, task.dueDate, task.speciality],
        actions: [
          h("button", { key: "start", onClick: () => updateTask(task, "In Progress") }, "Start"),
          h("button", { key: "done", className: "success", onClick: () => updateTask(task, "Done") }, "Done")
        ]
      }))),
      h("h3", null, "Shared Layout"),
      h("div", { className: "floorplan" }, data.layouts[0].elements.map((item, index) =>
        h("div", { key: index, className: "floor-item", style: { left: `${item.x}%`, top: `${item.y}%` } }, item.label)
      ))
    ),
    h("div", { className: "panel" },
      h("h2", null, "Guest and Vendor Logistics"),
      h("div", { className: "grid" },
        h(Metric, { label: "Total guests", value: data.summary.operations.totalGuests }),
        h(Metric, { label: "Arrived", value: data.summary.operations.arrivedGuests })
      ),
      h("h3", null, "Guest Check-In"),
      h("div", { className: "list" }, data.guests.map(guest => h(Card, {
        key: guest.id,
        title: guest.name,
        meta: [guest.rsvp, guest.checkInStatus, guest.dietary],
        actions: guest.checkInStatus !== "Arrived" ? [h("button", { key: "check", className: "primary", onClick: () => checkInGuest(guest) }, "Check in")] : []
      }))),
      h("h3", null, "Vendor Arrivals"),
      h("div", { className: "list" }, data.deliveries.map(delivery => h(Card, {
        key: delivery.id,
        title: data.vendors.find(vendor => vendor.id === delivery.vendorId)?.name || delivery.vendorId,
        meta: [delivery.status],
        actions: delivery.status !== "Delivered" ? [h("button", { key: "arrived", onClick: () => markDelivery(delivery) }, "Mark arrived")] : []
      })))
    )
  );
}

function Vendor({ data, refresh, setNotice }) {
  async function updateRequest(request, status) {
    await api(`/sourcingRequests/${request.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setNotice(`Request ${status.toLowerCase()}.`);
    refresh();
  }

  async function updateDelivery(delivery, status) {
    await api(`/deliveries/${delivery.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setNotice("Delivery status updated.");
    refresh();
  }

  async function createInvoice(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/invoices", {
      method: "POST",
      body: JSON.stringify({
        vendorId: form.get("vendorId"),
        eventId: form.get("eventId"),
        amount: Number(form.get("amount")),
        status: "Pending Review",
        breakdown: form.get("breakdown")
      })
    });
    event.currentTarget.reset();
    setNotice("Invoice submitted for organizer review.");
    refresh();
  }

  return h("div", { className: "wide-grid" },
    h("div", { className: "panel" },
      h("h2", null, "Vendor Requests"),
      h("div", { className: "list" }, data.sourcingRequests.map(request => h(Card, {
        key: request.id,
        title: request.items,
        meta: [request.status, request.deliveryDate, request.location],
        actions: [
          h("button", { key: "accept", className: "success", onClick: () => updateRequest(request, "Accepted") }, "Accept"),
          h("button", { key: "decline", className: "warn", onClick: () => updateRequest(request, "Declined") }, "Decline")
        ]
      }, h("p", null, request.note))))
    ),
    h("div", { className: "panel" },
      h("h2", null, "Deliveries and Invoices"),
      h("div", { className: "list" }, data.deliveries.map(delivery => h(Card, {
        key: delivery.id,
        title: data.events.find(event => event.id === delivery.eventId)?.name || delivery.eventId,
        meta: [delivery.status],
        actions: ["Preparing", "Out for Delivery", "Delivered"].map(status =>
          h("button", { key: status, onClick: () => updateDelivery(delivery, status) }, status)
        )
      }))),
      h("h3", null, "Submit Invoice"),
      h("form", { onSubmit: createInvoice, className: "form-grid" },
        h(Field, { label: "Vendor" }, h("select", { name: "vendorId" }, data.vendors.map(vendor => h("option", { key: vendor.id, value: vendor.id }, vendor.name)))),
        h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
        h(Field, { label: "Amount" }, h("input", { name: "amount", type: "number", required: true })),
        h(Field, { label: "Breakdown" }, h("input", { name: "breakdown", required: true })),
        h("button", { className: "primary" }, "Submit")
      ),
      h("div", { className: "list" }, data.invoices.map(invoice => h(Card, {
        key: invoice.id,
        title: `${Number(invoice.amount).toLocaleString()} EGP`,
        meta: [invoice.status, invoice.breakdown]
      })))
    )
  );
}

function Guest({ data, refresh, setNotice }) {
  const guest = data.guests[0];

  async function updateRsvp(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/guests/${guest.id}`, {
      method: "PATCH",
      body: JSON.stringify({ rsvp: form.get("rsvp"), dietary: form.get("dietary") })
    });
    setNotice("RSVP saved. Confirmation message displayed.");
    refresh();
  }

  async function submitFeedback(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/feedback", {
      method: "POST",
      body: JSON.stringify({
        eventId: guest.eventId,
        guestId: guest.id,
        rating: Number(form.get("rating")),
        food: Number(form.get("food")),
        venue: Number(form.get("venue")),
        organization: Number(form.get("organization")),
        comments: form.get("comments")
      })
    });
    event.currentTarget.reset();
    setNotice("Thank you. Feedback submitted.");
    refresh();
  }

  return h("div", { className: "wide-grid" },
    h("div", { className: "panel" },
      h("h2", null, "Invitation"),
      data.events.map(event => h(Card, {
        key: event.id,
        title: event.name,
        meta: [event.date, event.time, event.dressCode]
      }, h("p", null, event.agenda))),
      h("h3", null, "RSVP"),
      h("form", { onSubmit: updateRsvp, className: "form-grid" },
        h(Field, { label: "Response" }, h("select", { name: "rsvp", defaultValue: guest.rsvp },
          ["Attending", "Not Attending", "Maybe"].map(item => h("option", { key: item, value: item }, item))
        )),
        h(Field, { label: "Dietary preference" }, h("input", { name: "dietary", defaultValue: guest.dietary })),
        h("button", { className: "primary" }, "Save RSVP")
      ),
      h("h3", null, "Check-In QR Code"),
      h("div", { className: "card" },
        h("strong", null, `QR-${guest.id.toUpperCase()}-${guest.eventId.toUpperCase()}`),
        h("p", { className: "muted" }, "Staff can confirm this code or search by name at the entrance.")
      )
    ),
    h("div", { className: "panel" },
      h("h2", null, "Messages and Feedback"),
      h("div", { className: "list" }, data.messages.map(message => h(Card, {
        key: message.id,
        title: message.body,
        meta: [message.status, message.seenBy.includes(guest.id) ? "Seen" : "Received"]
      }))),
      h("h3", null, "Post-Event Feedback"),
      h("form", { onSubmit: submitFeedback, className: "form-grid" },
        ["rating", "food", "venue", "organization"].map(name =>
          h(Field, { key: name, label: name[0].toUpperCase() + name.slice(1) }, h("input", { name, type: "number", min: "1", max: "5", required: true }))
        ),
        h(Field, { label: "Comments" }, h("textarea", { name: "comments", required: true })),
        h("button", { className: "primary" }, "Submit")
      )
    )
  );
}

function VenueOwner({ data, refresh, setNotice }) {
  async function updateBooking(booking, status) {
    await api(`/bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setNotice(`Booking ${status.toLowerCase()}.`);
    refresh();
  }

  async function createVenue(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/venues", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        location: form.get("location"),
        capacity: Number(form.get("capacity")),
        dimensions: form.get("dimensions"),
        amenities: form.get("amenities").split(",").map(item => item.trim()).filter(Boolean),
        pricePerDay: Number(form.get("pricePerDay")),
        unavailableDates: [],
        active: true,
        ownerId: "user-5"
      })
    });
    event.currentTarget.reset();
    setNotice("Venue listing created.");
    refresh();
  }

  return h("div", { className: "wide-grid" },
    h("div", { className: "panel" },
      h("h2", null, "Venue Listings"),
      h("form", { onSubmit: createVenue, className: "form-grid" },
        h(Field, { label: "Name" }, h("input", { name: "name", required: true })),
        h(Field, { label: "Location" }, h("input", { name: "location", required: true })),
        h(Field, { label: "Capacity" }, h("input", { name: "capacity", type: "number", required: true })),
        h(Field, { label: "Dimensions" }, h("input", { name: "dimensions", required: true })),
        h(Field, { label: "Amenities" }, h("input", { name: "amenities", placeholder: "AV, Parking", required: true })),
        h(Field, { label: "Price per day" }, h("input", { name: "pricePerDay", type: "number", required: true })),
        h("button", { className: "primary" }, "Create")
      ),
      h("div", { className: "list" }, data.venues.map(venue => h(Card, {
        key: venue.id,
        title: venue.name,
        meta: [venue.location, `${venue.capacity} guests`, venue.active ? "Active" : "Inactive"]
      }, h("p", null, venue.amenities.join(", ")))))
    ),
    h("div", { className: "panel" },
      h("h2", null, "Bookings and Reports"),
      h("div", { className: "grid" },
        h(Metric, { label: "Approved bookings", value: data.summary.venueOwner.totalBookings }),
        h(Metric, { label: "Pending requests", value: data.summary.venueOwner.pendingBookings }),
        h(Metric, { label: "Revenue", value: `${data.summary.venueOwner.revenue.toLocaleString()} EGP` })
      ),
      h("div", { className: "list" }, data.bookings.map(booking => h(Card, {
        key: booking.id,
        title: booking.eventName,
        meta: [booking.status, booking.date, `${booking.attendees} attendees`],
        actions: [
          h("button", { key: "approve", className: "success", onClick: () => updateBooking(booking, "Approved") }, "Approve"),
          h("button", { key: "decline", className: "warn", onClick: () => updateBooking(booking, "Declined") }, "Decline")
        ]
      }, h("p", null, booking.requirements))))
    )
  );
}

function App() {
  const roles = ["Organizer", "Staff", "Vendor", "Guest", "Venue Owner"];
  const resources = ["users", "venues", "bookings", "events", "tasks", "budgets", "expenses", "vendors", "sourcingRequests", "deliveries", "invoices", "guests", "messages", "feedback", "layouts", "notifications"];
  const [role, setRole] = React.useState("Organizer");
  const [data, setData] = React.useState(null);
  const [notice, setNotice] = React.useState("");

  async function load() {
    const entries = await Promise.all([
      api("/summary"),
      ...resources.map(resource => api(`/${resource}`))
    ]);
    const next = { summary: entries[0] };
    resources.forEach((resource, index) => {
      next[resource] = entries[index + 1];
    });
    setData(next);
  }

  React.useEffect(() => {
    load().catch(error => setNotice(error.message));
  }, []);

  if (!data) {
    return h("main", { className: "workspace" }, h("p", null, "Loading event platform..."));
  }

  const views = {
    Organizer: h(Organizer, { data, refresh: load, setNotice }),
    Staff: h(Staff, { data, refresh: load, setNotice }),
    Vendor: h(Vendor, { data, refresh: load, setNotice }),
    Guest: h(Guest, { data, refresh: load, setNotice }),
    "Venue Owner": h(VenueOwner, { data, refresh: load, setNotice })
  };

  return h(React.Fragment, null,
    h("header", { className: "app-header" },
      h("h1", null, "Event Management Platform"),
      h("p", null, "A full-stack milestone implementation covering organizer, staff, vendor, guest, and venue owner journeys with live API-backed data.")
    ),
    h("nav", { className: "role-tabs", "aria-label": "Role workspaces" },
      roles.map(item => h("button", {
        key: item,
        className: item === role ? "active" : "",
        onClick: () => setRole(item)
      }, item))
    ),
    h("main", { className: "workspace" },
      notice ? h("div", { className: "status-line" }, notice) : null,
      views[role]
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
