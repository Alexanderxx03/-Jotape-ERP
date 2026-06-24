// Datos de prueba (Mock Data) en español para la suite de pruebas de Jotape ERP
// Este archivo contiene los objetos simulados que serán insertados, validados y limpiados en Firestore.

export const usuarioPrueba = {
    correo: "usuario.prueba.erp@jotapetextil.com",
    contrasena: "PasswordDePrueba123",
    nombre: "Usuario Test Integración",
    areas_acceso: ["sales", "inventory"] as string[]
};

export const ventaPrueba = {
    id_venta: "V-TEST-99999",
    id_vendedor: "vendedor-prueba-uid",
    nombre_vendedor: "Vendedor de Prueba ERP",
    productos: [
        {
            id_prenda: "prenda-test-01",
            nombre: "Polera Oversize Test",
            categoria: "Poleras",
            color: "Negro",
            talla: "L",
            cantidad: 5,
            precio_unitario: 45,
            subtotal: 225
        }
    ],
    total_venta: 225
};

export const rolloPrueba = {
    tipo_tela: "Franela Test",
    color: "Gris Melange",
    cantidad_rollos: 15,
    cantidad_original: 15,
    disponible: true,
    id_usuario: "usuario-prueba-uid"
};

export const cortePrueba = {
    id_registro: "CT-TEST-99999",
    tipo_tela: "Franela Test",
    color: "Gris Melange",
    cantidad_cortada: 150,
    tallas: { "M": 75, "L": 75 },
    id_usuario: "usuario-prueba-uid",
    nombre_usuario: "Cortador de Prueba"
};

export const costuraPrueba = {
    id_registro: "CS-TEST-99999",
    taller: "Taller de Prueba S.A.C.",
    prenda: "Polera Oversize Test",
    cantidad: 145, // 5 prendas de merma
    id_usuario: "usuario-prueba-uid",
    nombre_usuario: "Sastre de Prueba"
};

export const envioPrueba = {
    id_envio: "ET-TEST-99999",
    taller: "Taller de Prueba S.A.C.",
    cantidad_piezas: 150,
    estado: "pendiente"
};
