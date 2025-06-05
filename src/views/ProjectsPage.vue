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
            <button 
              class="action-btn edit-btn" 
              @click="openEditModal(project)"
              title="Изменить описание"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              class="action-btn delete-btn" 
              @click="confirmDelete(project)"
              title="Удалить проект"
            >
              <i class="fas fa-trash"></i>
            </button>
            <button @click="openProject(project.id)" class="open-project-btn">
              Открыть проект
            </button>
          </div>
        </div>
        <p><strong>ID:</strong> {{ project.id || "Нет id" }}</p>
        <p><strong>Описание:</strong> {{ project.description || "Нет описания" }}</p>
        <p><strong>Владелец:</strong> {{ project.owner?.name || "Неизвестно" }}</p>
        <p><strong>Дата создания:</strong> {{ formatDate(project.created_at) }}</p>
        <p><strong>Последнее обновление:</strong> {{ formatDate(project.last_activity_at) }}</p>
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>Изменить описание проекта</h3>
        <textarea
          v-model="editedDescription"
          class="modal-textarea"
          placeholder="Введите новое описание проекта"
        ></textarea>
        <div class="modal-actions">
          <button 
            class="modal-btn cancel-btn" 
            @click="showEditModal = false"
          >
            Отмена
          </button>
          <button 
            class="modal-btn save-btn" 
            @click="updateProject"
            :disabled="isUpdating"
          >
            {{ isUpdating ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить проект "{{ selectedProject?.name }}"?</p>
        <p class="text-danger">Это действие нельзя отменить!</p>
        <div class="modal-actions">
          <button 
            class="modal-btn cancel-btn" 
            @click="showDeleteModal = false"
          >
            Отмена
          </button>
          <button 
            class="modal-btn delete-btn" 
            @click="deleteProject"
            :disabled="isDeleting"
          >
            {{ isDeleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
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
      showEditModal: false,
      showDeleteModal: false,
      editedDescription: '',
      selectedProject: null,
      isUpdating: false,
      isDeleting: false
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
    openProject(id) {
    this.$router.push({ name: 'ProjectPage', params: { id } });
  },
    openEditModal(project) {
      this.selectedProject = project;
      this.editedDescription = project.description || '';
      this.showEditModal = true;
    },
    confirmDelete(project) {
      if (!project?.id) {
        this.toast.error('Не удалось определить ID проекта');
        return;
      }
      this.selectedProject = project;
      this.showDeleteModal = true;
    },
    async updateProject() {
      if (this.isUpdating || !this.selectedProject) return;
      
      this.isUpdating = true;
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${this.selectedProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            description: this.editedDescription
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка при обновлении проекта');
        }

        const data = await response.json();
        const index = this.projects.findIndex(p => p.id === this.selectedProject.id);
        if (index !== -1) {
          this.projects[index] = data.project;
        }
        
        this.toast.success('Проект успешно обновлен');
        this.showEditModal = false;
      } catch (error) {
        console.error('Ошибка при обновлении проекта:', error);
        this.toast.error(error.message);
      } finally {
        this.isUpdating = false;
      }
    },
    async deleteProject() {
      if (this.isDeleting || !this.selectedProject?.id) {
        this.toast.error('Не удалось определить ID проекта');
        return;
      }
      
      this.isDeleting = true;
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${this.selectedProject.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Ошибка при удалении проекта');
        }

        this.projects = this.projects.filter(p => p.id !== this.selectedProject.id);
        this.toast.success('Проект успешно удален');
        this.showDeleteModal = false;
        this.selectedProject = null;
      } catch (error) {
        console.error('Ошибка при удалении проекта:', error);
        this.toast.error(error.message || 'Произошла ошибка при удалении проекта');
      } finally {
        this.isDeleting = false;
      }
    }
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
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  color: #4a5568;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.action-btn:hover {
  background-color: #ebf8ff;
}

.edit-btn:hover {
  color: #2b6cb0;
}

.delete-btn:hover {
  color: #e53e3e;
  background-color: #fff5f5;
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

/* Модальные окна */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.modal-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 1rem;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.modal-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #edf2f7;
  color: #2d3748;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.save-btn {
  background-color: #4299e1;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #3182ce;
}

.delete-btn {
  background-color: #e53e3e;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c53030;
}

.text-danger {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
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