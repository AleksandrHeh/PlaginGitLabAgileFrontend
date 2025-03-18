<template>
  <div class="auth-container">
    <div class="form-wrapper">
      <h2>Вход</h2>
      <button @click="loginWithGitLab" class="gitlab-login-button">
        Войти через GitLab
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>


export default {
  data() {
    return {
      errorMessage: '',
    };
  },
  methods: {
    loginWithGitLab() {
      try {
        // Перенаправляем пользователя на страницу авторизации GitLab
        window.location.href = 'http://localhost:4000/api/gitlab/auth';
      } catch (error) {
        console.error('Ошибка при перенаправлении:', error);
        this.errorMessage = 'Произошла ошибка. Попробуйте позже.';
      }
    },
  },
};
</script>
<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.form-wrapper {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.8rem;
}

.gitlab-login-button {
  width: 100%;
  padding: 0.8rem;
  background-color: #fc6d26; /* Цвет GitLab */
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.gitlab-login-button:hover {
  background-color: #e05d1a;
  box-shadow: 0 5px 15px rgba(252, 109, 38, 0.3);
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>