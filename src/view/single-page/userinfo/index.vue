<template>
  <div class="base-info">
    <div class="crumb"><span>基本信息</span></div>
    <div class="info-form">
      <div>个人信息</div>
    </div>
    <Form :model="baseUserInfo" :label-width="64" label-position="right" class="cf-form">
      <FormItem label="头像"><img :src="avatar" style="border-radius:50%"/></FormItem>
      <FormItem label="用户名">{{ userName }}</FormItem>
      <FormItem label="商铺名称">{{ baseUserInfo.shop_name }}</FormItem>
      <FormItem label="商铺等级">{{ baseUserInfo.shop_level }}级
        <!-- <a @click="details">
          详情
        </a> -->
      </FormItem>
      <!-- <FormItem label="邮箱">
        <span>{{ baseUserInfo.name }}</span>
      </FormItem> -->
      <FormItem label="登录密码" key="password">
        <a class="update" @click="passwordModal = true">修改</a>
      </FormItem>
      <!-- <FormItem label="手机">
        <span v-if="baseUserInfo.mobile">{{ baseUserInfo.mobile }}</span>
        <a class="update" @click="showModal('mobile')">修改</a>
      </FormItem> -->
      <FormItem label="注册时间">
        <span>{{ baseUserInfo.create_time }}</span>
      </FormItem>
    </Form>
    <Modal v-model="passwordModal" title="更改密码" @on-ok="ok" @on-cancel="cancel">
      <Form :model="updatePassword" :label-width="104" label-position="right" class="cf-form">
        <FormItem label="输入旧密码：">
          <Input type="password" v-model="updatePassword.oldPassword" placeholder="输入旧密码"/>
        </FormItem>
        <FormItem label="输入新密码：">
          <Input type="password" v-model="updatePassword.newPassword" placeholder="输入新密码"/>
        </FormItem>
        <FormItem label="确认新密码：">
          <Input type="password" v-model="updatePassword.truePassword" placeholder="确认新密码"/>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
import './base-info.less'
import util from '@/libs/util2.js'

export default {
  name: 'user_info_page',
  data () {
    return {
      baseUserInfo: {
        userName: '', // 账号名
        user_state: 0, // 商铺状态
        shop_level: -1, // 商铺等级
        shop_name: '', // 商铺名称
        mobile: '',
        checkStatus: false,
        email: '',
        identityVerification: 0,
        create_time: ''
      },
      avatar: '',
      userName: '',
      passwordModal: false,
      updatePassword: {
        oldPassword: '',
        newPassword: '',
        truePassword: ''
      }
    }
  },
  methods: {
    loadData () {
      let data = {
        userName: this.userName
      }
      let ok = (vm, res) => {
        vm.baseUserInfo = res.data
        vm.baseUserInfo.create_time = vm.baseUserInfo.create_time.replace('T', ' ')
        vm.baseUserInfo.create_time = vm.baseUserInfo.create_time.slice(0, -5)
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '获取个人信息失败', err)
        }
      }
      util.processRequest(this, '/userinfo/query', 'post', data, ok, error)
    },
    details () {
      debugger
    },
    ok () {
      let updatePassword = this.updatePassword
      let { newPassword, truePassword } = updatePassword
      if (newPassword.length < 6 || newPassword.length > 18) {
        util.Notice(this, 'warning', '密码长度不能小于6或大于18')
        return
      } else {
        let passn = /^[a-zA-Z0-9]{1,}$/
        if (!newPassword.match(passn)) {
          util.Notice(this, 'warning', '密码只能包含英文字母、数字！')
          return
        }
      }
      if (newPassword !== truePassword) {
        util.Notice(this, 'warning', '两次新密码输入不一致')
      }
      updatePassword.userName = this.userName
      let ok = (vm, res) => {
        this.updatePassword = {}
        if (res.data === 501) {
          util.Notice(this, 'error', '旧密码输入错误')
        } else if (res.data === 201) {
          util.Notice(this, 'success', '修改密码成功')
        } else {
          util.Notice(this, 'error', '修改密码失败', err)
        }
      }
      let error = (vm, err) => {
        if (err !== undefined) {
          util.Notice(this, 'error', '修改密码失败', err)
        }
      }
      util.processRequest(this, '/userinfo/update', 'post', updatePassword, ok, error)
    },
    cancel () {
      this.passwordModal = false
      this.updatePassword = {}
    }
  },
  mounted () {
    this.avatar = this.$store.state.avatar
    this.userName = this.$store.state.userName
    this.loadData()
  }
}
</script>

<style>

</style>
