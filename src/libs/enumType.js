// 构造用于v-for循环的对象
export const constructData = (data, filter = (data) => { return isNaN(data) }) => {
  let obj = {}
  Object.keys(data).forEach(key => {
    if (filter(key)) {
      obj[key] = data[key]
    }
  })
  return obj
}

// 用户权限等级
export const userPrivileges = {
  '普通会员': 1,
  '超级会员': 2,
  '管理员': 3,
  '1': '普通会员',
  '2': '超级会员',
  '3': '管理员'
}

// 顾客评价等级
export const evaluateEvaluation = {
  '好评': 1,
  '中评': 2,
  '差评': 3,
  '1': '好评',
  '2': '中评',
  '3': '差评'
}
