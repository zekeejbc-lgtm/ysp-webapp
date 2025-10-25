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
    // Determine outgoing body: if req.body is already a string use it directly
    // Vercel/Next may parse JSON and provide an object; in that case stringify.
    let outgoingBody;
    if (req.method === 'GET' || req.method === 'HEAD') {
      outgoingBody = undefined;
    } else if (typeof req.body === 'string') {
      outgoingBody = req.body;
    } else if (req.rawBody && req.rawBody.length) {
      // If rawBody is available (buffer), use it as string
      outgoingBody = req.rawBody.toString();
    } else {
      outgoingBody = JSON.stringify(req.body || {});
    }

    // Basic redaction for logging (avoid printing raw passwords)
    const redact = (str) => {
      try {
        return str.replace(/"password"\s*:\s*"(.*?)"/gi, '"password":"[REDACTED]"');
      } catch (e) {
        return str;
      }
    };

    console.log('[gas-proxy] incoming headers:', req.headers);
    console.log('[gas-proxy] incoming body (redacted):', redact(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)));
    console.log('[gas-proxy] outgoingBody (redacted):', redact(outgoingBody || 'undefined'));

    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: outgoingBody,
    };

    const r = await fetch(GAS_URL, fetchOptions);
    const text = await r.text();

  console.log('[gas-proxy] GAS response status:', r.status);
  console.log('[gas-proxy] GAS response text:', text);

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
