<template>
  <div>
    <Table
      :data="listArr"
      :columns="columnList"
      stripe :border="true"
      :highlight-row="true"
      style="margin:10px auto"
      :loading="loadingData"
      class="ct-table">
      <div slot="header" style="position: relative;">
        <!-- <Button type="primary" style="position: absolute;right: 0;margin-top: 5px;margin-right: 10px;"
          size="large" :disabled="isEditing" @click="addFakeDataDictionary">添加
        </Button> -->
        <Row type="flex" justify="center">
          <span class="table-header">商品列表</span>
        </Row>
      </div>
    </Table>
    <div style="margin: 10px;overflow: hidden;">
      <div style="float: right;">
        <Page :total="totalCount" :current.sync="currentPage" :page-size="pageSize" @on-change="loadData(); isEditing = false; isAppending = false;"></Page>
      </div>
    </div>
    <Modal v-model="photoModal" width="550" footer-hide>
      <img :src="photoSrc" width="100%">
    </Modal>
    <Modal v-model="photoUpload" footer-hide>
      <form enctype="multipart/form-data">
        <input type="file" id="fileccc" @change="getFile($event)">
        <Button v-if="canUpload" @click="submitForm($event)">确定</Button>
      </form>
      <!-- <img :src="imgSrc" alt="" v-if="showImg" width="500px" height="auto"><br> -->
    </Modal>
  </div>
</template>

<script>
import '@/assets/css/custom-table.less'
import { cellInput, cellSwitch, toolButtonDelete, toolButtonEdit, toolButtonCancel } from '@/libs/table_edit_func'
import { timestampToTime } from '@/libs/tools'
import { userPrivileges } from '@/libs/enumType'
import util from '@/libs/util2'

const toolButtonUpload = (vm, h, params) => {
  return h('Button', {
    props: {
      size: 'small'
    },
    on: {
      click: () => {
        vm.uploadPhoto(params)
      }
    }
  }, '上传')
}

export default {
  name: 'shop_list',
  data () {
    return {
      totalCount: 0,
      currentPage: 1,
      pageSize: 10,
      canUpload: false,
      loadingData: false,
      listArr: [],
      columnList: [
        {
          title: '产品名称',
          key: 'p_name',
          align: 'center',
          minWidth: 90,
          editable: true
        },
        {
          title: '产品样图',
          key: 'p_photo',
          align: 'center',
          minWidth: 100
        },
        {
          title: '产品价格（/元）',
          key: 'p_price',
          align: 'center',
          minWidth: 90,
          editable: true
        },
        {
          title: '剩余数量',
          key: 'p_count',
          align: 'center',
          minWidth: 100,
          editable: true
        },
        // {
        //   title: '状态',
        //   key: 'p_states',
        //   align: 'center',
        //   minWidth: 100,
        //   editable: true
        // },
        {
          title: '创建时间',
          key: 'create_time',
          align: 'center',
          minWidth: 130,
          ellipsis: true
        },
        {
          title: '更新时间',
          key: 'update_time',
          align: 'center',
          minWidth: 130,
          ellipsis: true
        }
      ],
      // 修改项
      tempData: {},
      // 当前编辑项原始数据
      tempDataArr: [],
      // 当前修改项索引
      userDataIndex: -1,
      isEditing: false,
      isAppending: false,
      bAdd: false,
      // modal
      showChangePasswdModal: false,
      showAddUserModal: false,
      loading: true,
      formUserData: {
        newPassword: '',
        username: '',
        password: '',
        email: '',
        role: []
      },
      // 修改权限
      showChangeUserRoleModal: false,
      modalLoading: true,
      currentUserRef: {},
      userInfoInRoleModal: {},
      // 所有可用角色信息
      roleData: [],
      // 选中项
      tempRoleData: [],
      // 角色数据
      roleInfo: [],
      roleInfoObj: {},
      title: '',
      // 消息相关
      showMessageModal: false,
      messageInfo: {
        title: '',
        content: ''
      },
      messageRule: {
        title: { required: true, message: '消息标题不能为空', trigger: 'blur' },
        content: { required: true, message: '消息内容不能为空', trigger: 'blur' }
      },
      receivedUser: 0,
      photoModal: false,
      photoUpload: false,
      photoSrc: ''
    }
  },
  computed: {
    userPrivileges () {
      let obj = {}
      Object.keys(userPrivileges).map(key => {
        if (userPrivileges[key] !== 0 && key !== '0') {
          obj[key] = userPrivileges[key]
        }
      })
      return obj
    }
  },
  methods: {
    init () {
      this.bAdd = util.hasPermissionValue('noAccess') || util.hasPermissionValue('superman:full')
      this.columnList.push({
        title: '操作',
        key: 'toolbox',
        align: 'center',
        width: 140,
        render: (h, params) => {
          let children = []
          children.push(toolButtonEdit(this, h, params, 'noAccess'))
          children.push(toolButtonCancel(this, h, params))
          children.push(toolButtonDelete(this, h, params, 'noAccess'))
          return h('div', {
            style: {
              textAlign: 'left'
            }
          }, [
            h('div', children)
          ])
        }
      })

      for (let column of this.columnList) {
        if (column.editable) {
          if (column.key === 'p_name') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params, '输入产品名称')
            }
          } else if (column.key === 'p_price') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params)
            }
          } else if (column.key === 'p_count') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params)
            }
          } else if (column.key === 'p_states') {
            column.render = (h, params) => {
              return cellSwitch(this, column, h, params, !params.row.cellEditable, 1, 0, '开启', '关闭')
            }
          }
        } else {
          if (column.key === 'create_time' || column.key === 'update_time') {
            column.render = (h, params) => {
              let time = timestampToTime(params.row[column.key])
              if (time.indexOf('NaN') !== -1) {
                time = ''
              }
              return h('div', time)
            }
          } else if (column.key === 'p_photo') {
            column.render = (h, params) => {
              let that = this
              let src = 'http://localhost:8084/images/zpf/' + params.row.id + '.jpg'
              if (params.row.p_photo === -1) {
                let children = []
                children.push(toolButtonUpload(this, h, params, 'noAccess'))
                return h('div', {
                  style: {
                    textAlign: 'center'
                  }
                }, [
                  h('div', children)
                ])
              } else {
                return h('img', {
                  attrs: {
                    src: src
                  },
                  on: {
                    click: function () {
                      that.showPhoto(src)
                    }
                  },
                  style: {
                    width: '100px',
                    height: '60px',
                    marginTop: '4px'
                  }
                })
              }
            }
          }
        }
      }
    },
    loadData () {
      this.loadingData = true
      let data = {
        username: this.$store.state.userName,
        page: this.currentPage,
        pageSize: this.pageSize
      }
      let ok = (vm, res) => {
        this.loadingData = false
        // this.totalCount = res.count
        this.initTable(res.data)
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '获取用户信息失败', err)
        }
        this.loadingData = false
      }
      util.processRequest(this, '/product/query', 'post', data, ok, error)
    },
    initTable (data) {
      let arr = []
      for (let info of data) {
        arr.push({
          id: info.id,
          user_id: info.user_id,
          p_name: info.p_name,
          p_price: info.p_price,
          p_count: info.p_count,
          p_states: info.p_states,
          create_time: info.create_time,
          update_time: info.update_time,
          cellEditable: false,
          isUpdating: false
        })
      }
      this.listArr.splice(0, this.listArr.length)
      this.listArr.splice(0, 0, ...arr)
    },
    confirmDeleteData (data, index) {
      util.confirmModal(this, '删除配置项', '删除', data.mailName, '配置项', this.deleteData, null, data, index, 'delete')
    },
    deleteData (data, index) {
      if (data.isUpdating) {
        this.tempData = {}
        return
      }
      data.isUpdating = true
      let newData = {
        id: data.id
      }
      let ok = (vm, res) => {
        util.Notice(this, 'success', '删除配置项成功')
        this.listArr.splice(index, 1)
        if (this.listArr.length === 0) {
          this.loadData()
        }
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '删除配置项失败', err)
        }
      }
      util.processRequest(this, '/product/delete', 'post', newData, ok, error)
    },
    executeUpdate (data, index) {
      if (!data.cellEditable) {
        this.tempDataArr[index] = Object.assign({}, data)
        data.cellEditable = true
        this.isEditing = true
      } else if (data.cellEditable) {
        util.confirmModal(this, '更新权限', '更新', data.roleName, '', this.update, undefined, data, index)
      }
    },
    update (data, index) {
      if (data.isUpdating) {
        util.Notice(this, 'warning', '正在等待服务器返回数据，请稍后再试')
        this.tempData = {}
        return
      }
      data.isUpdating = true
      // 更新内部数据
      for (let key in this.tempData) {
        if (typeof this.tempData[key] === 'string') {
          this.tempData[key] = this.tempData[key].trim()
        }
        this.$set(data, key, this.tempData[key])
      }

      let keys = []
      for (let key in this.tempDataArr[index]) {
        if (this.tempDataArr[index][key] !== data[key]) {
          keys.push(key)
        }
      }
      let newData = {}
      for (let val of keys) {
        newData[val] = data[val]
      }
      delete newData.isUpdating
      delete newData.cellEditable
      if (JSON.stringify(newData) === '{}') {
        util.Notice(this, 'warning', '没有数据更新')
        data.isUpdating = false
        return
      }
      newData.id = data.id

      let ok = (vm, res) => {
        util.Notice(this, 'success', '更新权限信息成功')
        this.$set(this.listArr[index], 'update_time', new Date().valueOf())
        // reset
        data.cellEditable = false
        data.isUpdating = false
        this.isAppending = false
        this.isEditing = false
        this.tempData = {}
        this.showChangePasswdModal = false
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '更新权限信息失败', err)
        }
        this.resetRow(data, index)
      }
      util.processRequest(this, '/product/update', 'post', {
        roleInfo: newData
      }, ok, error)
    },
    resetRow (data, index) {
      data.cellEditable = false
      data.isUpdating = false
      this.isEditing = false
      this.$set(this.listArr, index, this.tempDataArr[index])
      this.tempData = {}
      this.tempDataArr[index] = {}
    },
    resetRow2 (data, index) {
      this.isEditing = false
      this.isAppending = false
      this.listArr.splice(0, 1)
      this.templistArr[index] = {}
      this.tempData = {}
    },
    showPhoto (src) {
      this.photoModal = true
      this.$set(this, 'photoSrc', src)
    },
    addFakeDataDictionary () {
      this.isAppending = true
      this.isEditing = true

      let data = []
      data.push({
        p_name: '',
        p_photo: -1,
        p_price: '',
        p_count: '',
        cellEditable: true,
        isUpdating: false
      })
      this.listArr.splice(0, 0, ...data)
    },
    uploadPhoto (params) {
      this.photoUpload = true
    },
    cancel () {
      this.passwordModal = false
      this.updatePassword = {}
    },
    getFile (event) {
      debugger
      this.file = event.target.files[0]
      this.canUpload = true
    },
    submitForm (event) {
      event.preventDefault()
      let formData = new FormData()
      formData.append('file', this.file)
      let ok = (vm, res) => {
        vm.imgSrc = baseUrl + res.data.substr(6, res.data.length)
        vm.fileName = res.data
        vm.showImg = true
      }
      let error = (vm, err) => {
        debugger
      }
      util.processRequest(this, '/product/photo', 'post', formData, ok, error)
    }
  },
  created () {
    this.init()
  },
  mounted () {
    this.loadData()
  }
}
</script>
