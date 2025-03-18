<template>
    <div class="callback-container">
      <p>Завершение входа...</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    mounted() {
      this.handleCallback();
    },
    methods: {
      async handleCallback() {
  try {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      console.error('Authorization code is missing');
      this.$router.push({ name: 'AuthorizationForm' });
      return;
    }

    const response = await axios.get(`http://localhost:4000/api/gitlab/callback?code=${code}`);
    console.log("Ответ от сервера:", response.data); // Логируем ответ

    const { user, token } = response.data;

    if (!token) {
      console.error("Токен отсутствует в ответе сервера");
      this.toast.error("Ошибка: токен отсутствует в ответе сервера.");
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token); // Сохраняем токен

    this.$router.push('/home');
  } catch (error) {
    console.error('Ошибка при обработке OAuth callback:', error);
    this.toast.error("Произошла ошибка при входе.");
    this.$router.push({ name: 'AuthorizationForm' });
  }
},
    },
  };
  </script>
  
  <style scoped>
  .callback-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f5f5;
  }
  </style>