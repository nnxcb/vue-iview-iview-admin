import Vue from 'vue'
import Vuex from 'vuex'

import user from './module/user'
import app from './module/app'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    avatar: '',
    userName: ''
  },
  mutations: {
    setAvatar (state, avatar) {
      state.avatar = avatar
    },
    setUserName (state, name) {
      state.userName = name
    }
  },
  actions: {
    //
  },
  modules: {
    user,
    app
  }
})
