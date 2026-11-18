# Wayfarer — AI Travel Itinerary Planner

Single-page Next.js app. The UI is in `app/page.tsx`. The backend API route at `app/api/itinerary/route.ts` calls the Groq API on the server, so your API key never reaches the browser.

## Setup

1. Get a free API key at https://console.groq.com/keys
2. Copy `.env.local.example` to `.env.local` and paste in your key:
   ```
   GROQ_API_KEY=gsk_...
   ```
3. Install and run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000
