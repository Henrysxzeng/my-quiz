export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({ error: 'Upstash Redis 未配置。请在 Vercel Dashboard → Storage → 点击 Upstash → Create → Connect 到本项目。' });
  }

  if (req.method === 'GET') {
    const { syncId } = req.query;
    if (!syncId) return res.status(400).json({ error: '缺少 syncId 参数' });

    try {
      const resp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/quiz:${encodeURIComponent(syncId)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` }
      });
      if (!resp.ok) throw new Error(`Upstash responded with ${resp.status}`);
      const json = await resp.json();
      return res.status(200).json({ data: json.result ? JSON.parse(json.result) : null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { syncId, data } = req.body;
    if (!syncId || !data) return res.status(400).json({ error: '缺少 syncId 或 data' });

    try {
      const resp = await fetch(`${UPSTASH_REDIS_REST_URL}/set/quiz:${encodeURIComponent(syncId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
        body: JSON.stringify({ value: JSON.stringify(data) })
      });
      if (!resp.ok) throw new Error(`Upstash responded with ${resp.status}`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
