// 食物识别：优先调用用户配置的真实接口；未配置时进入演示模式。
const { findFood } = require("../data/foods.js");

// 演示模式的示例识别结果（一顿典型的健身餐），仅用于体验完整流程，结果页会明确标注「演示」
const DEMO_RESULT = [
  { name: "米饭", grams: 200, confidence: 0.96 },
  { name: "鸡胸肉", grams: 150, confidence: 0.93 },
  { name: "西兰花", grams: 150, confidence: 0.91 },
  { name: "煮鸡蛋", grams: 50, confidence: 0.89 }
];

function readBase64(path) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: "base64",
      success: res => resolve(res.data),
      fail: reject
    });
  });
}

// 返回 { demo: boolean, items: [{ name, grams, confidence, food }] }
// 真实接口约定：POST JSON { imageBase64 } -> { foods: [{ name, grams, confidence }] }
async function recognize(imagePath, endpoint) {
  if (!endpoint) {
    // 模拟网络延迟，让演示流程体验完整
    await new Promise(r => setTimeout(r, 900));
    return { demo: true, items: attachFoods(DEMO_RESULT) };
  }
  const base64 = await readBase64(imagePath);
  const res = await new Promise((resolve, reject) => {
    wx.request({
      url: endpoint,
      method: "POST",
      timeout: 30000,
      data: { imageBase64: base64 },
      success: resolve,
      fail: reject
    });
  });
  if (res.statusCode !== 200 || !res.data || !Array.isArray(res.data.foods)) {
    throw new Error("识别接口返回异常（HTTP " + res.statusCode + "）");
  }
  return { demo: !!res.data.demo, items: attachFoods(res.data.foods) };
}

function attachFoods(list) {
  return (list || []).map(it => {
    const food = findFood(it.name);
    return {
      name: food ? food.name : it.name,
      grams: Number(it.grams) || (food ? food.portion : 100),
      confidence: it.confidence,
      food: food || null,
      unknown: !food
    };
  });
}

module.exports = { recognize, DEMO_RESULT };
