const h = React.createElement;
const API = "/api";

const resources = [
  "users",
  "venues",
  "bookings",
  "events",
  "tasks",
  "budgets",
  "expenses",
  "vendors",
  "sourcingRequests",
  "deliveries",
  "invoices",
  "guests",
  "messages",
  "feedback",
  "layouts",
  "notifications",
  "outbox",
  "reports"
];

const rolePages = {
  Organizer: [
    ["dashboard", "Dashboard"],
    ["accounts", "Accounts"],
    ["venues", "Venue Search"],
    ["planning", "Planning"],
    ["vendors", "Vendors"],
    ["guests", "Guests"],
    ["operations", "Day-Of"],
    ["reports", "Reports"]
  ],
  Staff: [
    ["tasks", "Tasks"],
    ["layout", "Floor Plan"],
    ["checkin", "Check-In"],
    ["operations", "Operations"]
  ],
  Vendor: [
    ["profile", "Profile"],
    ["requests", "Requests"],
    ["deliveries", "Deliveries"],
    ["invoices", "Invoices"]
  ],
  Guest: [
    ["invitation", "Invitation"],
    ["rsvp", "RSVP"],
    ["messages", "Messages"],
    ["feedback", "Feedback"]
  ],
  "Venue Owner": [
    ["profile", "Profile"],
    ["listings", "Listings"],
    ["requests", "Requests"],
    ["bookings", "Bookings"],
    ["reports", "Reports"]
  ]
};

function statusClass(status) {
  if (["Approved", "Accepted", "Arrived", "Done", "Delivered", "Paid", "Attending", "Active"].includes(status)) return "green";
  if (["Pending", "Maybe", "Preparing", "Pending Review", "In Progress", "Out for Delivery"].includes(status)) return "amber";
  if (["Declined", "Not Attending", "Not Arrived", "Inactive"].includes(status)) return "rose";
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

function makeHash(role, page) {
  return `#/${role.toLowerCase().replaceAll(" ", "-")}/${page}`;
}

function parseHash() {
  const parts = window.location.hash.replace("#/", "").split("/");
  const role = Object.keys(rolePages).find(item => item.toLowerCase().replaceAll(" ", "-") === parts[0]) || "Organizer";
  const page = rolePages[role].some(([key]) => key === parts[1]) ? parts[1] : rolePages[role][0][0];
  return { role, page };
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function qrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
}

function floorPlanSvg(layout) {
  const items = layout.elements.map(item => {
    const x = item.x * 8;
    const y = item.y * 4;
    return `<rect x="${x - 38}" y="${y - 18}" width="76" height="36" rx="6" fill="white" stroke="#111827" stroke-width="2"/><text x="${x}" y="${y + 5}" font-family="Arial" font-size="12" text-anchor="middle" font-weight="700">${item.label}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#f8fafc"/><path d="M0 40H800M0 80H800M0 120H800M0 160H800M0 200H800M0 240H800M0 280H800M0 320H800M0 360H800M80 0V400M160 0V400M240 0V400M320 0V400M400 0V400M480 0V400M560 0V400M640 0V400M720 0V400" stroke="#d8dde5" stroke-width="1"/><text x="20" y="28" font-family="Arial" font-size="18" font-weight="700">${layout.name}</text>${items}</svg>`;
}

async function downloadServerReport() {
  const report = await api("/reports/full");
  downloadFile("comprehensive-event-report.json", JSON.stringify(report, null, 2), "application/json");
}

function CalendarView({ events, bookings }) {
  const dates = [...events.map(event => event.date), ...bookings.map(booking => booking.date)].sort();
  const firstDate = dates[0] || "2026-06-01";
  const [year, month] = firstDate.split("-").map(Number);
  const days = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  return h("div", { className: "calendar" },
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => h("strong", { key: day }, day)),
    cells.map((day, index) => {
      const date = day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
      const dayEvents = events.filter(event => event.date === date);
      const dayBookings = bookings.filter(booking => booking.date === date);
      return h("div", { key: index, className: "calendar-cell" },
        day ? h("span", null, day) : null,
        dayEvents.map(event => h("small", { key: event.id }, event.name)),
        dayBookings.map(booking => h("small", { key: booking.id }, booking.eventName))
      );
    })
  );
}

function csv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map(row => headers.map(header => escape(row[header])).join(","))].join("\n");
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

function Login({ data, setUser, refresh, setNotice }) {
  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: form.get("email"), role: form.get("role"), password: form.get("password") })
    });
    setUser(result.user);
    window.location.hash = makeHash(result.user.role, rolePages[result.user.role][0][0]);
    setNotice(`Logged in as ${result.user.name}.`);
  }

  async function register(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      role: form.get("role"),
      status: "Active",
      speciality: form.get("speciality") || "",
      company: form.get("company") || ""
    };
    payload.password = form.get("password");
    const created = await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    await refresh();
    setUser(created);
    window.location.hash = makeHash(created.role, rolePages[created.role][0][0]);
    setNotice(`Registered and logged in as ${created.name}.`);
  }

  return h("main", { className: "auth-shell" },
    h("section", { className: "auth-panel" },
      h("h1", null, "Event Management Platform"),
      h("p", { className: "muted" }, "Sign in as one of the journey actors, or register a new account for a stakeholder."),
      h("div", { className: "wide-grid" },
        h("form", { onSubmit: login, className: "panel form-stack" },
          h("h2", null, "Login"),
          h(Field, { label: "Email" }, h("input", { name: "email", type: "email", defaultValue: "mariam@events.example", required: true })),
          h(Field, { label: "Password" }, h("input", { name: "password", type: "password", defaultValue: "password123", required: true })),
          h(Field, { label: "Role" }, h("select", { name: "role", defaultValue: "Organizer" },
            Object.keys(rolePages).map(role => h("option", { key: role, value: role }, role))
          )),
          h("button", { className: "primary" }, "Login")
        ),
        h("form", { onSubmit: register, className: "panel form-stack" },
          h("h2", null, "Register"),
          h(Field, { label: "Name" }, h("input", { name: "name", required: true })),
          h(Field, { label: "Email" }, h("input", { name: "email", type: "email", required: true })),
          h(Field, { label: "Password" }, h("input", { name: "password", type: "password", required: true })),
          h(Field, { label: "Role" }, h("select", { name: "role", defaultValue: "Vendor" },
            Object.keys(rolePages).map(role => h("option", { key: role, value: role }, role))
          )),
          h(Field, { label: "Speciality" }, h("input", { name: "speciality", placeholder: "Catering, logistics, seating" })),
          h(Field, { label: "Company" }, h("input", { name: "company", placeholder: "For vendors or venue owners" })),
          h("button", { className: "primary" }, "Create account")
        )
      ),
      h("div", { className: "demo-accounts" },
        h("strong", null, "Demo accounts: "),
        data.users.map(user => h("span", { key: user.id }, `${user.role}: ${user.email}`))
      )
    )
  );
}

function AppFrame({ user, route, setRoute, setUser, notice, children }) {
  return h(React.Fragment, null,
    h("header", { className: "app-header" },
      h("div", null,
        h("h1", null, "Event Management Platform"),
        h("p", null, `${user.role} workspace for ${user.name}`)
      ),
      h("button", { onClick: () => setUser(null) }, "Logout")
    ),
    h("nav", { className: "role-tabs", "aria-label": "Journey pages" },
      rolePages[user.role].map(([page, label]) => h("a", {
        key: page,
        href: makeHash(user.role, page),
        className: route.page === page ? "active" : "",
        onClick: () => setRoute({ role: user.role, page })
      }, label))
    ),
    h("main", { className: "workspace" },
      notice ? h("div", { className: "status-line" }, notice) : null,
      children
    )
  );
}

function OrganizerPage({ page, data, refresh, setNotice }) {
  const [venueQuery, setVenueQuery] = React.useState({ location: "Cairo", minCapacity: 200, date: "2026-06-18" });
  const [taskStatus, setTaskStatus] = React.useState("");
  const [staffFilter, setStaffFilter] = React.useState("");
  const [guestFilter, setGuestFilter] = React.useState("");
  const [vendorFilter, setVendorFilter] = React.useState("");
  const [draggedElement, setDraggedElement] = React.useState(null);
  const layout = data.layouts[0];
  const venues = data.venues.filter(venue =>
    (!venueQuery.location || venue.location.toLowerCase().includes(venueQuery.location.toLowerCase())) &&
    Number(venue.capacity) >= Number(venueQuery.minCapacity || 0) &&
    !(venue.unavailableDates || []).includes(venueQuery.date)
  );
  const tasks = data.tasks.filter(task => !taskStatus || task.status === taskStatus);
  const staffMembers = data.users.filter(user =>
    user.role === "Staff" &&
    (!staffFilter || [user.speciality, user.status, user.name].join(" ").toLowerCase().includes(staffFilter.toLowerCase()))
  );
  const guests = data.guests.filter(guest =>
    !guestFilter || [guest.name, guest.rsvp, guest.dietary, guest.checkInStatus, guest.eventId].join(" ").toLowerCase().includes(guestFilter.toLowerCase())
  );
  const vendors = data.vendors.filter(vendor =>
    !vendorFilter || [vendor.name, vendor.location, vendor.supplies, vendor.status].join(" ").toLowerCase().includes(vendorFilter.toLowerCase())
  );

  async function patch(resource, id, payload, message) {
    await api(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setNotice(message);
    refresh();
  }

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

  async function createStakeholder(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/users", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        role: form.get("role"),
        speciality: form.get("speciality") || "",
        company: form.get("company") || "",
        password: form.get("password") || "password123",
        status: "Active"
      })
    });
    event.currentTarget.reset();
    setNotice("Stakeholder account created.");
    refresh();
  }

  async function createTask(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({
        eventId: form.get("eventId"),
        title: form.get("title"),
        status: "Pending",
        dueDate: form.get("dueDate"),
        assignedTo: form.get("assignedTo"),
        speciality: form.get("speciality")
      })
    });
    event.currentTarget.reset();
    setNotice("Task created.");
    refresh();
  }

  async function addBudgetItem(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/budgets", {
      method: "POST",
      body: JSON.stringify({
        eventId: form.get("eventId"),
        category: form.get("category"),
        planned: Number(form.get("planned"))
      })
    });
    event.currentTarget.reset();
    setNotice("Planned budget item added.");
    refresh();
  }

  async function addExpense(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/expenses", {
      method: "POST",
      body: JSON.stringify({
        eventId: form.get("eventId"),
        category: form.get("category"),
        description: form.get("description"),
        amount: Number(form.get("amount"))
      })
    });
    event.currentTarget.reset();
    setNotice("Actual expense recorded.");
    refresh();
  }

  async function createSourcingRequest(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/sourcingRequests", {
      method: "POST",
      body: JSON.stringify({
        vendorId: form.get("vendorId"),
        eventId: form.get("eventId"),
        items: form.get("items"),
        quantity: form.get("quantity"),
        deliveryDate: form.get("deliveryDate"),
        location: form.get("location"),
        status: "Pending",
        note: form.get("note")
      })
    });
    event.currentTarget.reset();
    setNotice("Sourcing request submitted to vendor.");
    refresh();
  }

  async function moveLayoutElement(event) {
    event.preventDefault();
    if (!draggedElement) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    const elements = layout.elements.map((item, index) => index === draggedElement ? { ...item, x, y } : item);
    await api(`/layouts/${layout.id}`, { method: "PATCH", body: JSON.stringify({ elements }) });
    setNotice("Floor plan updated.");
    setDraggedElement(null);
    refresh();
  }

  function addLayoutElement() {
    const label = window.prompt("Element label", "New table");
    if (!label) return;
    const elements = [...layout.elements, { type: "table", x: 50, y: 50, label }];
    api(`/layouts/${layout.id}`, { method: "PATCH", body: JSON.stringify({ elements }) })
      .then(() => {
        setNotice("Floor plan element added.");
        refresh();
      });
  }

  if (page === "dashboard") {
    return h("section", null,
      h("div", { className: "grid" },
        h(Metric, { label: "Today's events", value: data.summary.todaysEvents.length, detail: "Daily dashboard" }),
        h(Metric, { label: "Arrived guests", value: `${data.summary.operations.arrivedGuests}/${data.summary.operations.totalGuests}`, detail: "Day-of operations" }),
        h(Metric, { label: "Budget difference", value: `${data.summary.budget.difference.toLocaleString()} EGP`, detail: "Planned minus actual" }),
        h(Metric, { label: "Feedback", value: `${data.summary.feedback.positive}+ / ${data.summary.feedback.negative}-`, detail: "Post-event analysis" })
      ),
      h("div", { className: "wide-grid section-gap" },
        h("div", { className: "panel" },
          h("h2", null, "Upcoming Events"),
          h("div", { className: "list" }, data.summary.upcomingEvents.map(event => h(Card, {
            key: event.id,
            title: event.name,
            meta: [event.date, event.time, event.dressCode]
          }, h("p", null, event.agenda))))
        ),
        h("div", { className: "panel" },
          h("h2", null, "Task Reminders"),
          h("div", { className: "list" }, data.summary.taskReminders.map(task => h(Card, {
            key: task.id,
            title: task.title,
            meta: [task.status, task.dueDate, task.speciality]
          })))
        )
      ),
      h("section", { className: "panel section-gap" },
        h("h2", null, "Notifications"),
        h("div", { className: "list" }, data.notifications.map(notification => h(Card, {
          key: notification.id,
          title: notification.text,
          meta: [notification.read ? "Read" : "Unread"],
          actions: [
            h("button", { key: "read", onClick: () => patch("notifications", notification.id, { read: true }, "Notification marked as read.") }, "Mark read")
          ]
        })))
      )
    );
  }

  if (page === "accounts") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Create Stakeholder Accounts"),
        h("form", { onSubmit: createStakeholder, className: "form-stack" },
          h(Field, { label: "Name" }, h("input", { name: "name", required: true })),
          h(Field, { label: "Email" }, h("input", { name: "email", type: "email", required: true })),
          h(Field, { label: "Temporary password" }, h("input", { name: "password", type: "password", defaultValue: "password123", required: true })),
          h(Field, { label: "Role" }, h("select", { name: "role" },
            ["Staff", "Guest", "Vendor", "Venue Owner"].map(role => h("option", { key: role, value: role }, role))
          )),
          h(Field, { label: "Speciality" }, h("input", { name: "speciality", placeholder: "Catering, seating, logistics" })),
          h(Field, { label: "Company" }, h("input", { name: "company", placeholder: "Vendor or venue owner company" })),
          h("button", { className: "primary" }, "Create account")
        )
      ),
      h("section", { className: "panel" },
        h("h2", null, "Manage Accounts"),
        h("div", { className: "list" }, data.users.map(user => h(Card, {
          key: user.id,
          title: user.name,
          meta: [user.role, user.status, user.speciality || user.company || "Profile"],
          actions: [
            h("button", {
              key: "toggle",
              onClick: () => patch("users", user.id, { status: user.status === "Active" ? "Inactive" : "Active" }, "Account status updated.")
            }, user.status === "Active" ? "Deactivate" : "Reactivate")
          ]
        }, h("p", null, user.email))))
      )
    );
  }

  if (page === "venues") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Discover And Shortlist Venues"),
        h("div", { className: "toolbar" },
          h("input", { value: venueQuery.location, onChange: e => setVenueQuery({ ...venueQuery, location: e.target.value }), placeholder: "Location" }),
          h("input", { type: "number", value: venueQuery.minCapacity, onChange: e => setVenueQuery({ ...venueQuery, minCapacity: e.target.value }), placeholder: "Minimum capacity" }),
          h("input", { type: "date", value: venueQuery.date, onChange: e => setVenueQuery({ ...venueQuery, date: e.target.value }) })
        ),
        h("div", { className: "venue-grid" }, venues.map(venue => h(Card, {
          key: venue.id,
          title: venue.name,
          meta: [venue.location, `${venue.capacity} guests`, `${venue.pricePerDay.toLocaleString()} EGP/day`]
        },
          h("div", { className: "venue-photo" }, venue.name.split(" ").map(word => word[0]).join("")),
          h("p", null, `${venue.dimensions}. ${venue.amenities.join(", ")}`)
        )))
      ),
      h("section", { className: "panel" },
        h("h2", null, "Submit Venue Application"),
        h("form", { onSubmit: createBooking, className: "form-stack" },
          h(Field, { label: "Venue" }, h("select", { name: "venueId", required: true }, data.venues.map(venue => h("option", { key: venue.id, value: venue.id }, venue.name)))),
          h(Field, { label: "Event name" }, h("input", { name: "eventName", required: true })),
          h(Field, { label: "Type" }, h("input", { name: "eventType", required: true })),
          h(Field, { label: "Date" }, h("input", { name: "date", type: "date", required: true })),
          h(Field, { label: "Expected attendees" }, h("input", { name: "attendees", type: "number", required: true })),
          h(Field, { label: "Expected price" }, h("input", { name: "price", type: "number", required: true })),
          h(Field, { label: "Special requirements" }, h("textarea", { name: "requirements", required: true })),
          h("button", { className: "primary" }, "Submit request")
        ),
        h("h3", null, "Booking Status"),
        h("div", { className: "list" }, data.bookings.map(booking => h(Card, {
          key: booking.id,
          title: booking.eventName,
          meta: [booking.status, booking.date, `${booking.attendees} attendees`]
        })))
      )
    );
  }

  if (page === "planning") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Tasks And Team Members"),
        h("div", { className: "toolbar" },
          h("select", { value: taskStatus, onChange: e => setTaskStatus(e.target.value) },
            h("option", { value: "" }, "All task statuses"),
            ["Pending", "In Progress", "Done"].map(status => h("option", { key: status, value: status }, status))
          ),
          h("input", { value: staffFilter, onChange: e => setStaffFilter(e.target.value), placeholder: "Filter staff by speciality/status" })
        ),
        h("h3", null, "Staff"),
        h("div", { className: "list" }, staffMembers.map(user => h(Card, {
          key: user.id,
          title: user.name,
          meta: [user.status, user.speciality || "No speciality"]
        }, h("p", null, user.email)))),
        h("h3", null, "Create Task"),
        h("form", { onSubmit: createTask, className: "form-grid" },
          h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
          h(Field, { label: "Title" }, h("input", { name: "title", required: true })),
          h(Field, { label: "Due date" }, h("input", { name: "dueDate", type: "date", required: true })),
          h(Field, { label: "Speciality" }, h("input", { name: "speciality", required: true })),
          h(Field, { label: "Assign to" }, h("select", { name: "assignedTo" },
            h("option", { value: "" }, "Not yet assigned"),
            data.users.filter(user => user.role === "Staff").map(user => h("option", { key: user.id, value: user.id }, user.name))
          )),
          h("button", { className: "primary" }, "Create")
        ),
        h("h3", null, "Tasks"),
        h("div", { className: "list" }, tasks.map(task => h(Card, {
          key: task.id,
          title: task.title,
          meta: [task.status, task.speciality, task.dueDate],
          actions: [h("button", { key: "assign", onClick: () => assignTask(task.id, "user-2") }, "Assign to Omar")]
        }, h("p", null, `Assigned to: ${data.users.find(user => user.id === task.assignedTo)?.name || "Not yet assigned"}`))))
      ),
      h("section", { className: "panel" },
        h("div", { className: "section-title" },
          h("h2", null, "Digital Floor Plan"),
          h("div", { className: "actions" },
          h("button", { onClick: addLayoutElement }, "Add element"),
            h("button", { onClick: () => downloadFile("floor-plan.json", JSON.stringify(layout, null, 2), "application/json") }, "Export JSON"),
            h("button", { onClick: () => downloadFile("floor-plan.svg", floorPlanSvg(layout), "image/svg+xml") }, "Export image")
          )
        ),
        h("div", { className: "floorplan editable", onDragOver: event => event.preventDefault(), onDrop: moveLayoutElement },
          layout.elements.map((item, index) => h("div", {
            key: index,
            draggable: true,
            onDragStart: () => setDraggedElement(index),
            className: "floor-item",
            style: { left: `${item.x}%`, top: `${item.y}%` }
          }, item.label))
        ),
        h("h3", null, "Budget And Expenses"),
        h("div", { className: "split-forms" },
          h("form", { onSubmit: addBudgetItem, className: "form-stack compact-form" },
            h("h4", null, "Add planned budget"),
            h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
            h(Field, { label: "Category" }, h("input", { name: "category", required: true })),
            h(Field, { label: "Planned amount" }, h("input", { name: "planned", type: "number", required: true })),
            h("button", { className: "primary" }, "Add budget")
          ),
          h("form", { onSubmit: addExpense, className: "form-stack compact-form" },
            h("h4", null, "Record expense"),
            h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
            h(Field, { label: "Category" }, h("input", { name: "category", required: true })),
            h(Field, { label: "Description" }, h("input", { name: "description", required: true })),
            h(Field, { label: "Amount" }, h("input", { name: "amount", type: "number", required: true })),
            h("button", { className: "primary" }, "Add expense")
          )
        ),
        h("div", { className: "grid" },
          ...data.budgets.map(item => h(Card, { key: item.id, title: item.category, meta: [`${item.planned.toLocaleString()} EGP planned`] })),
          ...data.expenses.map(item => h(Card, { key: item.id, title: item.description, meta: [item.category, `${item.amount.toLocaleString()} EGP actual`] }))
        )
      )
    );
  }

  if (page === "vendors") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Vendor Directory"),
        h("input", { value: vendorFilter, onChange: e => setVendorFilter(e.target.value), placeholder: "Search vendors by name, supply, or location" }),
        h("div", { className: "list section-gap" }, vendors.map(vendor => h(Card, {
          key: vendor.id,
          title: vendor.name,
          meta: [vendor.location, vendor.status]
        }, h("p", null, `${vendor.supplies}. ${vendor.pricing}`))))
      ),
      h("section", { className: "panel" },
        h("h2", null, "Sourcing And Invoices"),
        h("form", { onSubmit: createSourcingRequest, className: "form-grid" },
          h(Field, { label: "Vendor" }, h("select", { name: "vendorId" }, data.vendors.map(vendor => h("option", { key: vendor.id, value: vendor.id }, vendor.name)))),
          h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
          h(Field, { label: "Items" }, h("input", { name: "items", required: true })),
          h(Field, { label: "Quantity" }, h("input", { name: "quantity", required: true })),
          h(Field, { label: "Delivery date" }, h("input", { name: "deliveryDate", type: "date", required: true })),
          h(Field, { label: "Location" }, h("input", { name: "location", required: true })),
          h(Field, { label: "Note" }, h("input", { name: "note", required: true })),
          h("button", { className: "primary" }, "Submit request")
        ),
        h("div", { className: "list" }, data.sourcingRequests.map(request => h(Card, {
          key: request.id,
          title: request.items,
          meta: [request.status, request.deliveryDate, request.location]
        }, h("p", null, request.note)))),
        h("div", { className: "list section-gap" }, data.invoices.map(invoice => h(Card, {
          key: invoice.id,
          title: `${Number(invoice.amount).toLocaleString()} EGP invoice`,
          meta: [invoice.status, invoice.breakdown],
          actions: [
            h("button", { key: "approve", className: "success", onClick: () => patch("invoices", invoice.id, { status: "Approved" }, "Invoice approved.") }, "Approve"),
            h("button", { key: "paid", onClick: () => patch("invoices", invoice.id, { status: "Paid" }, "Invoice marked as paid.") }, "Mark paid")
          ]
        })))
      )
    );
  }

  if (page === "guests") {
    return h("section", { className: "panel" },
      h("h2", null, "Guest Management"),
      h("input", { value: guestFilter, onChange: e => setGuestFilter(e.target.value), placeholder: "Filter guests by event, RSVP, dietary preference, or check-in status" }),
      h("div", { className: "list section-gap" }, guests.map(guest => h(Card, {
        key: guest.id,
        title: guest.name,
        meta: [guest.rsvp, guest.checkInStatus, guest.dietary, guest.invitationSent ? "Invited" : "Not invited"],
        actions: !guest.invitationSent ? [
          h("button", {
            key: "invite",
            onClick: async () => {
              await api(`/guests/${guest.id}`, { method: "PATCH", body: JSON.stringify({ invitationSent: true }) });
              await api("/outbox", {
                method: "POST",
                body: JSON.stringify({
                  type: "invitation",
                  recipientGroup: guest.email,
                  subject: "Event invitation",
                  body: `Invitation sent to ${guest.name}`,
                  status: "Queued"
                })
              });
              setNotice("Digital invitation marked as sent.");
              refresh();
            }
          }, "Send invitation")
        ] : []
      }, h("p", null, guest.email))))
    );
  }

  if (page === "operations") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Live Operations Dashboard"),
        h("div", { className: "grid" },
          h(Metric, { label: "Total guests", value: data.summary.operations.totalGuests }),
          h(Metric, { label: "Arrived guests", value: data.summary.operations.arrivedGuests }),
          h(Metric, { label: "Messages sent", value: data.messages.length })
        ),
        h("h3", null, "Communication Outbox"),
        h("div", { className: "list" }, data.outbox.map(item => h(Card, {
          key: item.id,
          title: item.subject,
          meta: [item.type, item.status, item.recipientGroup]
        }, h("p", null, item.body)))),
        h("form", { onSubmit: sendMessage, className: "form-stack" },
          h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
          h(Field, { label: "Message" }, h("textarea", { name: "body", required: true, placeholder: "Directions, schedule changes, or welcome messages" })),
          h("button", { className: "primary" }, "Send live message")
        )
      ),
      h("section", { className: "panel" },
        h("h2", null, "Message Tracking"),
        h("div", { className: "list" }, data.messages.map(message => h(Card, {
          key: message.id,
          title: message.body,
          meta: [message.status, `${message.seenBy.length} seen`],
          actions: [h("button", { key: "follow", onClick: () => setNotice("Follow-up message queued for guests who have not seen it.") }, "Send follow-up")]
        })))
      )
    );
  }

  return h("section", { className: "panel" },
    h("div", { className: "section-title" },
      h("h2", null, "Reports And Exports"),
      h("div", { className: "actions" },
        h("button", { onClick: () => downloadFile("event-costs.csv", csv([...data.budgets, ...data.expenses]), "text/csv") }, "Export costs CSV"),
        h("button", { onClick: () => downloadFile("attendance.csv", csv(data.guests), "text/csv") }, "Export attendance CSV"),
        h("button", { onClick: downloadServerReport }, "Export full report"),
        h("button", { onClick: () => window.print() }, "Print report")
      )
    ),
    h("div", { className: "grid" },
      h(Metric, { label: "Planned budget", value: `${data.summary.budget.plannedBudget.toLocaleString()} EGP` }),
      h(Metric, { label: "Actual expenses", value: `${data.summary.budget.actualExpenses.toLocaleString()} EGP` }),
      h(Metric, { label: "Attendance", value: `${data.summary.operations.arrivedGuests}/${data.summary.operations.totalGuests}` }),
      h(Metric, { label: "Positive feedback", value: data.summary.feedback.positive })
    ),
    h("div", { className: "list section-gap" }, data.feedback.map(item => h(Card, {
      key: item.id,
      title: `Guest feedback ${item.rating}/5`,
      meta: [`Food ${item.food}`, `Venue ${item.venue}`, `Organization ${item.organization}`]
    }, h("p", null, item.comments))))
  );
}

function StaffPage({ page, data, refresh, setNotice }) {
  const [status, setStatus] = React.useState("");
  const tasks = data.tasks.filter(task => task.assignedTo === "user-2" && (!status || task.status === status));

  async function patch(resource, id, payload, message) {
    await api(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setNotice(message);
    refresh();
  }

  if (page === "layout") {
    return h("section", { className: "panel" },
      h("h2", null, "Shared Digital Floor Plan"),
      h("div", { className: "floorplan" }, data.layouts[0].elements.map((item, index) =>
        h("div", { key: index, className: "floor-item", style: { left: `${item.x}%`, top: `${item.y}%` } }, item.label)
      ))
    );
  }

  if (page === "checkin") {
    return h("section", { className: "panel" },
      h("h2", null, "Guest Check-In"),
      h("div", { className: "list" }, data.guests.map(guest => h(Card, {
        key: guest.id,
        title: guest.name,
        meta: [guest.rsvp, guest.checkInStatus, guest.dietary],
        actions: guest.checkInStatus !== "Arrived" ? [
          h("button", { key: "check", className: "primary", onClick: () => patch("guests", guest.id, { checkInStatus: "Arrived" }, `${guest.name} checked in.`) }, "Check in")
        ] : []
      }, h("p", null, `QR-${guest.id.toUpperCase()}-${guest.eventId.toUpperCase()}`))))
    );
  }

  if (page === "operations") {
    return h("div", { className: "wide-grid" },
      h("section", { className: "panel" },
        h("h2", null, "Operations Dashboard"),
        h("div", { className: "grid" },
          h(Metric, { label: "Total guests", value: data.summary.operations.totalGuests }),
          h(Metric, { label: "Arrived", value: data.summary.operations.arrivedGuests })
        )
      ),
      h("section", { className: "panel" },
        h("h2", null, "Vendor Arrival Coordination"),
        h("div", { className: "list" }, data.deliveries.map(delivery => h(Card, {
          key: delivery.id,
          title: data.vendors.find(vendor => vendor.id === delivery.vendorId)?.name || delivery.vendorId,
          meta: [delivery.status],
          actions: delivery.status !== "Delivered" ? [
            h("button", { key: "arrived", onClick: () => patch("deliveries", delivery.id, { status: "Delivered" }, "Vendor arrival marked as delivered.") }, "Mark arrived")
          ] : []
        })))
      )
    ),
    h("section", { className: "panel section-gap" },
      h("h2", null, "Event Calendar"),
      h(CalendarView, { events: data.events, bookings: data.bookings })
    );
  }

  return h("section", { className: "panel" },
    h("h2", null, "Assigned Operational Tasks"),
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
        h("button", { key: "start", onClick: () => patch("tasks", task.id, { status: "In Progress" }, "Task progress updated.") }, "Start"),
        h("button", { key: "done", className: "success", onClick: () => patch("tasks", task.id, { status: "Done" }, "Task completed.") }, "Done")
      ]
    })))
  );
}

function VendorPage({ page, data, refresh, setNotice }) {
  const [deliveryFilter, setDeliveryFilter] = React.useState("");
  const deliveries = data.deliveries.filter(delivery => !deliveryFilter || delivery.status === deliveryFilter);

  async function patch(resource, id, payload, message) {
    await api(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setNotice(message);
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

  if (page === "profile") {
    return h("section", { className: "panel" },
      h("h2", null, "Vendor Profile"),
      h("div", { className: "grid" }, data.vendors.map(vendor => h(Card, {
        key: vendor.id,
        title: vendor.name,
        meta: [vendor.location, vendor.status]
      }, h("p", null, `${vendor.supplies}. ${vendor.pricing}`))))
    );
  }

  if (page === "deliveries") {
    return h("section", { className: "panel" },
      h("h2", null, "Delivery Management"),
      h("div", { className: "toolbar" },
        h("select", { value: deliveryFilter, onChange: e => setDeliveryFilter(e.target.value) },
          h("option", { value: "" }, "All delivery statuses"),
          ["Preparing", "Out for Delivery", "Delivered"].map(status => h("option", { key: status, value: status }, status))
        )
      ),
      h("div", { className: "list" }, deliveries.map(delivery => h(Card, {
        key: delivery.id,
        title: data.events.find(event => event.id === delivery.eventId)?.name || delivery.eventId,
        meta: [delivery.status],
        actions: ["Preparing", "Out for Delivery", "Delivered"].map(status =>
          h("button", { key: status, onClick: () => patch("deliveries", delivery.id, { status }, "Delivery status updated.") }, status)
        ).concat([
          h("button", {
            key: "delay",
            onClick: () => {
              const delayNote = window.prompt("Delay or schedule change note", delivery.delayNote || "Traffic delay, new ETA 30 minutes");
              if (delayNote) patch("deliveries", delivery.id, { delayNote }, "Delay note sent to organizer.");
            }
          }, "Notify delay")
        ])
      }, delivery.delayNote ? h("p", null, delivery.delayNote) : null)))
    );
  }

  if (page === "invoices") {
    return h("div", { className: "wide-grid" },
      h("form", { onSubmit: createInvoice, className: "panel form-stack" },
        h("h2", null, "Submit Invoice"),
        h(Field, { label: "Vendor" }, h("select", { name: "vendorId" }, data.vendors.map(vendor => h("option", { key: vendor.id, value: vendor.id }, vendor.name)))),
        h(Field, { label: "Event" }, h("select", { name: "eventId" }, data.events.map(event => h("option", { key: event.id, value: event.id }, event.name)))),
        h(Field, { label: "Amount" }, h("input", { name: "amount", type: "number", required: true })),
        h(Field, { label: "Breakdown" }, h("textarea", { name: "breakdown", required: true })),
        h("button", { className: "primary" }, "Submit invoice")
      ),
      h("section", { className: "panel" },
        h("h2", null, "Invoice Status"),
        h("div", { className: "list" }, data.invoices.map(invoice => h(Card, {
          key: invoice.id,
          title: `${Number(invoice.amount).toLocaleString()} EGP`,
          meta: [invoice.status, invoice.breakdown]
        })))
      )
    );
  }

  return h("section", { className: "panel" },
    h("h2", null, "Incoming Sourcing Requests"),
    h("div", { className: "list" }, data.sourcingRequests.map(request => h(Card, {
      key: request.id,
      title: request.items,
      meta: [request.status, request.deliveryDate, request.location],
      actions: [
        h("button", { key: "accept", className: "success", onClick: () => patch("sourcingRequests", request.id, { status: "Accepted" }, "Request accepted.") }, "Accept"),
        h("button", { key: "decline", className: "warn", onClick: () => patch("sourcingRequests", request.id, { status: "Declined" }, "Request declined.") }, "Decline"),
        h("button", { key: "note", onClick: () => setNotice("Clarification note sent to organizer.") }, "Send note")
      ]
    }, h("p", null, request.note))))
  );
}

function GuestPage({ page, data, refresh, setNotice }) {
  const guest = data.guests[0];
  const guestEvent = data.events.find(event => event.id === guest.eventId) || data.events[0];

  async function markMessageSeen(message) {
    const seenBy = Array.from(new Set([...(message.seenBy || []), guest.id]));
    await api(`/messages/${message.id}`, { method: "PATCH", body: JSON.stringify({ seenBy }) });
    setNotice("Message marked as seen.");
    refresh();
  }

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

  if (page === "rsvp") {
    return h("section", { className: "panel" },
      h("h2", null, "RSVP"),
      h("form", { onSubmit: updateRsvp, className: "form-stack" },
        h(Field, { label: "Response" }, h("select", { name: "rsvp", defaultValue: guest.rsvp },
          ["Attending", "Not Attending", "Maybe"].map(item => h("option", { key: item, value: item }, item))
        )),
        h(Field, { label: "Dietary preference or special requirement" }, h("input", { name: "dietary", defaultValue: guest.dietary })),
        h("button", { className: "primary" }, "Save RSVP")
      )
    );
  }

  if (page === "messages") {
    return h("section", { className: "panel" },
      h("h2", null, "Day-Of Communications"),
      h("div", { className: "list" }, data.messages.map(message => h(Card, {
        key: message.id,
        title: message.body,
        meta: [message.status, message.seenBy.includes(guest.id) ? "Seen" : "Received"],
        actions: !message.seenBy.includes(guest.id) ? [
          h("button", { key: "seen", onClick: () => markMessageSeen(message) }, "Mark seen")
        ] : []
      })))
    );
  }

  if (page === "feedback") {
    return h("section", { className: "panel" },
      h("h2", null, "Post-Event Feedback"),
      h("form", { onSubmit: submitFeedback, className: "form-grid" },
        ["rating", "food", "venue", "organization"].map(name =>
          h(Field, { key: name, label: name[0].toUpperCase() + name.slice(1) }, h("input", { name, type: "number", min: "1", max: "5", required: true }))
        ),
        h(Field, { label: "Comments" }, h("textarea", { name: "comments", required: true })),
        h("button", { className: "primary" }, "Submit feedback")
      )
    );
  }

  return h("div", { className: "wide-grid" },
    h("section", { className: "panel" },
      h("h2", null, "Invitation Details"),
      h(Card, {
        title: guestEvent.name,
        meta: [guestEvent.date, guestEvent.time, guestEvent.dressCode]
      }, h("p", null, guestEvent.agenda))
    ),
      h("section", { className: "panel" },
        h("h2", null, "Check-In Code"),
      h("div", { className: "qr-card" },
        h("img", { src: qrUrl(`guest=${guest.id};event=${guest.eventId}`), alt: "Guest check-in QR code" }),
        h("strong", null, `QR-${guest.id.toUpperCase()}-${guest.eventId.toUpperCase()}`)
      ),
      h("p", { className: "muted" }, "Present this code or your name to staff at the event entrance.")
    )
  );
}

function VenueOwnerPage({ page, data, refresh, setNotice }) {
  const [bookingFilter, setBookingFilter] = React.useState("");
  const ownerBookings = data.bookings.filter(booking => !bookingFilter || booking.status === bookingFilter);

  async function patch(resource, id, payload, message) {
    await api(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setNotice(message);
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
        unavailableDates: String(form.get("unavailableDates") || "").split(",").map(item => item.trim()).filter(Boolean),
        active: true,
        ownerId: "user-5"
      })
    });
    event.currentTarget.reset();
    setNotice("Venue listing created.");
    refresh();
  }

  async function uploadVenueFile(venue, event, field) {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const payload = field === "photos"
      ? { photos: [...(venue.photos || []), dataUrl] }
      : { floorPlanFile: dataUrl, floorPlanFileName: file.name };
    await api(`/venues/${venue.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setNotice(field === "photos" ? "Venue photo uploaded." : "Venue floor plan uploaded.");
    refresh();
  }

  if (page === "profile") {
    return h("section", { className: "panel" },
      h("h2", null, "Venue Owner Profile"),
      h(Card, { title: "Karim Youssef", meta: ["Venue Owner", "Active"] },
        h("p", null, "Company: Nile Venue Group"),
        h("p", null, "Contact: karim@venues.example")
      )
    );
  }

  if (page === "listings") {
    return h("div", { className: "wide-grid" },
      h("form", { onSubmit: createVenue, className: "panel form-stack" },
        h("h2", null, "Create Venue Listing"),
        h(Field, { label: "Name" }, h("input", { name: "name", required: true })),
        h(Field, { label: "Location" }, h("input", { name: "location", required: true })),
        h(Field, { label: "Capacity" }, h("input", { name: "capacity", type: "number", required: true })),
        h(Field, { label: "Dimensions" }, h("input", { name: "dimensions", required: true })),
        h(Field, { label: "Amenities" }, h("input", { name: "amenities", placeholder: "AV, Parking", required: true })),
        h(Field, { label: "Unavailable dates" }, h("input", { name: "unavailableDates", placeholder: "2026-07-01, 2026-07-02" })),
        h(Field, { label: "Price per day" }, h("input", { name: "pricePerDay", type: "number", required: true })),
        h("button", { className: "primary" }, "Create listing")
      ),
      h("section", { className: "panel" },
        h("h2", null, "Existing Listings"),
        h("div", { className: "list" }, data.venues.map(venue => h(Card, {
          key: venue.id,
          title: venue.name,
          meta: [venue.location, `${venue.capacity} guests`, venue.active ? "Active" : "Inactive"],
          actions: [
            h("button", { key: "toggle", onClick: () => patch("venues", venue.id, { active: !venue.active }, "Venue listing status updated.") }, venue.active ? "Deactivate" : "Reactivate"),
            h("button", {
              key: "availability",
              onClick: () => {
                const unavailableDates = window.prompt("Unavailable dates, comma separated", (venue.unavailableDates || []).join(", "));
                if (unavailableDates !== null) {
                  patch("venues", venue.id, { unavailableDates: unavailableDates.split(",").map(item => item.trim()).filter(Boolean) }, "Availability calendar updated.");
                }
              }
            }, "Set availability"),
            h("button", { key: "remove", className: "warn", onClick: () => patch("venues", venue.id, { active: false, removed: true }, "Venue listing removed from active listings.") }, "Remove")
          ]
        },
          venue.photos?.[0] ? h("img", { className: "uploaded-photo", src: venue.photos[0], alt: venue.name }) : null,
          h("p", null, `${venue.dimensions}. ${venue.amenities.join(", ")}`),
          h("div", { className: "upload-row" },
            h(Field, { label: "Upload photo" }, h("input", { type: "file", accept: "image/*", onChange: event => uploadVenueFile(venue, event, "photos") })),
            h(Field, { label: "Upload floor plan" }, h("input", { type: "file", accept: "image/*,.pdf", onChange: event => uploadVenueFile(venue, event, "floorPlanFile") }))
          ),
          venue.floorPlanFile ? h("a", { href: venue.floorPlanFile, download: venue.floorPlanFileName || "floor-plan" }, "Download uploaded floor plan") : null
        )))
      )
    );
  }

  if (page === "bookings") {
    return h("section", { className: "panel" },
      h("h2", null, "Confirmed Bookings"),
      h("div", { className: "list" }, data.bookings.filter(booking => booking.status === "Approved").map(booking => h(Card, {
        key: booking.id,
        title: booking.eventName,
        meta: [booking.date, `${booking.attendees} attendees`, `${Number(booking.price || 0).toLocaleString()} EGP`]
      }, h("p", null, booking.requirements))))
    );
  }

  if (page === "reports") {
    return h("section", { className: "panel" },
      h("div", { className: "section-title" },
        h("h2", null, "Performance And Reporting"),
        h("div", { className: "actions" },
          h("button", { onClick: () => downloadFile("venue-bookings.csv", csv(data.bookings), "text/csv") }, "Export bookings CSV"),
          h("button", { onClick: downloadServerReport }, "Export full report"),
          h("button", { onClick: () => window.print() }, "Print report")
        )
      ),
      h("div", { className: "grid" },
        h(Metric, { label: "Approved bookings", value: data.summary.venueOwner.totalBookings }),
        h(Metric, { label: "Pending requests", value: data.summary.venueOwner.pendingBookings }),
        h(Metric, { label: "Revenue", value: `${data.summary.venueOwner.revenue.toLocaleString()} EGP` })
      )
    ),
    h("section", { className: "panel section-gap" },
      h("h2", null, "Confirmed Bookings Calendar"),
      h(CalendarView, { events: [], bookings: data.bookings.filter(booking => booking.status === "Approved") })
    );
  }

  return h("section", { className: "panel" },
    h("h2", null, "Booking Requests"),
    h("div", { className: "toolbar" },
      h("select", { value: bookingFilter, onChange: e => setBookingFilter(e.target.value) },
        h("option", { value: "" }, "All booking statuses"),
        ["Pending", "Approved", "Declined"].map(status => h("option", { key: status, value: status }, status))
      )
    ),
    h("div", { className: "list" }, ownerBookings.map(booking => h(Card, {
      key: booking.id,
      title: booking.eventName,
      meta: [booking.status, booking.date, `${booking.attendees} attendees`],
      actions: [
        h("button", { key: "approve", className: "success", onClick: () => patch("bookings", booking.id, { status: "Approved" }, "Booking approved.") }, "Approve"),
        h("button", { key: "decline", className: "warn", onClick: () => patch("bookings", booking.id, { status: "Declined" }, "Booking declined.") }, "Decline"),
        h("button", { key: "counter", onClick: () => setNotice("Counter-proposal sent to organizer.") }, "Counter proposal")
      ]
    }, h("p", null, booking.requirements))))
  );
}

function App() {
  const [route, setRoute] = React.useState(parseHash());
  const [user, setUser] = React.useState(null);
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
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!data) {
    return h("main", { className: "workspace" }, h("p", null, "Loading event platform..."));
  }

  if (!user) {
    return h(React.Fragment, null,
      notice ? h("div", { className: "floating-notice" }, notice) : null,
      h(Login, { data, setUser, refresh: load, setNotice })
    );
  }

  const pageProps = { page: route.page, data, refresh: load, setNotice };
  const pages = {
    Organizer: h(OrganizerPage, pageProps),
    Staff: h(StaffPage, pageProps),
    Vendor: h(VendorPage, pageProps),
    Guest: h(GuestPage, pageProps),
    "Venue Owner": h(VenueOwnerPage, pageProps)
  };

  return h(AppFrame, { user, route, setRoute, setUser, notice }, pages[user.role]);
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
