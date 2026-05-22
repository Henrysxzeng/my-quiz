export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rule, reference, user_answer } = req.body;

  if (!rule || !reference || !user_answer) {
    return res.status(400).json({ error: '缺少 rule / reference / user_answer 参数' });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: '服务器未配置 DEEPSEEK_API_KEY 环境变量' });
  }

  const prompt = `你是一个严谨的软件测试专家。请根据验证规则和参考答案，判断用户设计的测试用例是否合理和完整。

评分标准（1-5分）：
- 5分：测试用例设计全面，覆盖了等价类划分、边界值分析等常用方法，与参考答案高度一致
- 4分：测试用例基本完整，但缺少个别边界情况或用例描述不够精确
- 3分：覆盖了主要场景但有明显遗漏（如缺少边界值测试、等价类覆盖不全）
- 2分：测试用例较少，大部分场景未覆盖
- 1分：完全错误或空白

判题规则：
- 重点考察是否覆盖了边界值（最小值、最大值、临界值）
- 是否包含正常输入、异常输入、空值测试
- 等价类划分是否合理
- 测试描述是否清晰、预期结果是否明确

返回严格 JSON（不要加 \`\`\`json 标记）：
{"score":1-5,"correct":true/false,"feedback":"简短评语","fix":"如果遗漏了测试场景，给出补充建议；如果正确，空字符串","knowledge":["知识点1","知识点2"]}`;

  try {
    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `验证规则：${rule}\n参考答案：\n${reference}\n用户答案：\n${user_answer}` }
        ],
        temperature: 0.1,
        max_tokens: 800
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return res.status(502).json({ error: `DeepSeek API 错误 (${aiResponse.status}): ${errText.slice(0, 200)}` });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content.trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: `服务器错误: ${err.message}` });
  }
}
