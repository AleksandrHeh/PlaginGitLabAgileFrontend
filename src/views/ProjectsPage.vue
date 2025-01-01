<template>
  <div class="projects">
    <h1>Список проектов</h1>
    <div class="projects-list">
      <div
        v-for="project in projects"
        :key="project.PtjID"
        class="project-item"
      >
        <div class="project-title">
          <h3>{{ project.PrjTitle }}</h3>
          <span class="info-icon" @click="openModal(project)">
            &#8505;
          </span>
        </div>
        <!-- Модальное окно с дополнительной информацией -->
        <div v-if="modalProject && modalProject.PtjID === project.PtjID" class="modal">
          <div class="modal-content">
            <span class="close" @click="closeModal">&times;</span>
            <h3>{{ modalProject.PrjTitle }}</h3>
            <p><strong>Описание:</strong> {{ modalProject.PrjDescription }}</p>
            <p><strong>Статус:</strong> {{ modalProject.PrjStatus }}</p>
            <p><strong>Начало:</strong> {{ formatDate(modalProject.PrjStartDate) }}</p>
            <p><strong>Завершение:</strong> {{ formatDate(modalProject.PrjEndDate) }}</p>
            <p><strong>Владелец:</strong> {{ modalProject.PrjOwner }}</p>
          </div>
        </div>
      </div>
    </div>
    <p v-if="projects.length === 0">Нет доступных проектов.</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      projects: [],
      modalProject: null,  // Для хранения данных о проекте, выбранном для отображения в модальном окне
    };
  },
  methods: {
    async fetchProjects() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Ошибка: отсутствует токен авторизации.");
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
          console.log("Полученные проекты:", data);  // Логирование данных
          this.projects = data;
        } else {
          const errorData = await response.json();
          alert("Ошибка загрузки проектов: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка загрузки проектов:", error);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    openModal(project) {
      this.modalProject = project;  // Открытие модального окна с данными выбранного проекта
    },
    closeModal() {
      this.modalProject = null;  // Закрытие модального окна
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
  flex-direction: column;  /* Изменено на вертикальное расположение */
  gap: 20px;
}

.project-item {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;  /* Ширина растягивается на всю доступную ширину */
  cursor: pointer;
}

.project-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-icon {
  font-size: 20px;
  cursor: pointer;
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
}

.modal-content {
  background: white;
  border: 2px solid black;
  border-radius: 5px;
  padding: 20px;
  border-radius: 16px;  /* Добавлено закругление углов */
  max-width: 600px;
  width: 100%;
}

.close {
  font-size: 24px;
  color: #aaa;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
</style>
