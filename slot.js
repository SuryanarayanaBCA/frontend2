// login.js (FULL CORRECTED – MOBILE + DESKTOP FRIENDLY, REDIRECT ONLY)

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("✅ login.js loaded");

/* ---------- CONFIG ---------- */
const ADMIN_EMAILS = ["admin@system.com"];

/* ---------- ELEMENTS ---------- */
const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("error-msg");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const forgotPasswordLink = document.getElementById("forgotPassword");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

/* ---------- SMALL HELPER ---------- */
function showError(msg) {
  if (!errorMsg) return;
  errorMsg.style.color = "red";
  errorMsg.textContent = msg || "";
}

function showSuccess(msg) {
  if (!errorMsg) return;
  errorMsg.style.color = "green";
  errorMsg.textContent = msg || "";
}

/* ---------- ADMIN / USER REDIRECT ---------- */
async function handleRedirect(user) {
  try {
    const email = (user?.email || "").toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(email);

    localStorage.setItem("isAdmin", isAdmin ? "true" : "false");

    if (isAdmin) {
      window.location.replace("./admin.html");
    } else {
      window.location.replace("./dash.html");
    }
  } catch (err) {
    console.error("Redirect handling error:", err);
    showError("Login successful, but redirect failed.");
  }
}

/* ---------- EMAIL LOGIN ---------- */
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
      );

      await handleRedirect(userCred.user);
    } catch (err) {
      console.error("Email login error:", err);
      // show a little more useful message
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        showError("Invalid email or password.");
      } else if (err.code === "auth/invalid-email") {
        showError("Invalid email format.");
      } else {
        showError(err.code || "Login failed.");
      }
    }
  });
}

/* ---------- FORGOT PASSWORD ---------- */
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    showError("");

    const email = emailInput.value.trim();
    if (!email) {
      showError("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset link sent to your email.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        showError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        showError("Invalid email address.");
      } else {
        showError(err.code || "Failed to send reset email.");
      }
    }
  });
}

/* ---------- GOOGLE LOGIN (REDIRECT ONLY – WORKS ON MOBILE) ---------- */
const provider = new GoogleAuthProvider();

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    showError("");
    try {
      // ✅ Use redirect for BOTH mobile & desktop (most reliable)
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error("Google login failed:", err);
      showError(err.code || "Google login failed.");
    }
  });
}

/* ---------- HANDLE GOOGLE REDIRECT RESULT ---------- */
window.addEventListener("load", async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await handleRedirect(result.user);
    }
  } catch (err) {
    console.error("Redirect login error:", err);
    // ignore "no event" (normal if user didn't click google login)
    if (err.code && err.code !== "auth/no-auth-event") {
      showError(err.code || "Google login failed.");
    }
  }
});
