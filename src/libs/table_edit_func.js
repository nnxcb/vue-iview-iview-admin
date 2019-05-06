import util from '@/libs/util2.js'

export const toolButtonEdit = (vm, h, params, access) => {
  return h('Button', {
    props: {
      type: 'primary',
      size: 'small',
      disabled: (!util.hasPermissionValue('superman:full') &&
          !util.hasPermissionValue(access)) ||
        (vm.isEditing && !params.row.cellEditable) || params.row.isUpdating
    },
    // style: {
    //   marginRight: '2px'
    // },
    on: {
      click: () => {
        if (vm.isAppending) {
          vm.confirmAdd(vm.listArr[params.index], params.index)
        } else {
          vm.executeUpdate(vm.listArr[params.index], params.index)
        }
      }
    }
  }, params.row.cellEditable ? '保存' : '编辑')
}

export const toolButtonCancel = (vm, h, params) => {
  return h('Button', {
    props: {
      type: 'primary',
      size: 'small',
      disabled: !params.row.cellEditable || params.row.isUpdating
    },
    // style: {
    //   marginRight: '2px'
    // },
    on: {
      click: () => {
        if (vm.isAppending) {
          vm.resetRow2(vm.listArr[params.index], params.index)
        } else {
          vm.resetRow(vm.listArr[params.index], params.index)
        }
      }
    }
  }, '取消')
}

export const toolButtonDelete = (vm, h, params, access) => {
  return h('Button', {
    props: {
      type: 'error',
      size: 'small',
      disabled: (!util.hasPermissionValue('superman:full') &&
          !util.hasPermissionValue(access)) || vm.isEditing ||
        params.row.isUpdating
    },
    // style: {
    //   marginRight: '2px'
    // },
    on: {
      click: () => {
        vm.confirmDeleteData(vm.listArr[params.index], params.index)
      }
    }
  }, '删除')
}

export const toolButton = (vm, h, params, btnType, btnTxt, btnDisabled = () => { return () => false }, onClick = (data, index) => { return () => {} }) => {
  return h('Button', {
    props: {
      type: btnType,
      size: 'small',
      disabled: btnDisabled()// vm.isEditing || params.row.isUpdating
    },
    // style: {
    //   marginRight: '2px',
    //   marginTop: '1px',
    //   marginBottom: '1px'
    // },
    on: {
      click: onClick(params.row, params.index)
    }
  }, btnTxt)
}

export const toolButtonPoptip = (vm, h, params, poptip, btnType, btnTxt,
  btnDisabled = () => { return () => false }, onOk = (data, index) => { return () => {} },
  onCancel = (data, index) => { return () => {} }, placement = 'top') => {
  const btn = () => {
    return h('Button', {
      props: {
        type: btnType,
        size: 'small',
        disabled: btnDisabled()// vm.isEditing || params.row.isUpdating
      }
      // style: {
      //   marginRight: '2px',
      //   marginTop: '1px',
      //   marginBottom: '1px'
      // }
    }, btnTxt)
  }
  return h('Poptip', {
    props: {
      placement: placement,
      confirm: true,
      transfer: true,
      title: poptip
    },
    on: {
      'on-ok': onOk(params.row, params.index),
      'on-cancel': onCancel(params.row, params.index)
    }
  }, [
    btn()
  ])
}

export const cellInput = (vm, column, h, params, placeholder = '', type = '') => {
  let currentRow = vm.listArr[params.index]
  if (currentRow.cellEditable) {
    return h('Input', {
      props: {
        value: currentRow[column.key],
        type: type || (column.key === 'description' ? 'textarea' : 'text'),
        placeholder: placeholder
      },
      on: {
        'on-change': (event) => {
          vm.tempData[column.key] = event.target.value
        }
      }
    })
  } else {
    return h('span', currentRow[column.key])
  }
}

export const cellTimeSelect = (vm, column, h, params, type) => {
  let currentRow = vm.listArr[params.index]
  if (currentRow.cellEditable) {
    return h('DatePicker', {
      props: {
        value: currentRow[column.key],
        type: 'date',
        placeholder: '选择时间',
        transfer: true
      },
      on: {
        'on-change': (data) => {
          if (type === 'start') {
            vm.tempData[column.key] = new Date(data)
          } else {
            vm.tempData[column.key] = new Date(new Date(data).valueOf() + 24 * 3600 * 1000 - 1000)
          }
        }
      }
    })
  } else {
    let val = currentRow[column.key]
    return h('span', val.replace('T', ' '))
  }
}

export const cellSingleSelect = (vm, column, h, params, enumInfo, editable = () => true) => {
  let currentRow = vm.listArr[params.index]
  let val = currentRow[column.key]
  let children = []
  for (let key in enumInfo) {
    if (isNaN(key)) {
      continue
    }
    children.push(h('Option', {
      props: {
        value: enumInfo[key],
        label: enumInfo[key]
      }
    }, enumInfo[key]))
  }
  if (currentRow.cellEditable) {
    if (!editable()) {
      return h('div', enumInfo[val])
    }
    return h('i-select', {
      props: {
        value: enumInfo[val],
        transfer: true
      },
      style: {
        maxWidth: '190px'
      },
      on: {
        'on-change': (val) => {
          let realVal = enumInfo[val]
          vm.tempData[column.key] = realVal
        }
      }
    }, children)
  } else {
    return h('div', enumInfo[val])
  }
}

export const cellMultiSelect = (vm, column, h, params, enumInfo, delimiters) => {
  let currentRow = vm.listArr[params.index]
  let val = currentRow[column.key]
  let children = []
  for (let key in enumInfo) {
    if (isNaN(key)) {
      continue
    }
    children.push(h('Option', {
      props: {
        value: enumInfo[key]
      }
    }, enumInfo[key]))
  }
  if (!val) val = ''
  let arr = val.split(delimiters).filter(Boolean).map((item) => {
    return enumInfo[item]
  })
  if (currentRow.cellEditable) {
    return h('i-select', {
      props: {
        value: arr,
        transfer: true,
        multiple: true
      },
      style: {
        maxWidth: '190px'
      },
      on: {
        'on-change': (val) => {
          vm.tempData[column.key] = ''
          for (let data of val) {
            vm.tempData[column.key] += enumInfo[data]
            vm.tempData[column.key] += delimiters
          }
        }
      }
    }, children)
  } else {
    return h('div', arr.join('/'))
  }
}

export const cellSwitch = (vm, column, h, params, disabled, trueVal, falseVal, openText = '', closeText = '') => {
  let currentRow = vm.listArr[params.index]
  let value = currentRow[column.key] === trueVal
  let props = {
    value: value,
    size: 'large',
    disabled: disabled || params.row.isUpdating || vm.isAppending
  }
  let on = {
    'on-change': (val) => {
      if (!vm.isEditing) {
        vm.tempData[column.key] = val === true ? trueVal : falseVal
        if (vm.templistArr) {
          vm.templistArr[params.index] = Object.assign({}, currentRow)
        }
        vm.update(vm.listArr[params.index], params.index)
      } else {
        vm.tempData[column.key] = val === true ? trueVal : falseVal
      }
    }
  }
  let slot = [
    h('span', {
      slot: 'open'
    }, openText),
    h('span', {
      slot: 'close'
    }, closeText)
  ]
  return h('i-switch', {
    props: props,
    on: on
  }, slot)
}

export const toolButtonInputNumber = (vm, column, h, params, min = 1, max = 1024) => {
  let currentRow = vm.listArr[params.index]
  let val = currentRow[column.key]
  if (currentRow.cellEditable) {
    return h('InputNumber', {
      props: {
        min: min,
        max: max,
        value: val
      },
      on: {
        'on-change': (val) => {
          vm.tempData[column.key] = val
        }
      }
    })
  } else {
    return h('div', val)
  }
}

export const toolPopPane = (h, params, modifyOptions) => {
  const cell = (option) => {
    return h('Cell', {
      props: {
        name: option.name,
        title: option.title
      }
    }, option.title)
  }
  const infoPane = () => {
    let children = []
    for (let option of modifyOptions) {
      children.push(cell(option))
    }
    return h('CellGroup', {
      on: {
        'on-click': (name) => {
          for (let option of modifyOptions) {
            if (option.name === name) {
              option.cb(params.row, params.index)
              break
            }
          }
        }
      },
      slot: 'content'
    }, children)
  }
  return h('Poptip', {
    props: {
      // transfer: true,
      placement: 'bottom-end',
      padding: '0 0'
    }
  }, [
    h('Button', {
      props: {
        type: 'primary',
        size: 'small'
      },
      style: {
        marginRight: '2px'
      }
    }, '修改'),
    infoPane()
  ])
}
