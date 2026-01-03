# TODO list

- [ ] Auth: User Name
  1. 更改註冊時 Name 邏輯，讓用戶必須提供 name (id)
  2. 用戶註冊時增加對 name 唯一性的檢查
- [ ] User profile hover card
- [ ] Design: Profile page
- [ ] Design: User page
- [ ] Design: calendar page
- [ ] Design: event page
- [ ] 心理測驗
  - 前端
    - 心理測驗頁面 explore/mbti-test, explore/holland-code
    - 結果顯示在item組件(ex. explore-score-item)
    - section組件(ex. explore-scores)
    - section組件顯示在 profile page, user page
  - 後端
    - 將結果記錄到資料庫
    - 結果和 User 連動
    - User 可以決定要不要顯示在個人頁面
    - Prisma Schema
    - 相關 API 和 Service 檔案
    - 快取/效能/記憶體負擔/載入速度
- [ ] Google Auth 登入整合
