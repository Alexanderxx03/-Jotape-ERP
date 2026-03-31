# Lista Preliminar de Requerimientos Funcionales y No Funcionales

A partir del Documento Inicial del Problema de la empresa "Distribuidor Textil Jotape E.I.R.L.", y en base a la necesidad urgente de mantener bajo control los inventarios y las salidas a talleres, se han definido los siguientes requerimientos iniciales (verificables y trazables a las deficiencias y ambigüedades identificadas).

---

## 1. Requerimientos Funcionales (RF)

Los Requerimientos Funcionales detallan el comportamiento del sistema y las opciones directas que los usuarios podrán realizar. Estas historias y tareas son la base del Product Backlog:

*   **RF01 - Gestión del Inventario Maestro:** El sistema debe permitir al Administrador crear, leer, actualizar y dar de baja (CRUD) productos principales y sus respectivas variantes (color, talla, SKU y cantidad stockológica).
*   **RF02 - Módulo de envíos a Talleres (Salida de Mercancía):** El sistema debe permitir al usuario autorizar y registrar la salida física temporal de rollos o tela parcial hacia talleres externos (Corte, Costura), vinculándolo a un proveedor o encargado del taller.
*   **RF03 - Módulo de Recepción (Retornos de Taller y Control de Merma):** El sistema debe proporcionar una interfaz que exija el registro de la cantidad real recibida desde los talleres y calcular de inmediato el porcentaje o cantidad equivalente en "merma" frente a lo enviado, para su posterior conciliación. *(Trazar al problema de ambigüedad de mermas vs retacería)*.
*   **RF04 - Módulo de Ventas y Búsqueda Ágil:** El sistema debe contar con un panel para Vendedores, integrando un buscador veloz de productos (por código o nombre) y facilitando añadir elementos a una cesta transaccional para restar stock instantáneamente.
*   **RF05 - Trazabilidad de Ciclo de Vida del Producto:** El sistema debe registrar un historial o bitácora observable de los movimientos, permitiendo auditorías para rastrear cuándo y hacia dónde salió un activo, y cuándo retornó a tienda.
*   **RF06 - Alertas de Restock (Stock Bajo):** El sistema notificará de manera visual y clara en el panel de inventario a aquellos artículos cuyo recuento caiga por debajo del umbral mínimo configurado.
*   **RF07 - Dashboard Gerencial (Reportes):** El sistema debe mostrar un resumen gerencial (KPIs) en la vista de Administrador, indicando métricas clave como: productos más vendidos y el flujo logístico a talleres, para rápida toma de decisiones.
*   **RF08 - Autenticación y Rol del Usuario:** El sistema debe clasificar a los usuarios al menos en dos niveles de privilegios jerárquicos ("Administrador" y "Vendedor"), limitando qué flujos o pantallas puede visualizar y manipular cada uno.

---

## 2. Requerimientos No Funcionales (RNF)

Los Requerimientos No Funcionales detallan los criterios de calidad, infraestructura y atributos transversales del sistema.

*   **RNF01 - Usabilidad (Mobile-First y Simplicidad):** Las interfaces dirigidas tanto al módulo de ventas como a la recepción de talleres, deben tener diseño responsivo óptimo para resoluciones pequeñas (desde 360px de ancho) y priorizar flujos de bajo número de "clicks" para no requerir alta alfabetización digital del usuario final o de los operarios textiles.
*   **RNF02 - Despliegue, Arquitectura y Disponibilidad:** La solución y su capa de Base de Datos deben estar desplegadas bajo una infraestructura sin mantenimiento fijo para el cliente (Serverless Cloud native, ej. Google Firebase/Firestore) asegurando una métrica de al menos 99.5% de tiempo de actividad mensual.
*   **RNF03 - Rendimiento y Tiempos de Respuesta:** Las transacciones principales (registrar una venta o emitir un descuento al inventario) deben procesarse de cara al usuario en un lapso no mayor a `2 segundos` sobre una conexión móvil estable (4G/LTE), dado el entorno comercial físico donde operarán las cajas.
*   **RNF04 - Seguridad y Privacidad (Control de Acceso):** Todas las consultas directas de escritura a la Base de Datos tendrán reglas del lado del servidor (Firebase Security Rules) garantizando que ninguna cuenta de terceros y ningún "Vendedor" (usuario sin los claims administrativos) pueda alterar datos históricos de métricas o de inventario subyacente de manera directa.
*   **RNF05 - Soporte Multiplataforma (Navegadores y Dispositivos Web):** La implementación web moderna debe ejecutarse de forma unificada y libre de inconsistencias a través de las versiones recientes de Google Chrome, Mozilla Firefox y Apple Safari (tanto en desktop como iOS/Android).
