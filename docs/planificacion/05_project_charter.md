# Project Charter (Acta de Constitución del Proyecto)

**Nombre del Proyecto:** Sistema Web Integrado de Control de Inventario y Operaciones "Jotape Core"
**Fecha de Elaboración:** Marzo 2026
**Cliente/Patrocinador:** "Distribuidor Textil Jotape E.I.R.L." (RUC: 20612487171)
**Metodología:** Scrum (Desarrollo Ágil)

---

## 1. Propósito y Justificación (Business Case)
El proyecto busca resolver la crisis operativa de control de inventarios descentralizado. La empresa enfrenta pérdidas económicas debido a discrepancias físicas versus lógicas y falta de control sobre los textiles despachados a talleres externos (corte y costura). La implementación del sistema unificará las ventas con la trazabilidad logística para reducir en un 40% las brechas informativas y evitar quiebres de stock.

## 2. Objetivos del Proyecto (SMART)
*   **Obj 1:** Diseñar y desplegar una plataforma web/móvil con módulo de ventas y recepción de talleres 100% funcional y testeado antes del fin del ciclo académico.
*   **Obj 2:** Consolidar un modelo de "Almacén Centralizado en la Nube" logrando mapear el 95% de la mercadería rotativa al finalizar el Sprint 3.
*   **Obj 3:** Lograr tiempos de operación e inerfaz para registro de nuevas ventas de menos de 10 segundos, reduciendo la fricción tecnológica para el usuario.

## 3. Alcance del Proyecto
### Incluye (In-Scope):
*   Gestión y creación (CRUD) de Módulo Inventario (Productos, Variantes, Tallas y Colores).
*   Módulo de Control de Talleres y Operaciones Externas (Envío y Recepción con control explícito de merma y retazo).
*   Módulo de Punto de Venta (Registro y salida stock).
*   Panel de Autenticación de Usuarios / Roles y Dashboard gerencial de reportes.
*   Alojamiento serverless en entorno de la nube (Firebase).

### No Incluye (Out-of-Scope):
*   Facturación electrónica directa conectada de manera oficial con la SUNAT peruana (estará fuera del MVP).
*   Gestión de recursos humanos, marcación de asistencia de trabajadores, o planillas y nóminas.

## 4. Stakeholders (Interesados Principales)
1.  **Patrocinador / Gerencia (Usuario Administrador):** Principal interesado en el ROI, eficiencia y métricas del Dashboard.
2.  **Operarios y Vendedores:** Usuarios del front-end en tienda física.
3.  **Jefes de Taller de Confecciones Externos:** Interesados en la parte resolutiva y entrega de materiales con interfaz minimalista.
4.  **Equipo Desarrollador:** Paytan Huaman, Rojas Lara.

## 5. Entregables Principales
*   **Documentación Ágil y Arquitectónica** (Sprint 0).
*   **MVP Web Responsivo** desplegado vía Vercel.
*   **Código Fuente** versionado bajo un repositorio central colaborativo en GitHub.
*   **Esquema Funcional de Base de Datos** NoSQL (Firestore).

## 6. Riesgos Iniciales Identificados
*   **Riesgo Tecnológico/Capacitación:** Rechazo del personal del taller o vendedor para operar la app móvil (Probabilidad: Media | Impacto: Alto). *Mitigación: Fuerte enfoque UI Mobile-first e interfaces intuitivas.*
*   **Riesgo de Infraestructura (Límites gratuitos):** Superar el plan Spark gratuito mensual de Firebase si la base de datos no está modelada eficientemente (Prob: Baja | Imp: Alto). *Mitigación: Consultas y escuchas optimizadas en Next.js.*

## 7. Cronograma Preliminar por Hitos (Milestones - Sprints)

| Fase / Hito                  | Entregables / Objetivos Clave                                                                   | 
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| **Sprint 0: Inicio**         | Project Charter, Backlog Inicial, Diseño de Arquitectura, Repositorio Git.                     |
| **Sprint 1: Base & Auth**    | Setup de Next.js, Firebase Auth. Base de datos operativa y CRUD Base del inventario.           |
| **Sprint 2: Ventas y CRUD**  | Pantallas Reactivas para cajeros/vendedores, descuento del stock real y UI responsiva.         |
| **Sprint 3: Outsourcing**    | Módulo completo de Recepción/Salida a Talleres externos. Algoritmo calculador de mermas.        |
| **Sprint 4: Pull y Entrega** | Testing final en dispositivos. Dashboard gerencial culminado. Pase a producción estable (MVP). |
