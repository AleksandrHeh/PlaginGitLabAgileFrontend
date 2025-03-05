<template>
  <div class="projects">
    <h1>Список проектов</h1>
    <div class="projects-list">
      <div
        v-for="project in projects"
        :key="project.PrjID"
        class="project-item"
      >
        <div class="project-title">
          <h3>{{ project.PrjTitle }}</h3>
          <div class="icons">
            <span class="info-icon" @click.stop="openModal(project)">&#8505;</span>
            <span class="edit-icon" @click.stop="openEditModal(project)">&#9998;</span>
            <span class="delete-icon" @click.stop="openDeleteModal(project)">&#128465;</span>
            <button class="open-project-btn" @click.stop="goToProject(project.PrjID)">Открыть проект</button>
          </div>
        </div>

        <!-- Модальное окно информации -->
        <div v-if="modalProject && modalProject.PrjID === project.PrjID" class="modal">
          <div class="modal-content">
            <span class="close" @click="closeModal">&times;</span>
            <h2>Информация о проекте</h2>
            <p><strong>ID проекта:</strong> {{ modalProject.PrjID }}</p>
            <p><strong>Описание:</strong> {{ modalProject.PrjDescription }}</p>
            <p><strong>Статус:</strong> {{ modalProject.PrjStatus }}</p>
            <p><strong>Начало:</strong> {{ formatDate(modalProject.PrjStartDate) }}</p>
            <p><strong>Завершение:</strong> {{ formatDate(modalProject.PrjEndDate) }}</p>
            <p><strong>Владелец:</strong> {{ modalProject.PrjOwner }}</p>
          </div>
        </div>

        <!-- Модальное окно редактирования -->
        <div v-if="editModalProject && editModalProject.PrjID === project.PrjID" class="modal">
          <div class="modal-content">
            <span class="close" @click="closeEditModal">&times;</span>
            <h3>Изменение проекта</h3>
            <p><strong>ID проекта:</strong> {{ editModalProject.PrjID }}</p>
            <form @submit.prevent="updateProject">
              <label>Название</label>
              <input v-model="editModalProject.PrjTitle" type="text" required />
              <label>Описание</label>
              <textarea v-model="editModalProject.PrjDescription" required></textarea>
              <label>Дата начала</label>
              <input v-model="editModalProject.PrjStartDate" type="date" />
              <label>Дата завершения</label>
              <input v-model="editModalProject.PrjEndDate" type="date" />
              <button class="save-button" type="submit">Сохранить изменения</button>
            </form>
          </div>
        </div>

        <!-- Модальное окно удаления -->
        <div v-if="deleteModalProject && deleteModalProject.PrjID === project.PrjID" class="modal">
          <div class="modal-content">
            <span class="close" @click="closeDeleteModal">&times;</span>
            <h3>Вы уверены, что хотите удалить этот проект?</h3>
            <p><strong>Название проекта:</strong> {{ deleteModalProject.PrjTitle }}</p>
            <div class="button-container">
              <button class="delete-button" @click="deleteProject">Удалить</button>
              <button class="cancel-button" @click="closeDeleteModal">Отмена</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-if="projects.length === 0">Нет доступных проектов.</p>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default {
  data() {
    return {
      projects: [],
      modalProject: null,
      editModalProject: null,
      deleteModalProject: null,
      toast: useToast(),
    };
  },
  methods: {
    async fetchProjects() {
      const token = localStorage.getItem("token");
      if (!token) {
        this.toast.error("Ошибка: отсутствует токен авторизации.");
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/api/viewProjects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.projects = data;
        } else {
          const errorData = await response.json();
          this.toast.error("Ошибка загрузки проектов: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка загрузки проектов:", error);
      }
    },
    formatDateToYYYYMMDD(date) {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    },
    formatDate(date) {
      const d = new Date(date);
      return d.toLocaleDateString('ru-RU');
    },
    openModal(project) {
      this.modalProject = project;
    },
    closeModal() {
      this.modalProject = null;
    },
    openEditModal(project) {
      this.editModalProject = { ...project };
      this.editModalProject.PrjStartDate = this.formatDateToYYYYMMDD(project.PrjStartDate);
      this.editModalProject.PrjEndDate = this.formatDateToYYYYMMDD(project.PrjEndDate);
    },
    closeEditModal() {
      this.editModalProject = null;
    },
    openDeleteModal(project) {
      this.deleteModalProject = project;
    },
    closeDeleteModal() {
      this.deleteModalProject = null;
    },
    async deleteProject() {
      try {
        const response = await fetch(`http://localhost:4000/api/deleteProject/${this.deleteModalProject.PrjID}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          this.toast.success("Проект удален успешно");
          this.closeDeleteModal();
          this.fetchProjects();
        } else {
          const errorData = await response.json();
          this.toast.error("Ошибка удаления проекта: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка удаления проекта:", error);
      }
    },
    async updateProject() {
      const transformedProject = {
        id: this.editModalProject.PrjID,
        title: this.editModalProject.PrjTitle,
        description: this.editModalProject.PrjDescription,
        start_date: this.formatDateToYYYYMMDD(this.editModalProject.PrjStartDate),
        end_date: this.formatDateToYYYYMMDD(this.editModalProject.PrjEndDate),
      };

      try {
        const response = await fetch(`http://localhost:4000/api/updateProject`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(transformedProject),
        });

        if (response.ok) {
          this.toast.success("Проект обновлен успешно");
          this.closeEditModal();
          this.fetchProjects();
        } else {
          const errorData = await response.json();
          this.toast.error("Ошибка обновления проекта: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка обновления проекта:", error);
      }
    },
    goToProject(projectId) {
      this.$router.push({ name: 'ProjectPage', params: { id: projectId } });
    },
  },
  mounted() {
    this.fetchProjects();
  },
};
</script>

<style scoped>
.projects {
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
.project-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.icons {
  display: flex;
  gap: 15px;
  align-items: center;
}
.info-icon,
.edit-icon,
.delete-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 10px;
  border-radius: 5%;
  background-color: #f9f9f9;
  transition: background-color 0.3s ease;
}
.delete-icon:hover {
  background-color: #ff5757;
}
.info-icon:hover {
  background-color: #a1a1a1;
}
.edit-icon:hover {
  background-color: #5ea0eb;
}
.delete-icon {
  color: rgb(53, 53, 53);
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
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}
.modal-content {
  background: white;
  border: 4px solid #575757;
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  position: relative;
  animation: fadeIn 0.3s ease;
}
.close {
  font-size: 24px;
  color: #aaa;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  transition: color 0.3s ease;
}
.close:hover {
  color: red;
}
h2 {
  font-size: 1.5em;
  margin-bottom: 15px;
}
h3 {
  margin-bottom: 20px;
  color: #333;
}
form label {
  display: block;
  margin: 10px 0 5px;
  font-weight: bold;
}
form input,
form textarea,
form button {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  border: 1px solid #ccc;
}
form button {
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
form button:hover {
  background-color: #45a049;
}
.save-button {
  width: 45%;
  padding: 15px;
  font-size: 1.1em;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #4470ff;
  color: white;
  transition: background-color 0.3s ease;
}
.save-button:hover {
  background-color: #295bff;
}
.delete-button {
  width: 45%;
  padding: 15px;
  font-size: 1.1em;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #ee4444;
  color: white;
  transition: background-color 0.3s ease;
}
.cancel-button {
  width: 45%;
  padding: 15px;
  font-size: 1.1em;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #686868;
  color: white;
  transition: background-color 0.3s ease;
}
.delete-button:hover {
  background-color: #e62131;
}
.button-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>