<template>
  <div class="auth-container">
    <div class="form-wrapper">
      <h2>Вход</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">Логин:</label>
          <input v-model="username" id="username" type="text" required />
        </div>
        <div class="form-group">
          <label for="password">Пароль:</label>
          <input v-model="password" id="password" type="password" required />
        </div>
        <button type="submit">Войти</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('http://localhost:4000/api/login', {
          username: this.username,
          password: this.password
        });
        console.log('Login successful:', response.data);

        // Сохраните токен в localStorage
        localStorage.setItem('token', response.data.token);

        // Перенаправьте пользователя на страницу Home
        this.$router.push({ name: 'Home' }); // Убедитесь, что имя маршрута совпадает
      } catch (error) {
        // Проверяем, есть ли ошибка в response
        if (error.response && error.response.data) {
          console.error('Login failed:', error.response.data);
          this.errorMessage = error.response.data.message || 'Неверный логин или пароль.';
        } else {
          console.error('Unexpected error:', error);
          this.errorMessage = 'Произошла ошибка. Попробуйте позже.';
        }
      }
    }
  }
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

.form-group {
  margin-bottom: 1rem;
  padding-right: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  text-align: left;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus {
  border-color: #42b983;
  box-shadow: 0 0 5px rgba(66, 185, 131, 0.5);
  outline: none;
}

button {
  width: 100%;
  padding: 0.8rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s;
}

button:hover {
  background-color: #36a673;
  box-shadow: 0 5px 15px rgba(66, 185, 131, 0.3);
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>