# La Tarima - Frontend

**Panel administrativo para el sistema de reservas y gestión del bar La Tarima.**

## 📋 ¿Qué incluye?

- Interfaz React + Vite para administrar:
  - Clientes
  - Productos
  - Órdenes
  - Reservas
  - Pagos
  - Descuentos
  - Reportes
- Conexión con la API REST del backend (`la-tarima-back`).
- Rutas protegidas para acceso administrativo.
- Manejo de estados y consumo de datos con `axios`.

## 🚀 Requisitos

- Node.js 18+ instalado
- npm 9+ instalado
- Backend ejecutándose en `http://localhost:3000` (o ajustar la URL en `src/Api/axios.js`)

## 🔧 Instalación y ejecución

```bash
cd "la-tarima-front"
npm install
npm run dev
```

Luego abre el enlace que muestra Vite (por defecto `http://localhost:5173`).

## 🛠 Comandos disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Genera la versión de producción
npm run preview  # Previsualiza la versión de producción
npm run lint     # Ejecuta ESLint en el proyecto
```

## 🗂 Estructura principal

- `src/main.jsx`  → Punto de entrada de React
- `src/App.jsx`   → Configuración de rutas y layout global
- `src/Api/axios.js` → Instancia Axios para llamadas al backend
- `src/components/` → Componentes reutilizables
- `src/Pages/`    → Vistas de la aplicación
- `src/assets/`   → Recursos estáticos

## ⚙️ Configuración del backend

La aplicación frontend consume la API desde `src/Api/axios.js`. Si tu backend usa otra dirección, actualiza el valor de `baseURL` en ese archivo.

```js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

export default axiosInstance;
```

## 📌 Notas

- Asegúrate de tener el backend corriendo antes de iniciar el frontend.
- Si agregas nuevas rutas al backend, actualiza los servicios y componentes correspondientes en `src/Pages/`.
- El frontend está diseñado para usarse como panel administrativo; no incluye un sitio público separado.
