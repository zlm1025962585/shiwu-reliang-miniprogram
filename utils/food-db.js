// 内置常见食物营养库（每 100g），无网络 / 无 Key / 识别失败时兜底手动录入
// 数据为常见做法的近似值，用于估算，不作医学依据
const FOODS = [
  // 主食
  { name: '米饭', cat: 'staple', kcal: 116, p: 2.6, c: 25.9, f: 0.3, alias: ['白米饭', '大米饭', '白饭'] },
  { name: '白粥', cat: 'staple', kcal: 46, p: 1.1, c: 9.9, f: 0.2 },
  { name: '馒头', cat: 'staple', kcal: 223, p: 7.0, c: 47.0, f: 1.1 },
  { name: '花卷', cat: 'staple', kcal: 214, p: 6.4, c: 45.6, f: 1.0 },
  { name: '面条（煮）', cat: 'staple', kcal: 110, p: 4.5, c: 22.0, f: 0.7, alias: ['面条', '清汤面', '挂面'] },
  { name: '炒饭', cat: 'staple', kcal: 180, p: 4.5, c: 30.0, f: 4.5 },
  { name: '炒面', cat: 'staple', kcal: 190, p: 5.5, c: 28.0, f: 6.5 },
  { name: '米粉', cat: 'staple', kcal: 110, p: 2.0, c: 24.0, f: 0.4 },
  { name: '米线', cat: 'staple', kcal: 110, p: 2.2, c: 24.5, f: 0.3 },
  { name: '河粉', cat: 'staple', kcal: 130, p: 2.4, c: 28.0, f: 0.5 },
  { name: '油条', cat: 'staple', kcal: 388, p: 6.9, c: 51.0, f: 17.6 },
  { name: '肉包', cat: 'staple', kcal: 227, p: 8.0, c: 30.0, f: 8.0 },
  { name: '小笼包', cat: 'staple', kcal: 220, p: 7.5, c: 26.0, f: 9.5 },
  { name: '饺子（猪肉）', cat: 'staple', kcal: 235, p: 9.0, c: 29.0, f: 9.0 },
  { name: '全麦面包', cat: 'staple', kcal: 247, p: 9.0, c: 41.0, f: 4.2 },
  { name: '白吐司', cat: 'staple', kcal: 280, p: 8.5, c: 50.0, f: 4.5 },
  { name: '燕麦片（干）', cat: 'staple', kcal: 377, p: 13.0, c: 66.0, f: 6.7 },
  { name: '红薯', cat: 'staple', kcal: 86, p: 1.6, c: 20.0, f: 0.1, alias: ['地瓜', '番薯'] },
  { name: '玉米', cat: 'staple', kcal: 106, p: 4.0, c: 22.8, f: 1.2 },
  { name: '土豆', cat: 'staple', kcal: 77, p: 2.0, c: 17.0, f: 0.1, alias: ['马铃薯', '洋芋'] },

  // 蛋白质
  { name: '鸡蛋（水煮）', cat: 'protein', kcal: 155, p: 13.0, c: 1.1, f: 11.0, alias: ['水煮蛋', '白煮蛋', '煮鸡蛋', '鸡蛋'] },
  { name: '煎蛋', cat: 'protein', kcal: 200, p: 13.0, c: 1.0, f: 16.0 },
  { name: '鸡胸肉（熟）', cat: 'protein', kcal: 165, p: 31.0, c: 0.0, f: 3.6, alias: ['鸡胸', '鸡胸脯', '鸡胸肉'] },
  { name: '鸡腿（炸）', cat: 'protein', kcal: 260, p: 18.0, c: 12.0, f: 16.0 },
  { name: '鸡腿（卤）', cat: 'protein', kcal: 180, p: 20.0, c: 3.0, f: 10.0 },
  { name: '红烧肉', cat: 'protein', kcal: 480, p: 9.0, c: 6.0, f: 46.0 },
  { name: '猪肉（瘦）', cat: 'protein', kcal: 143, p: 20.3, c: 1.5, f: 6.2 },
  { name: '排骨（红烧）', cat: 'protein', kcal: 280, p: 16.0, c: 6.0, f: 21.0 },
  { name: '牛肉（瘦）', cat: 'protein', kcal: 125, p: 20.0, c: 2.0, f: 4.2 },
  { name: '牛排（煎）', cat: 'protein', kcal: 250, p: 26.0, c: 0.0, f: 16.0 },
  { name: '清蒸鱼', cat: 'protein', kcal: 105, p: 20.0, c: 0.0, f: 2.5 },
  { name: '三文鱼', cat: 'protein', kcal: 208, p: 20.0, c: 0.0, f: 13.0 },
  { name: '虾仁', cat: 'protein', kcal: 99, p: 20.0, c: 0.2, f: 1.4 },
  { name: '豆腐', cat: 'protein', kcal: 82, p: 8.0, c: 2.0, f: 4.8 },
  { name: '麻婆豆腐', cat: 'protein', kcal: 130, p: 8.5, c: 5.0, f: 8.5 },
  { name: '蛋白粉', cat: 'protein', kcal: 380, p: 75.0, c: 8.0, f: 5.0 },

  // 蔬果
  { name: '炒青菜', cat: 'veg', kcal: 90, p: 1.8, c: 4.0, f: 7.5, alias: ['青菜', '炒时蔬', '炒小白菜'] },
  { name: '水煮西兰花', cat: 'veg', kcal: 34, p: 2.8, c: 6.6, f: 0.4 },
  { name: '番茄', cat: 'veg', kcal: 18, p: 0.9, c: 3.9, f: 0.2 },
  { name: '黄瓜', cat: 'veg', kcal: 16, p: 0.8, c: 2.9, f: 0.2 },
  { name: '生菜沙拉（无酱）', cat: 'veg', kcal: 40, p: 1.5, c: 5.0, f: 1.2 },
  { name: '苹果', cat: 'veg', kcal: 53, p: 0.2, c: 13.5, f: 0.2 },
  { name: '香蕉', cat: 'veg', kcal: 93, p: 1.4, c: 22.0, f: 0.2 },
  { name: '橙子', cat: 'veg', kcal: 48, p: 0.8, c: 11.1, f: 0.2 },
  { name: '西瓜', cat: 'veg', kcal: 31, p: 0.6, c: 7.9, f: 0.1 },
  { name: '蓝莓', cat: 'veg', kcal: 57, p: 0.7, c: 14.5, f: 0.3 },

  // 菜品 / 外食
  { name: '牛肉面', cat: 'dish', kcal: 130, p: 6.0, c: 20.0, f: 3.0 },
  { name: '猪脚饭', cat: 'dish', kcal: 180, p: 6.5, c: 25.0, f: 6.0 },
  { name: '黄焖鸡米饭', cat: 'dish', kcal: 160, p: 7.0, c: 22.0, f: 5.0 },
  { name: '咖喱饭', cat: 'dish', kcal: 150, p: 4.5, c: 24.0, f: 4.5 },
  { name: '盒饭（荤素）', cat: 'dish', kcal: 150, p: 6.0, c: 21.0, f: 4.5 },
  { name: '麻辣香锅', cat: 'dish', kcal: 180, p: 8.0, c: 10.0, f: 12.0 },
  { name: '麻辣烫', cat: 'dish', kcal: 120, p: 6.0, c: 10.0, f: 6.0, alias: ['冒菜', '麻辣拌'] },
  { name: '火锅（荤素混合）', cat: 'dish', kcal: 200, p: 10.0, c: 8.0, f: 15.0 },
  { name: '螺蛳粉', cat: 'dish', kcal: 150, p: 4.0, c: 22.0, f: 5.0 },
  { name: '烧烤（混合）', cat: 'dish', kcal: 250, p: 15.0, c: 5.0, f: 19.0 },
  { name: '汉堡', cat: 'dish', kcal: 295, p: 17.0, c: 24.0, f: 14.0 },
  { name: '薯条', cat: 'dish', kcal: 312, p: 3.4, c: 41.0, f: 15.0 },
  { name: '炸鸡', cat: 'dish', kcal: 279, p: 17.0, c: 14.0, f: 18.0 },
  { name: '披萨', cat: 'dish', kcal: 266, p: 11.0, c: 33.0, f: 10.0 },
  { name: '三明治', cat: 'dish', kcal: 250, p: 10.0, c: 28.0, f: 10.0 },

  // 饮品
  { name: '牛奶（全脂）', cat: 'drink', kcal: 65, p: 3.3, c: 4.7, f: 3.6, alias: ['牛奶', '纯牛奶', '全脂牛奶'] },
  { name: '豆浆（无糖）', cat: 'drink', kcal: 31, p: 3.0, c: 1.2, f: 1.6, alias: ['豆浆', '无糖豆浆', '现磨豆浆'] },
  { name: '酸奶（原味）', cat: 'drink', kcal: 72, p: 2.5, c: 9.3, f: 2.7 },
  { name: '美式咖啡', cat: 'drink', kcal: 2, p: 0.1, c: 0.3, f: 0.0 },
  { name: '拿铁', cat: 'drink', kcal: 55, p: 3.0, c: 5.0, f: 2.5 },
  { name: '可乐', cat: 'drink', kcal: 43, p: 0.0, c: 10.8, f: 0.0, alias: ['可口可乐', '百事可乐', '汽水'] },
  { name: '珍珠奶茶（全糖）', cat: 'drink', kcal: 90, p: 1.0, c: 17.0, f: 2.5, alias: ['奶茶', '珍珠奶茶', '波霸奶茶'] },
  { name: '啤酒', cat: 'drink', kcal: 43, p: 0.5, c: 3.6, f: 0.0 },

  // 零食
  { name: '混合坚果', cat: 'snack', kcal: 600, p: 18.0, c: 20.0, f: 52.0 },
  { name: '花生（炒）', cat: 'snack', kcal: 567, p: 26.0, c: 16.0, f: 49.0 },
  { name: '薯片', cat: 'snack', kcal: 536, p: 6.5, c: 53.0, f: 34.0 },
  { name: '蛋糕', cat: 'snack', kcal: 350, p: 5.0, c: 45.0, f: 16.0 },
  { name: '冰淇淋', cat: 'snack', kcal: 207, p: 3.5, c: 24.0, f: 11.0 },
  { name: '黑巧克力', cat: 'snack', kcal: 546, p: 4.9, c: 47.0, f: 31.0 },

  // 家常炒菜 / 下饭菜（每 100g，按常见家常做法估算）
  { name: '番茄炒蛋', cat: 'dish', kcal: 110, p: 5.5, c: 5.0, f: 8.0, alias: ['西红柿炒鸡蛋', '西红柿炒蛋', '番茄炒鸡蛋'] },
  { name: '韭菜炒鸡蛋', cat: 'dish', kcal: 130, p: 7.0, c: 3.0, f: 10.0 },
  { name: '宫保鸡丁', cat: 'dish', kcal: 190, p: 12.0, c: 9.0, f: 12.0 },
  { name: '鱼香肉丝', cat: 'dish', kcal: 210, p: 10.0, c: 11.0, f: 14.0 },
  { name: '回锅肉', cat: 'dish', kcal: 380, p: 10.0, c: 6.0, f: 36.0 },
  { name: '青椒肉丝', cat: 'dish', kcal: 150, p: 11.0, c: 5.0, f: 10.0 },
  { name: '京酱肉丝', cat: 'dish', kcal: 220, p: 14.0, c: 10.0, f: 14.0 },
  { name: '木须肉', cat: 'dish', kcal: 160, p: 11.0, c: 6.0, f: 10.0 },
  { name: '梅菜扣肉', cat: 'dish', kcal: 400, p: 9.0, c: 8.0, f: 37.0 },
  { name: '红烧狮子头', cat: 'dish', kcal: 250, p: 13.0, c: 9.0, f: 18.0 },
  { name: '糖醋排骨', cat: 'dish', kcal: 300, p: 15.0, c: 14.0, f: 20.0 },
  { name: '水煮鱼', cat: 'dish', kcal: 150, p: 14.0, c: 3.0, f: 9.0 },
  { name: '酸菜鱼', cat: 'dish', kcal: 130, p: 13.0, c: 3.0, f: 7.5 },
  { name: '红烧茄子', cat: 'dish', kcal: 160, p: 2.5, c: 10.0, f: 12.0 },
  { name: '地三鲜', cat: 'dish', kcal: 170, p: 2.5, c: 15.0, f: 11.0 },
  { name: '干煸四季豆', cat: 'dish', kcal: 150, p: 4.0, c: 9.0, f: 11.0 },
  { name: '酸辣土豆丝', cat: 'dish', kcal: 110, p: 2.0, c: 15.0, f: 4.5 },
  { name: '手撕包菜', cat: 'dish', kcal: 75, p: 1.8, c: 5.0, f: 5.5 },
  { name: '蒜蓉炒时蔬', cat: 'dish', kcal: 80, p: 2.5, c: 5.0, f: 6.0 },
  { name: '清炒油麦菜', cat: 'dish', kcal: 70, p: 2.0, c: 3.0, f: 5.5 },
  { name: '白切鸡', cat: 'dish', kcal: 180, p: 20.0, c: 1.0, f: 11.0 },
  { name: '口水鸡', cat: 'dish', kcal: 220, p: 18.0, c: 3.0, f: 15.0 },
  { name: '盐焗鸡', cat: 'dish', kcal: 200, p: 22.0, c: 1.0, f: 12.0 },
  { name: '黄焖鸡', cat: 'dish', kcal: 180, p: 13.0, c: 6.0, f: 12.0 },
  { name: '可乐鸡翅', cat: 'dish', kcal: 230, p: 17.0, c: 8.0, f: 14.0 },
  { name: '红烧鸡块', cat: 'dish', kcal: 200, p: 16.0, c: 4.0, f: 13.0 },
  { name: '烤鸭', cat: 'dish', kcal: 330, p: 16.0, c: 1.0, f: 29.0 },
  { name: '羊肉串', cat: 'dish', kcal: 250, p: 18.0, c: 2.0, f: 19.0 },
  { name: '小龙虾（麻辣）', cat: 'dish', kcal: 120, p: 15.0, c: 2.0, f: 6.0 },
  { name: '凉拌黄瓜', cat: 'dish', kcal: 40, p: 1.0, c: 3.5, f: 2.5 },
  { name: '皮蛋豆腐', cat: 'dish', kcal: 90, p: 7.0, c: 3.0, f: 6.0 },

  // 主食 / 汤（家常做法）
  { name: '蛋炒饭', cat: 'staple', kcal: 180, p: 5.0, c: 28.0, f: 5.5 },
  { name: '煲仔饭', cat: 'staple', kcal: 170, p: 6.0, c: 24.0, f: 5.0 },
  { name: '卤肉饭', cat: 'staple', kcal: 200, p: 7.0, c: 26.0, f: 7.0 },
  { name: '排骨饭', cat: 'staple', kcal: 190, p: 8.0, c: 25.0, f: 6.0 },
  { name: '西红柿鸡蛋面', cat: 'staple', kcal: 110, p: 4.5, c: 17.0, f: 2.5 },
  { name: '炸酱面', cat: 'staple', kcal: 160, p: 6.0, c: 25.0, f: 4.0 },
  { name: '兰州拉面', cat: 'staple', kcal: 120, p: 5.0, c: 21.0, f: 2.0 },
  { name: '重庆小面', cat: 'staple', kcal: 150, p: 4.5, c: 22.0, f: 5.0 },
  { name: '云吞面', cat: 'staple', kcal: 110, p: 6.0, c: 16.0, f: 2.5 },
  { name: '肠粉', cat: 'staple', kcal: 110, p: 4.0, c: 20.0, f: 1.5 },
  { name: '煎饺', cat: 'staple', kcal: 230, p: 8.0, c: 26.0, f: 10.0 },
  { name: '烧麦', cat: 'staple', kcal: 210, p: 8.0, c: 26.0, f: 8.0 },
  { name: '葱油饼', cat: 'staple', kcal: 300, p: 6.0, c: 40.0, f: 13.0 },
  { name: '手抓饼', cat: 'staple', kcal: 320, p: 6.0, c: 38.0, f: 16.0 },
  { name: '凉皮', cat: 'staple', kcal: 120, p: 3.0, c: 24.0, f: 1.5 },
  { name: '寿司', cat: 'staple', kcal: 150, p: 6.0, c: 26.0, f: 2.0 },
  { name: '粽子', cat: 'staple', kcal: 200, p: 4.0, c: 38.0, f: 4.0 },
  { name: '汤圆', cat: 'staple', kcal: 250, p: 3.0, c: 40.0, f: 9.0 },
  { name: '月饼', cat: 'staple', kcal: 400, p: 6.0, c: 55.0, f: 18.0 },
  { name: '小米粥', cat: 'staple', kcal: 46, p: 1.4, c: 9.7, f: 0.4 },
  { name: '皮蛋瘦肉粥', cat: 'staple', kcal: 65, p: 3.5, c: 9.0, f: 1.8 },
  { name: '豆腐脑', cat: 'staple', kcal: 60, p: 4.0, c: 3.0, f: 3.5 },
  { name: '蒸蛋', cat: 'protein', kcal: 60, p: 5.0, c: 1.0, f: 4.0 },
  { name: '冬瓜排骨汤', cat: 'dish', kcal: 45, p: 4.0, c: 2.0, f: 2.5 },
  { name: '番茄蛋汤', cat: 'dish', kcal: 35, p: 2.0, c: 2.5, f: 2.0 },
  { name: '紫菜蛋花汤', cat: 'dish', kcal: 30, p: 2.0, c: 2.0, f: 1.8 },
  { name: '玉米排骨汤', cat: 'dish', kcal: 55, p: 4.0, c: 4.0, f: 2.5 },

  // 水果 / 饮品补充
  { name: '葡萄', cat: 'veg', kcal: 69, p: 0.7, c: 18.0, f: 0.2 },
  { name: '梨', cat: 'veg', kcal: 51, p: 0.4, c: 13.3, f: 0.2 },
  { name: '草莓', cat: 'veg', kcal: 32, p: 0.7, c: 7.7, f: 0.3 },
  { name: '猕猴桃', cat: 'veg', kcal: 61, p: 1.1, c: 14.7, f: 0.5 },
  { name: '芒果', cat: 'veg', kcal: 60, p: 0.8, c: 15.0, f: 0.4 },
  { name: '火龙果', cat: 'veg', kcal: 51, p: 1.1, c: 13.3, f: 0.2 },
  { name: '桃子', cat: 'veg', kcal: 42, p: 0.9, c: 10.1, f: 0.3 },
  { name: '椰汁', cat: 'drink', kcal: 70, p: 0.6, c: 8.0, f: 4.0 },
  { name: '果汁（橙）', cat: 'drink', kcal: 45, p: 0.7, c: 10.5, f: 0.2 },
  { name: '无糖气泡水', cat: 'drink', kcal: 1, p: 0.0, c: 0.0, f: 0.0 },
  { name: '烤红薯', cat: 'snack', kcal: 90, p: 1.6, c: 21.0, f: 0.2 },
  { name: '板栗', cat: 'snack', kcal: 214, p: 4.8, c: 46.0, f: 1.5 },
  { name: '瓜子', cat: 'snack', kcal: 570, p: 23.0, c: 13.0, f: 50.0 },
  { name: '鸡蛋灌饼', cat: 'snack', kcal: 260, p: 8.0, c: 30.0, f: 12.0 }
]

const CATS = [
  { key: 'all', label: '全部' },
  { key: 'staple', label: '主食' },
  { key: 'protein', label: '蛋白质' },
  { key: 'veg', label: '蔬果' },
  { key: 'dish', label: '菜品' },
  { key: 'drink', label: '饮品' },
  { key: 'snack', label: '零食' }
]

// 转换成页面统一使用的 per100 结构
function toItem(food, grams) {
  const g = grams || 100
  return {
    name: food.name,
    grams: g,
    per100: {
      kcal: food.kcal,
      protein: food.p,
      carb: food.c,
      fat: food.f
    }
  }
}

function search(keyword, cat) {
  const k = (keyword || '').trim()
  return FOODS.filter(function (f) {
    const okCat = !cat || cat === 'all' || f.cat === cat
    if (!okCat) return false
    if (!k) return true
    if (f.name.indexOf(k) >= 0) return true
    const list = f.alias || []
    for (let i = 0; i < list.length; i++) {
      if (list[i].indexOf(k) >= 0) return true
    }
    return false
  })
}

// 去掉括号里的做法说明，便于「米饭」匹配到「米饭」「鸡胸肉」匹配到「鸡胸肉（熟）」
function baseName(name) {
  return String(name || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s/g, '')
    .trim()
}

// 用户改了名字后，用它反查营养值：
// 1) 严格同名（含去括号同名）2) 别名 3) 库里的名字包含输入
function matchByName(name) {
  const raw = String(name || '').trim()
  const key = baseName(raw)
  if (!key) return null

  let hit = null
  FOODS.forEach(function (f) {
    if (hit) return
    if (f.name === raw || baseName(f.name) === key) hit = f
  })
  if (hit) return hit

  // 别名：西红柿炒鸡蛋 → 番茄炒蛋
  FOODS.forEach(function (f) {
    if (hit) return
    const list = f.alias || []
    for (let i = 0; i < list.length; i++) {
      if (baseName(list[i]) === key) {
        hit = f
        return
      }
    }
  })
  if (hit) return hit

  if (key.length >= 2) {
    FOODS.forEach(function (f) {
      if (hit) return
      if (baseName(f.name).indexOf(key) >= 0) hit = f
    })
  }
  return hit
}

module.exports = {
  FOODS: FOODS,
  CATS: CATS,
  toItem: toItem,
  search: search,
  baseName: baseName,
  matchByName: matchByName
}
