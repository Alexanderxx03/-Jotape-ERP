# 🚀 Jotape - Sistema de Gestión de Inventario y Ventas

Bienvenido al repositorio oficial de **Jotape**, el sistema integral de administración de inventarios, control de talleres y ventas corporativas para Distribuidor Textil Jotape E.I.R.L.

---

## 📖 Wiki y Documentación General

Este repositorio cuenta con una extensa documentación organizada por Sprints, en donde se detalla y sustenta toda la planeación de Ingeniería de Software detrás de la construcción de esta plataforma.

Puedes navegar hacia nuestra "Wiki local" entrando al directorio de **[Documentación Oficial (`/docs`)](./docs)**.

### 🗂️ Documentos de Inicio (Sprint 0)
- **[Problema y Oportunidad de Negocio](./docs/sprint0/01_problema.md)**
- **[Project Charter (Acta de Constitución)](./docs/sprint0/05_project_charter.md)** 
- **[Supuestos y Restricciones](./docs/sprint0/06_supuestos_restricciones.md)**
- **[Equipo de Desarrollo](./docs/sprint0/07_equipo.md)**
- **[Estructura y Lineamientos del Repositorio](./docs/sprint0/08_repositorio_github.md)**
- **[Plan de Prácticas Profesionales](./docs/sprint0/09_plan_de_actividades.md)** *(Si aplica al equipo actual)*

---

## 💻 Pila Tecnológica (Tech Stack)

El proyecto está desarrollado utilizando herramientas ágiles y modernas de vanguardia en la industria web.

### Frontend (`/frontend`)
- **Framework Principal:** [Next.js 15 (React 19)](https://nextjs.org/)
- **Estilizador UI:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Gestor de Estado y Base de Datos:** [Firebase](https://firebase.google.com/) (Firestore)
- **Animaciones y UX:** Framer Motion
- **Gráficos Estadísticos:** Recharts
- **Iconografía:** Lucide React

---

## ⚙️ Estructura del Sistema

```plaintext
Jotape/
├── docs/                 # Wiki del Proyecto (Sprint 0, Requerimientos, etc.)
├── frontend/             # Código fuente de la Aplicación Web
│   ├── src/              # Componentes, Páginas y Hooks de Next.js
│   ├── public/           # Recursos estáticos
│   └── (configuración)   # package.json, tailwind, vite/next config
├── firebase.json         # Configuración y Reglas de seguridad de Firebase
├── .firebaserc           # Referencias a los proyectos cloud de Google
└── README.md             # Inicio de la Wiki / Resumen del Proyecto
```

## 🚀 Cómo inicializar en Local

1. Asegúrate de tener instalado **Node.js** (v20 o superior).
2. Clona el repositorio e ingresa a la carpeta del proyecto.
3. Posiciónate en la carpeta del Frontend:
   ```bash
   cd frontend
   npm install
   ```
4. Agrega las variables de entorno para firebase (`.env.local`).
5. Corre el entorno de desarrollo:
   ```bash
   npm run dev
   ```
6. Abre `http://localhost:3000` en tu navegador.

---
*Desarrollado para Distribuidor Textil Jotape E.I.R.L. Área de Desarrollo de Software.*
