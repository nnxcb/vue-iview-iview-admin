<style lang="less">
  @import './login.less';
</style>

<template>
  <div class="login">
    <div class="login-con">
      <Card icon="log-in" title="欢迎登录" :bordered="false">
        <div class="form-con">
          <login-form @on-success-valid="handleSubmit"></login-form>
          <!-- <p class="login-tip">输入任意用户名和密码即可</p> -->
        </div>
      </Card>
    </div>
  </div>
</template>

<script>
import LoginForm from '_c/login-form'
import util from '@/libs/util2'
import { mapActions } from 'vuex'
export default {
  components: {
    LoginForm
  },
  methods: {
    ...mapActions([
      'handleLogin',
      'getUserInfo'
    ]),
    handleSubmit ({ userName, password }) {
      let vm = this
      this.handleLogin({ userName, password, vm }).then(res => {
        if (res.code === 302) {
          util.Notice(this, 'error', '密码错误')
          return
        } else if (res.code === 500) {
          util.Notice(this, 'error', '用户名不存在')
          return
        } else if (res.code === 100) {
          util.Notice(this, 'success', '登录成功')
        }
        this.getUserInfo().then(res => {
          this.$router.push({
            name: this.$config.homeName
          })
        })
      })
    }
  }
}
</script>

<style>

</style>
