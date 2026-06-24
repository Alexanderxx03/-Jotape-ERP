# Diagramas de Secuencia por Roles: Antes vs. Después (Jotape ERP)

Este documento presenta una comparativa visual de los flujos de trabajo de Distribuidor Textil Jotape E.I.R.L. Muestra la diferencia radical entre el **Proceso Anterior (Lápiz, Papel y WhatsApp)** y el **Proceso Nuevo (Automatizado con Jotape ERP)** para cada uno de los roles clave de la empresa.

---

## 1. Rol: Administrador Gerencial / Gerente (Master)
El Administrador supervisa la empresa, configura el catálogo y toma decisiones de abastecimiento de materia prima.

### A) Proceso Anterior (Lápiz, Papel y WhatsApp)
El Administrador dependía de consolidaciones manuales al final del día y de conteos presenciales en almacén para saber el estado de la empresa.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador (Master)
    actor Vendedor as Vendedor (Caja)
    actor Almacen as Almacenero
    participant Libreta as Talonarios / Libretas Físicas
    participant AlmacenFisico as Almacén Físico

    %% Flujo 1: Consolidación de Ventas
    Note over Admin, Vendedor: Consolidación Diaria de Ventas
    Admin->>Vendedor: Solicita el resumen de ventas del día
    Vendedor->>Libreta: Revisa boletas físicas escritas a mano
    Libreta-->>Vendedor: Talonario con copias de boletas
    Vendedor-->>Admin: Entrega el talonario de boletas físicas
    Admin->>Admin: Suma manualmente los montos (Riesgo de errores matemáticos)

    %% Flujo 2: Inventario de materia prima
    Note over Admin, AlmacenFisico: Control de Stock de Tela
    Admin->>Almacen: Pregunta stock disponible de rollos de franela
    Almacen->>AlmacenFisico: Camina al almacén y cuenta físicamente rollo por rollo
    AlmacenFisico-->>Almacen: Conteo físico visual (Aproximado)
    Almacen-->>Admin: Reporta la cantidad verbalmente o en papelito

    %% Flujo 3: Decisiones de Abastecimiento
    Note over Admin: Toma de Decisiones a "Ojo"
    Admin->>Admin: Decide la compra de rollos según su intuición (Sin gráficas ni proyecciones de demanda)
```

### B) Proceso Nuevo (Con Jotape ERP)
El Administrador tiene visibilidad total, configura variantes al vuelo y cuenta con reportes predictivos con Inteligencia Artificial.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador (Master)
    participant UI as Frontend Next.js (App Router)
    participant Auth as Firebase Auth
    participant API as API Route (/api/predictions)
    participant DB as Firestore (Colecciones)
    participant Gemini as Gemini API (AI Studio)

    %% Flujo 1: Autenticación
    Note over Admin, Auth: Flujo de Acceso y Verificación
    Admin->>UI: Ingresa Credenciales (Login)
    UI->>Auth: Autenticar Usuario (email/password)
    Auth-->>UI: Retorna Token de Usuario (permisos: master)
    UI->>UI: Valida permisos en Sidebar (Muestra Dashboard e IA)

    %% Flujo 2: Creación de Variantes Dinámicas
    Note over Admin, DB: Flujo de Configuración al Vuelo
    Admin->>UI: Agrega nueva variante (Ej: Color "Gris Jaspeado")
    UI->>DB: runTransaction() en 'configuracion/opciones_formulario'
    DB-->>UI: Confirmación de actualización exitosa
    UI-->>Admin: Muestra la nueva opción seleccionada en los formularios

    %% Flujo 3: Predicciones Inteligentes con IA
    Note over Admin, Gemini: Consulta de Predicciones e Insights IA
    Admin->>UI: Clic en "Ver Predicciones IA" (o botón Refrescar)
    UI->>API: GET /api/predictions (Envía Token de Auth)
    API->>API: Valida token del Administrador
    API->>DB: Query de ventas, corte e inventario (últimos 60 días)
    DB-->>API: Datos históricos
    API->>API: Consolda y estructura el prompt en JSON
    API->>Gemini: POST /v1beta/models/gemini-2.5-flash (Datos + Schema JSON)
    Gemini-->>API: Retorna JSON (Predicciones, Reabastecimiento, Alertas)
    API-->>UI: Envía JSON de predicciones
    UI->>UI: Renderiza gráficos de barras (Recharts) e Insights de compra
    UI-->>Admin: Muestra Dashboard Inteligente con recomendaciones
```

---

## 2. Rol: Encargado de Almacén (Inventario)
El Almacenero recibe mercancía de los talleres de costura y despacha productos terminados o materia prima.

### A) Proceso Anterior (Lápiz, Papel y WhatsApp)
Los registros eran manuscritos en un cuaderno (Kardex físico), propenso a pérdidas, borrones y sin sincronización con la caja de ventas.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    actor Proveedor as Taller / Proveedor Externo
    participant Kardex as Kardex Físico (Cuaderno)
    participant Estante as Almacén / Estantería Física

    %% Flujo 1: Ingreso de material
    Note over Almacen, Kardex: Registro de Ingreso
    Proveedor->>Almacen: Entrega lote de prendas confeccionadas o rollos de tela
    Almacen->>Almacen: Cuenta manualmente las unidades (Camisetas, pantalones)
    Almacen->>Kardex: Anota la cantidad ingresada, fecha y tipo a mano
    Kardex-->>Almacen: Registro estático (Sin validación ni alertas)

    %% Flujo 2: Auditoría y Búsqueda de existencias
    Note over Almacen, Estante: Consulta de Disponibilidad
    Almacen->>Estante: Camina y busca visualmente entre las cajas de stock
    alt Producto encontrado
        Estante-->>Almacen: Stock físico existente
    else No encontrado o mal ubicado
        Note over Almacen: Pérdida de tiempo y retraso en la entrega
    end
```

### B) Proceso Nuevo (Con Jotape ERP)
El Almacenero registra transacciones digitales instantáneas con IDs secuenciales seguros, actualizando el stock global en tiempo real.

```mermaid
sequenceDiagram
    autonumber
    actor Almacenero as Encargado de Almacén
    participant UI as Frontend Next.js
    participant DB as Firestore (Colecciones)

    %% Flujo 1: Ingreso de Rollos
    Note over Almacenero, DB: Ingreso de Materia Prima (Telas)
    Almacenero->>UI: Registra Ingreso de Rollo (Tela, Color, Cantidad)
    UI->>DB: addDoc() en 'inventario_rollos'
    DB-->>UI: Retorna ID del documento creado
    UI-->>Almacenero: Muestra confirmación e incrementa stock de tela

    %% Flujo 2: Recepción de producto terminado
    Note over Almacenero, DB: Recepción de Confección
    Almacenero->>UI: Registra Entrada de Prendas (Categoría, Talla, Cantidad)
    UI->>DB: setDoc() en 'entradas_inventario' (ID secuencial INV-XXXXX)
    UI->>DB: runTransaction() para actualizar stock de productos
    DB-->>UI: Confirmación de transacción
    UI-->>Almacenero: Muestra stock actualizado del producto

    %% Flujo 3: Salidas y Ajustes por Merma
    Note over Almacenero, DB: Ajustes Manuales o Salidas por Defectos
    Almacenero->>UI: Registra Salida o Discrepancia (Ej. Faltantes/Defectuosos)
    UI->>DB: Valida que la cantidad a retirar <= Stock disponible
    UI->>DB: Registra incidencia en 'discrepancias_inventario' y resta stock
    DB-->>UI: Éxito en BD
    UI-->>Almacenero: Alerta visual de stock actualizado
```

---

## 3. Rol: Encargado de Producción (Corte, Costura y Talleres)
Este rol coordina a los talleres externos de confección, administrando el envío de rollos y el retorno de prendas confeccionadas.

### A) Proceso Anterior (Lápiz, Papel y WhatsApp)
El seguimiento logístico era sumamente informal. Las mermas no se calculaban con exactitud matemática y los tiempos de retorno dependían de llamadas y mensajes de WhatsApp.

```mermaid
sequenceDiagram
    autonumber
    actor Productor as Encargado de Producción
    actor Taller as Taller Externo (Confección)
    participant Libreta as Libreta de Registro Manual
    participant WS as Mensajería / WhatsApp

    %% Flujo 1: Salida a taller
    Note over Productor, Taller: Envío de Materia Prima
    Productor->>Taller: Entrega rollos de tela física
    Productor->>Libreta: Anota cantidad de rollos entregados en el cuaderno

    %% Flujo 2: Recepción y Discrepancias
    Note over Taller, Productor: Recepción e Incertidumbre de Merma
    Taller->>Productor: Devuelve prendas cosidas + retazos sobrantes
    Taller->>WS: Envía mensaje "Salieron 140 prendas, hubo merma por fallas en tela"
    Productor->>Libreta: Anota la cantidad de prendas devueltas
    Note over Productor, Taller: No se calcula matemáticamente el rendimiento. Sospecha de merma oculta.
```

### B) Proceso Nuevo (Con Jotape ERP)
Toda la cadena está enlazada. Al recibir prendas se marca el lote como `recibido` y el ERP calcula de inmediato el porcentaje de merma frente a lo enviado, alertando discrepancias.

```mermaid
sequenceDiagram
    autonumber
    actor Productor as Encargado de Producción
    participant UI as Frontend Next.js
    participant DB as Firestore (Colecciones)

    %% Flujo 1: Corte de Tela
    Note over Productor, DB: Proceso de Corte (Consumo de Tela)
    Productor->>UI: Selecciona rollo de tela e ingresa prendas cortadas por talla
    UI->>DB: runTransaction() en 'inventario_rollos'
    DB->>DB: Resta los rollos o metros consumidos en el corte
    UI->>DB: setDoc() en 'registros_corte' (ID secuencial CT-XXXXX)
    DB-->>UI: Transacción completada con éxito
    UI-->>Productor: Notifica que el corte está registrado y la tela descontada

    %% Flujo 2: Envío a Talleres de Costura
    Note over Productor, DB: Logística Externa
    Productor->>UI: Registra envío de piezas cortadas a Taller de Confección
    UI->>DB: setDoc() en 'envios_talleres' (Estado: 'pendiente')
    DB-->>UI: Registro creado (ET-XXXXX)
    UI-->>Productor: Muestra ticket de salida para taller

    %% Flujo 3: Recepción y Control de Mermas de Taller
    Note over Productor, DB: Retorno e Inspección de Calidad
    Productor->>UI: Marca envío a taller como recibido y declara prendas confeccionadas
    UI->>DB: updateDoc() en 'envios_talleres' (Cambia estado a 'recibido')
    UI->>DB: Registra variantes_recibidas y calcula merma automática
    DB-->>UI: Datos actualizados
    UI-->>Productor: Muestra resumen del retorno e indicador de merma calculado
```

---

## 4. Rol: Vendedor / Cajero (Punto de Venta)
El Vendedor atiende al público en tienda y cobra las ventas del día.

### A) Proceso Anterior (Lápiz, Papel y WhatsApp)
El vendedor no tenía visibilidad del stock en almacén, teniendo que verificar físicamente en los estantes o preguntar al almacenero, lo que demoraba la atención al cliente.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente Final
    actor Vendedor as Vendedor (Caja)
    actor Almacen as Encargado de Almacén
    participant Estante as Almacén / Estanterías
    participant Talonario as Talonario de Boletas Físicas

    Cliente->>Vendedor: Solicita prenda específica (Ej: Oversize L Gris)
    Vendedor->>Vendedor: Revisa visualmente las perchas de exhibición
    alt Prenda no visible en tienda
        Vendedor->>Almacen: Llama por teléfono o va a preguntar si queda en stock
        Almacen->>Estante: Camina hacia las estanterías de stock a buscar la caja
        Estante-->>Almacen: Verifica presencia del producto
        Almacen-->>Vendedor: Responde por WhatsApp/Voz "Sí, quedan 3 unidades"
    end
    Vendedor->>Cliente: Confirma stock al cliente y recibe el pago
    Vendedor->>Talonario: Escribe la boleta de venta manual a lapicero
    Talonario-->>Vendedor: Copia física de la boleta
    Vendedor-->>Cliente: Entrega la prenda y el comprobante físico
    Note over Vendedor, Talonario: Alta probabilidad de olvidar registrar la venta en la libreta diaria.
```

### B) Proceso Nuevo (Con Jotape ERP)
El Vendedor tiene un buscador ágil, valida stock al instante, y el sistema realiza transacciones atómicas seguras disminuyendo el stock en milisegundos.

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Vendedor / Cajero
    participant UI as Frontend Next.js (POS View)
    participant DB as Firestore (Colecciones)

    %% Flujo 1: Búsqueda
    Note over Vendedor, DB: Consulta Rápida de Catálogo
    Vendedor->>UI: Busca producto por nombre/SKU
    UI->>DB: getDocs() con filtros de inventario (o lee caché local)
    DB-->>UI: Retorna productos que coinciden
    UI-->>Vendedor: Muestra lista con fotos, tallas y stock actual

    %% Flujo 2: Proceso de Venta (Transacción segura)
    Note over Vendedor, DB: Ejecución de la Transacción de Venta
    Vendedor->>UI: Añade productos al carrito y hace clic en "Cobrar"
    UI->>DB: Inicia runTransaction() para garantizar atomicidad
    DB->>DB: Valida stock en tiempo real para evitar sobreventa
    alt Stock Insuficiente
        DB-->>UI: Error: Stock superado
        UI-->>Vendedor: Muestra alerta "Stock insuficiente para la variante X"
    else Stock Disponible
        DB->>DB: Resta cantidades de los productos en inventario
        DB->>DB: setDoc() en 'ventas' (ID secuencial V-XXXXX)
        DB-->>UI: Transacción exitosa
        UI-->>Vendedor: Imprime comprobante de venta y limpia carrito
    end
```
