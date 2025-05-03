<template>
  <div class="project-page">
    <h1>{{ project?.name || 'Загрузка...' }}</h1>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Информация о проекте -->
      <p><strong>Описание:</strong> {{ project?.description || "Нет описания" }}</p>
      <p><strong>Владелец:</strong> {{ project?.owner?.name || "Неизвестно" }}</p>
      <p><strong>Дата создания:</strong> {{ project?.created_at ? formatDate(project.created_at) : "Неизвестно" }}</p>
      <p><strong>Последнее обновление:</strong> {{ project?.last_activity_at ? formatDate(project.last_activity_at) : "Неизвестно" }}</p>

      <!-- Кнопки действий -->
      <button @click="goBack" class="back-btn">Назад к списку проектов</button>
      <button @click="openTaskModal" class="action-btn">Создать задачу</button>
      <button @click="openSprintModal" class="action-btn">Создать спринт</button>

      <!-- Секция спринтов -->
      <div class="sprints-section">
        <h2>Спринты проекта</h2>
        <ul v-if="sprints.length > 0" class="sprints-list">
          <li v-for="sprint in sprints" :key="sprint.spt_id" class="sprint-item">
            <div class="sprint-content">
              <p><strong>Название:</strong> {{ sprint.spt_title }}</p>
              <p><strong>Дата начала:</strong> {{ formatDate(sprint.spt_start_date) }}</p>
              <p><strong>Дата окончания:</strong> {{ formatDate(sprint.spt_end_date) }}</p>
              <p><strong>Цели:</strong> {{ sprint.spt_goals || "Нет целей" }}</p>
            </div>
            <button @click="goToSprint(sprint.spt_id)" class="action-btn">Открыть спринт</button>
          </li>
        </ul>
        <div v-else class="no-sprints">
          Нет доступных спринтов.
        </div>
      </div>

      <!-- Список задач -->
      <div class="tasks-section">
        <h2>Задачи проекта</h2>
        <ul v-if="tasks.length > 0" class="tasks-list">
          <li v-for="task in tasks" :key="task.id" class="task-item">
            <div class="task-content">
              <p><strong>Задача:</strong> {{ task.title }}</p>
              <p><strong>Описание:</strong> {{ task.description || "Нет описания" }}</p>
              <p><strong>Статус:</strong> {{ task.state }}</p>
              <p><strong>Автор:</strong> {{ task.author?.name || "Неизвестно" }}</p>
              <p><strong>Дата создания:</strong> {{ formatDate(task.created_at) }}</p>
            </div>
            <span class="delete-icon" @click.stop="openDeleteModal(task)">&#128465;</span>
          </li>
        </ul>
        <div v-else class="no-tasks">
          Нет доступных задач.
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания задачи -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="modal">
        <h2>Создание задачи</h2>
        <form @submit.prevent="createTask">
          <div>
            <label for="taskTitle">Название задачи:</label>
            <input type="text" id="taskTitle" v-model="newTask.title" required />
          </div>
          <div>
            <label for="taskDescription">Описание задачи:</label>
            <textarea id="taskDescription" v-model="newTask.description" required></textarea>
          </div>
          <div>
            <label for="taskPriority">Приоритет:</label>
            <select id="taskPriority" v-model="newTask.priority">
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="action-btn">Создать задачу</button>
            <button type="button" class="cancel-btn" @click="closeTaskModal">Отменить</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно для подтверждения удаления задачи -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal">
        <h2>Удаление задачи</h2>
        <p>Вы уверены, что хотите удалить задачу "{{ selectedTask?.title }}"?</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="action-btn">Удалить</button>
          <button @click="closeDeleteModal" class="cancel-btn">Отменить</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания спринта -->
    <div v-if="showSprintModal" class="modal-overlay" @click.self="closeSprintModal">
      <div class="modal">
        <h2>Создание спринта</h2>
        <form @submit.prevent="createSprint">
          <div>
            <label for="sprintName">Название спринта:</label>
            <input type="text" id="sprintName" v-model="newSprint.name" required />
          </div>
          <div>
            <label for="sprintGoals">Цели спринта:</label>
            <textarea id="sprintGoals" v-model="newSprint.goals" rows="3"></textarea>
          </div>
          <div>
            <label for="startDate">Дата начала:</label>
            <input type="date" id="startDate" v-model="newSprint.start_date" required />
          </div>
          <div>
            <label for="endDate">Дата окончания:</label>
            <input type="date" id="endDate" v-model="newSprint.end_date" required />
          </div>
          <div class="modal-actions">
            <button type="submit" class="action-btn">Создать спринт</button>
            <button type="button" class="cancel-btn" @click="closeSprintModal">Отменить</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно для подтверждения удаления спринта -->
    <div v-if="showDeleteSprintModal" class="modal-overlay" @click.self="closeDeleteSprintModal">
      <div class="modal">
        <h2>Удаление спринта</h2>
        <p>Вы уверены, что хотите удалить спринт "{{ selectedSprint?.name }}"?</p>
        <div class="modal-actions">
          <button @click="confirmDeleteSprint" class="action-btn">Удалить</button>
          <button @click="closeDeleteSprintModal" class="cancel-btn">Отменить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default {
  name: 'ProjectPage',
  data() {
    return {
      project: null,
      tasks: [],
      sprints: [],
      loading: true,
      error: null,
      toast: useToast(),
      showTaskModal: false,
      showDeleteModal: false,
      showSprintModal: false,
      showDeleteSprintModal: false,
      selectedTask: null,
      selectedSprint: null,
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
      },
      newSprint: {
        name: '',
        start_date: '',
        end_date: '',
        goals: '',
      },
    };
  },
  methods: {
    async fetchProject() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const response = await api.get(`/api/gitlab/projects/${this.$route.params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.project = response.data;
        await this.fetchSprints();
        await this.fetchTasks();
      } catch (error) {
        console.error('Ошибка при получении проекта:', error);
        this.error = 'Не удалось загрузить данные проекта';
        this.toast.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    async fetchSprints() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const response = await api.get(`/api/projects/${this.$route.params.id}/sprints`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Полученные спринты:', response.data);
        this.sprints = response.data;
      } catch (error) {
        console.error('Ошибка при получении спринтов:', error);
        this.toast.error('Не удалось загрузить спринты');
      }
    },
    async fetchTasks() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const response = await api.get(`/api/gitlab/projects/${this.$route.params.id}/issues`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.tasks = response.data;
      } catch (error) {
        console.error('Ошибка при получении задач:', error);
        this.toast.error('Не удалось загрузить задачи');
      }
    },
    formatDate(dateString) {
      if (!dateString) return "Не указана";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return "Неверный формат даты";
        }
        return date.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return "Ошибка формата даты";
      }
    },
    goBack() {
      this.$router.push('/projects');
    },
    openTaskModal() {
      this.showTaskModal = true;
    },
    closeTaskModal() {
      this.showTaskModal = false;
      this.newTask = {
        title: '',
        description: '',
        priority: 'medium',
      };
    },
    async createTask() {
      const projectId = this.$route.params.id; // ID текущего проекта
      const token = localStorage.getItem('token'); // Токен авторизации

      if (!token) {
        this.toast.error('Ошибка: отсутствует токен авторизации.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${projectId}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: this.newTask.title,
            description: this.newTask.description,
            labels: this.newTask.priority, // Используем приоритет как метку
          }),
        });

        if (response.ok) {
          const newIssue = await response.json();
          this.tasks.push(newIssue); // Добавляем новую задачу в список
          this.toast.success('Задача успешно создана!');
          this.closeTaskModal();
        } else {
          const errorData = await response.json();
          this.toast.error(`Ошибка создания задачи: ${errorData.message}`);
        }
      } catch (err) {
        console.error('Ошибка при создании задачи:', err);
        this.toast.error('Произошла ошибка при создании задачи.');
      }
    },
    openDeleteModal(task) {
      this.selectedTask = task;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.selectedTask = null;
      this.showDeleteModal = false;
    },
    async confirmDelete() {
      const projectId = this.$route.params.id;
      const taskId = this.selectedTask.id;
      const token = localStorage.getItem('token');
      if (!token) {
        this.toast.error('Ошибка: отсутствует токен авторизации.');
        return;
      }
      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${projectId}/issues/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          this.tasks = this.tasks.filter((task) => task.id !== taskId);
          this.toast.success('Задача успешно удалена!');
          this.closeDeleteModal();
        } else {
          const errorData = await response.json();
          this.toast.error(`Ошибка удаления задачи: ${errorData.error}`);
        }
      } catch (err) {
        console.error('Ошибка при удалении задачи:', err);
        this.toast.error('Произошла ошибка при удалении задачи.');
      }
    },
    openSprintModal() {
      this.showSprintModal = true;
    },
    closeSprintModal() {
      this.showSprintModal = false;
      this.newSprint = {
        name: '',
        start_date: '',
        end_date: '',
        goals: '',
      };
    },
    async createSprint() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const response = await api.post('/api/sprints', {
          title: this.newSprint.name,
          start_date: new Date(this.newSprint.start_date).toISOString(),
          end_date: new Date(this.newSprint.end_date).toISOString(),
          goals: this.newSprint.goals,
          project_id: parseInt(this.$route.params.id)
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.sprints.push(response.data);
        this.showSprintModal = false;
        this.newSprint = {
          name: '',
          start_date: '',
          end_date: '',
          goals: ''
        };
        this.toast.success('Спринт успешно создан');
      } catch (error) {
        console.error('Ошибка при создании спринта:', error);
        this.toast.error('Не удалось создать спринт');
      }
    },
    openDeleteSprintModal(sprint) {
      this.selectedSprint = sprint;
      this.showDeleteSprintModal = true;
    },
    closeDeleteSprintModal() {
      this.selectedSprint = null;
      this.showDeleteSprintModal = false;
    },
    confirmDeleteSprint() {
      this.sprints = this.sprints.filter((sprint) => sprint.id !== this.selectedSprint.id);
      this.toast.success('Спринт успешно удален!');
      this.closeDeleteSprintModal();
    },
    goToSprint(sprintId) {
      this.$router.push(`/projects/${this.$route.params.id}/sprint/${sprintId}`);
    },
  },
  created() {
    this.fetchProject();
  },
};
</script>

<style scoped>
button{
  margin:10px
}

.project-page {
  padding: 2rem;

  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
}

h1 {
  font-size: 2.5rem;
  color: #34495e;
  margin-bottom: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 2rem 0 1rem;
  font-weight: 500;
  position: relative;
  padding-left: 1rem;
}

h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.3em;
  height: 1.2em;
  width: 4px;
  background-color: #3498db;
  border-radius: 2px;
}

.project-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.project-info p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background-color: #7f8c8d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background-color: #95a5a6;
  transform: translateY(-1px);
}

.action-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(41, 128, 185, 0.3);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.loading {
  background-color: #f8f9fa;
  color: #7f8c8d;
}

.error {
  background-color: #fdecea;
  color: #e74c3c;
}

.tasks-section, .sprints-section {
  margin-top: 3rem;
}

.no-tasks, .no-sprints {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.tasks-list, .sprints-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.task-item, .sprint-item {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #3498db;
}

.task-item:hover, .sprint-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.task-content, .sprint-content {
  flex: 1;
}

.task-content p, .sprint-content p {
  margin: 0.4rem 0;
  font-size: 1rem;
  line-height: 1.5;
}

.task-content strong, .sprint-content strong {
  color: #2c3e50;
  font-weight: 600;
}

.delete-icon {
  font-size: 1.5rem;
  color: #e74c3c;
  cursor: pointer;
  margin-left: 1.5rem;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 50%;
}

.delete-icon:hover {
  color: #c0392b;
  background-color: #fdecea;
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal h2 {
  margin-top: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  padding-left: 0;
}

.modal h2::before {
  display: none;
}

.modal form div {
  margin-bottom: 1.2rem;
}

.modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #34495e;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.modal textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
}

/* Адаптивность */
@media (max-width: 768px) {
  .project-page {
    padding: 1rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .task-item, .sprint-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .delete-icon {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .modal {
    width: 90%;
    padding: 1.5rem;
  margin: 1rem;
  max-height: 90vh;
    overflow-y: auto;
  }
}
</style>