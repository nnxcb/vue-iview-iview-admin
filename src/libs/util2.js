/* eslint-disable */
import axios from '@/libs/api.request'

let util = {

}

util.getRouterObjByName = function (routers, name) {
  if (!name || !routers || !routers.length) {
    return null
  }
  let routerObj = null
  for (let item of routers) {
    if (item.name === name) {
      return item
    }
    routerObj = util.getRouterObjByName(item.children, name)
    if (routerObj) {
      return routerObj
    }
  }
  return null
}

util.toDefaultPage = function (routers, name, route, next) {
  let len = routers.length
  let i = 0
  let notHandle = true
  while (i < len) {
    if (routers[i].name === name && routers[i].children && routers[i].redirect === undefined) {
      route.replace({
        name: routers[i].children[0].name
      })
      notHandle = false
      next()
      break
    }
    i++
  }
  if (notHandle) {
    next()
  }
}

util.hasPermissionValue = function (filter) {
  let ret = false
  if (filter === 'noAccess') return true
  if (filter === 'lockAccess') return false
  if (localStorage.permissionInfoList) {
    let permissionInfoList = JSON.parse(localStorage.permissionInfoList)
    for (let permission of permissionInfoList) {
      if (permission.permissionValue === filter) {
        ret = true
        break
      }
    }
  }
  return ret
}

util.Notice = function (vm, type, title, desc = '', duration = 3, render = undefined) {
  if (type === 'info') {
    vm.$Notice.info({
      title: title,
      desc: desc,
      duration: duration,
      render: render
    })
  } else if (type === 'success') {
    vm.$Notice.success({
      title: title,
      desc: desc,
      duration: duration,
      render: render
    })
  } else if (type === 'warning') {
    vm.$Notice.warning({
      title: title,
      desc: desc,
      duration: duration,
      render: render
    })
  } else if (type === 'error') {
    vm.$Notice.error({
      title: title,
      desc: desc,
      duration: duration,
      render: render
    })
  }
}

util.processRequest = (vm, url, method, reqData, fOk = null, fError = null, timeout = 15000) => {
  axios.request({
    url: url,
    method: method,
    data: reqData,
    timeout: timeout
  }).then(res => {
    if (typeof fOk === 'function') {
      fOk(vm, res)
    } else {
      // console.log('非法函数')
    }
  }).catch(err => {
    if (err !== undefined) {
      if (err.code == 10001) {
        util.Notice(vm, 'error', '登陆超时,3秒后自动退出')
        setTimeout(() => {
          vm.$store.dispatch('handleLogOut', { vm: vm }).then(() => {
          }).catch(err => {
          })
        }, 3000)
        return
      }
    }
    if (typeof fError === 'function') {
      if (err.status) {
        err = '数据处理异常，请联系管理人员'
      }
      if (err.down) {
        vm.$router.push({ name: 'error_500', query: { down: true } })
        return
      }
      fError(vm, err.message, err.code)
    } else {
      // console.log('非法函数')
    }
  })
}

// 表格数据修改确认窗口
util.confirmModal = function (vm, title, hint, name, hint2, fok, fcancel, data, index, colorType = 'edit') {
  vm.$Modal.confirm({
    title: title,
    render: (h, params) => {
      return h('div', {
        // class: ['tip'],
        style: {
          'font-family': '"Microsoft YaHei","微软雅黑",Arial,sans-serif',
          'font-size': '1.3em',
          'word-wrap': 'break-all'
        }
      }, [
        h('Icon', {
          props: {
            type: 'information-circled',
            size: 40
          },
          style: {
            // "height": '80px',
            'padding': '20px 15px',
            'color': 'rgb(253,142,32)'
          }
        }),
        h('span', {
          style: {
            // 'height': '80px',
            'position': 'absolute',
            'top': '50%',
            'margin-top': '-10px',
            'word-wrap': 'break-all'
          }
        }, [
          '确定要' + hint,
          h('strong', {
            style: {
              color: colorType === 'edit' ? '#2d8cf0' : 'rgb(249, 103, 104)'
            }
          }, name),
          hint2 + '？'
        ])
      ])
    },
    okText: '确定',
    cancelText: '取消',
    closable: false,
    onOk: () => {
      // console.log(func)
      fok(data, index)
    },
    onCancel: () => {
      if (fcancel !== null && fcancel !== undefined) {
        fcancel(data, index)
      }
    }
  })
}

export default util
