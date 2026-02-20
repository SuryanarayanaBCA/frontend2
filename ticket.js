import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ✅ Correct KOYEB backend
const API_BASE = "https://wooden-rachael-individual12-647a1f57.koyeb.app";

/* ---------------- LOAD TICKET DATA ---------------- */
const ticketDataRaw = localStorage.getItem("ticketData");

if (!ticketDataRaw) {
  alert("No ticket data found. Please book again.");
  window.location.href = "./book.html";
}

const ticketData = JSON.parse(ticketDataRaw);

/* ---------------- FILL TICKET ---------------- */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "-";
}

setText("ticketId", "#" + (ticketData.ticketId || ""));
setText("userName", ticketData.email);
setText("vehicleNo", ticketData.vehicle);
setText("slotNo", ticketData.slot);
setText("date", ticketData.date);
setText("time", ticketData.time);

/* ---------------- SHOW MODAL ---------------- */
const modal = document.getElementById("ticketModal");
if (modal) modal.style.display = "flex";

/* ---------------- CLOSE ---------------- */
const closeBtn = document.getElementById("closeTicketBtn");
if (closeBtn) {
  closeBtn.onclick = () => {
    localStorage.removeItem("ticketData");
    window.location.href = "./dash.html";
  };
}

/* ---------------- PRINT ---------------- */
const printBtn = document.getElementById("printBtn");
if (printBtn) printBtn.onclick = () => window.print();

/* ---------------- AUTH TOKEN ---------------- */
let firebaseToken = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Session expired. Please login again.");
    window.location.href = "./login.html";
    return;
  }
  firebaseToken = await user.getIdToken();
});

/* ---------------- DOWNLOAD PDF ---------------- */
const downloadBtn = document.getElementById("downloadPdfBtn");

if (downloadBtn) {
  downloadBtn.onclick = async () => {
    try {
      if (!ticketData.ticketId) {
        alert("Invalid ticket ID");
        return;
      }

      if (!firebaseToken) {
        alert("Please wait... login token loading");
        return;
      }

      // ✅ use KOYEB not localhost
      const res = await fetch(
        `${API_BASE}/api/ticket-pdf/${ticketData.ticketId}`,
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PDF failed: ${res.status} ${txt.slice(0, 120)}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_${ticketData.ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("PDF download error:", err);
      alert(err.message || "PDF download failed");
    }
  };
}

/* ---------------- QR CODE ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  const qrContainer = document.getElementById("qrcode");

  // ✅ point QR to your KOYEB verify route or a frontend page
  const scanUrl = `${API_BASE}/ticket/${ticketData.ticketId}`;

  if (qrContainer && window.QRCode && ticketData.ticketId) {
    new QRCode(qrContainer, { text: scanUrl, width: 150, height: 150 });
  }
});
