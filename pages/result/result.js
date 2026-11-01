const { searchFoods, findFood, calc } = require("../../data/foods.js");
const { recognize } = require("../../utils/recognize.js");
const store = require("../../utils/store.js");

// 营养库没有的食物，用通用估算值兜底
const FALLBACK_FOOD = { name: "", kcal: 150, protein: 8, fat: 6, carbs: 16, portion: 100, unit: "一份" };

Page({
  data: {
    image: "", loading: false, demo: false, error: "",
    meal: "", items: [], total: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
    keyword: "", candidates: []
  },

  async onLoad(options) {
    const app = getApp();
    const image = app.globalData.pendingImage || "";
    const manual = options && options.manual === "1";
    this.setData({
      image,
      meal: store.mealByTime(Date.now()),
      candidates: searchFoods("").slice(0, 12)
    });
    if (!image || manual) return; // 手动模式：直接添加食物
    this.setData({ loading: true });
    try {
      const settings = app.getSettings();
      const result = await recognize(image, settings.recognizeEndpoint);
      this.setData({ demo: result.demo });
      this.setItems(result.items.map(it => this.toRow(it)));
    } catch (e) {
      this.setData({ error: "识别失败：" + (e.message || e.errMsg || "网络异常") + "。你可以在下方手动搜索添加食物。" });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 把 { name, grams, confidence, food } 转成可编辑行
  toRow(it) {
    const food = it.food || { ...FALLBACK_FOOD, name: it.name };
    const n = calc(food, it.grams);
    return {
      name: it.name,
      grams: it.grams,
      confidence: it.confidence,
      confidenceText: it.confidence ? Math.round(it.confidence * 100) + "%" : "",
      unknown: !!it.unknown,
      per100: food.kcal,
      nProtein: n.protein, nFat: n.fat, nCarbs: n.carbs,
      kcal: n.kcal,
      _food: food
    };
  },

  setItems(items) {
    const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    items.forEach(r => {
      total.kcal += r.kcal; total.protein += r.nProtein; total.fat += r.nFat; total.carbs += r.nCarbs;
    });
    total.protein = Math.round(total.protein * 10) / 10;
    total.fat = Math.round(total.fat * 10) / 10;
    total.carbs = Math.round(total.carbs * 10) / 10;
    this.setData({ items, total });
  },

  recalcRow(row) {
    const n = calc(row._food, row.grams);
    return { ...row, kcal: n.kcal, nProtein: n.protein, nFat: n.fat, nCarbs: n.carbs };
  },

  changeGrams(e) {
    const { idx, delta } = e.currentTarget.dataset;
    const items = this.data.items.slice();
    items[idx].grams = Math.max(10, Math.min(1000, Number(items[idx].grams) + Number(delta)));
    items[idx] = this.recalcRow(items[idx]);
    this.setItems(items);
  },

  slideGrams(e) {
    const idx = e.currentTarget.dataset.idx;
    const items = this.data.items.slice();
    items[idx].grams = e.detail.value;
    items[idx] = this.recalcRow(items[idx]);
    this.setItems(items);
  },

  inputGrams(e) {
    const idx = e.currentTarget.dataset.idx;
    const v = Number(e.detail.value);
    if (!v || v <= 0) return;
    const items = this.data.items.slice();
    items[idx].grams = Math.min(2000, v);
    items[idx] = this.recalcRow(items[idx]);
    this.setItems(items);
  },

  removeItem(e) {
    const idx = e.currentTarget.dataset.idx;
    const items = this.data.items.slice();
    items.splice(idx, 1);
    this.setItems(items);
  },

  onSearch(e) {
    const keyword = e.detail.value;
    this.setData({ keyword, candidates: searchFoods(keyword).slice(0, 20) });
  },

  addFood(e) {
    const food = findFood(e.currentTarget.dataset.name);
    if (!food) return;
    const row = this.toRow({ name: food.name, grams: food.portion, food });
    this.setItems(this.data.items.concat(row));
    wx.showToast({ title: "已添加 " + food.name, icon: "none" });
  },

  save() {
    if (!this.data.items.length) return;
    const now = Date.now();
    const record = {
      id: "r" + now,
      time: now,
      dateStr: store.dateStr(now),
      meal: this.data.meal,
      image: this.data.image || "",
      demo: this.data.demo,
      items: this.data.items.map(r => ({
        name: r.name, grams: r.grams, kcal: r.kcal,
        protein: r.nProtein, fat: r.nFat, carbs: r.nCarbs
      })),
      totalKcal: this.data.total.kcal,
      totalProtein: this.data.total.protein,
      totalFat: this.data.total.fat,
      totalCarbs: this.data.total.carbs
    };
    store.addRecord(record);
    wx.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => wx.switchTab({ url: "/pages/history/history" }), 600);
  }
});
