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
          size="large" :disabled="isEditing" @click="showAddUserModal = true; isAppending = true;">添加
        </Button> -->
        <Row type="flex" justify="center">
          <span class="table-header">用户信息管理</span>
        </Row>
      </div>
    </Table>
    <div style="margin: 10px;overflow: hidden;">
      <div style="float: right;">
        <Page :total="totalCount" :current.sync="currentPage" :page-size="pageSize" @on-change="loadData(); isEditing = false; isAppending = false;"></Page>
      </div>
    </div>
    <!--权限修改页面-->
    <!-- <Modal ref="privilegeModal" v-model="showChangeUserRoleModal" :title="title"
      width="550" :loading="modalLoading" :mask-closable="false" @on-ok="updateUserRole">
      <Row type="flex" justify="start" align="middle">
        <Tree :data="roleData" show-checkbox @on-check-change="changeUserRole"></Tree>
      </Row>
    </Modal> -->
  </div>
</template>

<script>
import '@/assets/css/custom-table.less'
import { cellInput, cellSingleSelect, toolButtonDelete, toolButtonEdit, toolButtonCancel } from '@/libs/table_edit_func'
import { timestampToTime } from '@/libs/tools'
import { userPrivileges } from '@/libs/enumType'
import util from '@/libs/util2'

export default {
  name: 'user_list',
  data () {
    return {
      totalCount: 0,
      currentPage: 1,
      pageSize: 10,
      loadingData: false,
      listArr: [],
      columnList: [
        {
          title: '用户名',
          key: 'username',
          align: 'center',
          minWidth: 90
        },
        {
          title: '店铺名称',
          key: 'shop_name',
          align: 'center',
          minWidth: 90,
          editable: true
        },
        {
          title: '店铺等级',
          key: 'shop_level',
          align: 'center',
          minWidth: 100,
          editable: true
        },
        {
          title: '权限等级',
          key: 'user_status',
          align: 'center',
          minWidth: 100,
          editable: true
        },
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
      user_status: -1,
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
      receivedUser: 0
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
          if (column.key === 'shop_name') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params, '输入用户名')
            }
          } else if (column.key === 'user_status') {
            column.render = (h, params) => {
              return cellSingleSelect(this, column, h, params, this.userPrivileges)
            }
          }
        } else {
          if (column.key === 'create_time' || column.key === 'update_time') {
            column.render = (h, params) => {
              let time = ''
              if (params.row[column.key]) {
                time = timestampToTime(params.row[column.key])
              }
              if (time.indexOf('NaN') !== -1) {
                time = ''
              }
              return h('div', time)
            }
          }
        }
      }
    },
    loadData () {
      this.loadingData = true
      let data = {
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
      util.processRequest(this, '/user/query', 'post', data, ok, error)
    },
    initTable (data) {
      let arr = []
      for (let info of data) {
        if (info.username === this.$store.state.userName) {
          this.user_status = info.user_status
        }
        arr.push({
          id: info.id,
          username: info.username,
          password: info.password,
          user_status: info.user_status,
          shop_level: info.shop_level,
          shop_name: info.shop_name,
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
      util.processRequest(this, '/user/delete', 'post', newData, ok, error)
    },
    executeUpdate (data, index) {
      if (!data.cellEditable) {
        this.tempDataArr[index] = Object.assign({}, data)
        data.cellEditable = true
        this.isEditing = true
      } else if (data.cellEditable) {
        util.confirmModal(this, '更新权限', '更新', data.roleName, '', this.updateRole, undefined, data, index)
      }
    },
    updateRole (data, index) {
      if (data.isUpdating) {
        util.Notice(this, 'warning', '正在等待服务器返回数据，请稍后再试')
        this.tempData = {}
        return
      }
      if (this.user_status !== 3) {
        util.Notice(this, 'warning', '很抱歉，您没有修改权限')
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
        this.loadData()
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '更新权限信息失败', err)
        }
        this.resetRow(data, index)
      }
      util.processRequest(this, '/user/update', 'post', {
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
