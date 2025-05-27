<template>
  <div class="task-page">
    <div class="task-header">
      <h1>{{ task.title }}</h1>
      <div class="task-actions">
        <a 
          :href="gitlabTaskUrl" 
          target="_blank" 
          class="gitlab-link"
          title="Открыть задачу в GitLab"
        >
          <i class="fab fa-gitlab"></i> Открыть в GitLab
        </a>
        <button @click="goBack" class="back-btn">Назад</button>
      </div>
    </div>

    <div class="task-content">
      <div class="task-info">
        <div class="info-section">
          <h3>Описание</h3>
          <p class="task-description">{{ task.description || 'Описание отсутствует' }}</p>
        </div>

        <div class="info-section">
          <h3>Детали задачи</h3>
          <div class="task-details">
            <div class="detail-item">
              <span class="label">Статус:</span>
              <span class="value" :class="task.status.toLowerCase()">{{ getStatusLabel(task.status) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Приоритет:</span>
              <span class="value" :class="task.priority">{{ getPriorityLabel(task.priority) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Исполнитель:</span>
              <span class="value">{{ getAssigneeName(task.assigned_to) }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>Активность</h3>
          <div class="activity-timeline">
            <div v-if="task.last_commit" class="timeline-item">
              <div class="timeline-icon commit">
                <i class="fas fa-code-commit"></i>
              </div>
              <div class="timeline-content">
                <h4>Последний коммит</h4>
                <p>{{ formatDate(task.last_commit) }}</p>
                <a 
                  v-if="task.branch_name" 
                  :href="`${gitlabTaskUrl}/-/tree/${task.branch_name}`"
                  target="_blank"
                  class="branch-link"
                >
                  <i class="fas fa-code-branch"></i> {{ task.branch_name }}
                </a>
              </div>
            </div>

            <div v-if="task.last_merge" class="timeline-item">
              <div class="timeline-icon merge">
                <i class="fas fa-code-merge"></i>
              </div>
              <div class="timeline-content">
                <h4>Последний мердж</h4>
                <p>{{ formatDate(task.last_merge) }}</p>
                <a 
                  v-if="task.mr_id" 
                  :href="`${gitlabTaskUrl}/-/merge_requests/${task.mr_id}`"
                  target="_blank"
                  class="mr-link"
                >
                  <i class="fas fa-code-pull-request"></i> MR #{{ task.mr_id }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default {
  name: 'TaskPage',
  data() {
    return {
      task: {
        id: null,
        title: '',
        description: '',
        status: '',
        priority: '',
        assigned_to: null,
        last_commit: null,
        last_merge: null,
        branch_name: null,
        mr_id: null
      },
      projectMembers: [],
      gitlabBaseUrl: 'http://gitlab.example.com' // Измените на ваш URL GitLab
    };
  },
  computed: {
    gitlabTaskUrl() {
      return `${this.gitlabBaseUrl}/${this.$route.params.projectPath}/-/issues/${this.task.id}`;
    }
  },
  methods: {
    async fetchTask() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.get(
          `/api/projects/${this.$route.params.projectId}/sprints/${this.$route.params.sprintId}/issues/${this.$route.params.taskId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        this.task = {
          ...data,
          last_commit: data.si_last_commit,
          last_merge: data.si_last_merge,
          branch_name: data.si_branch_name,
          mr_id: data.si_mr_id
        };

        await this.fetchProjectMembers();
      } catch (error) {
        console.error('Ошибка при получении данных задачи:', error);
        this.$toast.error('Не удалось загрузить данные задачи');
      }
    },

    async fetchProjectMembers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.get('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.projectMembers = data;
      } catch (error) {
        console.error('Ошибка при получении участников проекта:', error);
      }
    },

    getStatusLabel(status) {
      const labels = {
        'К выполнению': 'К выполнению',
        'В работе': 'В работе',
        'На проверке': 'На проверке',
        'Готово': 'Готово'
      };
      return labels[status] || status;
    },

    getPriorityLabel(priority) {
      const labels = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий'
      };
      return labels[priority] || priority;
    },

    getAssigneeName(assigneeId) {
      if (!assigneeId) return 'Не назначен';
      const member = this.projectMembers.find(m => m.id === assigneeId);
      return member ? member.name : 'Неизвестный участник';
    },

    formatDate(dateString) {
      if (!dateString) return 'Нет данных';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    goBack() {
      this.$router.push(`/projects/${this.$route.params.projectId}/sprints/${this.$route.params.sprintId}`);
    }
  },
  async mounted() {
    await this.fetchTask();
  }
};
</script>

<style scoped>
.task-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.task-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
}

.task-actions {
  display: flex;
  gap: 1rem;
}

.gitlab-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #fc6d26;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.gitlab-link:hover {
  background-color: #e24329;
  transform: translateY(-2px);
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
}

.back-btn:hover {
  background-color: #95a5a6;
  transform: translateY(-2px);
}

.task-content {
  display: grid;
  gap: 2rem;
}

.task-info {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.task-description {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #34495e;
}

.task-details {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  font-weight: 500;
  color: #7f8c8d;
  min-width: 100px;
}

.value {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.value.готово {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.value.в_работе {
  background-color: #fff3e0;
  color: #ef6c00;
}

.value.на_проверке {
  background-color: #e3f2fd;
  color: #1565c0;
}

.value.к_выполнению {
  background-color: #f5f5f5;
  color: #616161;
}

.value.high {
  background-color: #ffebee;
  color: #c62828;
}

.value.medium {
  background-color: #fff8e1;
  color: #f57f17;
}

.value.low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.activity-timeline {
  display: grid;
  gap: 1.5rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 1.25rem;
  top: 2.5rem;
  bottom: -1.5rem;
  width: 2px;
  background-color: #eee;
}

.timeline-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.timeline-icon.commit {
  background-color: #3498db;
}

.timeline-icon.merge {
  background-color: #2ecc71;
}

.timeline-content {
  flex: 1;
}

.timeline-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.timeline-content p {
  margin: 0 0 0.5rem 0;
  color: #7f8c8d;
}

.branch-link,
.mr-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3498db;
  text-decoration: none;
  font-size: 0.9rem;
}

.branch-link:hover,
.mr-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .task-page {
    padding: 1rem;
  }

  .task-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .task-actions {
    width: 100%;
    flex-direction: column;
  }

  .gitlab-link,
  .back-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 