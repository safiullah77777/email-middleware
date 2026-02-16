import 'dotenv/config';
import express from 'express';
import { createClient } from '@sanity/client';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.all('/middleware/submit-to-store', (req, res, next) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

/**
 * POST /middleware/submit-to-store
 * Body: { projectId?, formId, payload, sourceUrl? }
 * Creates a formSubmission document in the configured Sanity project.
 */
app.post('/middleware/submit-to-store', async (req, res) => {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  console.log(projectId, dataset, token);

  if (!projectId || !dataset || !token) {
    return res.status(500).json({
      error: 'Server misconfiguration',
      detail: 'SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_TOKEN must be set',
    });
  }

  const body = req.body || {};
  const formId = body.formId;
  const payload = body.payload;

  if (formId == null || payload == null) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'formId and payload are required',
    });
  }

  const clientProjectId = body.projectId ?? '';
  const sourceUrl = body.sourceUrl ?? '';

  const client = createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: '2024-01-01',
  });

  try {
    const doc = await client.create({
      _type: 'formSubmission',
      projectId: clientProjectId,
      formId: String(formId),
      submittedAt: new Date().toISOString(),
      sourceUrl: String(sourceUrl),
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    });
    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('Sanity create error:', err);
    res.status(500).json({
      error: 'Failed to store submission',
      detail: err.message || String(err),
    });
  }
});
app.get('/', (req, res) => {
  res.json({ 
    message: `Hello World`,
    url: process.env.VERCEL_URL,
    domain: process.env.DOMAIN || 'not set',
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'not set',
    token: process.env.SANITY_API_TOKEN ? '********' : 'not set',
   });
});
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`POST http://localhost:${PORT}/middleware/submit-to-store`);
  });
}

export default app;
