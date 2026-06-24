# Diagramas de Secuencia: Procesos Clave de Negocio (Antes vs. Después)

Este documento detalla el comportamiento secuencial de los tres procesos clave del negocio para **Distribuidor Textil Jotape E.I.R.L.**, contrastando la ineficiencia del modelo tradicional con la optimización y trazabilidad provista por el nuevo sistema.

---

## 3.1. Proceso de Registro de Entradas y Salidas de Inventario

### A) ANTES DE LA SOLUCIÓN (Proceso Manual)
*   **Características:** Registro en cuadernos físicos y transcripción manual a Excel sin integración.
*   **Métricas:** Tiempo promedio: **15.2 min/operación**. Tasa de error: **~18.4%**. Sin trazabilidad.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    actor Proveedor as Proveedor / Taller
    participant Cuaderno as Cuaderno de Almacén
    participant Excel as Excel Local (PC Oficina)
    participant Admin as Administrador

    %% Paso 1 y 2
    Proveedor->>Almacen: Entrega prendas físicamente en fardos
    Note over Almacen: Conteo manual prenda por prenda<br/>(Separando por talla y color)<br/>Tiempo: 12 - 18 minutos
    
    %% Paso 3
    Almacen->>Cuaderno: Anota a lápiz cantidades y variantes
    Note over Almacen, Cuaderno: Alta probabilidad de error de transcripción y lectura

    %% Paso 4
    Almacen->>Excel: Transcribe manualmente datos del cuaderno al Excel consolidado
    Note over Almacen, Excel: Proceso en paralelo, duplicidad de esfuerzo y retraso

    %% Paso 5
    Note over Excel, Admin: Desfase temporal de horas o días.<br/>El Administrador no puede consultar el stock real en su celular.
```

### B) DESPUÉS DE LA SOLUCIÓN (Con Jotape ERP)
*   **Características:** Registro digital centralizado en Firestore con validación en tiempo real.
*   **Métricas:** Tiempo promedio: **3.1 min/operación**. Tasa de error: **< 1%**. Trazabilidad por SKU.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    participant UI as Frontend Next.js (Módulo Inventario)
    participant DB as Firestore (Nube)
    participant General as Otros Usuarios (Caja/Admin)

    %% Paso 1 y 2
    Almacen->>UI: Accede a Inventario > Registrar Ingreso
    UI-->>Almacen: Muestra selector de Almacén, Categoría y Tipo de Producto

    %% Paso 3
    Almacen->>UI: Selecciona variantes (Público, Talla, Color, Cantidad)
    UI->>UI: Valida campos y estructura de datos (Prevención de errores de tipeo)

    %% Paso 4
    Almacen->>UI: Confirma el Ingreso
    UI->>DB: setDoc() en 'entradas_inventario' (Crea INV-00001 + serverTimestamp)
    DB-->>UI: Retorna confirmación de escritura exitosa

    %% Paso 5
    DB->>General: Sincronización en tiempo real (Websockets / Snapshot listeners)
    UI-->>Almacen: Muestra mensaje de éxito y stock actualizado
```

---

## 3.2. Proceso de Traslado Almacén – Talleres y Puntos de Venta

### A) ANTES DE LA SOLUCIÓN (Proceso Manual)
*   **Características:** Despacho verbal por WhatsApp, sin control de retornos ni mermas in situ.
*   **Métricas:** Tasa de pérdidas en traslado: **~12.8%**. Sin responsabilidades definidas.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    actor Chofer as Transportista
    actor Taller as Responsable de Taller/Tienda
    participant WS as WhatsApp / Notas Sueltas

    %% Paso 1
    Almacen->>Almacen: Prepara y separa prendas físicas
    Almacen->>Chofer: Entrega lote físico
    Almacen->>WS: Envía mensaje "Te mandé los cortes en el carro" (Registro verbal)

    %% Paso 2
    Chofer->>Taller: Traslada mercadería sin bitácora digital de custodia

    %% Paso 3
    Taller->>Taller: Cuenta piezas físicamente al recibir
    alt Hay piezas faltantes o dañadas
        Taller->>WS: Notifica discrepancia ("Llegaron 10 menos")
    end

    %% Paso 4
    Note over Almacen, Taller: Las discrepancias no quedan registradas en el inventario.<br/>Genera discusiones y pérdidas sin responsable asignado.
```

### B) DESPUÉS DE LA SOLUCIÓN (Con Jotape ERP)
*   **Características:** Flujo de despacho/recepción inmutable con cálculo de mermas y pendientes.
*   **Métricas:** Tasa de pérdidas reducida a **~2.1%**. Trazabilidad total con usuario y timestamp.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    actor Taller as Responsable de Taller/Tienda
    participant UI as Frontend Next.js
    participant DB as Firestore (Colecciones)

    %% Paso 1
    Almacen->>UI: Registra despacho (Módulo Recepción de Talleres)
    UI->>DB: setDoc() en 'envios_talleres' (Estado: 'En Tránsito')
    DB-->>UI: Confirmación de salida

    %% Paso 2
    Taller->>UI: Abre envío pendiente y digita la cantidad recibida físicamente
    
    %% Paso 3
    UI->>UI: Calcula merma automática:<br/>((Enviado - Recibido) / Enviado) * 100
    UI->>DB: updateDoc() en 'envios_talleres' (Marca como 'recibido', guarda merma)
    
    %% Paso 4
    alt Recepción Parcial (Faltan prendas)
        UI->>DB: Cambia estado a 'Pendiente Parcial' y genera saldo deudor
        DB-->>UI: Actualiza registro
        UI-->>Taller: Alerta: "Queda pendiente un retorno de X unidades"
    else Recepción Completa
        UI-->>Taller: Cierra envío logístico con éxito
    end
```

---

## 3.3. Proceso de Generación de Reportes y Toma de Decisiones

### A) ANTES DE LA SOLUCIÓN (Proceso Manual)
*   **Características:** Consolidación manual bajo demanda, datos desactualizados y decisiones subjetivas.
*   **Métricas:** Tiempo de generación: **67.3 min**. Decisiones empíricas sin alertas.

```mermaid
sequenceDiagram
    autonumber
    actor Gerente as Gerente General
    actor Almacen as Encargado de Almacén
    participant Papel as Cuadernos de Almacén
    participant Excel as Excel Consolidado

    %% Paso 1
    Gerente->>Almacen: Solicita el estado del inventario valorizado y stock crítico
    
    %% Paso 2
    Note over Almacen: Revisa libretas, busca boletas físicas y digita en Excel<br/>Tiempo: 45 - 90 minutos promedio
    Almacen->>Papel: Busca apuntes
    Almacen->>Excel: Consolida información y calcula totales a mano

    %% Paso 3
    Almacen-->>Gerente: Envía archivo Excel por correo o WhatsApp (Con horas de retraso)
    
    %% Paso 4
    Note over Gerente: Toma decisiones de compra de rollos basadas en datos<br/>desactualizados, intuición o percepción subjetiva del mercado.
```

### B) DESPUÉS DE LA SOLUCIÓN (Con Jotape ERP)
*   **Características:** Dashboard en tiempo real, predicciones automáticas por IA/ML y exportaciones dinámicas.
*   **Métricas:** Tiempo de generación: **0.8 min**. Alertas automáticas y decisiones basadas en datos.

```mermaid
sequenceDiagram
    autonumber
    actor Gerente as Gerente General
    participant UI as Frontend Next.js (Dashboard)
    participant API as API Route (/api/predictions)
    participant DB as Firestore (Colecciones)
    participant Gemini as Gemini API (Predicción ML)
    participant SheetJS as Librería SheetJS (.xlsx)

    %% Paso 1
    Gerente->>UI: Accede al Dashboard desde su dispositivo
    
    %% Paso 2
    UI->>DB: Consulta instantánea de colecciones (Ventas, Corte, Costura)
    DB-->>UI: Retorna datos en vivo
    UI->>UI: Renderiza Cards de KPIs, alertas de stock bajo y gráficos (Recharts)

    %% Paso 3
    UI->>API: Llama al endpoint de predicciones IA
    API->>Gemini: Envía histórico tabular reciente
    Gemini-->>API: Retorna predicciones de demanda por SKU y prioridades
    API-->>UI: Muestra las sugerencias predictivas de producción y tela en pantalla

    %% Paso 4
    alt Exportar Reporte
        Gerente->>UI: Clic en "Exportar Reporte"
        UI->>SheetJS: Genera estructura .xlsx
        SheetJS-->>Gerente: Descarga inmediata de archivo Excel formateado
    end
    Note over Gerente: Toma decisiones de compra y corte con datos reales del día.
```
