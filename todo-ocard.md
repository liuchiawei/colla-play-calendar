# Ocard 整合專案待辦事項

## 📋 專案概述

**目標：** 在 CollaPlay Calendar 專案中導入 Ocard 服務，包括：

- Auth 整合（身份驗證）
- 點數折價券發放
- 線下異步整合（實體消費使用折價券時的資料庫整合）
- 與現有資料庫及 Better Auth 的整合

**技術棧：**

- Next.js 16.1.1 (App Router)
- Better Auth 1.4.9
- PostgreSQL + Prisma ORM
- TypeScript

---

## 🎯 階段一：前置準備與評估

### 1.1 聯繫 Ocard 技術支援

- [ ] 聯繫 Ocard 技術支援團隊
- [ ] 取得官方 API 文件與 SDK
- [ ] 確認 API 端點與認證方式
- [ ] 了解 Webhook 機制與格式
- [ ] 取得測試環境帳號與 API 金鑰
- [ ] 確認 API 版本管理方式

### 1.2 技術規格確認

- [ ] 確認 API 類型（RESTful / GraphQL）
- [ ] 確認認證方式（API Key / OAuth 2.0 / JWT）
- [ ] 確認 Rate Limiting 限制
- [ ] 確認 Webhook URL 註冊方式
- [ ] 確認 Webhook 事件類型清單
- [ ] 確認 Webhook 簽章驗證方式（HMAC / JWT）
- [ ] 確認資料格式（會員、點數、折價券）

### 1.3 資料庫設計

- [ ] 設計 `OcardMember` 模型（對應 User）
- [ ] 設計 `OcardTransaction` 模型（交易記錄）
- [ ] 設計 `OcardCoupon` 模型（折價券）
- [ ] 設計索引優化查詢效能
- [ ] 撰寫 Prisma Migration
- [ ] 測試資料庫遷移

### 1.4 環境配置準備

- [ ] 新增環境變數配置
  - [ ] `OCARD_API_BASE_URL`
  - [ ] `OCARD_API_KEY`
  - [ ] `OCARD_API_SECRET`
  - [ ] `OCARD_WEBHOOK_SECRET`
  - [ ] `OCARD_STORE_ID`
- [ ] 設定開發環境變數
- [ ] 設定測試環境變數
- [ ] 設定生產環境變數（Vercel Environment Variables）

---

## 🔐 階段二：Auth 整合實作

### 2.1 建立 Ocard Auth Service

- [ ] 建立 `lib/services/ocard/ocard-auth.service.ts`
- [ ] 實作手機號碼註冊功能
- [ ] 實作手機號碼登入功能
- [ ] 實作 Ocard 會員 ID 與本地 User 對應邏輯
- [ ] 實作雙向同步機制
- [ ] 處理 Email 與手機號碼的對應關係

### 2.2 Better Auth 擴充

- [ ] 評估 Ocard 是否支援 OAuth Provider
- [ ] 若支援，在 `lib/auth.ts` 中新增 Ocard Provider
- [ ] 若不支援，建立自訂認證流程整合 Ocard
- [ ] 實作用戶對應邏輯（註冊時同時建立 Ocard 會員）
- [ ] 實作登入時同步 Ocard 會員資料

### 2.3 用戶對應邏輯

- [ ] 設計用戶對應策略（Email ↔ 手機號碼）
- [ ] 實作註冊時自動建立 Ocard 會員
- [ ] 實作登入時同步 Ocard 會員資料
- [ ] 處理既有用戶的 Ocard 會員建立
- [ ] 實作用戶資料同步錯誤處理

---

## 💰 階段三：點數折價券 API 整合

### 3.1 建立 Ocard API Client

- [ ] 建立 `lib/services/ocard/ocard-api.client.ts`
- [ ] 實作 API 認證機制（API Key/Secret）
- [ ] 實作點數發放 API
- [ ] 實作折價券發放 API
- [ ] 實作會員查詢 API
- [ ] 實作點數查詢 API
- [ ] 實作折價券查詢 API
- [ ] 實作錯誤處理與重試機制

### 3.2 建立 API Routes

- [ ] 建立 `app/api/ocard/members/route.ts`（會員查詢、建立）
- [ ] 建立 `app/api/ocard/members/[memberId]/route.ts`（會員詳情）
- [ ] 建立 `app/api/ocard/members/[memberId]/points/route.ts`（點數操作）
- [ ] 建立 `app/api/ocard/members/[memberId]/coupons/route.ts`（折價券操作）
- [ ] 建立 `app/api/ocard/points/route.ts`（點數發放）
- [ ] 建立 `app/api/ocard/coupons/route.ts`（折價券發放）
- [ ] 實作 API 路由的錯誤處理
- [ ] 實作 API 路由的權限驗證

### 3.3 業務邏輯整合

- [ ] 整合活動報名成功自動送點功能
- [ ] 整合特定活動贈送折價券功能
- [ ] 實作點數查詢功能
- [ ] 實作點數歷史記錄查詢
- [ ] 實作折價券列表查詢
- [ ] 實作折價券使用狀態查詢

---

## 🔄 階段四：Webhook 異步整合

### 4.1 Webhook 端點建立

- [ ] 建立 `app/api/webhooks/ocard/route.ts`
- [ ] 實作 Webhook 簽章驗證
- [ ] 實作 `member.created` 事件處理
- [ ] 實作 `points.earned` 事件處理
- [ ] 實作 `points.redeemed` 事件處理
- [ ] 實作 `coupon.issued` 事件處理
- [ ] 實作 `coupon.used` 事件處理
- [ ] 實作 `transaction.completed` 事件處理
- [ ] 實作 Webhook 錯誤處理與日誌記錄

### 4.2 異步處理機制

- [ ] 評估是否需要 Queue 系統（BullMQ / Inngest）
- [ ] 若需要，設定 Queue 系統
- [ ] 實作 Webhook 事件佇列處理
- [ ] 實作重試機制
- [ ] 實作錯誤處理與告警
- [ ] 實作處理狀態追蹤

### 4.3 資料庫同步邏輯

- [ ] 實作更新本地 `OcardMember` 點數邏輯
- [ ] 實作記錄 `OcardTransaction` 邏輯
- [ ] 實作更新 `OcardCoupon` 狀態邏輯
- [ ] 實作資料同步衝突處理
- [ ] 實作資料同步失敗回滾機制
- [ ] 實作定期同步機制（防止資料不一致）

---

## 🧪 階段五：測試與優化

### 5.1 單元測試

- [ ] 撰寫 Ocard API Client 單元測試
- [ ] 撰寫 Webhook 處理邏輯單元測試
- [ ] 撰寫資料同步邏輯單元測試
- [ ] 撰寫 Auth 整合單元測試
- [ ] 設定測試覆蓋率目標

### 5.2 整合測試

- [ ] 測試完整流程（註冊 → 發點 → 使用折價券）
- [ ] 測試 Webhook 接收與處理
- [ ] 測試錯誤情境（API 失敗、網路錯誤）
- [ ] 測試資料同步正確性
- [ ] 測試並發處理能力

### 5.3 性能優化

- [ ] 實作 API 請求快取機制
- [ ] 優化資料庫查詢（使用 `include`/`select` 避免 N+1）
- [ ] 優化 Webhook 處理效能
- [ ] 使用 `unstable_cache` 快取 Ocard 資料
- [ ] 實作資料庫查詢批次處理

### 5.4 安全性檢查

- [ ] 確認 API 金鑰加密儲存
- [ ] 確認 Webhook 簽章驗證正確
- [ ] 確認用戶資料隱私保護
- [ ] 實作 Rate Limiting 防護
- [ ] 進行安全性審查

---

## 📊 階段六：監控與維護

### 6.1 監控機制

- [ ] 設定 Ocard API 呼叫監控
- [ ] 設定 Webhook 接收監控
- [ ] 設定資料同步狀態監控
- [ ] 設定錯誤告警機制
- [ ] 建立監控儀表板

### 6.2 日誌記錄

- [ ] 實作 Ocard API 呼叫日誌
- [ ] 實作 Webhook 處理日誌
- [ ] 實作資料同步日誌
- [ ] 實作錯誤日誌記錄
- [ ] 設定日誌輪轉與保留策略

### 6.3 文件撰寫

- [ ] 撰寫 API 使用文件
- [ ] 撰寫 Webhook 整合文件
- [ ] 撰寫資料庫模型文件
- [ ] 撰寫錯誤處理指南
- [ ] 撰寫維護手冊

---

## ⚠️ 風險與注意事項

### 資料一致性

- [ ] 設計資料同步策略
- [ ] 實作定期同步機制
- [ ] 實作衝突解決機制
- [ ] 建立資料一致性檢查工具

### 用戶體驗

- [ ] 確保整合不影響現有登入流程
- [ ] 設計點數與折價券查詢介面
- [ ] 實作 Ocard 服務異常時的降級方案
- [ ] 提供用戶友好的錯誤訊息

### 法規與隱私

- [ ] 確認個資法規合規性
- [ ] 實作資料使用告知機制
- [ ] 實作資料刪除機制（GDPR 合規）
- [ ] 建立隱私權政策

---

## 📝 技術細節備忘錄

### 需要向 Ocard 確認的問題

1. API 類型：RESTful 或 GraphQL？
2. 認證方式：API Key、OAuth 2.0、JWT？
3. Rate Limiting：每秒/每分鐘請求限制？
4. Webhook 註冊：如何註冊 Webhook URL？
5. Webhook 事件：完整事件類型清單？
6. Webhook 簽章：HMAC、JWT 或其他？
7. 資料格式：會員、點數、折價券的完整資料結構？
8. 錯誤處理：標準錯誤回應格式？
9. 測試環境：測試 API 端點與限制？
10. 技術支援：支援管道與回應時間？

### 建議的資料庫模型結構

```prisma
model OcardMember {
  id              String   @id @default(cuid())
  userId          String   @unique
  ocardMemberId   String   @unique
  phoneNumber     String?
  points          Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
  transactions    OcardTransaction[]
  coupons         OcardCoupon[]

  @@index([userId])
  @@index([ocardMemberId])
  @@index([phoneNumber])
}

model OcardTransaction {
  id              String   @id @default(cuid())
  ocardMemberId   String
  transactionId   String   @unique
  type            String   // 'earn' | 'redeem' | 'coupon_used'
  points          Int
  amount          Decimal?
  description     String?
  createdAt       DateTime @default(now())
  member          OcardMember @relation(fields: [ocardMemberId], references: [id])

  @@index([ocardMemberId])
  @@index([transactionId])
  @@index([createdAt])
}

model OcardCoupon {
  id              String   @id @default(cuid())
  ocardMemberId   String
  couponId        String   @unique
  name            String
  discountType    String   // 'percentage' | 'fixed'
  discountValue   Decimal
  status          String   // 'active' | 'used' | 'expired'
  expiresAt       DateTime?
  usedAt          DateTime?
  createdAt       DateTime @default(now())
  member          OcardMember @relation(fields: [ocardMemberId], references: [id])

  @@index([ocardMemberId])
  @@index([couponId])
  @@index([status])
  @@index([expiresAt])
}
```

### 環境變數範例

```env
# Ocard API 配置
OCARD_API_BASE_URL=https://api.ocard.co
OCARD_API_KEY=your_api_key
OCARD_API_SECRET=your_api_secret
OCARD_WEBHOOK_SECRET=your_webhook_secret
OCARD_STORE_ID=your_store_id
```

---

## 🚀 建議的實作順序

1. **階段一：前置準備**（1-2 週）

   - 聯繫 Ocard 取得文件
   - 設計資料庫結構
   - 準備環境配置

2. **階段二：Auth 整合**（1-2 週）

   - 建立 Ocard Auth Service
   - 整合 Better Auth
   - 實作用戶對應邏輯

3. **階段三：API 整合**（2-3 週）

   - 建立 Ocard API Client
   - 建立 API Routes
   - 整合業務邏輯

4. **階段四：Webhook 整合**（2-3 週）

   - 建立 Webhook 端點
   - 實作異步處理
   - 實作資料同步

5. **階段五：測試與優化**（1-2 週）

   - 撰寫測試
   - 性能優化
   - 安全性檢查

6. **階段六：監控與維護**（持續）
   - 設定監控
   - 建立文件
   - 持續優化

---

## 📅 進度追蹤

**開始日期：** _待填寫_  
**預計完成日期：** _待填寫_  
**目前階段：** 階段一 - 前置準備與評估

**完成度：** 0% (0/XX 項完成)

---

## 📌 備註

- 此文件會隨著專案進度持續更新
- 建議每完成一個階段後進行檢視與調整
- 遇到技術問題時，優先聯繫 Ocard 技術支援
- 保持與團隊成員的溝通，確保整合方向一致
