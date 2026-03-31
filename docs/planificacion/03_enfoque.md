# Documento de Selección del Enfoque del Proyecto

El desarrollo del sistema para "Distribuidor Textil Jotape E.I.R.L." requiere un plan metodológico y tecnológico adecuado que responda a la complejidad de las necesidades y a las restricciones descubiertas.

## 1. Selección del Enfoque Metodológico

### 1.1 Alternativas Evaluadas

**A) Modelo Tradicional (Cascada - Waterfall):**
*   **Pros:** Alta predictibilidad si los requisitos están fijos desde el inicio, documentación extensiva y etapas secuenciales bien demarcadas.
*   **Contras:** Incapacidad de reacción una vez la etapa de diseño de requisitos esté cerrada, nulo involucramiento del cliente durante los meses de desarrollo puro. Alto riesgo de entregar un producto obsoleto al final del proyecto.

**B) Metodología Ágil (Scrum):**
*   **Pros:** Fomenta un esquema de entregas incrementales (Sprints), permite la priorización según valor directo (Backlog) e involucra al usuario/stakeholder repetidamente a través de "Sprint Reviews".
*   **Contras:** Curva de aprendizaje inicial en la ceremonia e incertidumbre en el alcance final si faltan especificaciones de base.

### 1.2 Justificación de la Selección Criterio-Restricción

**Decisión Adoptada:** Se escoge **Scrum** (Enfoque Ágil).

**Fundamentación Técnica y del Negocio:**
El problema subyacente de Jotape posee una alta tasa de **ambigüedad** (ej. la verdadera definición de la métrica de mermas vs retazos durante las recepciones). Bajo la premisa del Manifiesto Ágil, no es factible exigir requisitos fijos perfectos ahora. La Restricción Temporal de "lanzar un MVP bajo marco académico" se ajusta de la manera más efectiva a Scrum; las revisiones iterativas permitirán ajustar la interfaz orientada a "moverse rápido" si observamos que a los operadores de talleres se les dificulta un formulario, a diferencia del modelo Cascada donde el feedback aparecería semanas o meses más tarde.

---

## 2. Selección del Stack Tecnológico / Arquitectura

### 2.1 Alternativas Evaluadas

**A) Monolito Tradicional Server-Side (PHP + MySQL hospedado en cPanel/VPS genérico):**
*   **Pros:** Tecnología madura, alto entendimiento universal para hosting, bajo costo estándar y reglas ACID rígidas garantizadas por SQL.
*   **Contras:** Escalabilidad vertical limitante (requiere migraciones costosas de servidor), escasa amabilidad inicial hacia un modo "Mobile-First" reactivo o progresivo (PWA), alta latencia conllevando recargas enteras de página en cada transacción.

**B) Cloud-Native / Serverless Frontend Reactivo (React/Next.js + Tailwind + Firebase/Firestore):**
*   **Pros:** Latencia ultra baja para actualizaciones en vivo (Websockets implícitos), despliegue distribuido de alto rendimiento (CDN global - Vercel), interfaz responsiva ultra fluida e intrínseca seguridad basada en roles sin gestión de servidores propios.
*   **Contras:** El modelo NoSQL requiere de mayor destreza en la desnormalización de datos inicialmente. Costos variables que escalan según lecturas (si excediera el Free-Tier).

### 2.2 Justificación de la Selección Criterio-Restricción

**Decisión Adoptada:** Se selecciona la **opción B (Ecosistema Serverless: Next.js + TailwindCSS + Firebase)**.

**Fundamentación Técnica:**
*   **Restricción Económica y Administrativa:** Firebase Firestore permite iniciar el despliegue con un entorno backend "Cero Costo" y "Cero Mantenimiento", a diferencia de un VPS MySQL que requeriría parches y un pago de suscripción mensual perpetuo. Al solo contar con un equipo de 2 personas, se debe maximizar el tiempo de desarrollo de características de negocio delegando la infraestructura del backend a servicios manejados como Google Cloud (Firebase).
*   **Respuesta Asíncrona (RNF03):** La naturaleza cliente-servidor reactiva de Next.js/React permitirá al Vendedor realizar búsquedas instantáneas de inventario sin cruzar un "página-refresh", reduciendo el tiempo de atención de clientes a la mitad frente al modelo tradicional.
*   **Velocidad de Adaptación y UI Compleja:** Tailwind CSS permite a los desarrolladores un maquetado sumamente rápido desde un diseño de "Alta Fidelidad" a la construcción, crucial por el apretado cronograma.
