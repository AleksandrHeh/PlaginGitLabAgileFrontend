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
      showProjectsPage: false, // Переменная для отображения страницы проектов
    };
  },
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.user.name = payload.username;
      this.user.email = payload.email;
      this.user.role = payload.role;
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
    }
  },
};
</script>


<style scoped>
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
  background-color: #e9ecef;
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