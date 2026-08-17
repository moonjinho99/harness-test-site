// @ts-check
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const categories = [
  { name: "상의", slug: "tops", emoji: "👕" },
  { name: "하의", slug: "bottoms", emoji: "👖" },
  { name: "아우터", slug: "outerwear", emoji: "🧥" },
  { name: "신발", slug: "shoes", emoji: "👟" },
  { name: "액세서리", slug: "accessories", emoji: "🎒" },
];

const products = [
  {
    categorySlug: "tops",
    name: "베이직 화이트 티셔츠",
    slug: "basic-white-tee",
    description: "매일 입기 좋은 기본 화이트 티셔츠입니다.",
    price: 19000,
    originalPrice: 25000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
  },
  {
    categorySlug: "tops",
    name: "스트라이프 오버핏 셔츠",
    slug: "stripe-overfit-shirt",
    description: "루즈한 핏의 스트라이프 패턴 셔츠.",
    price: 39000,
    originalPrice: null,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"],
  },
  {
    categorySlug: "bottoms",
    name: "슬림 스트레이트 데님",
    slug: "slim-straight-denim",
    description: "어디에나 잘 어울리는 슬림 스트레이트 진.",
    price: 59000,
    originalPrice: 79000,
    stock: 40,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"],
  },
  {
    categorySlug: "bottoms",
    name: "와이드 치노 팬츠",
    slug: "wide-chino-pants",
    description: "편안한 와이드 실루엣의 치노 팬츠.",
    price: 49000,
    originalPrice: null,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"],
  },
  {
    categorySlug: "outerwear",
    name: "울 블렌드 코트",
    slug: "wool-blend-coat",
    description: "따뜻하고 세련된 울 혼방 롱코트.",
    price: 189000,
    originalPrice: 240000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800"],
  },
  {
    categorySlug: "outerwear",
    name: "오버사이즈 후드 집업",
    slug: "oversized-hood-zipup",
    description: "넉넉한 핏의 기모 후드 집업.",
    price: 79000,
    originalPrice: null,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800"],
  },
  {
    categorySlug: "shoes",
    name: "클래식 화이트 스니커즈",
    slug: "classic-white-sneakers",
    description: "데일리로 신기 좋은 클린한 화이트 스니커즈.",
    price: 89000,
    originalPrice: 110000,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
  },
  {
    categorySlug: "shoes",
    name: "청키 로퍼",
    slug: "chunky-loafer",
    description: "트렌디한 청키 솔 로퍼.",
    price: 99000,
    originalPrice: null,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800"],
  },
  {
    categorySlug: "accessories",
    name: "버킷햇",
    slug: "bucket-hat",
    description: "사계절 코디에 어울리는 버킷햇.",
    price: 29000,
    originalPrice: 35000,
    stock: 60,
    images: ["https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800"],
  },
  {
    categorySlug: "accessories",
    name: "레더 미니 크로스백",
    slug: "leather-mini-crossbag",
    description: "가볍고 실용적인 레더 미니 크로스백.",
    price: 59000,
    originalPrice: null,
    stock: 22,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800"],
  },
];

async function main() {
  console.log("🌱 시드 데이터 삽입 시작...");

  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ 카테고리 ${categories.length}개 완료`);

  const catMap = Object.fromEntries(
    (await db.category.findMany()).map((c) => [c.slug, c.id]),
  );

  for (const p of products) {
    const { categorySlug, ...data } = p;
    const categoryId = catMap[categorySlug];
    if (!categoryId) continue;
    await db.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: { ...data, categoryId },
    });
  }
  console.log(`✅ 상품 ${products.length}개 완료`);
  console.log("🎉 시드 완료");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
