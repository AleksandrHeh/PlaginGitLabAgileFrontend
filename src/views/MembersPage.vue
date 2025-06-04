<template>
  <div class="members-page">
    <div class="page-header">
      <h1>Участники команды</h1>
      <div class="header-actions">
        <button class="refresh-button" @click="refreshMembers" :disabled="loading">
          <span class="refresh-icon">↻</span>
          Обновить
      </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Загрузка участников команды...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠</div>
      <p>{{ error }}</p>
      <button class="retry-button" @click="refreshMembers">Попробовать снова</button>
    </div>
    
    <div v-else class="members-table-container">
      <div class="table-wrapper">
        <table class="members-table">
          <thead>
            <tr>
              <th class="avatar-column">Фото</th>
              <th>Имя</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.id" class="member-row">
              <td class="avatar-cell">
                <div class="avatar-wrapper">
                  <img 
                    :src="getAvatarUrl(member.avatar_url)" 
                    :alt="member.name"
                    class="avatar"
                    @error="handleAvatarError"
                  >
          </div>
              </td>
              <td class="name-cell">{{ member.name }}</td>
              <td class="username-cell">@{{ member.username }}</td>
              <td class="email-cell">{{ member.email }}</td>
              <td class="role-cell">
                <div class="role-selector" v-if="isEditingRole(member.id)">
                  <div class="role-select-wrapper">
                    <select 
                      v-model="editingRole" 
                      class="role-select"
                    >
                      <option value="project_manager">Менеджер проекта</option>
                      <option value="developer">Разработчик</option>
                    </select>
                    <div class="role-actions">
                      <button class="save-role" @click="saveUserRole(member.id)" title="Сохранить">
                        <span class="icon">✓</span>
                      </button>
                      <button class="cancel-role" @click="cancelRoleEdit" title="Отмена">
                        <span class="icon">✕</span>
                      </button>
            </div>
          </div>
        </div>
                <span 
                  v-else 
                  :class="['role-badge', getRoleClass(member.userSettings?.us_role || 'developer')]"
                  @click="startRoleEdit(member.id, member.userSettings?.us_role || 'developer')"
                >
                  {{ getRoleDisplayName(member.userSettings?.us_role || 'developer') }}
                </span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', member.state === 'active' ? 'active' : 'inactive']">
                  {{ member.state === 'active' ? 'Активен' : 'Неактивен' }}
                </span>
              </td>
              <td class="actions-cell">
                <button 
                  class="edit-button"
                  @click="startRoleEdit(member.id, member.userSettings?.us_role || 'developer')"
                  v-if="!isEditingRole(member.id)"
                >
                  Изменить роль
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'MembersPage',
  data() {
    return {
      members: [],
      loading: true,
      error: null,
      editingMemberId: null,
      editingRole: null,
      defaultAvatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }
  },
  methods: {
    async refreshMembers() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/gitlab/members')
        this.members = response.data.map(member => ({
          ...member,
          userSettings: {
            us_role: member.userSettings?.us_role || 'developer'
          }
        }))
        console.log('Loaded members:', this.members)
      } catch (err) {
        this.error = 'Failed to load team members. Please try again later.'
        console.error('Error fetching members:', err)
      } finally {
        this.loading = false
      }
    },
    getAvatarUrl(avatarUrl) {
      if (!avatarUrl || avatarUrl === '') {
        return this.defaultAvatar
      }
      return avatarUrl
    },
    handleAvatarError(e) {
      e.target.src = this.defaultAvatar
    },
    getRoleClass(role) {
      const roleMap = {
        'project_manager': 'project-manager',
        'developer': 'developer'
      }
      const normalizedRole = role?.toLowerCase() || 'developer'
      return roleMap[normalizedRole] || 'developer'
    },
    getRoleDisplayName(role) {
      const roleMap = {
        'project_manager': 'Менеджер проекта',
        'developer': 'Разработчик'
      }
      const normalizedRole = role?.toLowerCase() || 'developer'
      return roleMap[normalizedRole] || 'Разработчик'
    },
    isEditingRole(memberId) {
      return this.editingMemberId === memberId
    },
    startRoleEdit(memberId, currentRole) {
      this.editingMemberId = memberId
      this.editingRole = currentRole?.toLowerCase() || 'developer'
    },
    cancelRoleEdit() {
      this.editingMemberId = null
      this.editingRole = null
    },
    async saveUserRole(memberId) {
      if (!this.editingRole) {
        this.error = 'Роль не выбрана'
        return
      }

      try {
        await axios.put(`/api/gitlab/users/${memberId}/role`, {
          role: this.editingRole
        })
        
        // Обновляем роль в локальном состоянии
        const memberIndex = this.members.findIndex(m => m.id === memberId)
        if (memberIndex !== -1) {
          if (!this.members[memberIndex].userSettings) {
            this.members[memberIndex].userSettings = {}
          }
          this.members[memberIndex].userSettings.us_role = this.editingRole
          // Принудительно обновляем массив для реактивности
          this.members = [...this.members]
        }
        this.cancelRoleEdit()
      } catch (err) {
        console.error('Error updating user role:', err)
        this.error = err.response?.data?.error || 'Failed to update user role. Please try again.'
      }
    }
  },
  async created() {
    await this.refreshMembers()
  }
}
</script>

<style scoped>
.members-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #495057;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background-color: #e9ecef;
  color: #212529;
  transform: translateY(-1px);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #dc3545;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.retry-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.members-table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.table-wrapper {
  min-width: 100%;
}

.members-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: white;
}

.members-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.members-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  color: #212529;
}

.member-row:hover {
  background-color: #f8f9fa;
}

.avatar-column {
  width: 80px;
}

.avatar-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name-cell {
  font-weight: 500;
  color: #2c3e50;
}

.username-cell {
  color: #6c757d;
}

.email-cell {
  color: #495057;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-select-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.role-select {
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  color: #495057;
  min-width: 150px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-select:hover {
  border-color: #ced4da;
}

.role-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.role-actions {
  display: flex;
  gap: 0.25rem;
}

.save-role,
.cancel-role {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.save-role {
  background-color: #28a745;
  color: white;
}

.save-role:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.cancel-role {
  background-color: #dc3545;
  color: white;
}

.cancel-role:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.edit-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.edit-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.role-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 120px;
}

.role-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.role-badge.project-manager {
  background-color: #4CAF50;
  color: white;
}

.role-badge.developer {
  background-color: #2196F3;
  color: white;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  min-width: 100px;
}

.status-badge.active {
  background-color: #28a745;
  color: white;
}

.status-badge.inactive {
  background-color: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .members-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .members-table th,
  .members-table td {
    padding: 0.75rem;
  }

  .avatar-wrapper {
    width: 32px;
    height: 32px;
  }

  .role-badge {
    min-width: 100px;
    padding: 0.4rem 0.8rem;
  }

  .status-badge {
    min-width: 80px;
    padding: 0.4rem 0.8rem;
  }
}
</style>
