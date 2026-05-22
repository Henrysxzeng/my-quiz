export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'Vercel KV 未配置。请在 Vercel Dashboard → Storage → KV 中创建并关联到此项目。' });
  }

  if (req.method === 'GET') {
    // Load: GET /api/sync?syncId=xxx
    const { syncId } = req.query;
    if (!syncId) return res.status(400).json({ error: '缺少 syncId 参数' });

    try {
      const resp = await fetch(`${KV_REST_API_URL}/get/quiz:${encodeURIComponent(syncId)}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
      });
      const json = await resp.json();
      return res.status(200).json({ data: json.result ? JSON.parse(json.result) : null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    // Save: POST /api/sync  body: { syncId, data }
    const { syncId, data } = req.body;
    if (!syncId || !data) return res.status(400).json({ error: '缺少 syncId 或 data' });

    try {
      await fetch(`${KV_REST_API_URL}/set/quiz:${encodeURIComponent(syncId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
        body: JSON.stringify({ value: JSON.stringify(data) })
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
