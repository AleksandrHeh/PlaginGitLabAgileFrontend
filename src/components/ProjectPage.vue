<template>
  <div class="project-page">
    <h1>{{ project.name }}</h1>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Информация о проекте -->
      <p><strong>Описание:</strong> {{ project.description || "Нет описания" }}</p>
      <p><strong>Владелец:</strong> {{ project.owner?.name || "Неизвестно" }}</p>
      <p><strong>Дата создания:</strong> {{ formatDate(project.created_at) }}</p>
      <p><strong>Последнее обновление:</strong> {{ formatDate(project.last_activity_at) }}</p>

      <!-- Кнопки действий -->
      <button @click="goBack" class="back-btn">Назад к списку проектов</button>
      <button @click="openTaskModal" class="action-btn">Создать задачу</button>

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

    <!-- Модальное окно для подтверждения удаления -->
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
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default {
  data() {
    return {
      project: {},
      tasks: [],
      loading: true,
      error: null,
      toast: useToast(),
      showTaskModal: false,
      showDeleteModal: false,
      selectedTask: null,
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
      },
    };
  },
  methods: {
    async fetchProject(id) {
      const token = localStorage.getItem('token');
      if (!token) {
        this.error = 'Ошибка: отсутствует токен авторизации.';
        this.loading = false;
        this.toast.error(this.error);
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.project = data;
        } else {
          const errorData = await response.json();
          this.error = `Ошибка загрузки проекта: ${errorData.error}`;
          this.toast.error(this.error);
        }
      } catch (err) {
        console.error('Ошибка при загрузке проекта:', err);
        this.error = 'Произошла ошибка при загрузке проекта.';
        this.toast.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    async fetchTasks(id) {
      const token = localStorage.getItem('token');
      if (!token) {
        this.error = 'Ошибка: отсутствует токен авторизации.';
        this.toast.error(this.error);
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${id}/issues`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.tasks = data;
        } else {
          const errorData = await response.json();
          this.error = `Ошибка загрузки задач: ${errorData.error}`;
          this.toast.error(this.error);
        }
      } catch (err) {
        console.error('Ошибка при загрузке задач:', err);
        this.error = 'Произошла ошибка при загрузке задач.';
        this.toast.error(this.error);
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
      const projectId = this.$route.params.id;
      const token = localStorage.getItem('token');
      if (!token) {
        this.toast.error('Ошибка: отсутствует токен авторизации.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/gitlab/projects/${projectId}/issues`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.newTask),
        });

        if (response.ok) {
          const newIssue = await response.json();
          this.tasks.push(newIssue);
          this.toast.success('Задача успешно создана!');
          this.closeTaskModal();
        } else {
          const errorData = await response.json();
          this.toast.error(`Ошибка создания задачи: ${errorData.error}`);
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
  },
  mounted() {
    const projectId = this.$route.params.id;
    this.fetchProject(projectId);
    this.fetchTasks(projectId);
  },
};
</script>

<style scoped>
.project-page {
  padding: 20px;
}

.back-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4470ff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background-color: #295bff;
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

.tasks-section {
  margin-top: 30px;
}

.tasks-section h2 {
  font-size: 24px;
  margin-bottom: 15px;
}

.no-tasks {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.tasks-list {
  list-style-type: none;
  padding: 0;
}

.task-item {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-content {
  flex: 1;
}

.delete-icon {
  font-size: 20px;
  color: #ff4444;
  cursor: pointer;
  margin-left: 15px;
}

.delete-icon:hover {
  color: #cc0000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal h2 {
  font-size: 24px;
  margin-bottom: 15px;
}

.modal form div {
  margin-bottom: 15px;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.action-btn {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #e72a2a;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #d34242;
}
</style>