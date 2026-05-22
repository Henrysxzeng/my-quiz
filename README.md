# 📝 My Quiz — 刷题学习网站

一个集选择题、SQL 刷题、Java 调试、软件测试和 UML 建模于一体的多功能学习平台，部署于 [Vercel](https://vercel.com)。

## 功能模块

| 模块 | 说明 |
|------|------|
| 📝 **选择题** | 分章节答题，支持错题本、章节进度追踪、随机/顺序模式 |
| 💾 **SQL 刷题** | 手写 SQL 语句，AI 自动评分（DeepSeek），错题本 + 知识点总结 |
| ☕ **Java 调试题** | 5 道代码调试题目，IDE 风格语法高亮，编号标注修改点 |
| 🧪 **软件测试题** | 等价类划分/边界值测试，可编辑表格，AI 评分，错题本 |
| 📐 **UML 建模题** | 10 道 UML 图题目，Mermaid.js 渲染类图/E-R 图/状态图/活动图/用例图 |

## 技术栈

- **前端**：Vanilla HTML/CSS/JS，单页面应用
- **后端**：Vercel Serverless Functions（`api/` 目录）
- **AI 评分**：DeepSeek API（`deepseek-chat` 模型）
- **UML 渲染**：[Mermaid.js](https://mermaid.js.org/)
- **数据存储**：localStorage（支持导出/导入 JSON 存档实现跨设备迁移）

## 项目结构

```
├── index.html          # 主页面（~2600 行）
├── data.js             # 选择题题库数据
├── package.json        # Vercel 项目配置
├── api/
│   ├── grade-sql.js    # SQL 题目 AI 评分
│   ├── grade-testing.js # 软件测试题 AI 评分
│   └── sync.js         # KV 同步接口（备用，当前未使用）
└── .gitignore
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，用于 AI 评分功能 |

在 Vercel 控制台 → Settings → Environment Variables 中设置。

## 本地运行

```bash
# 安装 Vercel CLI
npm i -g vercel

# 启动开发服务器
vercel dev
```

然后访问 `http://localhost:3000`。

## 数据迁移

点击页面顶部的 📤 导出存档 按钮可将错题本、章节进度等数据导出为 JSON 文件，在新设备上通过 📥 导入存档 恢复。

## License

MIT
