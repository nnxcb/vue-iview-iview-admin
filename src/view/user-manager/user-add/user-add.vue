<template>
  <div>
    <Form :model="uploadData" :label-width="80" label-position="right" style="width: 600px">
      <FormItem label="用户名：">
        <i-input v-model="uploadData.username" placeholder="请输入用户名" autofocus class="ivu-input-group-active">
          <template slot="prepend">
            <Icon type="ios-contact" size="20"/>
          </template>
        </i-input>
      </FormItem>
      <FormItem label="密码：">
        <i-input v-model="uploadData.password" placeholder="请输入密码" type="password" autofocus class="ivu-input-group-active">
          <template slot="prepend">
            <Icon type="md-key" size="20"/>
          </template>
        </i-input>
      </FormItem>
      <FormItem label="确认密码：">
        <i-input v-model="uploadData.truePassword" placeholder="请输入密码" type="password" autofocus class="ivu-input-group-active">
          <template slot="prepend">
            <Icon type="md-key" size="20"/>
          </template>
        </i-input>
      </FormItem>
      <FormItem label="店铺名称：">
        <i-input v-model="uploadData.shop_name" placeholder="请输入店铺" autofocus class="ivu-input-group-active">
          <template slot="prepend">
            <Icon type="ios-home" size="20"/>
          </template>
        </i-input>
      </FormItem>
      <FormItem label="权限等级：" style="margin-bottom: 8px">
        <i-select v-model='uploadData.fileType'>
          <i-option v-for='(value, key) in userPrivileges' :key='`item-${key}`' :value='value' :label='key'></i-option>
        </i-select>
      </FormItem>
    </Form>
    <div v-if="showUpload" style="float: left;margin: 0 9px;">上传头像：</div>
    <form enctype="multipart/form-data" v-if="showUpload">
      <input type="file" id="fileccc" @change="getFile($event)">
      <Button v-if="canUpload" @click="submitForm($event)">确定</Button>
    </form>
    <img :src="imgSrc" alt="" v-if="showImg" width="500px" height="auto"><br>
    <Button v-if="showImg" @click="confirmAdd()" type="primary">添加用户</Button>
  </div>
</template>

<script>

import util from '@/libs/util2'
import { userPrivileges, constructData } from '@/libs/enumType'
const baseUrl = 'http://localhost:8084/'

export default {
  name: 'user_add',
  data () {
    return {
      imgName: '',
      baseUrl,
      visible: false,
      canUpload: false,
      showImg: false,
      focusUser: false,
      imgSrc: '',
      uploadList: [],
      uploadData: {}
    }
  },
  computed: {
    userPrivileges () {
      return constructData(userPrivileges)
    },
    showUpload () {
      let uploadData = this.uploadData
      if (uploadData.username && uploadData.password && uploadData.truePassword && uploadData.shop_name && uploadData.fileType) {
        return true
      }
    }
  },
  methods: {
    getFile (event) {
      this.file = event.target.files[0]
      this.canUpload = true
    },
    submitForm (event) {
      let { username, password, truePassword } = this.uploadData
      if (username.length < 6 || username.length > 18) {
        util.Notice(this, 'warning', '用户名长度不能小于6或大于18')
        return
      } else {
        let usern = /^[a-zA-Z0-9_]{1,}$/
        if (!username.match(usern)) {
          util.Notice(this, 'warning', '用户名只能包含英文字母、数字、下划线！')
          return
        }
      }
      if (password.length < 6 || password.length > 18) {
        util.Notice(this, 'warning', '密码长度不能小于6或大于18')
        return
      } else {
        let passn = /^[a-zA-Z0-9]{1,}$/
        if (!password.match(passn)) {
          util.Notice(this, 'warning', '密码只能包含英文字母、数字！')
          return
        }
      }
      if (password !== truePassword) {
        util.Notice(this, 'warning', '两次输入的密码不相同')
        return
      }
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
      util.processRequest(this, '/users/touxiang', 'post', formData, ok, error)
    },
    confirmAdd () {
      util.confirmModal(this, '添加用户', '添加用户 ', this.uploadData.username, '', this.addData, null)
    },
    addData () {
      let addUserData = {
        fileName: this.fileName,
        uploadData: this.uploadData
      }
      let ok = (vm, res) => {
        if (res.data === 1001) {
          util.Notice(this, 'warning', '该用户名已注册')
          return
        }
        util.Notice(this, 'success', '添加用户成功')
        vm.imgSrc = ''
        vm.showImg = false
        vm.showUpload = false
        vm.uploadData = {}
      }
      let error = (vm, err) => {
        debugger
      }
      util.processRequest(this, '/users/add', 'post', addUserData, ok, error)
    }
  },
  mounted () {
    this.uploadList = this.$refs.upload.fileList
  }
}
</script>

<style>
.ivu-input-group-active {
  background: #f6f9fc;
  border-color: #2461f6;
}
</style>
