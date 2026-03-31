# Historias de Usuario (User Stories) - Jotape ERP

A continuación, se define el Product Backlog inicial para el desarrollo del ecosistema web corporativo de Distribuidor Textil Jotape E.I.R.L. Las historias están priorizadas por módulos estratégicos.

---

## 🌐 Módulo 1: Landing Page y Presencia Digital

### **HU-01: Visualización del Catálogo y Portal Corporativo**
**Como** cliente potencial o visitante web.
**Quiero** acceder a una Landing Page moderna responsiva que presente la identidad visual de la empresa y sus servicios.
**Para** conocer quién es Distribuidor Textil Jotape y obtener sus principales medios de contacto (ej. WhatsApp).
* **Criterios de Aceptación:**
  * Debe cargar en menos de 2 segundos (optimización Vite).
  * Debe ser completamente responsiva (adaptable a móviles y escritorio).
  * Debe incluir una sección "Acerca de nosotros" y un botón flotante visible hacia redes sociales.

---

## 📦 Módulo 2: Gestión Centralizada de Inventarios

### **HU-02: Recepción de Inventario desde Talleres**
**Como** Encargado de Almacén.
**Quiero** un formulario dentro del sistema privado para registrar la entrada de los lotes de prendas fabricadas en los talleres.
**Para** mantener un conteo exacto de las nuevas existencias que llegan y poder asignarles categoría, color y marca.
* **Criterios de Aceptación:**
  * El formulario debe permitir seleccionar parámetros como producto, color y cantidad entrante.
  * Al guardar, el stock global de ese producto debe sumar la cantidad recibida en la base de datos (Firebase).

### **HU-03: Registro de Faltantes y Discrepancias**
**Como** Administrador o Encargado de Almacén.
**Quiero** poder registrar y declarar incidentes de faltantes durante la recepción de mercadería (ej. prendas defectuosas o no enviadas).
**Para** llevar una vitácora auditable de pérdidas en el taller sin comprometer el stock real disponible para la venta.
* **Criterios de Aceptación:**
  * Se requiere un panel visible con alertas o badges rojos ("Faltantes").
  * Debe guardar fecha, responsable de la observación y no afectar falsamente el inventario positivo.

### **HU-04: Registro de Salida de Inventarios**
**Como** Encargado de Almacén.
**Quiero** una vista dedicada para procesar salidas unitarias o en bloque del inventario (por razones externas o ajustes merma).
**Para** disminuir de forma limpia el stock actual en caso ocurran eventos no ligados a compras de mostrador.
* **Criterios de Aceptación:**
  * El panel debe validar que no se pueda registrar una salida mayor al stock disponible en base de datos.

---

## 🛒 Módulo 3: Gestión de Ventas y Formularios Dinámicos

### **HU-05: Realizar y Registrar una Venta**
**Como** Vendedor o Cajero.
**Quiero** poder seleccionar un producto de mi catálogo y concretar su venta.
**Para** que su cantidad se descuente automáticamente del stock de almacén sin intervención manual.
* **Criterios de Aceptación:**
  * Debe tener un buscador optimizado de productos en stock.
  * El sistema debe arrojar una advertencia ("Stock insuficiente") si se intenta vender más artículos de los existentes.

### **HU-06: Persistencia del Historial de Ventas**
**Como** Administrador Gerencial.
**Quiero** tener un módulo de histórico donde queden guardadas *todas* las ventas anteriores.
**Para** poder consultar o auditar ventas pasadas incluso si refresco el navegador de mi computadora, leyendo directamente la base de datos segura.
* **Criterios de Aceptación:**
  * El historial debe incluir "Fecha de la venta, Producto, Cantidad y Monto total".
  * La lista debe persistir y consultar a la red permanentemente (Base de Datos).

### **HU-07: Agregar Variantes Dinámicas (Formularios Flexibles)**
**Como** Administrador.
**Quiero** poder agregar nuevas categorías, nuevos colores, y nuevos tipos de productos de la textilera al vuelo (módales flotantes).
**Para** no depender programadores cada vez que la empresa empiece a vender o manufacturar un tipo diferente de ropa.
* **Criterios de Aceptación:**
  * No deben usarse popups o `prompt()` nativos del navegador, sino ventanas modales diseñadas con Tailwind CSS.
  * El color o variable ingresada debe seleccionarse automáticamente tras crearse para agilizar el uso en los formularios.

---

## 📊 Módulo 4: Panel Administrativo (Dashboard)

### **HU-08: Acceso Seguro y Restringido al Sistema**
**Como** Administrador o Dueño.
**Quiero** que el sistema tenga una pasarela de Login por usuario y contraseña.
**Para** que ninguna persona externa logre entrar a manipular los inventarios, ventas y métricas sensibles de la organización.
* **Criterios de Aceptación:**
  * La plataforma debe desviar a los no autorizados a la Landing Page temporal.

### **HU-09: Dashboard Estadístico General**
**Como** Gerente General.
**Quiero** visualizar una pantalla principal al abrir la aplicación donde vea métricas de productos con bajo stock y número de ventas del mes, a base de gráficos.
**Para** tomar decisiones inmediatas sobre qué tipo de prendas debo mandar a confeccionar más a los talleres textiles.
* **Criterios de Aceptación:**
  * Diseño limpio y corporativo, integrando una barra lateral de navegación (Sidebar).
  * Uso de cuadros y tarjetas minimalistas.
