<template>
  <div class="create-project">
    <div class="header-with-dates">
      <h2>Создание проекта</h2>
      <div class="project-dates">
        <label for="start-date">Дата начала:</label>
        <input type="date" id="start-date" v-model="startDate" required />
        <label for="end-date">Дата окончания:</label>
        <input type="date" id="end-date" v-model="endDate" required />
      </div>
    </div>

    <form @submit.prevent="submitProject" class="project-form">
      <label for="project-name">Название проекта:</label>
      <input type="text" id="project-name" v-model="projectName" required />

      <button type="button" @click="toggleDescription" class="btn-description">
        {{ showDescription ? "Скрыть описание" : "Добавить описание" }}
      </button>
      <textarea
        v-if="showDescription"
        v-model="projectDescription"
        placeholder="Введите описание проекта..."
        class="description-field"
      ></textarea>
    </form>

    <div class="user-info" v-if="creatorName">
      <p>Создатель проекта: {{ creatorName }}</p>
    </div>

    <div class="participants-selection">
      <div class="available-users">
        <h3>Выберите участников:</h3>
        <select v-model="selectedUser" size="5">
          <option v-for="user in availableUsers" :key="user.UsrID" :value="user">
            {{ user.UsrName }} {{ user.UsrPatronomic || '' }} {{ user.UsrSurname }}
            <span class="user-role">({{ user.UsrRole }})</span>
          </option>
        </select>
        <button @click="addUserToProject" class="btn-add">Добавить в проект</button>
      </div>

      <div class="project-users">
        <h3>Участники проекта:</h3>
        <select v-model="selectedProjectUser" size="5">
          <option v-for="user in projectUsers" :key="user.UsrID" :value="user">
            {{ user.UsrName }} {{ user.UsrPatronomic || '' }} {{ user.UsrSurname }}
            <span class="user-role">({{ user.UsrRole }})</span>
          </option>
        </select>
        <button @click="removeUserFromProject" class="btn-remove">Убрать из проекта</button>
      </div>
    </div>

    <button @click="saveProject" class="btn-save">Сохранить проект</button>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default {
  name: "CreateProject",
  data() {
    return {
      toast: useToast(),
      projectName: "",
      projectDescription: "",
      startDate: "",
      endDate: "",
      showDescription: false,
      selectedUser: null,
      selectedProjectUser: null,
      availableUsers: [],
      projectUsers: [],
      creatorName: ""
    };
  },
  mounted() {
    this.loadCreatorInfo();
    this.fetchUsers();
  },
  methods: {
    loadCreatorInfo() {
      try {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        this.creatorName = userData.name || 'Неизвестный создатель';
        
        // Автоматически добавляем создателя в участники
        if (userData.id) {
          this.projectUsers.push({
            UsrID: userData.id,
            UsrName: userData.name?.split(' ')[0] || 'Создатель',
            UsrSurname: userData.name?.split(' ')[1] || '',
            UsrRole: userData.role || 'Менеджер'
          });
        }
      } catch (e) {
        console.error("Ошибка загрузки данных создателя:", e);
        this.creatorName = "Неизвестный создатель";
      }
    },

    toggleDescription() {
      this.showDescription = !this.showDescription;
    },
    
    async fetchUsers() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.toast.error("Ошибка: отсутствует токен авторизации.");
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
            this.availableUsers = data
              .filter(user => user.UsrID !== currentUserId)
              .map(user => ({
                UsrID: user.UsrID,
                UsrName: user.UsrName || '',
                UsrPatronomic: user.UsrPatronomic || '',
                UsrSurname: user.UsrSurname || '',
                UsrRole: user.UsrRole || 'Участник'
              }));
          }
        } else {
          const errorData = await response.json();
          this.toast.error("Ошибка загрузки пользователей: " + (errorData.error || 'Неизвестная ошибка'));
        }
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
        this.toast.error("Ошибка при загрузке пользователей");
      }
    },

    addUserToProject() {
      if (!this.selectedUser) {
        this.toast.warning("Выберите пользователя для добавления");
        return;
      }

      const exists = this.projectUsers.some(
        user => user.UsrID === this.selectedUser.UsrID
      );

      if (!exists) {
        this.projectUsers.push({...this.selectedUser});
        this.availableUsers = this.availableUsers.filter(
          user => user.UsrID !== this.selectedUser.UsrID
        );
        this.toast.success("Пользователь добавлен в проект");
      } else {
        this.toast.warning("Этот пользователь уже в проекте");
      }
      this.selectedUser = null;
    },

    removeUserFromProject() {
      if (!this.selectedProjectUser) {
        this.toast.warning("Выберите пользователя для удаления");
        return;
      }

      // Проверяем, не является ли пользователь создателем
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
      if (this.selectedProjectUser.UsrID === currentUserId) {
        this.toast.error("Нельзя удалить создателя проекта");
        return;
      }

      this.availableUsers.push({...this.selectedProjectUser});
      this.projectUsers = this.projectUsers.filter(
        user => user.UsrID !== this.selectedProjectUser.UsrID
      );
      this.toast.success("Пользователь удален из проекта");
      this.selectedProjectUser = null;
    },

    validateProjectData() {
      if (!this.projectName.trim()) {
        this.toast.error("Введите название проекта");
        return false;
      }

      if (!this.startDate || !this.endDate) {
        this.toast.error("Укажите даты начала и окончания проекта");
        return false;
      }

      if (new Date(this.startDate) > new Date(this.endDate)) {
        this.toast.error("Дата окончания должна быть позже даты начала");
        return false;
      }

      if (this.projectUsers.length < 1) {
        this.toast.error("Добавьте хотя бы одного участника");
        return false;
      }

      return true;
    },

    async saveProject() {
  if (!this.validateProjectData()) return;

  const token = localStorage.getItem('token');
  if (!token) {
    this.toast.error("Ошибка авторизации");
    return;
  }

  // Подготовка данных для GitLab API
  const projectData = {
    name: this.projectName,
    description: this.projectDescription,
    visibility: 'private', // или 'internal', 'public'
    initialize_with_readme: true,
  };

  try {
    // 1. Создаем проект в GitLab
    const gitlabResponse = await fetch("http://localhost:4000/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });

    if (!gitlabResponse.ok) {
      const errorData = await gitlabResponse.json();
      throw new Error(errorData.message || "Ошибка при создании проекта в GitLab");
    }

    const gitlabProject = await gitlabResponse.json();

    // 2. Сохраняем метаданные в вашем API
    const ourApiData = {
      gitlab_project_id: gitlabProject.id,
      title: this.projectName,
      description: this.projectDescription,
      start_date: this.startDate,
      end_date: this.endDate,
      participants: this.projectUsers.map(user => user.UsrID),
    };

    const ourApiResponse = await fetch("http://localhost:4000/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(ourApiData),
    });

    if (!ourApiResponse.ok) {
      throw new Error("Ошибка при сохранении метаданных проекта");
    }

    this.toast.success("Проект успешно создан в GitLab!");
    this.$emit('projectCreated');
    this.resetForm();
  } catch (error) {
    console.error("Ошибка при создании проекта:", error);
    this.toast.error(`Ошибка: ${error.message}`);
  }
},

    resetForm() {
      this.projectName = "";
      this.projectDescription = "";
      this.startDate = "";
      this.endDate = "";
      this.showDescription = false;
      this.selectedUser = null;
      this.selectedProjectUser = null;
      this.projectUsers = [];
      this.loadCreatorInfo(); // Снова добавляем создателя
    }
  },
};
</script>

<style scoped>
/* Ваши стили без изменений */
</style>

<style scoped>
.create-project {
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-with-dates {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
}

.header-with-dates h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 0;
}

.project-dates {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.project-dates label {
  font-weight: 500;
  color: #4a5568;
  margin-right: 0.5rem;
  font-size: 0.95rem;
}

.project-dates input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.project-dates input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.project-form {
  margin-bottom: 2rem;
}

.project-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
}

.project-form input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.project-form input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.btn-description {
  background-color: #edf2f7;
  color: #2d3748;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.2rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-description:hover {
  background-color: #e2e8f0;
}

.description-field {
  width: 100%;
  min-height: 120px;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.2s ease;
}

.description-field:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.user-info {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  color: #4a5568;
}

.user-info p {
  margin: 0;
}

.participants-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.available-users,
.project-users {
  display: flex;
  flex-direction: column;
}

.available-users h3,
.project-users h3 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eaeaea;
}

select {
  width: 100%;
  min-height: 200px;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

option {
  padding: 0.5rem;
  border-bottom: 1px solid #f1f1f1;
}

option:hover {
  background-color: #ebf8ff;
}

.btn-add,
.btn-remove {
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.btn-add {
  background-color: #4299e1;
  color: white;
}

.btn-add:hover {
  background-color: #3182ce;
}

.btn-remove {
  background-color: #e53e3e;
  color: white;
}

.btn-remove:hover {
  background-color: #c53030;
}

.btn-save {
  width: 100%;
  padding: 0.9rem;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-save:hover {
  background-color: #38a169;
}

.user-role {
  font-weight: 500;
  color: #718096;
  margin-left: 0.3rem;
  font-size: 0.85rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .create-project {
    padding: 1.5rem;
  }
  
  .participants-selection {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .header-with-dates {
    flex-direction: column;
    gap: 1rem;
  }
  
  .project-dates {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .create-project {
    padding: 1rem;
  }
  
  .header-with-dates h2 {
    font-size: 1.5rem;
  }
  
  .btn-add,
  .btn-remove,
  .btn-save {
    padding: 0.6rem 1rem;
  }
}
</style>
