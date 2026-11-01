// 本地记录存储（wx.setStorageSync）
// record: { id, time(ms), dateStr(YYYY-MM-DD), meal, image, demo, items:[{name, grams, kcal, protein, fat, carbs}], totalKcal, totalProtein, totalFat, totalCarbs }
const KEY = "meal_records";

function dateStr(ts) {
  const d = new Date(ts);
  const p = n => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function todayStr() { return dateStr(Date.now()); }

function mealByTime(ts) {
  const h = new Date(ts).getHours();
  if (h < 10) return "早餐";
  if (h < 14) return "午餐";
  if (h < 21) return "晚餐";
  return "加餐";
}

function getRecords() {
  return wx.getStorageSync(KEY) || [];
}

function addRecord(record) {
  const list = getRecords();
  list.unshift(record);
  wx.setStorageSync(KEY, list);
  return record;
}

function removeRecord(id) {
  const list = getRecords().filter(r => r.id !== id);
  wx.setStorageSync(KEY, list);
}

function clearRecords() { wx.removeStorageSync(KEY); }

function totalsForDate(ds) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, count: 0 };
  getRecords().filter(r => r.dateStr === ds).forEach(r => {
    t.kcal += r.totalKcal || 0;
    t.protein += r.totalProtein || 0;
    t.fat += r.totalFat || 0;
    t.carbs += r.totalCarbs || 0;
    t.count += 1;
  });
  t.protein = Math.round(t.protein * 10) / 10;
  t.fat = Math.round(t.fat * 10) / 10;
  t.carbs = Math.round(t.carbs * 10) / 10;
  return t;
}

// 最近 7 天（含今天）每天总热量，旧到新
function last7Days() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const ts = Date.now() - i * 24 * 3600 * 1000;
    const ds = dateStr(ts);
    out.push({ dateStr: ds, label: (new Date(ts).getMonth() + 1) + "/" + new Date(ts).getDate(), kcal: totalsForDate(ds).kcal });
  }
  return out;
}

module.exports = { dateStr, todayStr, mealByTime, getRecords, addRecord, removeRecord, clearRecords, totalsForDate, last7Days };
