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

    <div class="user-info">
      <p>Создатель проекта: {{ user.name }}</p>
    </div>

    <!-- Меню выбора участников -->
    <div class="participants-selection">
      <div class="available-users">
        <h3>Выберите участников:</h3>
        <select v-model="selectedUser" size="5">
          <option v-for="user in availableUsers" :key="user.ID" :value="user">
            {{ user.UsrName }} {{ user.UsrPatronomic }} {{ user.UsrSurname }}
            <span class="user-role">({{ user.UsrRole }})</span>
          </option>
        </select>
        <button @click="addUserToProject" class="btn-add">Добавить в проект</button>
      </div>

      <div class="project-users">
        <h3>Участники проекта:</h3>
        <select v-model="selectedProjectUser" size="5">
          <option v-for="user in projectUsers" :key="user.ID" :value="user">
            {{ user.UsrName }} {{ user.UsrPatronomic }} {{ user.UsrSurname }}
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
export default {
  name: "CreateProject",
  data() {
    return {
      projectName: "",
      projectDescription: "",
      startDate: "",
      endDate: "",
      showDescription: false,
      selectedUser: null,
      selectedProjectUser: null,
      availableUsers: [],
      projectUsers: [],
      user: {
        id: "",
        name: "",
        email: "",
        role: "",
      },
    };
  },
  mounted() {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      this.user.id = payload.id
      this.user.name = payload.username;
      this.user.email = payload.email;
      this.user.role = payload.role;
    }
  },
  methods: {
    toggleDescription() {
      this.showDescription = !this.showDescription;
    },
    async fetchUsers() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Ошибка: отсутствует токен авторизации.");
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
            this.availableUsers = data.map((user) => ({
              UsrID: user.UsrID,
              UsrName: user.UsrName,
              UsrPatronomic: user.UsrPatronomic,
              UsrSurname: user.UsrSurname,
              UsrRole: user.UsrRole,
            }));
          }
        } else {
          const errorData = await response.json();
          alert("Ошибка загрузки пользователей: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
      }
    },
    addUserToProject() {
      if (this.selectedUser && this.selectedUser.UsrID) {
        const exists = this.projectUsers.some(
          (user) => user.UsrID === this.selectedUser.UsrID
        );

        if (!exists) {
          this.projectUsers.push(this.selectedUser);

          const index = this.availableUsers.findIndex(
            (user) => user.UsrID === this.selectedUser.UsrID
          );
          if (index !== -1) {
            this.availableUsers.splice(index, 1);
          }
        } else {
          alert("Этот пользователь уже добавлен в проект.");
        }
        this.selectedUser = null;
      }
    },
    removeUserFromProject() {
      if (this.selectedProjectUser && this.selectedProjectUser.UsrID) {
        this.availableUsers.push(this.selectedProjectUser);

        const index = this.projectUsers.findIndex(
          (user) => user.UsrID === this.selectedProjectUser.UsrID
        );
        if (index !== -1) {
          this.projectUsers.splice(index, 1);
        }
        this.selectedProjectUser = null;
      }
    },
    async saveProject() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Ошибка: отсутствует токен авторизации.");
        return;
      }

      if (this.projectUsers.length === 0) {
        alert("Добавьте хотя бы одного участника в проект.");
        return;
      }

      const projectData = {
        ownerID: this.user.id,
        title: this.projectName,
        description: this.projectDescription,
        start_date: this.startDate,
        end_date: this.endDate,
        participants: this.projectUsers.map((user) => user.UsrID),
      };

      try {
        const response = await fetch("http://localhost:4000/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(projectData),
        });

        if (response.ok) {
          alert("Проект успешно создан!");
        } else {
          const errorData = await response.json();
          alert("Ошибка: " + errorData.error);
        }
      } catch (error) {
        console.error("Ошибка:", error);
      }
    },
  },
  created() {
    this.fetchUsers();
  },
};
</script>

<style scoped>
.create-project {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-with-dates {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.project-dates {
  display: flex;
  gap: 20px;
}

.project-dates label {
  font-weight: bold;
  margin-right: 10px;
}

.project-dates input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.project-form {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.project-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.project-form input,
.description-field {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

.btn-description {
  background-color: #ffc107;
  border-color: #ffc107;
  border-radius: 4px;
  color: black;
  padding: 10px;
  margin-bottom: 20px;
  align-self: flex-start;
}

.btn-add,
.btn-remove,
.btn-save {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-add {
  background-color: #007bff;
  color: white;
}

.btn-remove {
  background-color: #dc3545;
  color: white;
}

.btn-save {
  background-color: #007bff;
  color: white;
  margin-top: 20px;
}

.participants-selection {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.available-users,
.project-users {
  display: flex;
  flex-direction: column;
}

select {
  font-size: 15px;
  width: 400px;
  height: 150px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 5px;
}

.user-info {
  text-align: left;
  margin-bottom: 20px;
}

.user-role {
  font-weight: bold;
  color: #007bff;
  margin-left: 5px;
}
</style>
