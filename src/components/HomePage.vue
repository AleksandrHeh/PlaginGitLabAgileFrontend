<template>
  <div id="app">
    <header class="main-header">
      <div class="clock">
        <p>{{ currentTime }}</p>
      </div>
      <div class="user-info">
        <div class="details">
          <h3>{{ user.name }}</h3>
        </div>
      </div>
    </header>

    <nav class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <button class="toggle-button" @click="toggleSidebar">
        {{ isSidebarCollapsed ? '▶' : '◀' }}
      </button>
      <ul>
        <li :class="{ 'hidden': isSidebarCollapsed }" @click="showProjectsPage = !showProjectsPage">
          Проекты
        </li>
        <li :class="{ 'hidden': isSidebarCollapsed }">Участники</li>
        <li :class="{ 'hidden': isSidebarCollapsed }">Отчеты</li>
        <li :class="{ 'hidden': isSidebarCollapsed }" class="logout-button" @click="logout">
          Выйти
        </li>
      </ul>
    </nav>

    <div class="main-content" :class="{ 'shifted': isSidebarCollapsed }">
      <nav class="navigation">
        <button 
          class="add-project-button" 
          v-if="user.role === 'ProjectOwner'" 
          @click="toggleCreateProject">
          {{ showCreateProject ? 'Закрыть' : 'Создать проект' }}
        </button>
      </nav>

      <!-- Основной контент -->
      <section class="views">
        <p v-if="!showCreateProject"></p>
        <CreateProject v-else @projectCreated="handleProjectCreated" />

        <!-- Добавьте условное отображение компонента ProjectsPage -->
        <ProjectsPage v-if="showProjectsPage" />
      </section>
    </div>
  </div>
</template>

<script>
import CreateProject from '../views/CreateProject.vue';
import ProjectsPage from '@/views/ProjectsPage.vue';
import jwt_decode from 'jwt-decode'; // Или import { jwtDecode } from 'jwt-decode';

export default {
  name: 'HomePage',
  components: { CreateProject, ProjectsPage },
  data() {
    return {
      currentTime: '',
      user: {
        name: '',
        email: '',
        role: '',
      },
      isSidebarCollapsed: false,
      showCreateProject: false,
      showProjectsPage: false,
      errorMessage: '', // Поле для хранения сообщения об ошибке
    };
  },
  mounted() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }

    this.updateTime();
    setInterval(this.updateTime, 1000);

    const token = localStorage.getItem('token');
    console.log("Токен:", token);
    if (!token) {
      this.errorMessage = "Токен отсутствует. Пожалуйста, войдите снова.";
      return;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      this.errorMessage = "Некорректный формат токена. Пожалуйста, войдите снова.";
      return;
    }

    try {
      const payload = jwt_decode(token); // Или jwtDecode(token)
      this.user.name = payload.username || 'Неизвестный пользователь';
      this.user.email = payload.email || 'Нет данных';
      this.user.role = payload.role || 'Гость';
    } catch (error) {
      console.error("Ошибка при декодировании токена:", error);
      this.errorMessage = "Ошибка авторизации. Пожалуйста, войдите снова.";
    }
  },
  methods: {
    toggleCreateProject() {
      this.showCreateProject = !this.showCreateProject;
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    handleProjectCreated(projectName) {
      console.log("Проект создан:", projectName);
      this.showCreateProject = false;
    },
    logout() {
      // Очищаем данные пользователя из localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Перенаправляем пользователя на страницу авторизации
      this.$router.push({ name: 'AuthorizationForm' });
    },
  },
};
</script>

<style scoped>
.logout-button {
  background-color: #dc3545; /* Красный фон */
  color: white; /* Белый текст */
  border: none; /* Без границ */
  padding: 5px 10px; /* Внутренние отступы */
  border-radius: 5px; /* Скругленные углы */
  cursor: pointer; /* Указатель мыши */
  font-size: 0.9rem; /* Размер текста */
  width: 50%;
  transition: background-color 0.3s ease; /* Плавный переход */
}

.logout-button:hover {
  background-color: #c82333; /* Темно-красный при наведении */
}
/* Стиль для сообщения об ошибке */
.auth-error {
  background-color: #ffebee; /* Красный фон */
  color: #c62828; /* Красный текст */
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}

#app {
  display: flex;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  width: 100%;
  z-index: 1000;
  position: fixed;
  top: 0;
}

.clock {
  flex-grow: 1;
  text-align: center;
  font-size: 2rem;
}

.user-info {
  text-align: right;
  margin-right: 1.2rem;
}

.details h3 {
  font-size: 1.5rem;
}

.details p {
  font-size: 1.2rem;
}

h3, p {
  margin: 0;
}

.sidebar {
  width: 200px;
  background-color: #f9f9f9;
  transition: width 0.3s ease;
  position: fixed;
  top: 50px; /* Отступ от заголовка */
  bottom: 0;
  border-right: 2px solid #ccc; /* Визуальное ограничение для боковой панели */
}

.sidebar.collapsed {
  width: 50px;
}

.sidebar ul {
  list-style-type: none;
  padding: 0;
}

.sidebar ul li {
  padding: 15px;
  cursor: pointer;
  transition: opacity 0.3s ease; /* Плавный переход для скрытия */
}

.hidden {
  opacity: 0; /* Скрываем элемент */
  pointer-events: none; /* Отключаем взаимодействие */
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 10px;
}

.main-content {
  margin-left: 200px; /* Отступ для боковой панели */
  margin-top: 60px; /* Отступ для заголовка */
  padding: 20px;
  flex-grow: 1;
  transition: margin-left 0.3s ease; /* Плавный переход для сдвига */
}

.main-content.shifted {
  margin-left: 50px; /* Отступ для боковой панели при закрытии */
}

.navigation {
  display: flex;
  justify-content: flex-start;
  padding: 10px;
  border: 1px solid #ccc; /* Визуальное ограничение для навигации */
  border-radius: 5px; /* Скругление углов */
  background-color: #f9f9f9; /* Фон для навигации */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Тень для навигации */
}

.add-project-button {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.2rem;
  color: #ffffff;
  background-color: #28a745;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.add-project-button:hover {
  background-color: #218838;
}

.add-icon {
  margin-left: 10px;
  font-size: 1.5rem;
}

/* Оформление для секции views */
.views {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ccc; /* Визуальное ограничение для секции views */
  border-radius: 5px; /* Скругленные углы */
  background-color: #ffffff; /* Фоновый цвет */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Тень для разделения */
}
</style>