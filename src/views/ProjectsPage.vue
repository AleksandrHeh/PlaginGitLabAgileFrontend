<template>
  <div class="projects-page">
    <h1>Список проектов</h1>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="projects.length === 0" class="no-projects">
      Нет доступных проектов.
    </div>
    <div v-else class="projects-list">
      <div v-for="project in projects" :key="project.id" class="project-item">
        <div class="project-header">
          <h3>{{ project.name }}</h3>
          <div class="project-actions">
            <button @click="openProject(project.web_url)" class="open-project-btn">
              Открыть проект
            </button>
          </div>
        </div>
        <p><strong>Описание:</strong> {{ project.description || "Нет описания" }}</p>
        <p><strong>Владелец:</strong> {{ project.owner?.name || "Неизвестно" }}</p>
        <p><strong>Дата создания:</strong> {{ formatDate(project.created_at) }}</p>
        <p><strong>Последнее обновление:</strong> {{ formatDate(project.last_activity_at) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default {
  data() {
    return {
      projects: [],
      loading: true,
      error: null,
      toast: useToast(),
    };
  },
  methods: {
    async fetchProjects() {
      const token = localStorage.getItem('token');
      console.log("Токен:", token);
      if (!token) {
        this.error = 'Ошибка: отсутствует токен авторизации.';
        this.loading = false;
        this.toast.error(this.error);
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/gitlab/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.projects = data;
        } else {
          const errorData = await response.json();
          this.error = `Ошибка загрузки проектов: ${errorData.error}`;
          this.toast.error(this.error);
        }
      } catch (err) {
        console.error('Ошибка при загрузке проектов:', err);
        this.error = 'Произошла ошибка при загрузке проектов.';
        this.toast.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    openProject(url) {
      window.open(url, '_blank');
    },
  },
  mounted() {
    this.fetchProjects();
  },
};
</script>

<style scoped>
.projects-page {
  padding: 20px;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-item {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.open-project-btn {
  padding: 8px 16px;
  background-color: #4470ff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.open-project-btn:hover {
  background-color: #295bff;
}

.no-projects {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: #333;
}

.error {
  text-align: center;
  font-size: 1.2em;
  color: red;
}
</style>