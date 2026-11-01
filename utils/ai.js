// 多模态大模型调用：兼容 OpenAI /chat/completions 接口
// 支持 OpenAI、通义千问(DashScope 兼容模式)、豆包(方舟)、DeepSeek、Kimi、智谱 等
const store = require('./store.js')

const PROMPT = [
  '请识别这张餐食照片里的所有食物，估算实际份量和营养。',
  '严格要求：',
  '1) 只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释文字。',
  '2) JSON 结构：{"foods":[{"name":"食物名称","grams":这一整份的份量数字,"unit":"g 或 ml","kcal":这一整份的总千卡,"protein":蛋白质克数,"carb":碳水克数,"fat":脂肪克数}],"note":"一句话备注"}',
  '3) name 用中文常见叫法，同类合并。grams 必须是照片里**这一整份**的份量，不是每 100g，也不要用 100 这种默认值糊弄。',
  '4) 份量参考：一碗米饭 150-200g；一盘家常炒菜 250-350g；一个鸡蛋 50g；一片吐司 30g；一杯饮料 350-500ml；一听易拉罐 330ml；一瓶水 500ml。据此推断图中份量。',
  '5) 饮料、汤、奶茶、咖啡这类液体：unit 填 "ml"，按**容器的总容量**估，不要按 100ml 记。看不出容量时按 400ml 估，并在 note 里写明。',
  '6) note 必须写清最大的不确定点，例如「按 500ml 一杯计」「油量按 15g 估」。看不清份量时一定要说明。',
  '7) 最多 8 项，按热量从高到低排列。',
  '8) 看不清或图里没有食物时返回 {"foods":[],"note":"无法识别的原因"}。',
  '9) 除 unit 外，所有数值必须是数字，不要带单位和引号。'
].join('\n')

// 只问一句「这道菜每 100g 多少营养」，用于用户手改名后补数据
const NUTRIENT_PROMPT = [
  '请给出「{NAME}」每 100{UNIT} 的营养成分，用于饮食热量记录。',
  '严格要求：',
  '1) 只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释文字。',
  '2) JSON 结构：{"name":"规范菜名","kcal":每100{UNIT}千卡,"protein":蛋白质克,"carb":碳水克,"fat":脂肪克,"error":""}',
  '3) 按中国最常见的家常做法估算；同名菜各地做法差异大时取最常见的那种（例如宫保鸡丁按川菜做法）。',
  '4) 这是识别不出来的兜底查询，请给出一个合理的估算值，不要返回 0 或空。',
  '5) 若确实不是食物（比如乱码），kcal 填 0，并在 error 里写一句中文原因。',
  '6) 除 name 和 error 外，所有数值必须是数字，不带单位、不带引号。'
].join('\n')

function endpoint(baseUrl) {
  const s = (baseUrl || '').trim().replace(/\/+$/, '')
  if (!s) return ''
  if (/\/chat\/completions$/i.test(s)) return s
  return s + '/chat/completions'
}

function readBase64(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: function (res) {
        resolve(res.data)
      },
      fail: reject
    })
  })
}

function compress(src) {
  return new Promise(function (resolve) {
    wx.compressImage({
      src: src,
      quality: 76,
      success: function (res) {
        resolve(res.tempFilePath)
      },
      fail: function () {
        resolve(src)
      }
    })
  })
}

function tryParse(s) {
  try {
    return JSON.parse(s)
  } catch (e) {
    return null
  }
}

// 从模型输出里尽量稳地抠出 JSON
function extractJson(text) {
  let s = String(text || '').trim()
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) {
    s = s.substring(start, end + 1)
  }
  let out = tryParse(s)
  if (out) return out

  // 输出被截断的常见形态：{"foods":[{"name":"米饭",...},   ← 后面没了
  // 从后往前找完整的对象边界，补上 "]} 再试
  for (let i = s.length; i > 0; i--) {
    if (s.charAt(i - 1) !== '}') continue
    const head = s.substring(0, i).replace(/[,\s]+$/, '')
    out = tryParse(head + ']}')
    if (out) return out
  }
  throw new Error('parse fail')
}

function toNumber(v) {
  const n = Number(v)
  return isNaN(n) || n < 0 ? 0 : n
}

// 模型返回的该份量营养 -> 页面使用的 per100 结构
function normalizeFoods(foods) {
  const list = Array.isArray(foods) ? foods : []
  return list
    .map(function (f) {
      const grams = Math.round(toNumber(f.grams)) || 100
      const kcal = toNumber(f.kcal)
      const protein = toNumber(f.protein)
      const carb = toNumber(f.carb)
      const fat = toNumber(f.fat)
      const k = 100 / grams
      return {
        name: String(f.name || '未命名食物').slice(0, 20),
        grams: grams,
        unit: String(f.unit || '').toLowerCase() === 'ml' ? 'ml' : 'g',
        per100: {
          kcal: Math.round(kcal * k),
          protein: Math.round(protein * k * 10) / 10,
          carb: Math.round(carb * k * 10) / 10,
          fat: Math.round(fat * k * 10) / 10
        }
      }
    })
    .filter(function (f) {
      return f.per100.kcal > 0
    })
    .slice(0, 8)
}

function request(cfg, messages, timeout, useJson) {
  return new Promise(function (resolve, reject) {
    const url = endpoint(cfg.baseUrl)
    if (!url) {
      reject(new Error('还没配置接口地址，先去 AI 设置里填一下'))
      return
    }
    const payload = {
      model: cfg.model,
      messages: messages,
      temperature: 0.1,
      // 会思考的模型（DeepSeek V4、Gemini 3 等）输出前要花掉一部分额度，
      // 900 容易被截断，这里给足余量
      max_tokens: 2600
    }
    if (useJson) {
      payload.response_format = { type: 'json_object' }
    }
    wx.request({
      url: url,
      method: 'POST',
      timeout: timeout || 60000,
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (cfg.apiKey || '')
      },
      data: payload,
      success: function (res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const msg = body.choices[0].message
            const content = msg.content
            // 有些模型把正文放在数组里
            if (Array.isArray(content)) {
              resolve(
                content
                  .map(function (p) {
                    return typeof p === 'string' ? p : p && p.text ? p.text : ''
                  })
                  .join('')
              )
              return
            }
            // 正文为空但只有思考过程时，明确告诉用户原因
            if (!content && msg.reasoning_content) {
              reject(
                new Error(
                  '模型只返回了思考过程，没给出结果。通常是 max_tokens 被思考用完了，换 gemini-2.5-flash 之类不带思考的模型更稳。'
                )
              )
              return
            }
            resolve(content)
          } catch (e) {
            reject(new Error('接口返回格式不对，确认 Base URL 是 OpenAI 兼容地址'))
          }
          return
        }
        let msg = '接口返回 ' + res.statusCode
        if (body.error && body.error.message) {
          msg = body.error.message
        } else if (body.message) {
          msg = body.message
        }
        reject(new Error(msg))
      },
      fail: function (err) {
        const m = (err && err.errMsg) || ''
        const host = (url.match(/^https?:\/\/([^/?#]+)/i) || [])[1] || '接口域名'
        if (m.indexOf('domain') >= 0 || m.indexOf('url not in domain list') >= 0) {
          reject(
            new Error(
              '域名没进白名单：' +
                host +
                '\n\n这一项只有小程序作者能改，你这边没法解决。请联系作者，请他在微信后台「开发管理 → 开发设置 → 服务器域名」把 ' +
                host +
                ' 加进 request 合法域名（需已备案、HTTPS），加完把小程序彻底关掉重进。\n\n临时绕过：把小程序从后台划掉，重新扫码进入后，点右上角「··· → 打开调试」，重启即可。'
            )
          )
          return
        }
        reject(new Error('网络请求失败：' + m))
      }
    })
  })
}

// 识别一张图，返回 { items, note }
function recognize(imagePath) {
  return new Promise(function (resolve, reject) {
    const cfg = store.getApi()
    if (!cfg.apiKey) {
      const err = new Error('还没有填 API Key')
      err.code = 'NO_KEY'
      reject(err)
      return
    }
    compress(imagePath)
      .then(readBase64)
      .then(function (b64) {
        const messages = [
          {
            role: 'system',
            content:
              '你是经验丰富的中式饮食营养师，擅长根据照片估算份量与热量，并且只输出 JSON。'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              {
                type: 'image_url',
                image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'low' }
              }
            ]
          }
        ]
        return request(cfg, messages, 70000, true).catch(function (e) {
          // 有的服务商不认 response_format，退一步用纯提示词约束重试一次
          const m = (e && e.message) || ''
          if (/response_format|json_object|unsupported|not support|invalid/i.test(m)) {
            return request(cfg, messages, 70000, false)
          }
          throw e
        })
      })
      .then(function (content) {
        const text = String(content === null || content === undefined ? '' : content).trim()
        console.log('[ai] 原始返回', text.slice(0, 400))
        if (!text) {
          throw new Error(
            '模型返回了空内容。多半是输出长度被截断，或这个模型还不支持看图——换 deepseek-flash 或 gemini-2.5-flash 试试。'
          )
        }
        let parsed
        try {
          parsed = extractJson(text)
        } catch (e) {
          throw new Error(
            '模型没返回可解析的结果\n\n原始返回：' + text.replace(/\s+/g, ' ').slice(0, 140)
          )
        }
        return {
          items: normalizeFoods(parsed.foods),
          note: parsed.note || ''
        }
      })
      .then(resolve)
      .catch(reject)
  })
}

// 按菜名查每 100g/ml 的营养。用户手改菜名、内置库里又没有时用它兜底
function lookupNutrient(name, unit, timeout) {
  return new Promise(function (resolve, reject) {
    const cfg = store.getApi()
    if (!cfg.apiKey) {
      const err = new Error('还没有填 API Key')
      err.code = 'NO_KEY'
      reject(err)
      return
    }
    const u = unit === 'ml' ? 'ml' : 'g'
    const messages = [
      {
        role: 'system',
        content: '你是中国食物成分数据库，只输出 JSON，数值按每 100 克或毫升给出。'
      },
      {
        role: 'user',
        content: NUTRIENT_PROMPT.replace(/\{NAME\}/g, String(name)).replace(/\{UNIT\}/g, u)
      }
    ]
    const t = timeout || 25000
    request(cfg, messages, t, true)
      .catch(function (e) {
        const m = (e && e.message) || ''
        if (/response_format|json_object|unsupported|not support|invalid/i.test(m)) {
          return request(cfg, messages, t, false)
        }
        throw e
      })
      .then(function (content) {
        const text = String(content === null || content === undefined ? '' : content).trim()
        console.log('[ai] 查营养返回', text.slice(0, 300))
        if (!text) throw new Error('模型返回了空内容')
        let parsed
        try {
          parsed = extractJson(text)
        } catch (e) {
          throw new Error('模型返回的不是 JSON：' + text.replace(/\s+/g, ' ').slice(0, 80))
        }
        const kcal = toNumber(parsed.kcal)
        if (kcal <= 0) {
          throw new Error(parsed.error ? String(parsed.error) : '模型说这不是食物')
        }
        resolve({
          name: String(parsed.name || name).slice(0, 20),
          unit: u,
          per100: {
            kcal: Math.round(kcal),
            protein: Math.round(toNumber(parsed.protein) * 10) / 10,
            carb: Math.round(toNumber(parsed.carb) * 10) / 10,
            fat: Math.round(toNumber(parsed.fat) * 10) / 10
          }
        })
      })
      .catch(reject)
  })
}

// 连通性测试：发一条最小的纯文本请求
function testConnection() {
  const cfg = store.getApi()
  if (!cfg.apiKey) return Promise.reject(new Error('请先填写 API Key'))
  if (!cfg.model) return Promise.reject(new Error('请先填写模型名'))
  return request(
    cfg,
    [{ role: 'user', content: '回答两个字：正常' }],
    30000
  ).then(function (content) {
    return String(content || '').trim()
  })
}

module.exports = {
  recognize: recognize,
  lookupNutrient: lookupNutrient,
  testConnection: testConnection,
  endpoint: endpoint,
  PROMPT: PROMPT,
  NUTRIENT_PROMPT: NUTRIENT_PROMPT
}
