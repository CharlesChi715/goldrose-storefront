# GoldRose Tester Guide

Welcome! You are looking at the testing version of the GoldRose store. This
page explains what you can do and how the forum works. Nothing here involves
real money.

## Getting in

- On the login page, click **"Need an account? Request access"** and sign up
  with a **nickname**, your email, and a password (8+ characters).
- The owner approves new accounts — until then, logging in shows "awaiting
  approval." Ping the owner if you're waiting.
- Your nickname is bound to your account and is automatically your name on
  the forum — you never retype it.
- Forgot your password? Use the **"Forgot password?"** link on the login page.

## The admin (this dashboard)

- Everything is open for testing: Orders, Products, Customers, Analytics,
  Discounts, Settings — click around freely.
- The store data is demo data. You cannot break anything real.

## The storefront (the shop itself)

- Visit the home page, the shop page, and the product pages like a customer
  would.
- Try the full checkout! Payments are simulated — no card is charged, ever.

## The forum

- Open **Forum** in the left menu.
- **Start a discussion** with a title and message — bugs, questions, ideas,
  opinions, anything.
- **Reply** to any thread at the bottom of its page.
- **Edit** appears on your own posts (posts made under your nickname). Edited
  posts show an "edited" mark.
- **Delete** is open to everyone during testing — please only delete your own
  posts.
- **New messages**: the Forum item in the left menu shows how many messages
  you haven't read, and each thread in the list carries an "n new" badge.
  Opening a thread marks it read. The count is remembered per browser, so a
  new device starts with everything unread; your own posts never count.

## Reporting bugs and ideas

- Post them on the forum, or
- Use the chat bubble in the corner of the storefront — those messages go to
  the owner's Ideas inbox.

## Good to know

- The live site now runs on the real database, so your data (orders, forum
  posts) persists. It is still all test data, and may be cleared once before
  launch.

## Marketing links (for the owner)

- Analytics shows where visitors come from: **Sessions by channel**
  (Google / Facebook / TikTok / Instagram / Pinterest / YouTube), **Sessions
  by visitor country**, live **Visitors right now** split the same way, and
  **Sessions by campaign** for judging each piece of content.
- When posting content, always use a **tagged link** — many apps (TikTok,
  Instagram) hide the "came from" signal, so a plain link counts as "Direct":

  `https://goldrose-storefront.vercel.app/?utm_source=tiktok&utm_campaign=rose-video-1`

- `utm_source` = the platform (google / facebook / tiktok / instagram /
  pinterest / youtube). `utm_campaign` = your own name for that piece of
  content — each name becomes a row in "Sessions by campaign".
- **Tracking which account brought the sale (commissions):** if several
  accounts post on the same platform (e.g. multiple TikTok accounts, one per
  salesperson), give each account its own `utm_acc` tag and reuse it in
  every link that account posts:

  `https://goldrose-storefront.vercel.app/?utm_source=tiktok&utm_acc=amy&utm_campaign=rose-video-1`

  Analytics then shows **Sessions by posting account** and **Sales by posting
  account (for commissions)** — e.g. "TikTok · amy" — and each order's page
  shows **Referred by account**, so you can trace any order back to the
  account that brought the buyer and work out that salesperson's commission.
  `utm_acc` is our own tag (only this store reads it), so ad tools that
  auto-fill the standard tags will never overwrite it. When you post a link
  in a new place, click it once yourself and check the account shows up
  under **Visitors right now** / **Sessions by posting account**.
- For Google ads, add the same tags to the ad's final URL.

# 中文指南

欢迎！这是 GoldRose 商店的测试版本，这里不涉及任何真实付款。

## 如何进入

- 在登录页点击**"需要账号？申请访问"**，用**昵称**、邮箱和密码（至少 8 位）
  注册。
- 新账号需店主批准——批准前登录会显示"待批准"，请联系店主。
- 昵称与账号绑定，自动作为你在论坛上的名字，无需重复填写。
- 忘记密码？使用登录页的**"忘记密码？"**链接。

## 后台（当前界面）

- 测试期间全部开放：订单、产品、客户、分析、折扣、设置——随便点，都是演示
  数据，不会弄坏任何真实内容。

## 店面（商店本身）

- 像顾客一样浏览首页、商店页和产品页。
- 尽管试试完整的结账流程！付款是模拟的，绝不会真实扣款。

## 论坛

- 点击左侧菜单的**论坛**。
- **发起讨论**：填写标题和内容——Bug、疑问、想法、意见都可以。
- 在帖子页底部**回复**任何讨论。
- 自己昵称发的帖子会显示**编辑**按钮，编辑过的帖子会有"已编辑"标记。
- 测试期间**删除**对所有人开放，请只删除自己的帖子。
- **新消息**：左侧菜单的"论坛"会显示未读消息数量，列表里每个讨论也有
  "n 条新消息"标记。打开讨论即视为已读。未读状态按浏览器记忆——换设备后
  会重新显示全部未读；自己发的帖子不算未读。

## 反馈问题和想法

- 在论坛发帖，或者
- 使用店面角落的聊天气泡——消息会进入店主的想法收件箱。

## 注意事项

- 线上站点已接入正式数据库，数据（订单、论坛帖子）会保留。目前仍全部是测试
  数据，上线前可能会统一清理一次。

## 营销链接（店主必读）

- 分析页可以看到访客来源：**按渠道划分的会话**（Google / Facebook / TikTok /
  Instagram / Pinterest / YouTube）、**按访客国家/地区划分的会话**、**当前
  访客**（实时，同样按渠道和国家拆分，每 30 秒自动刷新），以及**按营销活动
  划分的会话**——用来判断每条素材的成效。
- 发布内容时请务必使用**带标签的链接**——很多 App（TikTok、Instagram）会隐藏
  "从哪里来"的信息，普通链接会被算成"直接访问"：

  `https://goldrose-storefront.vercel.app/?utm_source=tiktok&utm_campaign=rose-video-1`

- `utm_source` = 平台名（google / facebook / tiktok / instagram / pinterest /
  youtube）。`utm_campaign` = 你给这条素材起的名字——每个名字会在"按营销活动
  划分的会话"里单独成行。
- **追踪订单来自哪个账号（算提成）：** 同一平台有多个账号发内容时（比如几个
  TikTok 账号、每个销售一个），给每个账号定一个专属的 `utm_acc` 标签，该
  账号发的所有链接都带上它：

  `https://goldrose-storefront.vercel.app/?utm_source=tiktok&utm_acc=amy&utm_campaign=rose-video-1`

  之后分析页会显示**按发布账号划分的会话**和**按发布账号划分的销售额（用于算
  提成）**——例如"TikTok · amy"；每个订单详情页也会显示**引流账号**，任何一笔
  订单都能追溯到具体引流账号，直接按账号给销售算提成。
  `utm_acc` 是我们自己的标签（只有本店会读取），广告工具自动填写标准标签时
  不会覆盖它。在新的地方发链接时，请自己先点一次，确认账号出现在**当前访客**
  / **按发布账号划分的会话**里。
- 投 Google 广告时，在广告的最终到达网址上加同样的标签。
