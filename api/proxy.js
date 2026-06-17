const ALLOWED_HOST = 'bitter-morning-77fd.jager001.workers.dev';

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, 'https://local.invalid');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    const target = requestUrl.searchParams.get('url');
    if (!target) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'url query parameter is required' }));
      return;
    }

    const parsed = new URL(target);
    if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'target host is not allowed' }));
      return;
    }

    const upstream = await fetch(parsed.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Codex Performance Attribution Engine'
      }
    });

    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(text);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error?.message || 'proxy failed' }));
  }
}
