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

  const { question, standard_answer, user_answer } = req.body;

  if (!question || !standard_answer || !user_answer) {
    return res.status(400).json({ error: '缺少 question / standard_answer / user_answer 参数' });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: '服务器未配置 DEEPSEEK_API_KEY 环境变量' });
  }

  const prompt = `你是一个严谨的 SQL 判题专家。请根据题目要求和标准答案，判断用户的 SQL 语句是否能实现相同功能。

评分标准（1-5分）：
- 5分：功能完全正确，写法规范，甚至有优化
- 4分：功能正确但有小瑕疵（如多余子查询、命名不规范）
- 3分：思路正确但语法有误，或者漏了部分条件
- 2分：方向大概对但整体语法错得比较多
- 1分：完全错误或空白

判题规则：
- 忽略大小写差异
- 忽略多余空格和换行
- 同等效果的函数/语法视为正确（如 INNER JOIN 和 JOIN，IN 和 = ANY）
- 表名/列名别名不影响功能判断
- 多解法的，只要功能一致就视为正确

返回严格 JSON（不要加 \`\`\`json 标记）：
{"score":1-5,"correct":true/false,"feedback":"简短评语","fix":"如果错了，给出修改建议；如果正确，空字符串","knowledge":["知识点1","知识点2"]}`;

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
          { role: 'user', content: `题目：${question}\n标准答案：${standard_answer}\n用户答案：${user_answer}` }
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

    // Try to parse the JSON response from DeepSeek
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Sometimes DeepSeek wraps in markdown code blocks
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: `服务器错误: ${err.message}` });
  }
}
