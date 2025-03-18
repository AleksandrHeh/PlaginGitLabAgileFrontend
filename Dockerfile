# Используем базовый образ для Node.js (версия 14 или выше)
FROM node:14 AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Обновляем зависимости (если требуется)
RUN npm update

# Копируем исходный код фронтенда
COPY . .

# Собираем фронтенд
RUN npm run build

# Используем легковесный образ для запуска
FROM nginx:alpine

# Копируем собранные файлы фронтенда
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]