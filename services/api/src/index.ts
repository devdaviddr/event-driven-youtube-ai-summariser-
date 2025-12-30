import { Hono } from 'hono';
import { Client } from 'pg';

const app = new Hono();
const db = new Client(process.env.DATABASE_URL);

app.get('/channels', async (c) => {
  // TODO: fetch channels from DB
  return c.json({ channels: [] });
});

app.post('/channels', async (c) => {
  // TODO: subscribe channel, emit event
  return c.json({ message: 'Channel subscribed' });
});

app.get('/videos', async (c) => {
  // TODO: fetch videos with summaries
  return c.json({ videos: [] });
});

async function main() {
  await db.connect();
  console.log('API started on port 3000');
  // In production, use a server like node:http
}

export default app;