<template>
  <div class="project-page">
    <h1>{{ project.PrjTitle }}</h1>
    <div class="project-details">
      <p><strong>ID проекта:</strong> {{ projectId }}</p>
      <p><strong>Описание:</strong> {{ project.PrjDescription }}</p>
      <p><strong>Статус:</strong> {{ project.PrjStatus }}</p>
      <p><strong>Дата начала:</strong> {{ formatDate(project.PrjStartDate) }}</p>
      <p><strong>Дата завершения:</strong> {{ formatDate(project.PrjEndDate) }}</p>
      <p><strong>Владелец:</strong> {{ project.PrjOwner }}</p>
    </div>

    <div class="project-actions">
      <button @click="openTaskModal" class="action-btn">Создать задачу</button>
    </div>

    <div class="agile-board">
      <h2>Задачи проекта</h2>
      <ul>
        <li v-for="task in tasks" :key="task.TskId" class="task-item">
          <p><strong>Задача:</strong> {{ task.TskTitle }}</p>
          <p><strong>Описание:</strong> {{ task.TskDescription }}</p>
          <p><strong>Статус:</strong> {{ task.TskStatus }}</p>
          <!-- Иконка удаления -->
          <span class="delete-icon" @click.stop="openDeleteModal(task)">&#128465;</span>
        </li>
      </ul>
    </div>

    <!-- Модальное окно для подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal">
        <h2>Удаление задачи</h2>
        <p>Вы уверены, что хотите удалить задачу "{{ selectedTask?.TskTitle }}"?</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="action-btn">Удалить</button>
          <button @click="closeDeleteModal" class="cancel-btn">Отменить</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания задачи -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="modal">
        <h2>Создание задачи</h2>
        <form @submit.prevent="submitTask">
          <div>
            <label for="taskTitle">Название задачи:</label>
            <input type="text" id="taskTitle" v-model="task.title" required />
          </div>
          <div>
            <label for="taskDescription">Описание задачи:</label>
            <textarea id="taskDescription" v-model="task.description" required></textarea>
          </div>
          <div>
            <label for="taskPriority">Приоритет:</label>
            <select id="taskPriority" v-model="task.priority">
              <option value="Low">Низкий</option>
              <option value="Medium">Средний</option>
              <option value="High">Высокий</option>
            </select>
          </div>
          <div>
            <button type="submit" class="action-btn">Создать задачу</button>
            <button type="button" class="cancel-btn" @click="closeTaskModal">Отменить</button>
          </div>
        </form>
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
      toast: useToast(),
      project: {},
      tasks: [],
      showTaskModal: false,
      showDeleteModal: false, // Управление модальным окном удаления
      selectedTask: null, // Выбранная задача для удаления
      task: {
        tsk_prj_id: 0,
        title: '',
        description: '',
        priority: 'Medium',
      },
    };
  },
  computed: {
    projectId() {
      return this.$route.params.id;
    },
  },
  methods: {
    async fetchProject(id) {
      const token = localStorage.getItem("token");
      if (!token) {
        this.toast.error("Ошибка: отсутствует токен авторизации.");
        return;
      }

      try {
        // Загружаем данные проекта
        const projectResponse = await fetch(`http://localhost:4000/api/viewProject/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          this.project = projectData;
          this.task.tsk_prj_id = this.projectId; // Устанавливаем ID проекта
        } else {
          const errorData = await projectResponse.json();
          this.toast.error("Ошибка загрузки проекта: " + errorData.error);
        }

        // Загружаем задачи проекта
        const tasksResponse = await fetch(`http://localhost:4000/api/getTasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          this.tasks = tasksData;
        } else {
          const errorData = await tasksResponse.json();
          this.toast.error("Ошибка загрузки задач: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      }
    },
    openTaskModal() {
      this.showTaskModal = true;
    },
    closeTaskModal() {
      this.showTaskModal = false;
      this.task = {
        tsk_prj_id: this.projectId, // Сбрасываем ID проекта
        title: '',
        description: '',
        priority: 'Medium',
      };
    },
    async submitTask() {
      try {
        const taskData = {
          tsk_prj_id: Number(this.task.tsk_prj_id), // Преобразуем в число
          title: this.task.title,
          description: this.task.description,
          priority: this.task.priority,
          status: "Новая", // Добавляем статус по умолчанию
        };

        console.log("Отправляемые данные:", taskData); // Логируем данные перед отправкой

        const response = await fetch("http://localhost:4000/api/createTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.log("Ответ сервера (текст):", responseText);

          if (!response.headers.get("Content-Type")?.includes("application/json")) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
          }

          const errorData = JSON.parse(responseText);
          throw new Error(errorData?.error || "Неизвестная ошибка сервера");
        }

        const data = await response.json();
        this.tasks.push(data);
        this.toast.success("Задача создана!");
        this.closeTaskModal();
      } catch (error) {
        console.error("Ошибка при создании задачи:", error);
        this.toast.error("Ошибка создания задачи: " + error.message);
      }
    },
    openDeleteModal(task) {
      this.selectedTask = task; // Сохраняем выбранную задачу
      this.showDeleteModal = true; // Показываем модальное окно
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.selectedTask = null; // Сбрасываем выбранную задачу
    },
    async confirmDelete() {
      if (this.selectedTask) {
        await this.deleteTask(this.selectedTask.TskId); // Удаляем задачу
        this.closeDeleteModal(); // Закрываем модальное окно
      }
    },
    async deleteTask(taskId) {
      const token = localStorage.getItem("token");
      if (!token) {
        this.toast.error("Ошибка: отсутствует токен авторизации.");
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/deleteTask/${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          this.toast.success("Задача успешно удалена!");
          // Удаляем задачу из списка без перезагрузки страницы
          this.tasks = this.tasks.filter(task => task.TskId !== taskId);
        } else {
          const errorData = await response.json();
          this.toast.error("Ошибка удаления задачи: " + errorData.message);
        }
      } catch (error) {
        console.error("Ошибка при удалении задачи:", error);
        this.toast.error("Ошибка удаления задачи: " + error.message);
      }
    },
    formatDate(date) {
      const d = new Date(date);
      return d.toLocaleDateString('ru-RU');
    },
  },
  mounted() {
    console.log("Полученный ID через $route.params:", this.projectId);
    const projectId = this.$route.params.id;
    if (!projectId) {
      this.toast.error("Ошибка: ID проекта не найден в URL.");
      return;
    }
    this.fetchProject(projectId);
  },
};
</script>

<style scoped>
/* Основные стили для страницы проекта */
.project-page {
  padding: 30px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.project-details p {
  font-size: 16px;
  line-height: 1.6;
  margin: 10px 0;
}

.project-actions {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}

.action-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  margin-left: 5px;
  padding: 10px 20px;
  background-color: #e72a2a;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #d34242;
}


.complete-btn {
  background-color: #f44336;
}

.complete-btn:hover {
  background-color: #e53935;
}

.logout-btn {
  background-color: #2196F3;
}

.logout-btn:hover {
  background-color: #1976D2;
}

/* Стили для отображения задач */
.agile-board {
  margin-top: 30px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.agile-board h2 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #333;
}



.agile-board li {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: right;
}

.agile-board p {
  font-size: 14px;
  margin: 5px 0;
}

.agile-board p strong {
  font-weight: 600;
}

/* Стили для иконки удаления */
.delete-icon {
  cursor: pointer;
  color: #ff4444;
  font-size: 20px;
  transition: color 0.3s;
}

.delete-icon:hover {
  color: #cc0000;
}

/* Стили для модального окна */
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
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal h2 {
  font-size: 24px;
  margin-bottom: 15px;
}

.modal input, .modal select, .modal textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 14px;
}
</style>