# email-middleware

Express server that receives form submissions from any frontend and creates `formSubmission` documents in your **store-emails** Sanity project. Runs as a normal Node server locally and as a serverless app on Vercel.

## Flow

1. Frontend sends `POST` to this app with `{ projectId, formId, payload, sourceUrl }`.
2. This app creates a Sanity document: `_type: 'formSubmission'` with fixed metadata and `payload` stored as a JSON string.
3. Submissions appear in your Sanity Studio.

## Environment variables (Vercel)

Set these in your Vercel project (**Settings → Environment Variables**):

| Variable | Description |
|----------|-------------|
| `SANITY_PROJECT_ID` | Store-emails Sanity project ID |
| `SANITY_DATASET` | Dataset (e.g. `production`) |
| `SANITY_API_TOKEN` | Token with **write** access (create under Project → API → Tokens) |

## Run locally

```bash
npm install
npm run dev   # with auto-reload (Node --watch)
# or
npm start     # node server.js
```

Server runs at **http://localhost:3333** (or `PORT` env). Your frontend can use `STORE_EMAILS_API_URL=http://localhost:3333/middleware/submit-to-store`.

## Endpoints

- **GET** `/health` — health check (`{ "ok": true }`)
- **POST** `/middleware/submit-to-store` — submit form data.
- **Body:** `application/json`

```json
{
  "projectId": "coutts-electrical",
  "formId": "contact",
  "payload": { "name": "Jane", "email": "jane@example.com", "message": "Hello" },
  "sourceUrl": "https://example.com/contact"
}
```

- **Required:** `formId`, `payload`
- **Optional:** `projectId` (default `""`), `sourceUrl` (default `""`)

**Success:** `201` with `{ "ok": true, "id": "<sanity-doc-id>" }`  
**Errors:** `400` (bad body), `405` (not POST), `500` (config or Sanity error)

## Frontend usage

In your frontend app set:

- `STORE_EMAILS_API_URL` = your deployed URL, e.g. `https://your-app.vercel.app/middleware/submit-to-store`
- `STORE_EMAILS_PROJECT_ID` = client/site identifier (e.g. `coutts-electrical`) if you use it in the payload

Then call `sendToStore({ formId, payload, sourceUrl })` as in your example; the middleware will create the Sanity document.

## Deploy on Vercel

1. Install dependencies: `npm install`
2. Connect the repo to Vercel and set the env vars above.
3. Deploy: `vercel` or push to the connected branch.

**Vercel:** The same Express app is wrapped as a serverless function in `api/index.js`; rewrites in `vercel.json` send `/middleware/submit-to-store` and `/health` to it. Local dev is the normal Express server (`npm run dev`).
