const store = require('../../utils/store.js')
const nutrition = require('../../utils/nutrition.js')
const foodDb = require('../../utils/food-db.js')
const ai = require('../../utils/ai.js')

const app = getApp()

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' }
]

let uidSeq = 0

function newUid() {
  uidSeq += 1
  return 'f' + Date.now() + '_' + uidSeq
}

function round1(v) {
  const n = Number(v)
  return isNaN(n) ? 0 : Math.round(n * 10) / 10
}

function num0(v) {
  const n = Number(v)
  return isNaN(n) || n < 0 ? 0 : n
}

Page({
  data: {
    image: '',
    note: '',
    items: [],
    total: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    mealType: 'lunch',
    mealTypes: MEAL_TYPES,
    saved: false,
    edit: null
  },

  onLoad() {
    const p = app.globalData.pendingMeal || {
      image: '',
      items: [],
      note: '',
      mealType: nutrition.guessMealType(new Date())
    }
    const items = (p.items || []).map(function (it) {
      return {
        uid: newUid(),
        name: it.name,
        applied: it.name,
        grams: it.grams,
        gramsText: String(it.grams),
        unit: it.unit || 'g',
        per100: it.per100,
        manual: false
      }
    })
    this.setData({
      image: p.image || '',
      note: p.note || '',
      mealType: p.mealType || 'lunch'
    })
    this.recalc(items)
  },

  onShow() {
    const picked = app.globalData.pickedFood
    const idx = this._replaceIndex
    this._replaceIndex = null
    if (!picked) return
    app.globalData.pickedFood = null

    const g = picked.grams || 100
    const items = this.data.items.slice()
    const next = {
      uid: newUid(),
      name: picked.name,
      applied: picked.name,
      grams: g,
      gramsText: String(g),
      unit: picked.unit || 'g',
      per100: picked.per100,
      manual: false
    }
    if (typeof idx === 'number' && idx >= 0 && idx < items.length) {
      // 替换而不是追加：修正某一项时用
      next.uid = items[idx].uid || next.uid
      items[idx] = next
    } else {
      items.push(next)
    }
    this.recalc(items)
  },

  recalc(items) {
    const view = items.map(function (it) {
      const n = nutrition.itemNutrient(it)
      return {
        uid: it.uid,
        name: it.name,
        applied: it.applied,
        grams: it.grams,
        gramsText: it.gramsText,
        unit: it.unit || 'g',
        per100: it.per100,
        manual: !!it.manual,
        kcal: n.kcal,
        protein: n.protein,
        carb: n.carb,
        fat: n.fat
      }
    })
    this.setData({
      items: view,
      total: nutrition.sumItems(view)
    })
  },

  onName(e) {
    const i = e.currentTarget.dataset.index
    const patch = {}
    patch['items[' + i + '].name'] = e.detail.value
    this.setData(patch)
  },

  // 名字改完才重算；只是点进输入框又点出来，不做任何事
  onNameBlur(e) {
    const i = e.currentTarget.dataset.index
    const items = this.data.items.slice()
    const cur = items[i]
    if (!cur) return

    const name = String(cur.name || '').trim()
    if (!name) {
      items[i] = Object.assign({}, cur, { name: cur.applied || '未命名食物' })
      this.recalc(items)
      return
    }
    if (name === cur.applied) return

    // 1) 以前问过模型的菜，直接复用，不再发请求
    const cached = store.getCachedFood(name)
    if (cached) {
      items[i] = this.applyNutrient(cur, cached.name || name, cached.per100)
      this.recalc(items)
      wx.showToast({ title: '已按上次查到的数据重算', icon: 'none' })
      return
    }

    // 2) 内置食物库
    const hit = foodDb.matchByName(name)
    if (hit) {
      items[i] = this.applyNutrient(cur, hit.name, {
        kcal: hit.kcal,
        protein: hit.p,
        carb: hit.c,
        fat: hit.f
      })
      this.recalc(items)
      wx.showToast({ title: '已按「' + hit.name + '」重算', icon: 'none' })
      return
    }

    // 3) 库里没有 → 直接问模型要这道菜的营养
    const cfg = store.getApi()
    if (!cfg.apiKey) {
      this.askFallback(i, name, '还没配 AI，查不了新菜')
      return
    }
    this.lookupByName(i, name)
  },

  applyNutrient(item, name, per100) {
    return Object.assign({}, item, {
      name: name,
      applied: name,
      per100: per100,
      manual: false
    })
  },

  // 问模型这道菜每 100g 的营养，成功后缓存并重算
  lookupByName(i, name) {
    const that = this
    const seq = (this._lookupSeq || 0) + 1
    this._lookupSeq = seq
    const cur0 = this.data.items[i]
    if (!cur0) return

    wx.showLoading({ title: '查「' + name.slice(0, 6) + '」中', mask: true })
    ai.lookupNutrient(name, cur0.unit, 25000)
      .then(function (r) {
        if (that._gone || that._lookupSeq !== seq) return
        wx.hideLoading()
        store.saveCachedFood(name, r.per100, r.unit)
        const items = that.data.items.slice()
        const cur = items[i]
        // 查的过程中用户又改了名字，就不要覆盖
        if (!cur || String(cur.name || '').trim() !== name) return
        items[i] = that.applyNutrient(cur, r.name || name, r.per100)
        that.recalc(items)
        wx.showToast({ title: '已按模型数据重算', icon: 'none' })
      })
      .catch(function (err) {
        if (that._gone || that._lookupSeq !== seq) return
        wx.hideLoading()
        that.askFallback(i, name, (err && err.message) || '没查到这道菜')
      })
  },

  askFallback(i, name, reason) {
    const that = this
    wx.showModal({
      title: '没能查到「' + name + '」',
      content:
        (reason ? reason + '\n\n' : '') +
        '可以手动填这一份的营养，或者从内置食物库里挑个相近的。',
      confirmText: '手动填',
      cancelText: '从库里选',
      success: function (res) {
        if (res.confirm) {
          that.openEditAt(i)
        } else if (res.cancel) {
          that.repickAt(i)
        }
      }
    })
  },

  onUnload() {
    this._gone = true
    this._lookupSeq = (this._lookupSeq || 0) + 1
  },

  onGrams(e) {
    const i = e.currentTarget.dataset.index
    const raw = e.detail.value
    const items = this.data.items.slice()
    const next = Object.assign({}, items[i])
    next.gramsText = raw
    next.grams = Math.max(0, Math.min(3000, Number(raw) || 0))
    items[i] = next
    this.recalc(items)
  },

  onRemove(e) {
    const i = e.currentTarget.dataset.index
    const items = this.data.items.slice()
    items.splice(i, 1)
    this.recalc(items)
  },

  // ---- 手动修正弹层 ----
  openEdit(e) {
    this.openEditAt(Number(e.currentTarget.dataset.index))
  },

  openEditAt(i) {
    const it = this.data.items[i]
    if (!it) return
    const grams = it.grams || 0
    this.setData({
      edit: {
        index: i,
        name: it.name,
        unit: it.unit || 'g',
        gramsText: String(grams),
        kcalText: String(it.kcal),
        pText: String(it.protein),
        cText: String(it.carb),
        fText: String(it.fat),
        // 换份量时按这份的比例同步其余数值，避免出现「份量变了热量不变」
        base: {
          grams: grams,
          kcal: it.kcal,
          protein: it.protein,
          carb: it.carb,
          fat: it.fat
        }
      }
    })
  },

  closeEdit() {
    this.setData({ edit: null })
  },

  noop() {},

  onEditField(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    const patch = {}
    patch['edit.' + field] = e.detail.value
    this.setData(patch)
  },

  onEditGrams(e) {
    const ed = this.data.edit
    if (!ed) return
    const raw = e.detail.value
    const g = Number(raw) || 0
    const patch = { 'edit.gramsText': raw }
    const base = ed.base || {}
    if (base.grams > 0 && g > 0) {
      const r = g / base.grams
      patch['edit.kcalText'] = String(Math.round(num0(base.kcal) * r))
      patch['edit.pText'] = String(round1(num0(base.protein) * r))
      patch['edit.cText'] = String(round1(num0(base.carb) * r))
      patch['edit.fText'] = String(round1(num0(base.fat) * r))
    }
    this.setData(patch)
  },

  saveEdit() {
    const ed = this.data.edit
    if (!ed) return
    const g = Math.max(0, Math.min(3000, Number(ed.gramsText) || 0))
    if (g <= 0) {
      wx.showToast({ title: '份量要大于 0', icon: 'none' })
      return
    }
    const items = this.data.items.slice()
    const cur = items[ed.index]
    if (!cur) {
      this.setData({ edit: null })
      return
    }
    items[ed.index] = Object.assign({}, cur, {
      applied: cur.name,
      grams: g,
      gramsText: String(Math.round(g)),
      per100: {
        kcal: round1((num0(ed.kcalText) * 100) / g),
        protein: round1((num0(ed.pText) * 100) / g),
        carb: round1((num0(ed.cText) * 100) / g),
        fat: round1((num0(ed.fText) * 100) / g)
      },
      manual: true
    })
    this.setData({ edit: null })
    this.recalc(items)
    wx.showToast({ title: '已更新', icon: 'success' })
  },

  // ---- 换食物 ----
  goPickFood() {
    this._replaceIndex = null
    wx.navigateTo({ url: '/pages/food-picker/food-picker' })
  },

  goRepick() {
    const ed = this.data.edit
    if (!ed) return
    this.repickAt(ed.index)
  },

  repickAt(i) {
    this._replaceIndex = Number(i)
    this.setData({ edit: null })
    wx.navigateTo({ url: '/pages/food-picker/food-picker?replace=1' })
  },

  onPickType(e) {
    this.setData({ mealType: e.currentTarget.dataset.key })
  },

  onSave() {
    if (this.data.saved) return
    if (!this.data.items.length) {
      wx.showToast({ title: '这一餐还没有食物', icon: 'none' })
      return
    }
    if (this.data.total.kcal <= 0) {
      wx.showToast({ title: '份量填一下再保存', icon: 'none' })
      return
    }

    const items = this.data.items.map(function (it) {
      return {
        name: (it.name || '食物').slice(0, 24),
        grams: Math.round(it.grams),
        unit: it.unit || 'g',
        per100: it.per100
      }
    })
    const meal = {
      id: store.genId(),
      date: store.dateStr(),
      time: store.timeStr(),
      mealType: this.data.mealType,
      items: items,
      total: nutrition.sumItems(items),
      image: '',
      note: this.data.note
    }

    this.setData({ saved: true })
    wx.showLoading({ title: '保存中…', mask: true })

    store.persistImage(this.data.image).then(function (path) {
      meal.image = path
      store.addMeal(meal)
      wx.hideLoading()
      wx.showToast({ title: '记好啦', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 480)
    })
  }
})
