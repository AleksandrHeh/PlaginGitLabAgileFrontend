<template>
  <div class="auth-container">
    <div class="form-wrapper" :class="{ 'shake': isShaking }">
      <h2 class="title">Вход</h2>
      <div class="logo-animation">
        <div class="gitlab-logo" v-if="showLogo">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="#FC6D26" d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
          </svg>
        </div>
      </div>
      <button 
        @click="loginWithGitLab" 
        class="gitlab-login-button"
        @mouseenter="hoverButton"
        @mouseleave="unhoverButton"
      >
        <span class="button-content">
          <span class="button-text">Войти через GitLab</span>
          <span class="button-icon">→</span>
        </span>
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <div class="loading-dots" v-if="isLoading">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    <div class="particles">
      <div class="particle" v-for="(particle, index) in particles" :key="index" 
           :style="particleStyle(particle)"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      errorMessage: '',
      isShaking: false,
      showLogo: false,
      isLoading: false,
      particles: [],
      colors: ['#FC6D26', '#E24329', '#FCA326', '#6A4C93']
    };
  },
  mounted() {
    this.showLogo = true;
    this.createParticles();
  },
  methods: {
    loginWithGitLab() {
      try {
        this.isLoading = true;
        // Имитация задержки перед перенаправлением
        setTimeout(() => {
          window.location.href = 'http://localhost:4000/api/gitlab/auth';
        }, 1500);
      } catch (error) {
        console.error('Ошибка при перенаправлении:', error);
        this.errorMessage = 'Произошла ошибка. Попробуйте позже.';
        this.isShaking = true;
        setTimeout(() => this.isShaking = false, 500);
        this.isLoading = false;
      }
    },
    hoverButton() {
      this.showLogo = false;
      setTimeout(() => this.showLogo = true, 300);
    },
    unhoverButton() {
      // Дополнительные эффекты при уходе курсора
    },
    createParticles() {
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 5 + 2,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2
        });
      }
      this.animateParticles();
    },
    animateParticles() {
      if (this._particleAnimation) return;
      
      const animate = () => {
        this.particles.forEach(p => {
          p.x += p.speedX;
          p.y += p.speedY;
          
          if (p.x > 100 || p.x < 0) p.speedX *= -1;
          if (p.y > 100 || p.y < 0) p.speedY *= -1;
        });
        this._particleAnimation = requestAnimationFrame(animate);
      };
      animate();
    },
    particleStyle(particle) {
      return {
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        opacity: Math.random() * 0.4 + 0.2
      };
    }
  },
  beforeUnmount() {
    if (this._particleAnimation) {
      cancelAnimationFrame(this._particleAnimation);
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.form-wrapper {
  background-color: white;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  max-width: 420px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
  transform: translateY(0);
}

.form-wrapper.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}

.title {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
  background: linear-gradient(45deg, #FC6D26, #E24329);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.logo-animation {
  height: 60px;
  margin-bottom: 1.5rem;
  position: relative;
}

.gitlab-logo {
  animation: bounce 1.5s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.gitlab-login-button {
  width: 100%;
  padding: 1rem;
  background-color: #fc6d26;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  position: relative;
}

.gitlab-login-button:hover {
  background-color: #e05d1a;
  box-shadow: 0 8px 20px rgba(252, 109, 38, 0.4);
  transform: translateY(-3px);
}

.gitlab-login-button:active {
  transform: translateY(1px);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.button-icon {
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-10px);
}

.gitlab-login-button:hover .button-icon {
  opacity: 1;
  transform: translateX(0);
}

.error {
  color: #e24329;
  margin-top: 1.2rem;
  animation: fadeIn 0.3s ease-out;
}

.loading-dots {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #fc6d26;
  animation: bounce 1s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.particle {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}
</style>