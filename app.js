const money = n => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n).replace("Ksh", "KES");
const grid = document.querySelector("#eventsGrid");
const dialog = document.querySelector("#checkoutDialog");
const form = document.querySelector("#checkoutForm");
const ticketSelect = document.querySelector("#ticketSelect");
let eventData = [];
let selectedEvent = null;

document.querySelector("#menuBtn").addEventListener("click", () => document.querySelector("#nav").classList.toggle("hidden"));
document.querySelector("#closeDialog").addEventListener("click", () => dialog.close());

async function loadEvents() {
  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("Could not load events");
    eventData = await response.json();
    document.querySelector("#eventCount").textContent = `${eventData.length} featured events`;
    grid.innerHTML = eventData.map(event => `
      <article class="event-card">
        <img class="event-image" src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" loading="lazy">
        <div class="event-info">
          <div class="event-top"><span class="tag">${escapeHtml(event.category)}</span><span class="muted">${escapeHtml(event.date)}</span></div>
          <h3>${escapeHtml(event.title)}</h3>
          <div class="muted">📍 ${escapeHtml(event.venue)}</div>
          <p>${escapeHtml(event.description)}</p>
          <div class="event-bottom"><span class="price">from ${money(Math.min(...event.tickets.map(t => t.price)))}</span><button class="buy" data-event="${escapeHtml(event.id)}">Get tickets ↗</button></div>
        </div>
      </article>`).join("");
    grid.querySelectorAll("[data-event]").forEach(button => button.addEventListener("click", () => openCheckout(button.dataset.event)));
  } catch {
    grid.innerHTML = "<p>Events could not load. Please refresh and try again.</p>";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function openCheckout(id) {
  selectedEvent = eventData.find(event => event.id === id);
  if (!selectedEvent) return;
  document.querySelector("#checkoutTitle").textContent = selectedEvent.title;
  document.querySelector("#checkoutVenue").textContent = `${selectedEvent.venue} · ${selectedEvent.date}`;
  ticketSelect.innerHTML = selectedEvent.tickets.map(ticket => `<option value="${escapeHtml(ticket.id)}">${escapeHtml(ticket.name)} — ${money(ticket.price)}</option>`).join("");
  document.querySelector("#checkoutMessage").textContent = "";
  document.querySelector("#checkoutMessage").className = "message";
  updateTotal();
  dialog.showModal();
}
function updateTotal() {
  if (!selectedEvent) return;
  const ticket = selectedEvent.tickets.find(t => t.id === ticketSelect.value) || selectedEvent.tickets[0];
  const qty = Math.min(10, Math.max(1, Number(document.querySelector("#quantity").value) || 1));
  document.querySelector("#quantity").value = qty;
  document.querySelector("#total").textContent = money(ticket.price * qty);
}
ticketSelect.addEventListener("change", updateTotal);
document.querySelector("#quantity").addEventListener("input", updateTotal);

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!selectedEvent) return;
  const button = document.querySelector("#payBtn");
  const message = document.querySelector("#checkoutMessage");
  button.disabled = true;
  button.textContent = "Processing…";
  message.className = "message";
  message.textContent = "";
  const payload = {
    eventId: selectedEvent.id,
    ticketId: ticketSelect.value,
    quantity: Number(document.querySelector("#quantity").value),
    fullName: document.querySelector("#fullName").value.trim(),
    email: document.querySelector("#email").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    paymentMethod: new FormData(form).get("paymentMethod")
  };
  try {
    const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || "Checkout failed");
    message.className = "message success";
    message.textContent = `${result.message} Reference: ${result.orderId}. Connect a verified payment provider before using this for real sales.`;
  } catch (error) {
    message.className = "message error";
    message.textContent = error.message || "Could not start checkout.";
  } finally {
    button.disabled = false;
    button.textContent = "Continue to payment";
  }
});
loadEvents();
