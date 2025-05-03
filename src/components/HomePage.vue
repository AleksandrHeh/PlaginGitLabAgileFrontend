<template>
  <div id="app">
    <header class="main-header">
      <div class="clock">
        <p>{{ currentTime }}</p>
      </div>
      <div class="user-info" v-if="currentUser">
        <div class="details">
          <h3>{{ currentUser.name || 'Пользователь' }}</h3>
          <p v-if="!isSidebarCollapsed">{{ currentUser.email || '' }}</p>
        </div>
      </div>
      <div class="user-info" v-else>
        <div class="details">
          <h3>Загрузка...</h3>
        </div>
      </div>
    </header>

    <nav class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <button class="toggle-button" @click="toggleSidebar">
        {{ isSidebarCollapsed ? '▶' : '◀' }}
      </button>
      
      <ul>
        <li :class="{ 'hidden': isSidebarCollapsed }" @click="showProjectsPage = true; showMembersView = false;">
          Проекты
        </li>
        <li :class="{ 'hidden': isSidebarCollapsed }" @click="showMembersView = true; showProjectsPage = false;">
          Участники
        </li>
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
          @click="toggleCreateProject"
         >
          {{ showCreateProject ? 'Закрыть' : 'Создать проект' }}
        </button>
      </nav>

      <section class="views">
        <CreateProject 
          v-if="showCreateProject" 
          @projectCreated="handleProjectCreated" />
        <ProjectsPage v-if="showProjectsPage" />
        <MembersView v-if="showMembersView" />
      </section>
    </div>
  </div>
</template>

<script>
import CreateProject from '../views/CreateProject.vue';
import ProjectsPage from '@/views/ProjectsPage.vue';
import MembersView from '@/views/MembersPage.vue';
import jwt_decode from 'jwt-decode';

export default {
  name: 'HomePage',
  components: { CreateProject, ProjectsPage, MembersView },
  data() {
    return {
      currentTime: '',
      isSidebarCollapsed: false,
      showCreateProject: false,
      showProjectsPage: true,
      showMembersView: false,
      errorMessage: '',
      currentUser: null,
      authChecked: false
    };
  },
  mounted() {
    this.initializeUser();
    this.updateTime();
    setInterval(this.updateTime, 1000);
  },
  methods: {
    async initializeUser() {
      try {
        // Сначала пробуем получить из localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          this.currentUser = JSON.parse(savedUser);
          this.authChecked = true;
          return;
        }

        // Если нет в localStorage, проверяем токен
        const token = localStorage.getItem('token');
        if (!token) {
          this.logout();
          return;
        }

        const payload = jwt_decode(token);
        
        // Проверяем срок действия токена
        if (payload.exp && payload.exp < Date.now() / 1000) {
          throw new Error('Token expired');
        }

        this.currentUser = {
          id: payload.id || '',
          name: payload.username || 'Пользователь',
          email: payload.email || '',
          role: payload.role || 'Гость'
        };

        localStorage.setItem('user', JSON.stringify(this.currentUser));
        this.authChecked = true;
      } catch (error) {
        console.error("Ошибка авторизации:", error);
        this.errorMessage = "Ошибка авторизации. Пожалуйста, войдите снова.";
        this.logout();
      }
    },

    toggleCreateProject() {
      this.showCreateProject = !this.showCreateProject;
      if (this.showCreateProject) {
        this.showProjectsPage = false;
        this.showMembersView = false;
      } else {
        this.showProjectsPage = true;
      }
    },

    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },

    handleProjectCreated() {
      this.showCreateProject = false;
      this.showProjectsPage = true;
    },

    logout() {
      this.currentUser = null;
      this.authChecked = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push({ name: 'AuthorizationForm' });
    },
  },
};
</script>

<style scoped>
/* Ваши стили без изменений */
</style>


<style scoped>
#app {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #ffffff; /* Белый фон вместо синего */
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background-color: #2c3e50;
  color: white;
  width: 100%;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.clock {
  font-size: 1.2rem;
  font-weight: 500;
  color: #ecf0f1;
}

.user-info {
  display: flex;
  align-items: center;
  margin-right: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details {
  overflow: hidden;
  text-overflow: ellipsis;
}

.details h3 {
  font-size: 1rem;
  margin: 0;
  color: #ecf0f1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details p {
  display: none; /* Скрываем email на всех устройствах */
}

.sidebar {
  width: 220px;
  background-color: #f8f9fa; /* Светлый фон вместо темного */
  transition: all 0.3s ease;
  position: fixed;
  top: 60px;
  bottom: 0;
  z-index: 900;
  border-right: 1px solid #e0e0e0; /* Легкая граница вместо тени */
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar ul {
  list-style-type: none;
  padding: 1rem 0;
  margin: 0;
}

.sidebar ul li {
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  color: #2c3e50; /* Темный текст */
}

.sidebar ul li:not(.logout-button):hover {
  background-color: #e9ecef;
  padding-left: 1.8rem;
}

.hidden {
  opacity: 0;
  pointer-events: none;
  height: 0;
  padding: 0 !important;
  margin: 0 !important;
}

.toggle-button {
  position: absolute;
  right: -15px;
  top: 20px;
  width: 30px;
  height: 30px;
  background-color: #ffffff;
  color: #2c3e50;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  z-index: 950;
}

.toggle-button:hover {
  background-color: #f1f1f1;
}

.logout-button {
  background-color: #e74c3c;
  margin: 1rem 1.5rem 0;
  border-radius: 4px;
  justify-content: center;
  color: white;
  padding: 0.6rem;
}

.logout-button:hover {
  background-color: #c0392b;
}

.main-content {
  margin-left: 220px;
  margin-top: 60px;
  padding: 1.5rem;
  flex-grow: 1;
  transition: margin-left 0.3s ease;
  background-color: #ffffff;
}

.main-content.shifted {
  margin-left: 60px;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.2rem;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  margin-bottom: 1.5rem;
}

.add-project-button {
  padding: 0.6rem 1.2rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.add-project-button:hover {
  background-color: #218838;
}

.views {
  background-color: white;
  border-radius: 6px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
}

.auth-error {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
  border-left: 3px solid #c62828;
}

/* Адаптивность */
@media (max-width: 992px) {
  .sidebar {
    width: 200px;
  }
  
  .sidebar.collapsed {
    width: 50px;
  }
  
  .main-content {
    margin-left: 200px;
  }
  
  .main-content.shifted {
    margin-left: 50px;
  }
}

@media (max-width: 768px) {
  .main-header {
    padding: 0 1rem;
  }
  
  .user-info {
    max-width: 40%;
  }
  
  .sidebar {
    width: 180px;
    top: 60px;
  }
  
  .sidebar.collapsed {
    width: 40px;
  }
  
  .main-content {
    margin-left: 180px;
    padding: 1rem;
  }
  
  .main-content.shifted {
    margin-left: 40px;
  }
  
  .sidebar ul li {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .main-header {
    height: 50px;
  }
  
  .clock {
    font-size: 1rem;
  }
  
  .details h3 {
    font-size: 0.9rem;
  }
  
  .sidebar {
    top: 50px;
    transform: translateX(-100%);
  }
  
  .sidebar.collapsed {
    transform: translateX(0);
    width: 100%;
  }
  
  .main-content {
    margin-left: 0;
    margin-top: 50px;
  }
  
  .toggle-button {
    right: 10px;
    top: -35px;
    background-color: white;
  }
}
</style>