export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!API_URL || !API_TOKEN) {
    return res.status(500).json({ error: 'Redis 未配置' });
  }

  if (req.method === 'GET') {
    const { syncId } = req.query;
    if (!syncId) return res.status(400).json({ error: '缺少 syncId' });

    const key = 'quizdata-' + encodeURIComponent(syncId);
    try {
      const resp = await fetch(API_URL + '/get/' + key, {
        headers: { Authorization: 'Bearer ' + API_TOKEN }
      });
      if (!resp.ok) {
        return res.status(502).json({ error: 'Upstash GET error ' + resp.status });
      }
      const json = await resp.json();
      // Upstash returns {"result": "string"}
      if (!json.result) {
        return res.status(200).json({ data: null });
      }
      const data = JSON.parse(json.result);
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: 'GET error: ' + err.message });
    }
  }

  if (req.method === 'POST') {
    const { syncId, data } = req.body;
    if (!syncId || !data) return res.status(400).json({ error: '缺少 syncId 或 data' });

    const key = 'quizdata-' + encodeURIComponent(syncId);
    try {
      const resp = await fetch(API_URL + '/set/' + key, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(data) })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return res.status(502).json({ error: 'Upstash SET error ' + resp.status + ': ' + txt.slice(0, 100) });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'SET error: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
