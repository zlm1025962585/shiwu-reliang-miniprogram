// 云函数 recognizeFood：接收 { imageBase64 }，调用多模态视觉模型识别食物，
// 返回 { foods: [{ name, grams, confidence }], demo: false }
//
// 环境变量（在云开发控制台 -> 云函数 -> 函数配置 -> 环境变量里设置）：
//   VISION_API_URL   OpenAI 兼容的 chat/completions 接口地址，
//                    例如腾讯混元 / 通义千问等平台提供的兼容地址
//   VISION_API_KEY   对应平台的 API Key（只存在云端，不要写进小程序代码）
//   VISION_MODEL     视觉模型名，例如 hunyuan-vision / qwen-vl-max 等，以平台文档为准
// 未设置环境变量时返回演示数据并标注 demo: true，方便先跑通链路。
const https = require("https");

const DEMO = {
  demo: true,
  foods: [
    { name: "米饭", grams: 200, confidence: 0.96 },
    { name: "鸡胸肉", grams: 150, confidence: 0.93 },
    { name: "西兰花", grams: 150, confidence: 0.91 }
  ]
};

function postJSON(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers } },
      res => {
        let buf = "";
        res.on("data", c => (buf += c));
        res.on("end", () => {
          try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error("模型接口返回非 JSON")); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

exports.main = async (event) => {
  // 兼容两种调用方式：云函数直调（event 即参数）和 HTTP 触发（参数在 event.body 里）
  let input = event || {};
  if (typeof input.body === "string") {
    try { input = JSON.parse(input.body); } catch (e) { input = {}; }
  }
  const { VISION_API_URL, VISION_API_KEY, VISION_MODEL } = process.env;
  if (!VISION_API_URL || !VISION_API_KEY || !VISION_MODEL) return DEMO;
  if (!input.imageBase64) return { demo: false, foods: [], error: "缺少 imageBase64" };
  event = input;

  const prompt = [
    "你是食物识别助手。看这张食物照片，列出图中每种食物的中文名称、估计克数和置信度(0到1)。",
    "只输出 JSON，不要任何解释文字，格式：{\"foods\":[{\"name\":\"米饭\",\"grams\":200,\"confidence\":0.9}]}",
    "克数按常见份量估算：如一碗米饭约200克、一个鸡蛋约50克。看不清的食物不要编造。"
  ].join("\n");

  const resp = await postJSON(
    VISION_API_URL,
    { Authorization: "Bearer " + VISION_API_KEY },
    {
      model: VISION_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + event.imageBase64 } }
        ]
      }],
      temperature: 0.1
    }
  );

  const text = resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
  if (!text) return { demo: false, foods: [], error: "模型未返回内容" };
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { demo: false, foods: Array.isArray(parsed.foods) ? parsed.foods : [] };
  } catch (e) {
    return { demo: false, foods: [], error: "模型输出无法解析" };
  }
};
