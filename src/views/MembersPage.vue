<template>
  <div class="members-page">
    <h1>Участники проекта</h1>
    
    <div v-if="loading" class="loading">
      Загрузка участников...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Поиск и фильтрация -->
      <div class="search-section">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Поиск участников..." 
          class="search-input"
        />
        <select v-model="roleFilter" class="role-filter">
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="developer">Разработчик</option>
          <option value="tester">Тестировщик</option>
        </select>
      </div>

      <!-- Список участников -->
      <div class="members-grid">
        <div v-for="member in filteredMembers" :key="member.id" class="member-card">
          <div class="member-avatar">
            <img :src="member.avatar_url || '/default-avatar.png'" :alt="member.name">
          </div>
          <div class="member-info">
            <h3>{{ member.name }}</h3>
            <p class="member-username">@{{ member.username }}</p>
            <p class="member-role" :class="member.userSettings?.us_role || 'developer'">
              {{ getRoleName(member.userSettings?.us_role) }}
            </p>
            <p class="member-email">{{ member.email }}</p>
            <p class="member-joined">
              Участник с {{ formatDate(member.created_at) }}
            </p>
          </div>
          <div class="member-actions">
            <button 
              v-if="canManageMembers" 
              @click="openEditModal(member)"
              class="action-btn edit-btn"
            >
              Изменить роль
            </button>
            <button 
              v-if="canManageMembers && member.id !== currentUserId" 
              @click="openRemoveModal(member)"
              class="action-btn remove-btn"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Модальное окно изменения роли -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal">
          <h2>Изменение роли участника</h2>
          <div class="modal-content">
            <p><strong>Участник:</strong> {{ selectedMember?.name }}</p>
            <div class="form-group">
              <label for="newRole">Новая роль:</label>
              <select id="newRole" v-model="newRole" class="role-select">
                <option value="admin">Администратор</option>
                <option value="manager">Менеджер</option>
                <option value="developer">Разработчик</option>
                <option value="tester">Тестировщик</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="updateMemberRole" class="action-btn">Сохранить</button>
            <button @click="closeEditModal" class="cancel-btn">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модальное окно подтверждения удаления -->
      <div v-if="showRemoveModal" class="modal-overlay" @click.self="closeRemoveModal">
        <div class="modal">
          <h2>Удаление участника</h2>
          <p>Вы уверены, что хотите удалить участника "{{ selectedMember?.name }}" из проекта?</p>
          <div class="modal-actions">
            <button @click="removeMember" class="action-btn remove-btn">Удалить</button>
            <button @click="closeRemoveModal" class="cancel-btn">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default {
  name: 'MembersPage',
  data() {
    return {
      members: [],
      loading: true,
      error: null,
      searchQuery: '',
      roleFilter: '',
      showEditModal: false,
      showRemoveModal: false,
      selectedMember: null,
      newRole: '',
      currentUserId: null,
      toast: useToast()
    };
  },
  computed: {
    filteredMembers() {
      return this.members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            member.username.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesRole = !this.roleFilter || member.userSettings?.us_role === this.roleFilter;
        return matchesSearch && matchesRole;
      });
    },
    canManageMembers() {
      // Проверяем, является ли текущий пользователь администратором или менеджером
      const currentMember = this.members.find(m => m.id === this.currentUserId);
      return currentMember && ['admin', 'manager'].includes(currentMember.userSettings?.us_role);
    }
  },
  methods: {
    async fetchMembers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        // Получаем участников из GitLab
        const gitlabResponse = await api.get(`/api/gitlab/projects/${this.$route.params.id}/members`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Получаем настройки пользователей из нашей БД
        const settingsResponse = await api.get('/api/users/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Объединяем данные
        this.members = gitlabResponse.data.map(member => ({
          ...member,
          userSettings: settingsResponse.data.find(s => s.us_user_id === member.id)
        }));
        
        // Получаем ID текущего пользователя
        const currentUserResponse = await api.get('/api/users/current', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.currentUserId = currentUserResponse.data.id;
      } catch (error) {
        console.error('Ошибка при получении участников:', error);
        this.error = 'Не удалось загрузить список участников';
        this.toast.error(this.error);
      } finally {
        this.loading = false;
      }
    },

    getRoleName(role) {
      const roles = {
        admin: 'Администратор',
        manager: 'Менеджер',
        developer: 'Разработчик',
        tester: 'Тестировщик'
      };
      return roles[role] || 'Разработчик';
    },

    formatDate(dateString) {
      if (!dateString) return 'Не указана';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    openEditModal(member) {
      this.selectedMember = member;
      this.newRole = member.userSettings?.us_role || 'developer';
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.selectedMember = null;
      this.newRole = '';
    },

    async updateMemberRole() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        // Обновляем роль в нашей БД
        await api.put(
          `/api/users/${this.selectedMember.id}/settings`,
          {
            role: this.newRole
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Обновляем роль в локальном списке
        const memberIndex = this.members.findIndex(m => m.id === this.selectedMember.id);
        if (memberIndex !== -1) {
          this.members[memberIndex].userSettings = {
            ...this.members[memberIndex].userSettings,
            us_role: this.newRole
          };
        }

        this.toast.success('Роль участника успешно обновлена');
        this.closeEditModal();
      } catch (error) {
        console.error('Ошибка при обновлении роли:', error);
        this.toast.error('Не удалось обновить роль участника');
      }
    },

    openRemoveModal(member) {
      this.selectedMember = member;
      this.showRemoveModal = true;
    },

    closeRemoveModal() {
      this.showRemoveModal = false;
      this.selectedMember = null;
    },

    async removeMember() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        // Удаляем участника из GitLab
        await api.delete(
          `/api/gitlab/projects/${this.$route.params.id}/members/${this.selectedMember.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Удаляем настройки пользователя из нашей БД
        await api.delete(
          `/api/users/${this.selectedMember.id}/settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Удаляем участника из локального списка
        this.members = this.members.filter(m => m.id !== this.selectedMember.id);

        this.toast.success('Участник успешно удален из проекта');
        this.closeRemoveModal();
      } catch (error) {
        console.error('Ошибка при удалении участника:', error);
        this.toast.error('Не удалось удалить участника из проекта');
      }
    }
  },
  created() {
    this.fetchMembers();
  }
};
</script>

<style scoped>
.members-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2.2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.role-filter {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 150px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.member-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  text-align: center;
}

.member-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.member-username {
  color: #666;
  margin: 0.3rem 0;
}

.member-role {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.member-role.admin {
  background-color: #e3f2fd;
  color: #1565c0;
}

.member-role.manager {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.member-role.developer {
  background-color: #fff8e1;
  color: #f57f17;
}

.member-role.tester {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.member-email {
  color: #666;
  font-size: 0.9rem;
  margin: 0.3rem 0;
}

.member-joined {
  color: #888;
  font-size: 0.85rem;
  margin: 0.3rem 0;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  flex: 1;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.edit-btn:hover {
  background-color: #2980b9;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
}

.remove-btn:hover {
  background-color: #c0392b;
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
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal h2 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.modal-content {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.role-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #7f8c8d;
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

@media (max-width: 768px) {
  .members-page {
    padding: 1rem;
  }

  .search-section {
    flex-direction: column;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .member-card {
    padding: 1rem;
  }

  .modal {
    width: 95%;
    padding: 1.5rem;
  }
}
</style>
