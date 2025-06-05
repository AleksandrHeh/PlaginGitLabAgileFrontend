<template>
  <div class="create-project">
    <div class="create-project__header">
      <h2>Создание нового проекта</h2>
      <div class="create-project__creator">
        <span class="creator-label">Создатель:</span>
        <span class="creator-name">{{ creatorName }}</span>
      </div>
    </div>

    <div class="create-project__form">
      <div class="form-group">
        <label for="projectName">Название проекта</label>
        <input
          id="projectName"
          v-model="projectName"
          type="text"
          placeholder="Введите название проекта"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <div class="description-toggle" @click="toggleDescription">
          <span>Описание проекта</span>
          <span class="toggle-icon">{{ showDescription ? '▼' : '▶' }}</span>
        </div>
      <textarea
        v-if="showDescription"
        v-model="projectDescription"
          placeholder="Введите описание проекта"
          class="form-control description-textarea"
      ></textarea>
      </div>

      <div class="form-group">
        <label for="startDate">Дата начала</label>
        <input
          id="startDate"
          v-model="startDate"
          type="date"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="endDate">Дата окончания</label>
        <input
          id="endDate"
          v-model="endDate"
          type="date"
          class="form-control"
        />
    </div>

      <div class="form-group">
        <label for="visibility">Видимость проекта</label>
        <select
          id="visibility"
          v-model="visibility"
          class="form-control"
        >
          <option value="private">Приватный</option>
          <option value="internal">Внутренний</option>
          <option value="public">Публичный</option>
        </select>
      </div>

      <div class="form-actions">
        <button
          @click="$emit('close')"
          class="btn btn-secondary"
        >
          Отмена
        </button>
        <button
          @click="submitProject"
          class="btn btn-primary"
        >
          Создать проект
        </button>
      </div>
    </div>
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
      creatorName: "",
      visibility: "private"
    };
  },
  mounted() {
    this.loadCreatorInfo();
  },
  methods: {
    loadCreatorInfo() {
      try {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        this.creatorName = userData.name || 'Неизвестный создатель';
      } catch (e) {
        console.error("Ошибка загрузки данных создателя:", e);
        this.creatorName = "Неизвестный создатель";
      }
    },

    toggleDescription() {
      this.showDescription = !this.showDescription;
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

      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const today = new Date();

      if (start < today) {
        this.toast.error("Дата начала не может быть в прошлом");
        return false;
      }

      if (end <= start) {
        this.toast.error("Дата окончания должна быть позже даты начала");
        return false;
      }

      return true;
    },

    async submitProject() {
  if (!this.validateProjectData()) return;

  const token = localStorage.getItem('token');
  if (!token) {
    this.toast.error("Ошибка авторизации");
    return;
  }

      // Форматируем даты в ISO формат
      const formattedStartDate = new Date(this.startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(this.endDate).toISOString().split('T')[0];

  try {
        const response = await fetch("http://localhost:4000/api/gitlab/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
          body: JSON.stringify({
            name: this.projectName.trim(),
            description: this.projectDescription.trim() || "",
            visibility: this.visibility,
            start_date: formattedStartDate,
            end_date: formattedEndDate
          })
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorMessage = responseData.error || responseData.message || "Неизвестная ошибка";
          throw new Error(errorMessage);
    }

        this.toast.success("Проект успешно создан!");
    this.$emit('projectCreated');
    this.resetForm();
  } catch (error) {
    console.error("Ошибка при создании проекта:", error);
        const errorMessage = error instanceof Error ? error.message : "Произошла ошибка при создании проекта";
        this.toast.error(errorMessage);
  }
},

    resetForm() {
      this.projectName = "";
      this.projectDescription = "";
      this.startDate = "";
      this.endDate = "";
      this.showDescription = false;
      this.visibility = "private";
    }
  },
};
</script>

<style scoped>
.create-project {
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.create-project__header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
}

.create-project__header h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 0;
}

.create-project__creator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #4a5568;
}

.create-project__creator .creator-label {
  font-weight: 500;
}

.create-project__creator .creator-name {
  font-weight: 400;
}

.create-project__form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

/* Добавляем специальный класс для select видимости */
.form-group select#visibility {
  width: auto;
  min-width: 150px;
  padding: 0.3rem 0.8rem;
  height: 32px;
  line-height: 1;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.description-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
}

.toggle-icon {
  font-size: 0.8rem;
}

.description-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-secondary {
  background-color: #edf2f7;
  color: #2d3748;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.2rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-primary {
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.9rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #38a169;
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
  
  .create-project__header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .create-project__creator {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .create-project {
    padding: 1rem;
  }
  
  .create-project__header h2 {
    font-size: 1.5rem;
  }
  
  .btn-add,
  .btn-remove,
  .btn-primary {
    padding: 0.6rem 1rem;
  }
}
</style>
