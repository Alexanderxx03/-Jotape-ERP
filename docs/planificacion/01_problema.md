# Documento Inicial del Problema (Primer Borrador)

## Contexto y Definición del Problema Complejo

La empresa "Distribuidor Textil Jotape E.I.R.L." enfrenta deficiencias operativas crónicas en su gestión logística y comercial. El problema central se define como la **"Falta de trazabilidad integral e ineficiencia en el control de inventarios, flujo de ventas y coordinación logística con talleres externos de confección"**.

Este no es un problema de simple digitalización, sino un problema complejo que involucra flujos físicos de mercancía (rollos de tela, insumos, prendas terminadas) descentralizados entre el almacén principal y diversos talleres externos (corte, costura). La desconexión y latencia de la información provoca quiebres de stock, la imposibilidad de saber el estado exacto de la materia prima en tránsito y pérdida de oportunidades de venta debido a una visión desactualizada del inventario en tiempo real.

## Stakeholders (Grupos de Interés) y Relaciones

1. **Administrador/Gerencia (Patrocinador y Usuario Principal):** Requiere tener visibilidad total del negocio (ventas diarias, stock valorizado, métricas de rendimiento y mermas en talleres). *Relación: Configura el entorno, delega tareas a vendedores y dirige los insumos a los talleres.*
2. **Vendedores (Usuarios Operativos):** Necesitan un sistema rápido e intuitivo para registrar ventas, añadir variantes de colores y tallas y confirmar disponibilidad inmediata de stock para cerrar transacciones frente al cliente. *Relación: Interactúan directamente con el cliente y dependen de que el Administrador mantenga actualizado el inventario maestro.*
3. **Jefes de Taller (Corte y Confección) (Proveedores Externos):** Responsables de recibir la materia prima y enviarla devuelta como producto terminado u otros cortes. *Relación: Notifican al Administrador sobre mermas, entregas parciales y material faltante.*
4. **Clientes Finales:** Expectativas de respuesta inmediata, disponibilidad y entregas a tiempo. *Relación: Se ven directamente afectados si hay un déficit informativo.*

## Identificación de Ambigüedades (≥4)

En el proceso de levantamiento inicial, se han detectado las siguientes fuentes de incertidumbre y ambigüedad que deben mitigarse durante el desarrollo:

1. **Definición y Cuantificación de "Merma" vs. "Retacería":** Actualmente no existe un consenso claro sobre qué porcentaje de pérdida en tela se considera merma normal de operación durante el corte y qué cuenta como retacería aprovechable.
2. **Control de Entregas Parciales:** Es ambiguo cómo proceder sistémicamente cuando un taller entrega el 70% del lote acordado en una fecha y el 30% restante se retrasa indefinidamente.
3. **Tiempos de Ciclo Variables en Talleres:** El tiempo estándar desde que una tela sale del almacén hacia confección hasta que retorna como producto terminado ("Lead Time") varía esporádicamente según el taller, haciendo inestable cualquier pronóstico rígido en el sistema.
4. **Manejo de Variantes y Sub-variantes:** Existe alta confusión entre si un artículo debe registrarse como un "Solo producto con 20 colores y 5 dimensiones" o como productos funcionalmente independientes. La taxonomia actual requiere una estandarización obligatoria que debe ser construida junto con los Stakeholders.

## Identificación de Restricciones Reales (≥4)

El desarrollo del proyecto está limitado y condicionado por las siguientes restricciones:

1. **Restricción Tecnológica de Adopción (Alfabetización Digital):** El equipo operativo de los talleres externos (y en algunos casos, los vendedores) tiene habilidades tecnológicas limitadas, forzando a que la interfaz de usuario de "Recepción/Salida de Talleres" deba ser excesivamente intuitiva o requerir clics mínimos, con fuerte priorización "Mobile-First".
2. **Restricción Económica / Presupuestal:** El proyecto opera actualmente sin un fondo financiero de inversión para infraestructura. Se utilizarán plataformas tipo "Serverless" (como Firebase) únicamente dentro de sus capas de uso gratuito ("Free Tier").
3. **Restricción de Tiempo (Time-Box):** El inicio y la entrega del MVP del proyecto están encajonados estrictamente a la duración del presente ciclo académico (Sprint 0 a Sprint X), sin posibilidad de expansión temporal.
4. **Restricción de Conectividad (Red):** Los almacenes y talleres en zonas periféricas pueden experimentar intermitencias de internet móvil, por lo que las peticiones del sistema no pueden perderse en caso de caídas de conexión o deben emitir un claro aviso si no se han completado correctamente, para no duplicar datos ni perder trazabilidad.

## Mejoras Propuestas

Para abordar la complejidad mencionada, se propone implementar un **sistema web modular** que incluya un seguimiento estricto del "viaje" del material. El sistema obligará a registrar explícitamente el porcentaje de merma al recibir materia prima desde los talleres, lo cual desvanece la ambigüedad #1 y #2, y brindará un "Dashboard" en vivo al Administrador y a Ventas, mitigando el problema de tiempos variables y desconexión entre almacén y caja de ventas.
