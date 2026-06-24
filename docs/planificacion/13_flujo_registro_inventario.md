# Flujo de Registro de Inventario (Detallado y Completo)

Este documento detalla el flujo de registro de inventario en **Jotape ERP**, dividiéndose en el flujo para **Prendas Terminadas (Lotes por variantes)** y **Materia Prima (Rollos de Tela)**.

---

## 1. Diagrama de Flujo del Proceso (Flowchart)

El siguiente diagrama de flujo abarca desde que el Encargado de Almacén decide qué registrar, las validaciones frontend, el guardado transaccional en la base de datos Firestore y la propagación de datos.

```mermaid
flowchart TD
    Start([Inicio: Encargado entra a módulo Inventario]) --> ChooseType{¿Qué desea registrar?}
    
    %% FLUJO A: PRENDAS TERMINADAS
    ChooseType -- "Prendas Confeccionadas (Lotes)" --> FlowGarments[1. Seleccionar Almacén de Destino]
    FlowGarments --> InputHeader[2. Seleccionar Categoría y Tipo de Producto]
    InputHeader --> InputVariants[3. Agregar Variantes de Prenda]
    
    subgraph Ingreso de Variante
        InputVariants --> SelPublic[Seleccionar Público: Varón/Dama/Niño/Niña/Unisex]
        SelPublic --> SelSize[Seleccionar Talla: S, M, L, XL, etc.]
        SelSize --> SelColor[Seleccionar Color]
        SelColor --> SelQty[Digitar Cantidad de prendas]
        SelQty --> AddToList[Hacer clic en 'Añadir Variante']
    end
    
    AddToList --> VerifyMore{¿Añadir más variantes al lote?}
    VerifyMore -- Sí --> InputVariants
    VerifyMore -- No --> CalcTotal[4. Calcular Total del Lote: Sumatoria de cantidades de variantes]
    
    CalcTotal --> SubmitGarments[5. Hacer clic en 'Guardar Operación']
    SubmitGarments --> ValidateGarments{¿Campos vacíos o variantes vacías?}
    ValidateGarments -- Sí --> ErrorGarments[Mostrar Toast: Completar campos obligatorios]
    ErrorGarments --> CalcTotal
    ValidateGarments -- No (Válido) --> RequestNextIdGarment[6. Generar ID autoincremental INV-XXXXX via getNextId]
    
    RequestNextIdGarment --> SaveFirestoreGarment[7. Guardar setDoc en 'entradas_inventario']
    SaveFirestoreGarment --> UpdateStockMap[8. Actualizar Mapa de Stock local y global]
    UpdateStockMap --> SuccessGarments[9. Mostrar Toast de éxito y refrescar lista de ingresos]
    SuccessGarments --> End([Fin])

    %% FLUJO B: MATERIA PRIMA (ROLLOS DE TELA)
    ChooseType -- "Materia Prima (Rollos de Tela)" --> FlowFabrics[1. Seleccionar Tipo de Tela]
    FlowFabrics --> InputFabricColor[2. Seleccionar Color de la Tela]
    InputFabricColor --> InputFabricQty[3. Digitar Cantidad de Rollos de Tela]
    InputFabricQty --> SubmitFabrics[4. Hacer clic en 'Guardar Rollo']
    
    SubmitFabrics --> ValidateFabrics{¿Campos vacíos o Cantidad <= 0?}
    ValidateFabrics -- Sí --> ErrorFabrics[Mostrar Toast: Completar campos de tela]
    ErrorFabrics --> FlowFabrics
    ValidateFabrics -- No (Válido) --> SaveFirestoreFabric[5. Guardar addDoc en 'inventario_rollos' con disponible: true]
    
    SaveFirestoreFabric --> SuccessFabrics[6. Mostrar Toast de éxito y refrescar lista de rollos]
    SuccessFabrics --> End
```

---

## 2. Diagrama de Secuencia Técnico (Sequence Diagram)

Este diagrama muestra las llamadas de función y la comunicación entre el Cliente (Frontend React/Next.js) y la base de datos Firestore durante el guardado de los dos flujos.

```mermaid
sequenceDiagram
    autonumber
    actor Almacen as Encargado de Almacén
    participant UI as Frontend Next.js (Módulo Inventario)
    participant Utils as Utils de Firestore (firestoreUtils.ts)
    participant DB as Firestore Database (Nube)
    participant Realtime as Pantalla de Caja/Admin (Clientes)

    %% Registro de Prendas
    Note over Almacen, UI: FLUJO A: Registro de Lote de Prendas Terminadas
    Almacen->>UI: Ingresa categoría, producto y lista de variantes (publico, talla, color, cant)
    Almacen->>UI: Clic en "Guardar Operación"
    UI->>UI: Calcula total_ingresado (sumatoria de variantes)
    UI->>Utils: guardarEntradaInventario(registro)
    
    activate Utils
    Utils->>DB: getNextId('inventario') (Consulta contador incremental)
    DB-->>Utils: Retorna número de ID (ej. 12)
    Utils->>Utils: Formatea ID a correlativo ("INV-00012")
    Utils->>DB: setDoc() en 'entradas_inventario/INV-00012' con serverTimestamp
    DB-->>Utils: Confirmación de guardado exitoso
    deactivate Utils
    
    Utils-->>UI: Retorna ID generado "INV-00012"
    UI->>UI: Agrega el nuevo registro al array de estado 'itemsIngreso'
    UI-->>Almacen: Muestra Toast: "Registro #INV-00012 guardado en Almacén"
    
    DB->>Realtime: Notifica cambios en la colección via Snapshot Listeners
    Note over Realtime: El Dashboard y la pantalla de ventas se actualizan automáticamente

    %% Registro de Rollos
    Note over Almacen, UI: FLUJO B: Registro de Rollos de Tela (Materia Prima)
    Almacen->>UI: Ingresa Tipo de Tela, Color y Cantidad de Rollos
    Almacen->>UI: Clic en "Guardar Rollo"
    UI->>Utils: guardarIngresoRollo(registro)
    
    activate Utils
    Utils->>DB: addDoc() en 'inventario_rollos' (disponible: true, cantidad_original: X)
    DB-->>Utils: Retorna Id del documento auto-generado
    deactivate Utils
    
    Utils-->>UI: Retorna ID de confirmación
    UI->>UI: Agrega el nuevo rollo al array de estado 'itemsRollos'
    UI-->>Almacen: Muestra Toast: "X rollos de Tela registrados exitosamente"
```
