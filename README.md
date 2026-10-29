# TicketYetu starter

A responsive ticket-sales website inspired by the supplied screenshots. Includes an event listing, ticket tiers, buyer form, M-Pesa/card selection, and an Express backend. A Render blueprint (`render.yaml`) is included for a free starter deployment.

## Important payment and security notes

- The API key shared in chat was intentionally **not** copied into this project. Treat it as exposed: revoke/rotate it with the provider that issued it.
- The provider cannot be identified reliably from the key string alone. Do not assume it works for M-Pesa or card payments.
- Checkout currently runs in **demo mode**. It does not charge money, send WhatsApp/email tickets, or generate real QR tickets.
- Do not switch off demo mode until a known provider's official API is integrated and tested.
- Never put secret keys in `public/` files, frontend JavaScript, Git, screenshots, or a public repository. Set secrets in the host's environment-variable dashboard.

## Run locally

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Keep `PAYMENT_PROVIDER=demo` until the provider integration is implemented.
4. In this folder, run:

   ```bash
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.
6. Check backend health at `http://localhost:3000/api/health`.

## Free deployment using Render

Render currently offers free web services for testing/hobby projects, with limitations: free services can spin down after 15 minutes without traffic, and local filesystem data is not persistent. Do not use this in-memory demo for real ticket sales.

1. Create a GitHub repository and upload these project files. Make sure `.env` is **not** uploaded.
2. Sign in to Render and create a **New → Blueprint** from that repository, or create a Web Service manually.
3. If creating it manually, use:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/health`
   - Plan: Free
4. Keep `PAYMENT_PROVIDER` set to `demo`.
5. After deployment, test the homepage and `/api/health`.

Render docs: https://render.com/docs/your-first-deploy and https://render.com/docs/free

## Connect a real payment provider

A real payment integration cannot be completed safely until the API provider is identified. Each provider has its own authentication, request format, callback signature, and payment-status verification.

For M-Pesa in Kenya, start with the official Safaricom Daraja portal: https://developer.safaricom.co.ke/. You'll typically need to create an app and obtain the specific credentials required for the selected API. An arbitrary API key is not enough to infer or authenticate a Daraja integration.

When the provider is known:
- Implement the checkout call server-side using environment variables.
- Use a public HTTPS callback URL.
- Verify callback authenticity and confirm payment status with the provider server-to-server.
- Mark orders paid only after verification.
- Issue QR tickets and send email/WhatsApp delivery only after confirmed payment.
- Add persistent database storage, idempotency, rate limits, admin/organizer authentication, inventory controls, refunds, terms/privacy pages, monitoring, and backups.

## Before production

- Replace the in-memory `Map` with a persistent database.
- Add request rate limiting and provider-specific callback verification.
- Use HTTPS and configure a real domain and callback URL.
- Add ticket inventory and prevent duplicate ticket issuance.
- Never collect or store card numbers directly; use the processor's hosted checkout/tokenization.
