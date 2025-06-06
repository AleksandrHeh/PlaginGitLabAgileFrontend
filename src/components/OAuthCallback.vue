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
          const state = new URLSearchParams(window.location.search).get('state');
          
          if (!code) {
            console.error('Код авторизации отсутствует');
            this.$router.push({ name: 'AuthorizationForm' });
            return;
          }

          const response = await axios.get(`http://localhost:4000/oauth/callback`, {
            params: {
              code: code,
              state: state
            },
            withCredentials: true
          });

          if (response.data.error) {
            console.error('Ошибка от сервера:', response.data.error);
            this.$router.push({ name: 'AuthorizationForm' });
            return;
          }

          const { user, token } = response.data;

          if (!user || !token) {
            console.error('Данные пользователя или токен отсутствуют в ответе');
            this.$router.push({ name: 'AuthorizationForm' });
            return;
          }

          // Сохраняем данные пользователя и токен
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          
          // Перенаправляем на домашнюю страницу
          this.$router.push({ name: 'HomePage' });
        } catch (error) {
          console.error('Ошибка при обработке OAuth callback:', error);
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