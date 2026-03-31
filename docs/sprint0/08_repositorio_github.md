# Repositorio GitHub Estructurado

Este documento sirve como evidencia ("Entregable F") de la creación y operación ágil del repositorio para el proyecto "Jotape Core".

## 1. Operatividad y Estructura Organizada

El proyecto se encuentra centralizado en una estructura de monorepositorio que aloja tanto la documentación ágil (Sprint 0) como el código fuente inicial (Next.js, Tailwind, Firebase).

```text
/ (Raíz del Repositorio)
├── docs/
│   └── sprint0/
│       ├── 01_problema.md
│       ├── 02_requerimientos.md
│       ├── 03_enfoque.md
│       ├── 04_vision.md
│       ├── 05_project_charter.md
│       ├── 06_supuestos_restricciones.md
│       ├── 07_equipo.md
│       └── 08_repositorio_github.md
├── frontend/ (MVP Base Code)
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

Hitos alcanzados:
*   Repositorio inicializado e integrado.
*   Documentación separada del código fuente y catalogada lógicamente.

## 2. Uso de Ramas Funcionales (Git Flow)

Se ha establecido y comprobado el uso metodológico de ramas para seguir la integración continua. El flujo de aprobación ("Pull Requests") asegura que ningún código se introduzca a Producción sin consentimiento.

1.  **Rama `main`:** Rama resguardada de Producción (Solo despliegue o releases formales).
2.  **Rama `develop`:** Rama de integración e iteración (Sprints).
3.  **Ramas `feature/sprint0-docs` u otras:** (Ej. la rama donde se escriben estos documentos actualmente). Ramas aisladas para tareas cortas, las cuales se unen (`merge`) de vuelta a `develop` una vez el equipo o el "Product Owner" valida la calidad.

## 3. Acceso Compartido Verificado

El equipo del proyecto se encuentra enlistado y habilitado con privilegios de contribución de lectura y escritura ("Write/Maintain Access") al proyecto GitHub activo:

*   **Paytan Huaman** - (Colaborador / Owner)
*   **Rojas Lara** - (Colaborador / Owner)

Ambos desarrolladores disponen de credenciales para efectuar *commits* bajo sus correos institucionales/personales registrados, asegurando plena colaboración asíncrona fundamental de Scrum.

## 4. Control de Versiones Iniciales (≥5 Commits)

El equipo asegura haber realizado múltiples interacciones al núcleo base durante este inicio documentado. Algunos de los mensajes de *commits* registrados verificados para la calificación de este pre-requisito (Sprint 0) incluyen la atomización de los documentos de manera aislada ("Commit History" del repositorio):

1.  `docs(sprint0): agregar analisis inicial del problema`
2.  `docs(sprint0): definir lista de requerimientos RF/RNF`
3.  `docs(sprint0): incluir justificativa del enfoque agil`
4.  `docs(sprint0): redactar project charter y vision`
5.  `docs(sprint0): agregar restricciones y normas del equipo`
