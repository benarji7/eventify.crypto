
const ADMIN = {
    email: "admin@eventify.com",
    password: "admin123",
    name: "Admin"
};

const KEYS = {
    users: "eventify_users_v1",
    events: "eventify_events_v1",
    registrations: "eventify_registrations_v1",
    current: "eventify_current_user_v1"
};

const starterEvents = [
    {
        id: "EV101",
        name: "Capture The Flag",
        category: "CYBERSECURITY",
        description: "Solve security puzzles and test your ethical hacking skills.",
        date: "2027-02-12",
        venue: "Lab 1",
        fee: 150,
        capacity: 40
    },
    {
        id: "EV102",
        name: "Code Sprint",
        category: "CODING",
        description: "Race against time to solve programming challenges.",
        date: "2027-02-12",
        venue: "Computer Lab",
        fee: 100,
        capacity: 50
    },
    {
        id: "EV103",
        name: "Tech Quiz",
        category: "QUIZ",
        description: "Test your technology knowledge.",
        date: "2027-02-13",
        venue: "Seminar Hall",
        fee: 50,
        capacity: 30
    },
    {
        id: "EV104",
        name: "Robo Rush",
        category: "ROBOTICS",
        description: "Build and compete with your robot.",
        date: "2027-02-13",
        venue: "Innovation Arena",
        fee: 200,
        capacity: 40
    }
];

function getData(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
    return getData(KEYS.users, []);
}

function getEvents() {
    return getData(KEYS.events, starterEvents);
}

function getRegistrations() {
    return getData(KEYS.registrations, []);
}

function getCurrentUser() {
    return getData(KEYS.current, null);
}

function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 2500);
}

function openAuth(mode) {
    document.getElementById("authSection").classList.remove("hidden");

    const signup = mode === "signup";

    document.getElementById("authTitle").textContent =
        signup ? "Create Account" : "Login";

    document.getElementById("nameField").classList.toggle("hidden", !signup);
    document.getElementById("fullName").required = signup;

    document.getElementById("authSubmit").textContent =
        signup ? "Create Account" : "Login";

    document.getElementById("authSwitch").innerHTML =
        signup
        ? 'Already registered? <button type="button" onclick="openAuth(\'login\')">Login</button>'
        : 'New here? <button type="button" onclick="openAuth(\'signup\')">Sign Up</button>';

    document.getElementById("authForm").dataset.mode = mode;

    document.getElementById("authSection").scrollIntoView({
        behavior: "smooth"
    });
}

function closeAuth() {
    document.getElementById("authSection").classList.add("hidden");
}

// LOGIN AND SIGNUP

document.getElementById("authForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const mode = this.dataset.mode;

    const email = document.getElementById("email")
        .value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    // ADMIN LOGIN
    if (email === ADMIN.email && password === ADMIN.password) {
        saveData(KEYS.current, {
            name: ADMIN.name,
            email: ADMIN.email,
            role: "admin"
        });

        closeAuth();
        updateUI();
        toast("Admin login successful");
        return;
    }

    // STUDENT SIGNUP
    if (mode === "signup") {
        const name = document.getElementById("fullName").value.trim();

        if (name.length < 2) {
            toast("Enter your full name");
            return;
        }

        const users = getUsers();

        if (users.some(user => user.email === email)) {
            toast("Email already registered");
            return;
        }

        users.push({
            name,
            email,
            password
        });

        saveData(KEYS.users, users);

        saveData(KEYS.current, {
            name,
            email,
            role: "student"
        });

        closeAuth();
        updateUI();
        toast("Account created successfully!");
    }

    // STUDENT LOGIN
    else {
        const user = getUsers().find(user =>
            user.email === email &&
            user.password === password
        );

        if (!user) {
            toast("Incorrect email or password");
            return;
        }

        saveData(KEYS.current, {
            name: user.name,
            email: user.email,
            role: "student"
        });

        closeAuth();
        updateUI();
        toast("Welcome back " + user.name);
    }
});

// LOGOUT

function logout() {
    localStorage.removeItem(KEYS.current);
    updateUI();
    toast("Logged out successfully");
}

// EVENT DISPLAY

function renderEvents() {
    const events = getEvents();
    const registrations = getRegistrations();
    const user = getCurrentUser();

    const grid = document.getElementById("eventGrid");

    grid.innerHTML = events.map((event, index) => {
        const registered = registrations.some(reg =>
            reg.eventId === event.id &&
            reg.email === user?.email
        );

        const count = registrations.filter(reg =>
            reg.eventId === event.id
        ).length;

        const seats = Math.max(0, event.capacity - count);

        const disabled =
            !user ||
            user.role !== "student" ||
            registered ||
            seats === 0;

        let label = "Register Now";

        if (!user) label = "Login to Register";
        else if (user.role === "admin") label = "Admin Account";
        else if (registered) label = "Registered";
        else if (seats === 0) label = "Sold Out";

        return `
            <div class="event-card">
                <span class="eyebrow">EVENT / ${index + 1}</span>
                <h3>${event.name}</h3>
                <p>${event.description}</p>

                <div class="event-info">
                    📅 ${event.date}<br>
                    📍 ${event.venue}<br>
                    🎟 ${seats} seats available
                </div>

                <div class="event-bottom">
                    <strong>₹${event.fee}</strong>

                    <button
                        class="${disabled ? "" : "primary"}"
                        ${disabled ? "disabled" : ""}
                        onclick="registerEvent('${event.id}')">
                        ${label}
                    </button>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("statEvents").textContent = events.length;

    document.getElementById("statSeats").textContent =
        events.reduce((total, event) => {
            const count = registrations.filter(reg =>
                reg.eventId === event.id
            ).length;

            return total + Math.max(0, event.capacity - count);
        }, 0);

    document.getElementById("statRegistrations").textContent =
        registrations.length;
}

// EVENT REGISTRATION

function registerEvent(eventId) {
    const user = getCurrentUser();

    if (!user) {
        openAuth("login");
        return;
    }

    if (user.role !== "student") return;

    const events = getEvents();

    const event = events.find(e => e.id === eventId);

    if (!event) return;

    const registrations = getRegistrations();

    const alreadyRegistered = registrations.some(reg =>
        reg.eventId === eventId &&
        reg.email === user.email
    );

    if (alreadyRegistered) {
        toast("Already registered!");
        return;
    }

    const count = registrations.filter(reg =>
        reg.eventId === eventId
    ).length;

    if (count >= event.capacity) {
        toast("Event is full!");
        return;
    }

    registrations.push({
        id: "REG" + Date.now(),
        eventId,
        eventName: event.name,
        name: user.name,
        email: user.email,
        payment: "Pending"
    });

    saveData(KEYS.registrations, registrations);

    updateUI();

    toast("Registration successful!");
}

// STUDENT DASHBOARD

function renderStudent() {
    const user = getCurrentUser();

    if (!user || user.role !== "student") return;

    document.getElementById("studentName").textContent = user.name;

    const registrations = getRegistrations().filter(reg =>
        reg.email === user.email
    );

    document.getElementById("myRegistrations").innerHTML =
        registrations.length
        ? `
            <table>
                <tr>
                    <th>EVENT</th>
                    <th>REGISTRATION ID</th>
                    <th>PAYMENT</th>
                </tr>

                ${registrations.map(reg => `
                    <tr>
                        <td>${reg.eventName}</td>
                        <td>${reg.id}</td>
                        <td class="status">${reg.payment}</td>
                    </tr>
                `).join("")}
            </table>
        `
        : "<p>No registrations yet.</p>";
}

// ADMIN DASHBOARD

function renderAdmin() {
    const users = getUsers();
    const events = getEvents();
    const registrations = getRegistrations();

    document.getElementById("adminStudents").textContent = users.length;
    document.getElementById("adminEvents").textContent = events.length;
    document.getElementById("adminRegs").textContent = registrations.length;

    document.getElementById("adminPaid").textContent =
        registrations.filter(reg => reg.payment === "Paid").length;

    document.getElementById("adminEventList").innerHTML = `
        <table>
            <tr>
                <th>EVENT</th>
                <th>FEE</th>
                <th>ACTION</th>
            </tr>

            ${events.map(event => `
                <tr>
                    <td>${event.name}</td>
                    <td>₹${event.fee}</td>
                    <td>
                        <button onclick="deleteEvent('${event.id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join("")}
        </table>
    `;

    document.getElementById("adminRegistrationList").innerHTML =
        registrations.length
        ? `
            <table>
                <tr>
                    <th>STUDENT</th>
                    <th>EMAIL</th>
                    <th>EVENT</th>
                    <th>PAYMENT</th>
                    <th>ACTION</th>
                </tr>

                ${registrations.map(reg => `
                    <tr>
                        <td>${reg.name}</td>
                        <td>${reg.email}</td>
                        <td>${reg.eventName}</td>
                        <td>${reg.payment}</td>
                        <td>
                            <button onclick="togglePayment('${reg.id}')">
                                ${reg.payment === "Paid" ? "Set Pending" : "Mark Paid"}
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        `
        : "<p>No registrations yet.</p>";
}

// ADD EVENT

document.getElementById("eventForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (getCurrentUser()?.role !== "admin") return;

    const events = getEvents();

    events.push({
        id: "EV" + Date.now(),
        name: document.getElementById("eventName").value.trim(),
        category: "NEW EVENT",
        description: "A new CRYPTONIX 2027 event.",
        date: document.getElementById("eventDate").value,
        venue: document.getElementById("eventVenue").value.trim(),
        fee: Number(document.getElementById("eventFee").value),
        capacity: Number(document.getElementById("eventCapacity").value)
    });

    saveData(KEYS.events, events);

    this.reset();

    updateUI();
    toast("Event added successfully!");
});

// DELETE EVENT

function deleteEvent(id) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    saveData(
        KEYS.events,
        getEvents().filter(event => event.id !== id)
    );

    saveData(
        KEYS.registrations,
        getRegistrations().filter(reg => reg.eventId !== id)
    );

    updateUI();
    toast("Event deleted!");
}

// UPDATE PAYMENT

function togglePayment(id) {
    const registrations = getRegistrations();

    const registration = registrations.find(reg => reg.id === id);

    if (!registration) return;

    registration.payment =
        registration.payment === "Paid" ? "Pending" : "Paid";

    saveData(KEYS.registrations, registrations);

    updateUI();
    toast("Payment updated!");
}

// UPDATE WEBSITE BASED ON LOGIN

function updateUI() {
    const user = getCurrentUser();

    const isAdmin = user?.role === "admin";
    const isStudent = user?.role === "student";

    document.getElementById("loginNav").classList.toggle("hidden", !!user);
    document.getElementById("signupNav").classList.toggle("hidden", !!user);
    document.getElementById("logoutNav").classList.toggle("hidden", !user);

    document.getElementById("studentDashboard")
        .classList.toggle("hidden", !isStudent);

    document.getElementById("adminDashboard")
        .classList.toggle("hidden", !isAdmin);

    renderEvents();

    if (isStudent) renderStudent();
    if (isAdmin) renderAdmin();
}

// INITIALIZE WEBSITE

if (!localStorage.getItem(KEYS.events)) {
    saveData(KEYS.events, starterEvents);
}

if (!localStorage.getItem(KEYS.users)) {
    saveData(KEYS.users, []);
}

if (!localStorage.getItem(KEYS.registrations)) {
    saveData(KEYS.registrations, []);
}

updateUI();
