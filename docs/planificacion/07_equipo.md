# Declaración del Equipo del Proyecto

Para la construcción ágil y desarrollo del sistema logístico "Jotape Core", la gestión de perfiles metodológicos subyacentes recae en la especialización de **4 roles fundamentales (Product Owner, Scrum Master, Frontend Developer y Backend Developer)**, los cuales, dadas las restricciones del Taller de Proyectos, serán orquestados y distribuidos bajo la responsabilidad absoluta de sus 2 integrantes.

## 1. Integrantes y Asignación de Roles

| Nombre Completo | Rol Primario asignado | Rol Secundario (Técnico) | Contacto/Responsabilidad de Rol Central |
| :--- | :--- | :--- | :--- |
| **Paytan Huaman** | **Scrum Master (SM)** | **Backend & Data Architect** | *Asegura el flujo óptimo, remueve bloqueos del equipo, lidera el modelo de Base de Datos (Firestore Serverless) y gestiona despliegues.* |
| **Rojas Lara** | **Product Owner (PO)** | **Frontend Lead Developer** | *Prioriza el Backlog de Producto, define el 'Definition of Done', acepta el Incremento (Sprint Review), y estructura la Interfaz de Usuario bajo Next.js / TailwindCSS.* |

## 2. Responsabilidades Detalladas

### A) Product Owner (Rojas Lara)
Crea y afina (grooming) las Historias de Usuario para el "Jotape Backlog", priorizando activamente los requerimientos funcionales críticos ("RF01", "RF03") para generar un Producto Mínimo Viable de inmediato. Aprueba lo que está codificado y decide cuándo el proyecto avanza, alineándose a la resolución del "problema complejo" dictado en los entregables empresariales y universitarios.

### B) Scrum Master (Paytan Huaman)
Mantiene a ambas partes blindadas de factores de distracción cruzada. Promueve que los *Sprints* sigan un ciclo sostenido ("Time-box"), resolviendo dudas relativas a la gestión de ramas en *GitHub* que entorpezcan al *Developer*, y documenta diligentemente los retrospectivos (impedimentos / lecciones del software base).

### C) Frontend Lead Developer (Rojas Lara)
*Development Team:* Construye todo el marco interactivo visual, componentes de UI/UX, flujos de autenticación e informes gráficos; consumiendo datos de la nube con altos estándares "Mobile-First" (RNF01) sin descuidar el "Time-to-Interactive" (<= 2 segundos).

### D) Backend & Data Architect (Paytan Huaman)
*Development Team:* Crea la estructura fundamental y las reglas en JSON o *TypeScript* de los esquemas NoSQL (Product, Variant, Sale_Log, Dispatch_Workshop). Genera el esquema de permisos rigurosos vía Firebase Rules para validar y encriptar los flujos de "Administrador vs. Operario" (RNF04).

## 3. Normas de Trabajo (Scrum Working Agreements)

El éxito y coherencia colaborativa de los roles en la iteración Agile están sustentados bajo el estricto apego y vigencia de las siguientes reglas y ceremonias, conocidas como "Working Agreements":

1.  **Ceremonia "Daily Stand-up" Asíncrona:** Obligatoriedad de informar (vía un canal Slack/Discord o un Tracker) el marco de 3 preguntas de Scrum (Qué se hizo ayer, qué se hará hoy y qué impedimentos hay) de manera diaria o interdiaria fijada por el SM.
2.  **Transparencia Total (GitHub Pushes):** El trabajo de desarrollo de cualquier rama local `(feature/xyz)` debe ser forzosamente respaldado y *pusheado* ("git push") al servidor en la nube de GitHub al terminar el período/día de codiseño por cualquiera de los Devs. Está vetado acaparar o "secuestrar" código final en un disco duro aislado.
3.  **Definition of Done (DoD) - "Definición de Terminado":** El Product Owner no considerará una Tarea/Historia de Usuario como superada a menos que:
    *   Haya pasado validación *Linting*/ausencia de "Error Logs" críticos.
    *   Se ajuste a la coherencia de estilos de interfaces.
    *   Se haya subido como mínimo a la rama `develop` a merced del Pull Request.
4.  **Toma de Decisiones Conjunta en Planning:** Todas las estimaciones relativas a qué construir en la semana (Sprint Planning) serán decididos exclusivamente bajo votación o consenso en `Story Points / Horas` entre Paytan y Rojas; sin presiones impuestas unidireccionalmente.
