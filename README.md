# ⚡ AI 公益中转导航 · 专属邀请码推广聚合站

> 一个专为 AI 爱好者与站长打造的**超高颜值、极致现代化**的公益中转站与专属邀请链接（Affiliate）分享平台。

---

## ✨ 核心亮点

- 🎨 **极客科技视觉**：深色赛博毛玻璃美学（Cyber Glassmorphism）搭配流光粒子，支持深色/浅色模式平滑切换。
- 💰 **高转化率设计**：三段式拆解福利（注册即赠、专属加赠、每日签到），一键直达注册 + 复制邀请码/链接，自带 Toast 交互气泡。
- 📊 **动态统计看板**：自动汇总收录站点数、可用站点、累计可领新手额度（$400+）、每日签到额度。
- 🔍 **多维检索系统**：支持实时模糊搜索（按 `/` 键快速聚焦）、分类标签筛选、多种排序规则。
- 📖 **新手小白指引**：内置 Cherry Studio、NextChat、Chatbox、Cursor 等常用客户端快速接入步骤与手风琴常见问题 FAQ。
- 🚀 **极简维护与扩展**：数据完全解耦，添加或修改站点只需在 `js/data.js` 或 `data/sites.json` 中添加一个 JSON 对象。
- 📦 **零构建依赖**：纯原生 HTML5 / CSS3 / ES6+，无需 Node.js / npm 构建，双击或直接托管即可上线！

---

## 📂 项目目录结构

```
Demo/
├── index.html          # 页面主体结构（SEO 友好、语义化 HTML5）
├── css/
│   └── style.css       # 纯原生现代化 CSS 变量、毛玻璃与动效系统
├── js/
│   ├── data.js         # 默认站点数据与配置（离线/本地运行双重保障）
│   └── app.js          # 核心交互逻辑（搜索、筛选、排序、复制、公告）
├── data/
│   └── sites.json      # 独立 JSON 数据文件（便于服务器动态维护）
└── README.md           # 项目使用与部署说明
```

---

## 🛠️ 如何添加 / 修改新的邀请站点？

打开 [`js/data.js`](file:///c:/Users/19904/Desktop/newplan/Demo/js/data.js)（或 [`data/sites.json`](file:///c:/Users/19904/Desktop/newplan/Demo/data/sites.json)），在 `window.DEFAULT_SITES` 数组中复制以下模板并粘贴到列表末尾即可：

```javascript
{
  id: "newsite",                         // 唯一标识（英文字母）
  name: "新中转站名称",                    // 站点名称
  domain: "newsite.com",                 // 站点主域名
  link: "https://newsite.com/sign-up?aff=YOUR_CODE", // 你的专属邀请链接
  affCode: "YOUR_CODE",                  // 你的专属邀请码
  registerBonus: "$100",                 // 注册赠送额度文案
  inviteBonus: "+$20 邀请奖励",           // 邀请码专属加赠文案
  dailyBonus: "$20 / 每日签到",           // 每日签到文案
  bonusValue: 120,                       // 奖励数值（用于统计与高额度排序）
  dailyValue: 20,                        // 每日签到数值
  tags: ["每日签到", "超大额度", "深度思考"], // 分类标签
  desc: "简短介绍该站点的特色优势与支持的模型。",
  recommend: "站长的一句话推荐理由（将以高亮气泡展示）",
  status: "active",                      // 状态: 'active' (正常) 或 'inactive' (已失效)
  badge: "🔥 热门推荐",                   // 右上角特色徽章 (可选)
  pinned: false,                         // 是否置顶 (true / false)
  urgent: false,                         // 是否加急高亮显示 (true / false)
  icon: "⚡",                            // 图标 Emoji (如 ⚡, 🔮, 🚀, 🧠, 💎)
  color: "linear-gradient(135deg, #6366f1, #38bdf8)", // 图标背景渐变色
  date: "2026-08-20"                     // 收录日期 (7天内自动显示 NEW 徽章)
}
```

---

## 🚀 免费一键上线部署指南 (2分钟极速上线)

由于本项目为纯静态前端项目，你可以**完全免费**托管在以下任意平台：

### 方案 1：Cloudflare Pages（推荐，国内访问极速且免备案）
1. 注册/登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**（或直接点击 **Upload assets** 拖拽整个 Demo 文件夹上传）。
3. 构建设置为默认（无需任何构建命令，输出目录选根目录即可）。
4. 点击部署，10 秒内即可获得一个全球 CDN 加速的 `*.pages.dev` 免费域名，支持绑定你自己的个性域名。

### 方案 2：GitHub Pages
1. 将本项目推送到你的 GitHub 仓库。
2. 进入仓库的 **Settings** -> **Pages**。
3. 在 **Branch** 处选择 `main`（或 `master`）分支，目录选择 `/ (root)`，点击 **Save**。
4. 稍等 1 分钟即可通过 `https://<你的用户名>.github.io/<仓库名>/` 访问。

### 方案 3：Vercel
1. 访问 [Vercel](https://vercel.com/) 并导入你的 Git 仓库。
2. Framework Preset 选择 **Other**，直接点击 **Deploy** 即可。

---

## ⚙️ 个性化站长配置

在 [`js/data.js`](file:///c:/Users/19904/Desktop/newplan/Demo/js/data.js) 顶部的 `DEFAULT_CONFIG` 中，你可以自由修改：
- `siteName`: 网站名称（如：`AI 公益中转导航`）
- `heroTitle`: 首页大标题
- `heroSub`: 首页副标题与免责引导
- `noticeTitle` & `noticeContent`: 弹窗公告标题与内容
- `noticeVersion`: 公告版本号（递增如改为 `2`，之前关闭过的访客会重新看到新公告）
