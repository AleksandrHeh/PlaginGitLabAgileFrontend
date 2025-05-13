<template>
  <div class="sprint-page">
    <h1>{{ sprint.spt_title }}</h1>
    <div class="sprint-header">
      <div class="sprint-dates">
        <p><strong>Дата начала:</strong> {{ formatDate(sprint.spt_start_date) }}</p>
        <p><strong>Дата окончания:</strong> {{ formatDate(sprint.spt_end_date) }}</p>
      </div>
      <button 
        @click="completeSprint" 
        class="complete-btn"
        :disabled="!canCompleteSprint"
      >
        Завершить спринт
      </button>
    </div>

    <!-- Burn-down chart -->
    <div class="burn-down-chart">
      <h3>Диаграмма сгорания задач</h3>
      <div class="chart-container">
        <canvas ref="burnDownChart"></canvas>
      </div>
    </div>

    <!-- Кнопки -->
    <div class="action-buttons">
      <button @click="openBacklogModal" class="action-btn">Добавить задачу из бэклога</button>
      <button @click="openTaskModal" class="action-btn">Создать новую задачу</button>
    </div>

    <!-- Agile-доска -->
    <div class="agile-board">
      <div v-for="(column, index) in columns" :key="index" class="board-column">
        <h3>{{ column.title }}</h3>
        <ul class="tasks-list">
          <li
            v-for="task in column.tasks"
            :key="task.id"
            class="task-item"
            draggable="true"
            @dragstart="onDragStart(task)"
            @dragover.prevent
            @drop="onDrop(task, column)"
          >
            <p><strong>{{ task.title }}</strong></p>
            <p>{{ task.description || "Нет описания" }}</p>
            <p class="task-priority" :class="task.priority">
              Приоритет: {{ getPriorityLabel(task.priority) }}
            </p>
            <p class="task-status">
              Статус: {{ task.status }}
            </p>
            <div class="task-assignee">
              <label for="assignee">Участник:</label>
              <select 
                :id="'assignee-' + task.id" 
                v-model="task.assigned_to"
                @change="updateTaskAssignee(task.id, task.assigned_to)"
                class="assignee-select"
              >
                <option :value="null">Не назначен</option>
                <option 
                  v-for="member in projectMembers" 
                  :key="member.id" 
                  :value="member.id"
                >
                  {{ member.name }}
                </option>
              </select>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Кнопка возврата -->
    <button @click="goBack" class="back-btn">Назад к проекту</button>

    <!-- Модальное окно для создания задачи -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="modal">
        <h2>Создание задачи</h2>
        <form @submit.prevent="createTask">
          <div>
            <label for="taskTitle">Название задачи:</label>
            <input type="text" id="taskTitle" v-model="newTask.title" required />
          </div>
          <div>
            <label for="taskDescription">Описание задачи:</label>
            <textarea id="taskDescription" v-model="newTask.description" required></textarea>
          </div>
          <div>
            <label for="taskPriority">Приоритет:</label>
            <select id="taskPriority" v-model="newTask.priority">
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div>
            <label for="taskStatus">Начальный статус:</label>
            <select id="taskStatus" v-model="newTask.status">
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="action-btn">Создать задачу</button>
            <button type="button" class="cancel-btn" @click="closeTaskModal">Отменить</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно для добавления задачи из бэклога -->
    <div v-if="showBacklogModal" class="modal-overlay" @click.self="closeBacklogModal">
      <div class="modal">
        <h2>Выберите задачу из бэклога</h2>
        <ul class="backlog-list">
          <li v-for="task in backlogTasks" :key="task.id" class="backlog-item">
            <p><strong>{{ task.title }}</strong></p>
            <p>{{ task.description || "Нет описания" }}</p>
            <button @click="addTaskToSprint(task)" class="action-btn">Добавить</button>
          </li>
        </ul>
        <button @click="closeBacklogModal" class="cancel-btn">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import Chart from 'chart.js/auto';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default {
  data() {
    return {
      sprint: {
        spt_id: null,
        spt_title: '',
        spt_start_date: '',
        spt_end_date: '',
        spt_goals: '',
        spt_project_id: null
      },
      tasks: [],
      backlogTasks: [],
      projectMembers: [],
      draggedTask: null,
      showTaskModal: false,
      showBacklogModal: false,
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
        status: 'To Do'
      },
      columns: [
        { title: 'To Do', tasks: [] },
        { title: 'In Progress', tasks: [] },
        { title: 'Done', tasks: [] },
      ],
      burnDownData: {
        ideal: [],
        actual: [],
        dates: []
      },
      chart: null,
      canCompleteSprint: false
    };
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'Не указана';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Некорректная дата';
      
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    async fetchSprint() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }
        if (!this.$route.params.id || !this.$route.params.sprintId) {
          throw new Error('Отсутствуют параметры маршрута');
        }

        const { data } = await api.get(`/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.sprint = data;

        await this.fetchSprintTasks();
        await this.fetchBacklogTasks();
        this.assignTasksToColumns();
      } catch (error) {
        console.error('Ошибка при получении данных спринта:', error);
      }
    },

    async fetchSprintTasks() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.get(`/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}/issues`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (data && Array.isArray(data)) {
          this.tasks = data.map(issue => ({
            id: issue.issue_id,
            title: issue.title || `Задача #${issue.issue_id}`,
            description: issue.description || "Описание отсутствует",
            priority: issue.priority || 'medium',
            status: issue.status || 'To Do',
            assigned_to: issue.assigned_to
          }));
        } else {
          this.tasks = [];
        }
        
        this.assignTasksToColumns();
      } catch (error) {
        console.error('Ошибка при получении задач спринта:', error);
        this.tasks = [];
        this.assignTasksToColumns();
      }
    },

    async fetchBacklogTasks() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.get(`/api/gitlab/projects/${this.$route.params.id}/issues`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (data && Array.isArray(data)) {
          this.backlogTasks = data;
        } else {
          this.backlogTasks = [];
        }
      } catch (error) {
        console.error('Ошибка при получении задач из бэклога:', error);
        this.backlogTasks = [];
      }
    },

    async addTaskToSprint(task) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        await api.post(
          `/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}/issues`,
          {
            sprint_id: this.sprint.spt_id,
            issue_id: task.id,
            story_points: 0,
            priority: 'medium',
            name_issue: task.title,
            description_issue: task.description || "Нет описания",
            agile_status: 'To Do'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const newTask = {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: 'medium',
          status: 'To Do'
        };

        this.tasks.push(newTask);
        this.assignTasksToColumns();
        this.backlogTasks = this.backlogTasks.filter(t => t.id !== task.id);
        this.closeBacklogModal();
      } catch (error) {
        console.error('Ошибка при добавлении задачи в спринт:', error);
        alert('Не удалось добавить задачу в спринт');
      }
    },

    assignTasksToColumns() {
      this.columns.forEach(column => {
        column.tasks = this.tasks.filter(task => task.status === column.title);
      });
    },

    getPriorityLabel(priority) {
      const labels = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий'
      };
      return labels[priority] || priority;
    },

    goBack() {
      this.$router.push(`/projects/${this.$route.params.id}`);
    },

    onDragStart(task) {
      this.draggedTask = task;
    },

    async onDrop(task, targetColumn) {
      if (this.draggedTask) {
        try {
          const newStatus = targetColumn.title;
          const token = localStorage.getItem('token');
          
          await api.put(
            `/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}/issues/${this.draggedTask.id}`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          this.columns.forEach(column => {
            column.tasks = column.tasks.filter(t => t.id !== this.draggedTask.id);
          });
          
          targetColumn.tasks.push(this.draggedTask);
          this.draggedTask.status = newStatus;
          
          const taskIndex = this.tasks.findIndex(t => t.id === this.draggedTask.id);
          if (taskIndex !== -1) {
            this.tasks[taskIndex].status = newStatus;
          }
          
          this.draggedTask = null;
        } catch (error) {
          console.error('Ошибка при обновлении статуса задачи:', error);
          alert('Не удалось обновить статус задачи');
        }
      }
    },

    openTaskModal() {
      this.showTaskModal = true;
    },

    closeTaskModal() {
      this.showTaskModal = false;
      this.newTask = {
        title: '',
        description: '',
        priority: 'medium',
        status: 'To Do'
      };
    },

    async createTask() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.post(
          `/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}/issues`,
          {
            sprint_id: this.sprint.spt_id,
            issue_id: Date.now(),
            story_points: 0,
            priority: this.newTask.priority,
            name_issue: this.newTask.title,
            description_issue: this.newTask.description,
            agile_status: this.newTask.status
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const newTask = {
          id: data.issue_id,
          title: this.newTask.title,
          description: this.newTask.description,
          priority: this.newTask.priority,
          status: this.newTask.status,
        };
        
        this.tasks.push(newTask);
        this.assignTasksToColumns();
        this.closeTaskModal();
      } catch (error) {
        console.error('Ошибка при создании задачи:', error);
        alert('Не удалось создать задачу');
      }
    },

    openBacklogModal() {
      this.showBacklogModal = true;
    },

    closeBacklogModal() {
      this.showBacklogModal = false;
    },

    completeSprint() {
      if (confirm('Вы уверены, что хотите завершить этот спринт? Все незавершенные задачи будут возвращены в бэклог.')) {
        const unfinishedTasks = this.tasks.filter(task => task.status !== 'Done');
        this.backlogTasks = [...this.backlogTasks, ...unfinishedTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description
        }))];
        
        this.tasks = this.tasks.filter(task => task.status === 'Done');
        this.assignTasksToColumns();
        
        this.sprint.is_completed = true;
        this.sprint.end_date = new Date().toISOString().split('T')[0];
        
        alert('Спринт успешно завершен!');
      }
    },

    prepareBurnDownData() {
      if (!this.sprint.spt_start_date || !this.sprint.spt_end_date) {
        console.error('Отсутствуют даты начала или окончания спринта');
        return;
      }

      const startDate = new Date(this.sprint.spt_start_date);
      const endDate = new Date(this.sprint.spt_end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Некорректные даты для графика');
        return;
      }

      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const totalTasks = this.tasks.length;
      
      if (totalDays <= 0) {
        console.error('Некорректный период для графика');
        return;
      }

      this.burnDownData = {
        ideal: [],
        actual: [],
        dates: []
      };
      
      for (let i = 0; i < totalDays; i++) {
        this.burnDownData.ideal.push(totalTasks - (i * (totalTasks / (totalDays - 1))));
      }
      
      const doneTasks = this.tasks.filter(task => task.status === 'Done').length;
      const currentDay = Math.min(
        Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)) + 1,
        totalDays
      );
      
      for (let i = 0; i < totalDays; i++) {
        if (i < currentDay) {
          this.burnDownData.actual.push(totalTasks - (doneTasks * (i / currentDay)));
        } else {
          this.burnDownData.actual.push(null);
        }
      }
      
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        this.burnDownData.dates.push(this.formatChartDate(date));
      }
    },

    formatChartDate(date) {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    },

    renderBurnDownChart() {
      if (!this.$refs.burnDownChart) {
        console.error('Canvas элемент не найден');
        return;
      }

      const ctx = this.$refs.burnDownChart.getContext('2d');
      if (!ctx) {
        console.error('Не удалось получить контекст canvas');
        return;
      }

      if (!this.burnDownData.dates.length || !this.burnDownData.ideal.length) {
        console.error('Нет данных для отображения графика');
        return;
      }

      if (this.chart) {
        this.chart.destroy();
      }

      try {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.burnDownData.dates,
            datasets: [
              {
                label: 'Идеальное сгорание',
                data: this.burnDownData.ideal,
                borderColor: '#3498db',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.1
              },
              {
                label: 'Фактическое сгорание',
                data: this.burnDownData.actual,
                borderColor: '#2ecc71',
                backgroundColor: 'transparent',
                borderWidth: 3,
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Осталось задач'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Дни спринта'
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Ошибка при создании графика:', error);
      }
    },

    checkSprintCompletion() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(this.sprint.spt_end_date);
      
      this.canCompleteSprint = today >= endDate || 
        this.tasks.every(task => task.status === 'Done');
    },

    async fetchProjectMembers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        const { data } = await api.get(`/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.projectMembers = data;
      } catch (error) {
        console.error('Ошибка при получении участников проекта:', error);
      }
    },

    async updateTaskAssignee(taskId, assigneeId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Отсутствует токен авторизации');
        }

        await api.put(
          `/api/projects/${this.$route.params.id}/sprints/${this.$route.params.sprintId}/issues/assignee`,
          {
            issue_id: taskId,
            assignee_id: assigneeId
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Обновляем задачу в локальном состоянии
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex].assigned_to = assigneeId;
          this.assignTasksToColumns();
        }
      } catch (error) {
        console.error('Ошибка при обновлении участника задачи:', error);
      }
    },

    getAssigneeName(assigneeId) {
      if (!assigneeId) return 'Не назначен';
      const member = this.projectMembers.find(m => m.id === assigneeId);
      return member ? member.name : 'Неизвестный участник';
    }
  },
  async mounted() {
    try {
      await this.fetchSprint();
      await this.fetchProjectMembers();
      this.prepareBurnDownData();
      await this.$nextTick();
      this.renderBurnDownChart();
      this.checkSprintCompletion();
    } catch (error) {
      console.error('Ошибка при загрузке страницы:', error);
    }
  },
  watch: {
    tasks: {
      deep: true,
      handler() {
        this.prepareBurnDownData();
        this.$nextTick(() => {
          this.renderBurnDownChart();
        });
        this.checkSprintCompletion();
      }
    }
  }
};
</script>

<style scoped>
/* Стили остаются без изменений */

.task-status {
  font-size: 0.85rem;
  color: #555;
  margin-top: 0.5rem;
  padding: 0.2rem 0.5rem;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: inline-block;
}

/* Остальные стили остаются без изменений */
.sprint-page {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
}
.sprint-page {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
}

h1 {
  font-size: 2.2rem;
  color: #34495e;
  margin-bottom: 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.sprint-dates {
  display: flex;
  gap: 2rem;
}

.sprint-dates p {
  margin: 0;
  background: #f8f9fa;
  padding: 0.8rem 1.2rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.complete-btn {
  padding: 0.75rem 1.5rem;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.complete-btn:hover:not(:disabled) {
  background-color: #27ae60;
  transform: translateY(-2px);
}

.complete-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.burn-down-chart {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.burn-down-chart h3 {
  margin-top: 0;
  text-align: center;
  color: #34495e;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.agile-board {
  display: flex;
  gap: 1.5rem;
  margin: 2rem 0;
  min-height: 70vh;
}

.board-column {
  flex: 1;
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.board-column:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.board-column h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
  text-align: center;
}

.tasks-list {
  list-style: none;
  padding: 0;
  min-height: 300px;
  display: grid;
  gap: 1rem;
}

.task-item {
  background-color: white;
  padding: 1.2rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: move;
  border-left: 4px solid #3498db;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.task-item p {
  margin: 0.3rem 0;
  line-height: 1.5;
}

.task-item p:first-child {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.05rem;
}

.task-priority {
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.task-priority.high {
  background-color: #ffebee;
  color: #c62828;
}

.task-priority.medium {
  background-color: #fff8e1;
  color: #f57f17;
}

.task-priority.low {
  background-color: #e8f5e9;
  color: #2e7d32;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.back-btn:hover {
  background-color: #95a5a6;
  transform: translateY(-2px);
}

.action-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(41, 128, 185, 0.3);
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
  backdrop-filter: blur(3px);
}

.modal {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal h2 {
  margin-top: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.modal form div {
  margin-bottom: 1.2rem;
}

.modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #34495e;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.modal textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.backlog-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.backlog-item {
  background-color: #f8f9fa;
  padding: 1.2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.backlog-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.backlog-item p {
  margin: 0.3rem 0;
  flex: 1;
}

.backlog-item p:first-child {
  font-weight: 600;
  color: #2c3e50;
}

.board-column:nth-child(1) {
  border-top: 4px solid #3498db;
}
.board-column:nth-child(2) {
  border-top: 4px solid #f39c12;
}
.board-column:nth-child(3) {
  border-top: 4px solid #2ecc71;
}

@media (max-width: 992px) {
  .agile-board {
    flex-direction: column;
  }
  
  .board-column {
    min-height: auto;
  }
  
  .tasks-list {
    min-height: 150px;
  }
}

@media (max-width: 768px) {
  .sprint-page {
    padding: 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  .sprint-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .sprint-dates {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal {
    width: 95%;
    padding: 1.5rem;
  }
  
  .backlog-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .backlog-item button {
    align-self: flex-end;
  }
}

.task-assignee {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.task-assignee label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  color: #666;
}

.assignee-select {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
}

.assignee-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}
</style>