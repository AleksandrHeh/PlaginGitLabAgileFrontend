import { createStore } from 'vuex'

export default createStore({
  state() {
    return {
      currentUser: null
    }
  },
  mutations: {
    setCurrentUser(state, user) {
      state.currentUser = user
    },
    clearUser(state) {
      state.currentUser = null
    }
  },
  actions: {
    setCurrentUser({ commit }, user) {
      commit('setCurrentUser', user)
    },
    clearUser({ commit }) {
      commit('clearUser')
    }
  },
  getters: {
    currentUser: state => state.currentUser
  }
})