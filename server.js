require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

const PORT = Number(process.env.PORT || 3000);
const events = [
  {
    id: "luo-festival-2026",
    title: "Luo Festival",
    category: "Music & Culture",
    venue: "Uhuru Gardens, Nairobi",
    date: "Date to be confirmed",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80",
    description: "A full day celebrating Luo culture through music, dance, fashion, food and art.",
    tickets: [
      { id: "vip", name: "VIP", price: 3000, description: "VIP admission" },
      { id: "vvip", name: "VVIP", price: 8000, description: "Premium admission" },
      { id: "golden-circle", name: "Golden Circle", price: 100000, description: "Group package for 8" }
    ]
  },
  {
    id: "vibe-check-2026",
    title: "Vibe Check by PHXP",
    category: "Events",
    venue: "Carnivore Simba Saloon, Nairobi",
    date: "7 November 2026",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    description: "Music, friends and a big-night-out atmosphere. Check the organizer's details before purchasing.",
    tickets: [
      { id: "regular", name: "Regular", price: 2000, description: "General admission" },
      { id: "vip", name: "VIP", price: 5000, description: "VIP admission" }
    ]
  }
];

// Demo inventory only. Replace with a database before launching.
const orders = new Map();
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "TicketYetu", payments: process.env.PAYMENT_PROVIDER === "demo" ? "demo-only" : "provider-not-configured" }));
app.get("/api/events", (_req, res) => res.json(events));
app.get("/api/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ id: order.id, status: order.status, total: order.total, currency: "KES" });
});

app.post("/api/checkout", async (req, res) => {
  const { eventId, ticketId, quantity, fullName, email, phone, paymentMethod } = req.body || {};
  const event = events.find(e => e.id === eventId);
  const ticket = event?.tickets.find(t => t.id === ticketId);
  const qty = Number(quantity);

  if (!event || !ticket) return res.status(400).json({ error: "Choose a valid event and ticket." });
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: "Quantity must be 1–10." });
  if (typeof fullName !== "string" || fullName.trim().length < 2) return res.status(400).json({ error: "Enter your full name." });
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
  if (typeof phone !== "string" || phone.replace(/\D/g, "").length < 9) return res.status(400).json({ error: "Enter a valid phone number." });
  if (!["mpesa", "card"].includes(paymentMethod)) return res.status(400).json({ error: "Choose M-Pesa or card." });

  const order = {
    id: crypto.randomUUID(),
    eventId, ticketId, quantity: qty, fullName: fullName.trim(),
    email: email.trim().toLowerCase(), phone: phone.trim(), paymentMethod,
    total: ticket.price * qty, currency: "KES", status: "pending",
    createdAt: new Date().toISOString()
  };
  orders.set(order.id, order);

  // IMPORTANT: This is a safe demo response, not a real charge.
  // Implement the selected provider's server-side API and verify signed callbacks
  // before changing an order to "paid" or issuing a real ticket/QR code.
  if (process.env.PAYMENT_PROVIDER === "demo") {
    return res.status(201).json({
      orderId: order.id,
      status: "pending",
      message: "Demo checkout created. No money has been charged.",
      total: order.total,
      currency: "KES"
    });
  }

  return res.status(501).json({
    error: "Payment provider adapter is not configured.",
    message: "Add the official provider integration on the server before accepting payments."
  });
});

app.post("/api/payments/callback", (req, res) => {
  // Do not trust a callback without provider-specific signature/authentication
  // and server-to-server payment verification.
  res.status(501).json({ error: "Configure and verify the official provider callback first." });
});

app.listen(PORT, "0.0.0.0", () => console.log(`TicketYetu running on port ${PORT}`));
