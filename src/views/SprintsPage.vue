<template>
    <div class="sprint-page">
      <h1>{{ sprint.title }}</h1>
      <p><strong>Описание:</strong> {{ sprint.description || "Нет описания" }}</p>
      <p><strong>Период:</strong> {{ formatDate(sprint.startDate) }} - {{ formatDate(sprint.endDate) }}</p>
  
      <!-- Список задач -->
      <div class="tasks-section">
        <h2>Задачи спринта</h2>
        <ul v-if="sprint.tasks.length > 0" class="tasks-list">
          <li v-for="task in sprint.tasks" :key="task.id" class="task-item">
            <p><strong>Задача:</strong> {{ task.title }}</p>
            <p><strong>Описание:</strong> {{ task.description || "Нет описания" }}</p>
            <p><strong>Статус:</strong> {{ task.state }}</p>
          </li>
        </ul>
        <div v-else class="no-tasks">
          В этом спринте нет задач.
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        sprint: {}, // Текущий спринт
      };
    },
    created() {
      const projectId = this.$route.params.id;
      const sprintId = this.$route.params.sprintId;
      this.fetchSprint(projectId, sprintId);
    },
    methods: {
      fetchSprint(projectId, sprintId) {
        // Ищем спринт в массиве
        const project = this.$store.state.projects.find(p => p.id === projectId);
        if (project) {
          this.sprint = project.sprints.find(s => s.id === sprintId);
        }
      },
      formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
  };
  </script>