# Violation Tracker (Next.js + Supabase)

一个用于小范围记录社区违规发言的最小可用项目。

## 1. 启动前准备

1. 在 Supabase 执行你已确认可用的 SQL（表、RLS、Storage policy）。
2. 在 Supabase `Authentication -> URL Configuration` 添加：
   - `http://localhost:3000/**`
   - 你的线上域名
3. 复制 `.env.example` 为 `.env.local` 并填写正确值。

## 2. 本地运行

```bash
npm i
npm run dev
```

打开 `http://localhost:3000`。

## 3. 当前功能

1. Login / Register (email + password)
2. 顶部 Dock 导航（Records / Gallery / Account）
3. 违规记录列表（支持按玩家 ID / 类型筛选）
4. Gallery 瀑布流查看证据图片
5. 记录详情页查看证据（签名 URL）
6. 仅 admin 允许新建违规记录

## 4. 权限迁移（必须执行）

在 Supabase SQL Editor 执行：

`supabase-access-migration.sql`

并在 Supabase Authentication 中开启用户注册（Allow new users）。

## 5. 上线到 Vercel

1. 推送到 GitHub 后导入到 Vercel
2. 在 Vercel 设置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 绑定你的域名
4. 回到 Supabase 更新 `Site URL` 和 `Redirect URLs`
