let currentUser = null;

const STORAGE_KEY = "ipt_demo_v1";
window.db = { accounts: [], departments: [], employees: [], requests: [] };

/* ---------------- STORAGE ---------------- */

function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      window.db = data;
      return;
    }
  } catch {}

  window.db = {
    accounts: [
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "Password123!",
        role: "admin",
        verified: true
      }
    ],
    departments: [
      { id: 1, name: "Engineering" },
      { id: 2, name: "HR" }
    ],
    employees: [],
    requests: []
  };

  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* ---------------- ROUTER ---------------- */

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || "#/";
  const pageId = hash.replace("#/", "") || "home";

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const page = document.getElementById(`${pageId}-page`);
  if (!page) return navigateTo("#/");

  const protectedRoutes = ["profile", "requests"];
  const adminRoutes = ["employees", "accounts", "departments"];

  if (protectedRoutes.includes(pageId) && !currentUser) {
    return navigateTo("#/login");
  }

  if (adminRoutes.includes(pageId) && currentUser?.role !== "admin") {
    return navigateTo("#/");
  }

  page.classList.add("active");

  if (pageId === "profile") renderProfile();
  if (pageId === "verify-email") showVerifyEmail();
}

/* ---------------- AUTH ---------------- */

function setAuthState(isAuth, user = null) {
  currentUser = isAuth ? user : null;

  document.body.classList.toggle("authenticated", isAuth);
  document.body.classList.toggle("not-authenticated", !isAuth);
  document.body.classList.toggle("is-admin", user?.role === "admin");

  document.getElementById("nav-username").textContent =
    user ? user.firstName : "";
}

/* ---------------- REGISTER ---------------- */

document.getElementById("registerForm").addEventListener("submit", e => {
  e.preventDefault();
  const [fn, ln, email, pw] = e.target.querySelectorAll("input");

  if (pw.value.length < 6) return alert("Password too short");

  if (window.db.accounts.find(a => a.email === email.value)) {
    return alert("Email already exists");
  }

  window.db.accounts.push({
    firstName: fn.value,
    lastName: ln.value,
    email: email.value,
    password: pw.value,
    role: "user",
    verified: false
  });

  saveToStorage();
  localStorage.setItem("unverified_email", email.value);
  navigateTo("#/verify-email");
});

/* ---------------- VERIFY EMAIL ---------------- */

function showVerifyEmail() {
  const email = localStorage.getItem("unverified_email");
  document.getElementById("verifyMessage").textContent =
    `Verification sent to ${email}`;
}

document.getElementById("verifyBtn").addEventListener("click", () => {
  const email = localStorage.getItem("unverified_email");
  const user = window.db.accounts.find(a => a.email === email);
  if (!user) return;

  user.verified = true;
  saveToStorage();
  localStorage.removeItem("unverified_email");
  navigateTo("#/login");
});

/* ---------------- LOGIN ---------------- */

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const [email, pw] = e.target.querySelectorAll("input");

  const user = window.db.accounts.find(
    a => a.email === email.value && a.password === pw.value && a.verified
  );

  if (!user) {
    document.getElementById("loginError").textContent =
      "Invalid credentials or unverified email";
    return;
  }

  localStorage.setItem("auth_token", user.email);
  setAuthState(true, user);
  navigateTo("#/profile");
});

/* ---------------- LOGOUT ---------------- */

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("auth_token");
  setAuthState(false);
  navigateTo("#/");
});

/* ---------------- PROFILE ---------------- */

function renderProfile() {
  const el = document.getElementById("profileContent");
  el.innerHTML = `
    <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Role:</strong> ${currentUser.role}</p>
    <button class="btn btn-secondary">Edit Profile</button>
  `;
}

/* ---------------- INIT ---------------- */

loadFromStorage();

const token = localStorage.getItem("auth_token");
if (token) {
  const user = window.db.accounts.find(a => a.email === token);
  if (user) setAuthState(true, user);
}

window.addEventListener("hashchange", handleRouting);

if (!window.location.hash) navigateTo("#/");
handleRouting();
