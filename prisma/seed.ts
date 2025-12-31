// データベース初期化スクリプト
// サンプルデータを作成してデータベースに投入

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.js";

// Prisma Clientの設定
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// サンプルカテゴリ
const sampleCategories = [
  { name: "工作坊", color: "#FF6B6B" },
  { name: "講座", color: "#4ECDC4" },
  { name: "展演", color: "#45B7D1" },
  { name: "市集", color: "#96CEB4" },
  { name: "社群聚會", color: "#FFEAA7" },
  { name: "其他", color: "#DDA0DD" },
];

// サンプルイベント生成関数
function generateSampleEvents(categoryIds: Record<string, string>) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      title: "手作皮革工作坊",
      description:
        "學習基礎皮革工藝，製作屬於自己的皮革小物。適合初學者，所有材料工具皆由主辦方提供。",
      startTime: new Date(
        today.getTime() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
      ), // 明天 14:00
      endTime: new Date(
        today.getTime() + 1 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000
      ), // 明天 17:00
      location: "CollaPlay 工作坊區",
      organizer: "皮革職人工作室",
      price: "NT$ 1,200（含材料）",
      imageUrl:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop",
      registrationUrl: "https://example.com/register/leather",
      categoryId: categoryIds["工作坊"],
    },
    {
      title: "創業分享講座：從0到1的創業之路",
      description:
        "邀請三位成功創業家分享他們的創業經驗，包含資金籌措、團隊建立、市場策略等實戰經驗。",
      startTime: new Date(
        today.getTime() + 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000
      ), // 後天 19:00
      endTime: new Date(
        today.getTime() + 2 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000
      ), // 後天 21:00
      location: "CollaPlay 講堂",
      organizer: "新創社群",
      price: "免費入場",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop",
      registrationUrl: "https://example.com/register/startup",
      categoryId: categoryIds["講座"],
    },
    {
      title: "獨立樂團之夜",
      description: "三組本地獨立樂團現場演出，帶來原創音樂饗宴。備有酒水販售。",
      startTime: new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000
      ), // 3天後 20:00
      endTime: new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000
      ), // 3天後 23:00
      location: "CollaPlay 展演廳",
      organizer: "音樂愛好社",
      price: "NT$ 350（預售）/ NT$ 400（現場）",
      imageUrl: "https://picsum.photos/800/600",
      registrationUrl: "https://example.com/register/band",
      categoryId: categoryIds["展演"],
    },
    {
      title: "週末手作市集",
      description:
        "集結30組在地手作品牌，展售獨特的手工藝品、文創商品、輕食飲品。",
      startTime: new Date(
        today.getTime() + 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000
      ), // 4天後 11:00
      endTime: new Date(
        today.getTime() + 4 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000
      ), // 4天後 18:00
      location: "CollaPlay 戶外廣場",
      organizer: "手作市集聯盟",
      price: "免費入場",
      imageUrl:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      categoryId: categoryIds["市集"],
    },
    {
      title: "讀書會：《原子習慣》",
      description:
        "一起閱讀並討論《原子習慣》這本暢銷書，分享如何建立好習慣、戒除壞習慣的實踐經驗。",
      startTime: new Date(
        today.getTime() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
      ), // 5天後 14:00
      endTime: new Date(
        today.getTime() + 5 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000
      ), // 5天後 16:00
      location: "CollaPlay 閱讀角",
      organizer: "讀書同好會",
      price: "NT$ 100（茶水費）",
      categoryId: categoryIds["社群聚會"],
    },
    {
      title: "瑜珈晨練班",
      description:
        "適合各程度的晨間瑜珈課程，從基礎體式開始，幫助你開啟充滿活力的一天。請自備瑜珈墊。",
      startTime: new Date(
        today.getTime() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000
      ), // 明天 08:00
      endTime: new Date(
        today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000
      ), // 明天 09:00
      location: "CollaPlay 多功能室",
      organizer: "陽光瑜珈社",
      price: "NT$ 200",
      registrationUrl: "https://example.com/register/yoga",
      categoryId: categoryIds["其他"],
    },
    {
      title: "插畫創作工作坊",
      description:
        "學習數位插畫基礎技巧，從構圖到上色完成一幅作品。需自備平板或筆電。",
      startTime: new Date(
        today.getTime() + 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000
      ), // 後天 13:00
      endTime: new Date(
        today.getTime() + 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000
      ), // 後天 17:00
      location: "CollaPlay 工作坊區",
      organizer: "插畫家聯盟",
      price: "NT$ 800",
      registrationUrl: "https://example.com/register/illustration",
      categoryId: categoryIds["工作坊"],
    },
    {
      title: "科技趨勢分享會",
      description:
        "探討2025年最新科技趨勢，包含AI、區塊鏈、元宇宙等領域的發展與應用。",
      startTime: new Date(
        today.getTime() + 6 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000
      ), // 6天後 19:00
      endTime: new Date(
        today.getTime() + 6 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000
      ), // 6天後 21:00
      location: "CollaPlay 講堂",
      organizer: "科技愛好社",
      price: "免費入場",
      registrationUrl: "https://example.com/register/tech",
      categoryId: categoryIds["講座"],
    },
  ];
}

async function main() {
  console.log("🌱 開始初始化資料庫...\n");

  // 清除現有資料（注意順序：先刪除有外鍵依賴的資料）
  console.log("🗑️  清除現有資料...");
  await prisma.eventRegistration.deleteMany(); // 先刪除報名記錄（依賴 Event）
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  console.log("✅ 現有資料已清除\n");

  // 建立カテゴリ
  console.log("📁 建立活動類型...");
  const categoryIds: Record<string, string> = {};

  for (const cat of sampleCategories) {
    const created = await prisma.category.create({
      data: cat,
    });
    categoryIds[cat.name] = created.id;
    console.log(`   ✓ ${cat.name}`);
  }
  console.log(`✅ 已建立 ${sampleCategories.length} 個活動類型\n`);

  // 建立イベント
  console.log("📅 建立範例活動...");
  const sampleEvents = generateSampleEvents(categoryIds);

  for (const event of sampleEvents) {
    const created = await prisma.event.create({
      data: event,
    });
    console.log(`   ✓ ${created.title}`);
  }
  console.log(`✅ 已建立 ${sampleEvents.length} 個範例活動\n`);

  console.log("🎉 資料庫初始化完成！");
  console.log("   現在可以執行 'pnpm dev' 啟動開發伺服器");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
