// 本地存储封装：餐次记录、身体档案、API 配置
const KEY_MEALS = 'meals_v1'
const KEY_PROFILE = 'profile_v1'
const KEY_API = 'api_config_v1'
const KEY_API_VER = 'api_config_ver'
const KEY_FOOD_CACHE = 'food_cache_v1'
const CACHE_LIMIT = 300
// 配置版本：老版本存在手机里的配置会在启动时自动纠正成新的默认值
const API_VER = 2

const DEFAULT_PROFILE = {
  gender: 'male',
  age: 28,
  height: 175,
  weight: 70,
  activity: 'light',
  goal: 'fat_loss'
}

// 默认指向 DeepSeek：国内可直连、支持读图，用户只需补一个 Key
const DEFAULT_API = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-flash',
  apiKey: ''
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function dateStr(d) {
  const t = d || new Date()
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
}

function timeStr(d) {
  const t = d || new Date()
  return pad(t.getHours()) + ':' + pad(t.getMinutes())
}

// 统一整理用户输入的地址：去空格、去末尾斜杠、去掉 DeepSeek 多余的 /v1
function cleanBase(u) {
  let s = String(u || '')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')
  if (!s) return ''
  // 忘了写协议头会报「域名协议头非法」，这里自动补 https://
  // 只对域名生效，IP、localhost 这类本地地址不乱动
  if (!/^https?:\/\//i.test(s) && /^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(:\d+)?(\/|$)/i.test(s) && !/^localhost/i.test(s)) {
    s = 'https://' + s
  }
  // DeepSeek 官方地址带不带 /v1 都能通，但面板上统一显示成不带 /v1 的形式
  if (/^https?:\/\/api\.deepseek\.com(\/v1)?$/i.test(s)) {
    return 'https://api.deepseek.com'
  }
  return s
}

function copyDefault() {
  return {
    baseUrl: DEFAULT_API.baseUrl,
    model: DEFAULT_API.model,
    apiKey: ''
  }
}

// 老版本（默认 OpenAI / DeepSeek 带 /v1）留下的本地配置，自动纠正
function migrateApi() {
  const ver = Number(wx.getStorageSync(KEY_API_VER) || 0)
  if (ver >= API_VER) return
  let cfg = wx.getStorageSync(KEY_API)
  const key = (cfg && cfg.apiKey) || ''
  if (!cfg || !cfg.baseUrl) {
    cfg = copyDefault()
    cfg.apiKey = key
  } else if (!key && /api\.openai\.com/i.test(cfg.baseUrl)) {
    // 从没填过 Key 说明还在用旧的 OpenAI 默认值，直接换成 DeepSeek 默认
    cfg = copyDefault()
  } else {
    cfg = {
      baseUrl: cleanBase(cfg.baseUrl),
      model: cfg.model || DEFAULT_API.model,
      apiKey: key
    }
  }
  wx.setStorageSync(KEY_API, cfg)
  wx.setStorageSync(KEY_API_VER, API_VER)
}

function ensureProfile() {
  if (!wx.getStorageSync(KEY_PROFILE)) {
    wx.setStorageSync(KEY_PROFILE, DEFAULT_PROFILE)
  }
  migrateApi()
  if (!wx.getStorageSync(KEY_API)) {
    wx.setStorageSync(KEY_API, copyDefault())
  }
}

function getProfile() {
  return wx.getStorageSync(KEY_PROFILE) || DEFAULT_PROFILE
}

function saveProfile(p) {
  wx.setStorageSync(KEY_PROFILE, p)
}

function getApi() {
  // 兜底再迁移一次：直接从设置页进来、没走 app.onLaunch 的情况也不会读到脏数据
  migrateApi()
  const v = wx.getStorageSync(KEY_API)
  return v || copyDefault()
}

function saveApi(cfg) {
  wx.setStorageSync(KEY_API, {
    baseUrl: cleanBase(cfg && cfg.baseUrl),
    model: (cfg && cfg.model ? String(cfg.model) : '').trim(),
    apiKey: (cfg && cfg.apiKey ? String(cfg.apiKey) : '').trim()
  })
}

// 恢复默认：地址、模型回到 DeepSeek，Key 保留（不要求用户重填）
function resetApi() {
  const cur = wx.getStorageSync(KEY_API) || {}
  const cfg = copyDefault()
  cfg.apiKey = cur.apiKey || ''
  wx.setStorageSync(KEY_API, cfg)
  wx.setStorageSync(KEY_API_VER, API_VER)
  return cfg
}

function getMeals() {
  return wx.getStorageSync(KEY_MEALS) || []
}

function saveMeals(list) {
  wx.setStorageSync(KEY_MEALS, list)
}

function addMeal(meal) {
  const list = getMeals()
  list.unshift(meal)
  saveMeals(list)
  return list
}

function updateMeal(meal) {
  const list = getMeals()
  const idx = list.findIndex(function (m) {
    return m.id === meal.id
  })
  if (idx >= 0) {
    list[idx] = meal
    saveMeals(list)
  }
}

function removeMeal(id) {
  const list = getMeals().filter(function (m) {
    return m.id !== id
  })
  saveMeals(list)
}

function mealsOf(date) {
  return getMeals().filter(function (m) {
    return m.date === date
  })
}

function genId() {
  return 'm' + Date.now() + Math.floor(Math.random() * 1000)
}

// ---- 自建食物缓存：用户手改名后问过模型的菜，记下来下次直接用 ----
function foodKey(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, 20)
}

function getFoodCache() {
  return wx.getStorageSync(KEY_FOOD_CACHE) || {}
}

function getCachedFood(name) {
  const k = foodKey(name)
  if (!k) return null
  const hit = getFoodCache()[k]
  if (!hit || !hit.per100 || !(hit.per100.kcal > 0)) return null
  return hit
}

function saveCachedFood(name, per100, unit) {
  const k = foodKey(name)
  if (!k || !per100 || !(per100.kcal > 0)) return
  const cache = getFoodCache()
  cache[k] = {
    name: String(name || '').slice(0, 20),
    per100: per100,
    unit: unit === 'ml' ? 'ml' : 'g',
    at: Date.now()
  }
  // 超过上限时按时间淘汰最旧的，避免撑爆本地存储
  const keys = Object.keys(cache)
  if (keys.length > CACHE_LIMIT) {
    keys
      .sort(function (a, b) {
        return (cache[a].at || 0) - (cache[b].at || 0)
      })
      .slice(0, keys.length - CACHE_LIMIT)
      .forEach(function (old) {
        delete cache[old]
      })
  }
  wx.setStorageSync(KEY_FOOD_CACHE, cache)
}

function clearFoodCache() {
  wx.removeStorageSync(KEY_FOOD_CACHE)
}

// 把临时图片存到本地用户目录，失败则返回空串（不阻断记录）
function persistImage(tempPath) {
  return new Promise(function (resolve) {
    if (!tempPath) {
      resolve('')
      return
    }
    try {
      const fs = wx.getFileSystemManager()
      const ext = (String(tempPath).match(/\.(\w+)$/) || [])[1] || 'jpg'
      const target = wx.env.USER_DATA_PATH + '/meal_' + Date.now() + '.' + ext
      fs.saveFile({
        tempFilePath: tempPath,
        filePath: target,
        success: function () {
          resolve(target)
        },
        fail: function () {
          resolve('')
        }
      })
    } catch (e) {
      resolve('')
    }
  })
}

module.exports = {
  dateStr: dateStr,
  timeStr: timeStr,
  ensureProfile: ensureProfile,
  getProfile: getProfile,
  saveProfile: saveProfile,
  getApi: getApi,
  saveApi: saveApi,
  resetApi: resetApi,
  getMeals: getMeals,
  saveMeals: saveMeals,
  addMeal: addMeal,
  updateMeal: updateMeal,
  removeMeal: removeMeal,
  mealsOf: mealsOf,
  genId: genId,
  persistImage: persistImage,
  getCachedFood: getCachedFood,
  saveCachedFood: saveCachedFood,
  clearFoodCache: clearFoodCache,
  DEFAULT_PROFILE: DEFAULT_PROFILE,
  DEFAULT_API: DEFAULT_API
}
