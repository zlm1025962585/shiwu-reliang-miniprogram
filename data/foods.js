// 本地食物营养数据库
// 数值均为每 100 克（可食部）的大致平均值，参考常见食物成分表整理，仅供日常估算，不作医疗用途。
// kcal: 千卡, protein/fat/carbs: 克, portion: 常见一份的克数, unit: 份量描述
const FOODS = [
  { name: "米饭", keywords: "米饭 白饭 大米", kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.9, portion: 200, unit: "一碗" },
  { name: "糙米饭", keywords: "糙米饭 糙米", kcal: 112, protein: 2.8, fat: 0.9, carbs: 23.0, portion: 200, unit: "一碗" },
  { name: "白粥", keywords: "粥 白粥 大米粥", kcal: 46, protein: 1.1, fat: 0.2, carbs: 9.9, portion: 250, unit: "一碗" },
  { name: "面条", keywords: "面条 挂面 拉面 汤面", kcal: 110, protein: 3.4, fat: 0.7, carbs: 22.5, portion: 200, unit: "一碗" },
  { name: "米线", keywords: "米线 米粉 过桥米线", kcal: 100, protein: 2.0, fat: 0.4, carbs: 21.0, portion: 300, unit: "一碗" },
  { name: "馒头", keywords: "馒头", kcal: 223, protein: 7.0, fat: 1.1, carbs: 47.0, portion: 100, unit: "一个" },
  { name: "肉包子", keywords: "包子 肉包", kcal: 240, protein: 7.5, fat: 9.0, carbs: 32.0, portion: 90, unit: "一个" },
  { name: "水饺", keywords: "饺子 水饺", kcal: 190, protein: 8.0, fat: 7.5, carbs: 22.0, portion: 150, unit: "约8个" },
  { name: "全麦面包", keywords: "面包 全麦面包 吐司", kcal: 246, protein: 9.0, fat: 3.4, carbs: 43.0, portion: 50, unit: "一片半" },
  { name: "三明治", keywords: "三明治 sandwich", kcal: 220, protein: 9.0, fat: 9.0, carbs: 25.0, portion: 160, unit: "一个" },
  { name: "燕麦片", keywords: "燕麦 燕麦片 麦片", kcal: 367, protein: 15.0, fat: 6.7, carbs: 61.6, portion: 40, unit: "一份" },
  { name: "煮鸡蛋", keywords: "鸡蛋 煮鸡蛋 白煮蛋", kcal: 144, protein: 13.3, fat: 8.8, carbs: 2.8, portion: 50, unit: "一个" },
  { name: "煎鸡蛋", keywords: "煎蛋 荷包蛋", kcal: 190, protein: 12.0, fat: 14.0, carbs: 2.4, portion: 50, unit: "一个" },
  { name: "牛奶", keywords: "牛奶 纯牛奶", kcal: 65, protein: 3.3, fat: 3.6, carbs: 5.0, portion: 250, unit: "一盒" },
  { name: "酸奶", keywords: "酸奶", kcal: 72, protein: 2.9, fat: 2.7, carbs: 9.3, portion: 150, unit: "一杯" },
  { name: "豆浆", keywords: "豆浆", kcal: 31, protein: 3.0, fat: 1.6, carbs: 1.2, portion: 250, unit: "一杯" },
  { name: "红薯", keywords: "红薯 地瓜 番薯", kcal: 86, protein: 1.6, fat: 0.2, carbs: 20.1, portion: 200, unit: "一个" },
  { name: "玉米", keywords: "玉米 甜玉米", kcal: 112, protein: 4.0, fat: 1.2, carbs: 22.8, portion: 160, unit: "一根" },
  { name: "土豆", keywords: "土豆 马铃薯", kcal: 81, protein: 2.6, fat: 0.2, carbs: 17.8, portion: 150, unit: "一个" },
  { name: "鸡胸肉", keywords: "鸡胸肉 鸡胸 鸡肉", kcal: 165, protein: 31.0, fat: 3.6, carbs: 0, portion: 150, unit: "一块" },
  { name: "鸡腿", keywords: "鸡腿", kcal: 181, protein: 16.0, fat: 13.0, carbs: 0, portion: 120, unit: "一个" },
  { name: "炸鸡", keywords: "炸鸡 炸鸡腿", kcal: 230, protein: 18.0, fat: 12.0, carbs: 10.0, portion: 150, unit: "一块" },
  { name: "牛肉", keywords: "牛肉 牛排 肥牛", kcal: 125, protein: 19.9, fat: 4.2, carbs: 2.0, portion: 150, unit: "一份" },
  { name: "猪瘦肉", keywords: "猪肉 瘦肉 里脊", kcal: 143, protein: 20.3, fat: 6.2, carbs: 1.5, portion: 150, unit: "一份" },
  { name: "五花肉", keywords: "五花肉 红烧肉", kcal: 508, protein: 7.7, fat: 53.0, carbs: 0, portion: 100, unit: "一份" },
  { name: "排骨", keywords: "排骨 猪排骨", kcal: 264, protein: 18.3, fat: 20.4, carbs: 1.7, portion: 150, unit: "一份" },
  { name: "鲈鱼", keywords: "鱼 鲈鱼 清蒸鱼", kcal: 105, protein: 18.6, fat: 3.4, carbs: 0, portion: 200, unit: "一份" },
  { name: "虾", keywords: "虾 大虾 基围虾", kcal: 93, protein: 18.6, fat: 0.8, carbs: 2.8, portion: 100, unit: "约6只" },
  { name: "豆腐", keywords: "豆腐", kcal: 82, protein: 8.1, fat: 3.7, carbs: 4.2, portion: 150, unit: "一份" },
  { name: "西兰花", keywords: "西兰花 西蓝花", kcal: 36, protein: 4.1, fat: 0.6, carbs: 4.3, portion: 150, unit: "一份" },
  { name: "菠菜", keywords: "菠菜", kcal: 28, protein: 2.6, fat: 0.3, carbs: 4.5, portion: 150, unit: "一份" },
  { name: "番茄", keywords: "番茄 西红柿", kcal: 20, protein: 0.9, fat: 0.2, carbs: 4.0, portion: 150, unit: "一个" },
  { name: "黄瓜", keywords: "黄瓜", kcal: 16, protein: 0.8, fat: 0.2, carbs: 2.9, portion: 150, unit: "一根" },
  { name: "胡萝卜", keywords: "胡萝卜", kcal: 39, protein: 1.0, fat: 0.2, carbs: 8.8, portion: 100, unit: "一根" },
  { name: "蔬菜沙拉", keywords: "沙拉 蔬菜沙拉", kcal: 30, protein: 1.5, fat: 0.5, carbs: 5.0, portion: 200, unit: "一份" },
  { name: "苹果", keywords: "苹果", kcal: 53, protein: 0.2, fat: 0.2, carbs: 13.7, portion: 180, unit: "一个" },
  { name: "香蕉", keywords: "香蕉", kcal: 93, protein: 1.4, fat: 0.2, carbs: 22.0, portion: 120, unit: "一根" },
  { name: "橙子", keywords: "橙子 橘子", kcal: 48, protein: 0.8, fat: 0.2, carbs: 11.1, portion: 150, unit: "一个" },
  { name: "葡萄", keywords: "葡萄", kcal: 70, protein: 0.5, fat: 0.2, carbs: 17.0, portion: 150, unit: "一份" },
  { name: "西瓜", keywords: "西瓜", kcal: 31, protein: 0.6, fat: 0.1, carbs: 6.8, portion: 300, unit: "一块" },
  { name: "牛油果", keywords: "牛油果 鳄梨", kcal: 171, protein: 2.0, fat: 15.3, carbs: 7.4, portion: 70, unit: "半个" },
  { name: "混合坚果", keywords: "坚果 核桃 杏仁 腰果", kcal: 600, protein: 18.0, fat: 52.0, carbs: 20.0, portion: 25, unit: "一小把" },
  { name: "汉堡", keywords: "汉堡 牛肉堡", kcal: 260, protein: 12.0, fat: 11.0, carbs: 28.0, portion: 220, unit: "一个" },
  { name: "薯条", keywords: "薯条 炸薯条", kcal: 312, protein: 3.4, fat: 15.0, carbs: 41.0, portion: 100, unit: "一份" },
  { name: "披萨", keywords: "披萨 比萨 pizza", kcal: 266, protein: 11.0, fat: 9.5, carbs: 33.0, portion: 120, unit: "一片" },
  { name: "寿司", keywords: "寿司", kcal: 150, protein: 6.0, fat: 2.5, carbs: 25.0, portion: 200, unit: "一份" },
  { name: "可乐", keywords: "可乐 汽水", kcal: 43, protein: 0, fat: 0, carbs: 10.6, portion: 330, unit: "一罐" },
  { name: "奶茶", keywords: "奶茶 珍珠奶茶", kcal: 80, protein: 1.0, fat: 2.0, carbs: 14.0, portion: 500, unit: "一杯" },
  { name: "巧克力", keywords: "巧克力", kcal: 546, protein: 4.3, fat: 32.0, carbs: 59.0, portion: 40, unit: "一块" },
  { name: "蛋糕", keywords: "蛋糕 奶油蛋糕", kcal: 347, protein: 6.0, fat: 16.0, carbs: 45.0, portion: 100, unit: "一块" },
  { name: "冰淇淋", keywords: "冰淇淋 冰激凌 雪糕", kcal: 207, protein: 3.5, fat: 11.0, carbs: 24.0, portion: 80, unit: "一个" }
];

function findFood(name) {
  if (!name) return null;
  const n = String(name).trim();
  let hit = FOODS.find(f => f.name === n);
  if (hit) return hit;
  hit = FOODS.find(f => f.keywords.indexOf(n) >= 0 || n.indexOf(f.name) >= 0);
  return hit || null;
}

function searchFoods(keyword) {
  const k = String(keyword || "").trim();
  if (!k) return FOODS.slice();
  return FOODS.filter(f => f.name.indexOf(k) >= 0 || f.keywords.indexOf(k) >= 0);
}

// 按克数计算某食物的热量与营养
function calc(food, grams) {
  const ratio = (Number(grams) || 0) / 100;
  const r1 = v => Math.round(v * 10) / 10;
  return {
    kcal: Math.round(food.kcal * ratio),
    protein: r1(food.protein * ratio),
    fat: r1(food.fat * ratio),
    carbs: r1(food.carbs * ratio)
  };
}

module.exports = { FOODS, findFood, searchFoods, calc };
