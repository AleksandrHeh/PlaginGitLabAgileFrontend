<template>
  <div class="members-view">
    <div class="header">
      <h2>Участники системы</h2>
      <button @click="refreshMembers" class="refresh-button" :disabled="loading">
        <span v-if="!loading">Обновить</span>
        <span v-else>Обновление...</span>
      </button>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка данных участников...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="fetchMembers" class="retry-button">Попробовать снова</button>
    </div>
    
    <template v-else>
      <div v-if="members.length > 0" class="members-container">
        <div class="member-card" v-for="member in members" :key="member.id">
          <div class="member-avatar">
            {{ getInitials(member.name) }}
          </div>
          <div class="member-details">
            <h3>{{ member.name || "Неизвестный пользователь" }}</h3>
            <p class="email">{{ member.email || "Email не указан" }}</p>
            <div class="meta">
              <span class="role" :class="getRoleClass(member.role)">
                {{ getRoleLabel(member.role) }}
              </span>
              <span class="date">
                {{ formatDate(member.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">👤</div>
        <p>Нет доступных участников</p>
        <button @click="fetchMembers" class="retry-button">Проверить снова</button>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      members: [],
      loading: true,
      error: null,
      retryCount: 0,
      maxRetries: 3,
      roleLabels: {
        'Admin': 'Администратор',
        'Maintainer': 'Менеджер',
        'Developer': 'Разработчик',
        'Guest': 'Гость'
      }
    };
  },
  methods: {
    async fetchMembers() {
      this.loading = true;
      this.error = null;
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.handleError('Ошибка авторизации. Пожалуйста, войдите снова.');
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`, // Добавьте "Bearer"
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.members = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          role: user.role || 'Developer' // GitLab не возвращает роль, устанавливаем по умолчанию
        }));
        this.retryCount = 0;
      } catch (err) {
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          console.warn(`Попытка ${this.retryCount} из ${this.maxRetries}...`);
          setTimeout(this.fetchMembers, 1000 * this.retryCount);
        } else {
          this.handleError(`Не удалось загрузить участников: ${err.message}`);
        }
      } finally {
        this.loading = false;
      }
    },
    
    handleError(message) {
      this.error = message;
      this.loading = false;
      this.members = [];
    },
    
    refreshMembers() {
      this.retryCount = 0;
      this.fetchMembers();
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Дата неизвестна';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getInitials(name) {
      if (!name) return '?';
      return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },

    getRoleLabel(role) {
      return this.roleLabels[role] || role;
    },

    getRoleClass(role) {
      const roleMap = {
        'Admin': 'admin',
        'Maintainer': 'maintainer',
        'Developer': 'developer',
        'Guest': 'guest'
      };
      return roleMap[role] || 'guest';
    }
  },
  mounted() {
    this.fetchMembers();
  }
};
</script>

<style scoped>
.members-view {
  padding: 24px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

h2 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}

.refresh-button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background-color: #2980b9;
}

.refresh-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.members-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.member-card {
  display: flex;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
  flex-shrink: 0;
}

.member-details {
  flex-grow: 1;
}

.member-details h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #2c3e50;
}

.email {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #7f8c8d;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.role {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.role.admin {
  background-color: #e74c3c;
  color: white;
}

.role.maintainer {
  background-color: #e67e22;
  color: white;
}

.role.developer {
  background-color: #3498db;
  color: white;
}

.role.guest {
  background-color: #95a5a6;
  color: white;
}

.date {
  color: #95a5a6;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state p {
  color: #e74c3c;
  margin-bottom: 16px;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 16px;
}

.retry-button {
  padding: 8px 16px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #27ae60;
}
</style>