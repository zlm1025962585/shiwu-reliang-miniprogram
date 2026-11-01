// 营养计算：基础代谢、每日消耗、目标摄入、餐次合计
function num(v, d) {
  const n = Number(v)
  return isNaN(n) ? d : n
}

// Mifflin-St Jeor
function bmr(p) {
  const w = num(p.weight, 70)
  const h = num(p.height, 175)
  const a = num(p.age, 28)
  if (p.gender === 'female') {
    return Math.round(10 * w + 6.25 * h - 5 * a - 161)
  }
  return Math.round(10 * w + 6.25 * h - 5 * a + 5)
}

const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
}

function tdee(base, activity) {
  return Math.round(base * (ACTIVITY[activity] || 1.375))
}

// 目标调整：减脂 -20%，维持 0，增肌 +10%
function targetIntake(total, goal) {
  if (goal === 'fat_loss') return Math.round(total * 0.8)
  if (goal === 'muscle_gain') return Math.round(total * 1.1)
  return total
}

// 单项按每 100g 营养换算出实际摄入
function itemNutrient(item) {
  const g = num(item.grams, 0)
  const per = item.per100 || { kcal: 0, protein: 0, carb: 0, fat: 0 }
  const ratio = g / 100
  return {
    kcal: Math.round(per.kcal * ratio),
    protein: Math.round(per.protein * ratio * 10) / 10,
    carb: Math.round(per.carb * ratio * 10) / 10,
    fat: Math.round(per.fat * ratio * 10) / 10
  }
}

function sumItems(items) {
  const total = { kcal: 0, protein: 0, carb: 0, fat: 0 }
  ;(items || []).forEach(function (it) {
    const n = itemNutrient(it)
    total.kcal += n.kcal
    total.protein += n.protein
    total.carb += n.carb
    total.fat += n.fat
  })
  total.kcal = Math.round(total.kcal)
  total.protein = Math.round(total.protein * 10) / 10
  total.carb = Math.round(total.carb * 10) / 10
  total.fat = Math.round(total.fat * 10) / 10
  return total
}

function sumMeals(meals) {
  return sumItems(
    (meals || []).reduce(function (acc, m) {
      return acc.concat(m.items || [])
    }, [])
  )
}

// 按时间推断餐次
function guessMealType(date) {
  const h = (date || new Date()).getHours()
  if (h < 10) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

const MEAL_LABEL = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

module.exports = {
  bmr: bmr,
  tdee: tdee,
  targetIntake: targetIntake,
  itemNutrient: itemNutrient,
  sumItems: sumItems,
  sumMeals: sumMeals,
  guessMealType: guessMealType,
  MEAL_LABEL: MEAL_LABEL,
  ACTIVITY: ACTIVITY
}
