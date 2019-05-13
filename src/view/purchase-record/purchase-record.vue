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
          <span class="table-header">购买记录</span>
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
import { cellInput, cellSwitch, toolButtonDelete, toolButtonEdit, toolButtonCancel } from '@/libs/table_edit_func'
import { timestampToTime } from '@/libs/tools'
import { evaluateEvaluation } from '@/libs/enumType'
import util from '@/libs/util2'

export default {
  name: 'purchase_record_page',
  data () {
    return {
      totalCount: 0,
      currentPage: 1,
      pageSize: 10,
      loadingData: false,
      listArr: [],
      columnList: [
        {
          title: '购买人',
          key: 'customer_name',
          align: 'center',
          minWidth: 90,
          editable: true
        },
        {
          title: '商品名称',
          key: 'product_name',
          align: 'center',
          minWidth: 100
        },
        {
          title: '购买数量（/个）',
          key: 'count',
          align: 'center',
          minWidth: 90,
          editable: true
        },
        {
          title: '购买时间',
          key: 'buy_time',
          align: 'center',
          minWidth: 130,
          ellipsis: true
        },
        {
          title: '评价等级',
          key: 'evaluate',
          align: 'center',
          minWidth: 100,
          editable: true,
          sortable: true,
          render: (h, params) => {
            return h('div', {}, evaluateEvaluation[params.row.evaluate])
          }
        },
        // {
        //   title: '状态',
        //   key: 'p_states',
        //   align: 'center',
        //   minWidth: 100,
        //   editable: true
        // },
        {
          title: '描述',
          key: 'description',
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
      receivedUser: 0
    }
  },
  computed: {
    evaluateEvaluation () {
      let obj = {}
      Object.keys(evaluateEvaluation).map(key => {
        if (evaluateEvaluation[key] !== 0 && key !== '0') {
          obj[key] = evaluateEvaluation[key]
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
          if (column.key === 'customer_name') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params, '输入产品名称')
            }
          } else if (column.key === 'count') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params)
            }
          } else if (column.key === 'evaluate') {
            column.render = (h, params) => {
              return cellInput(this, column, h, params)
            }
          } else if (column.key === 'p_states') {
            column.render = (h, params) => {
              return cellSwitch(this, column, h, params, !params.row.cellEditable, 1, 0, '开启', '关闭')
            }
          }
        } else {
          if (column.key === 'createTime' || column.key === 'updateTime') {
            column.render = (h, params) => {
              let time = util.timestampToTime(params.row[column.key])
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
        username: this.$store.state.userName,
        page: this.currentPage,
        pageSize: this.pageSize
      }
      let ok = (vm, res) => {
        this.loadingData = false
        this.totalCount = res.data.count
        this.initTable(res.data.result)
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '获取用户信息失败', err)
        }
        this.loadingData = false
      }
      util.processRequest(this, '/purchase/record/query', 'post', data, ok, error)
    },
    initTable (data) {
      let arr = []
      for (let info of data) {
        arr.push({
          id: info.id,
          user_id: info.user_id,
          customer_name: info.customer_name,
          product_name: info.product_name,
          count: info.count,
          evaluate: info.evaluate,
          p_states: info.p_states,
          description: info.description,
          buy_time: timestampToTime(info.buy_time),
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
        this.$set(this.listArr[index], 'updateTime', new Date().valueOf())
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
    }
  },
  created () {
    // this.init()
  },
  mounted () {
    this.loadData()
  }
}
</script>
