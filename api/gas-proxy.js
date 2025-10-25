// Vercel serverless function that proxies requests to the Google Apps Script
// This avoids CORS issues by keeping requests same-origin to your Vercel app.
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyepq64QJEfXRzACKaXGSevEXdb-TueUaxtnTEQCnnFsECZGq1AWqNqyKZ9GeMmvcao2g/exec';

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      // forward the body for POST/PUT
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    };

    const r = await fetch(GAS_URL, fetchOptions);
    const text = await r.text();

    // Mirror status and set CORS headers for browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(r.status).send(text);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ success: false, message: 'Proxy error', error: String(err) });
  }
}
