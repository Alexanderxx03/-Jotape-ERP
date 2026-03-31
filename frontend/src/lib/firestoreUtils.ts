import { doc, runTransaction, collection, addDoc, serverTimestamp, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Obtiene el siguiente ID autoincremental de manera segura mediante una transacción de Firestore.
 * Si el contador no existe, lo inicializa en 1.
 * @param contadorName - Nombre del documento contador (ej. "ventas", "inventario", "corte", "costura")
 */
export async function getNextId(contadorName: string): Promise<number> {
    const counterRef = doc(db, 'contadores', contadorName);

    try {
        const newId = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            if (!counterDoc.exists()) {
                // Si el contador no existe, lo creamos y empezamos en 1
                transaction.set(counterRef, { count: 1 });
                return 1;
            }

            // Si existe, le sumamos 1
            const newCount = counterDoc.data().count + 1;
            transaction.update(counterRef, { count: newCount });

            return newCount;
        });

        return newId as number;
    } catch (e) {
        console.error("Error obteniendo ID autoincremental de Firestore: ", e);
        throw e;
    }
}

/**
 * Guarda un registro de venta en la colección 'ventas'.
 */
export async function guardarVenta(vendedorId: string | undefined, nombreVendedor: string | null | undefined, productos: any[], totalVenta: number) {
    try {
        const id_venta_num = await getNextId('ventas');
        const id_venta = `V-${id_venta_num.toString().padStart(5, '0')}`; // ej. V-00001

        const ventaRef = doc(db, 'ventas', id_venta);

        await setDoc(ventaRef, {
            id_venta: id_venta,
            id_vendedor: vendedorId || "desconocido",
            nombre_vendedor: nombreVendedor || "Vendedor Anónimo",
            productos: productos, // Array de productos vendidos con sus detalles
            total_venta: totalVenta,
            fecha_registro: serverTimestamp()
        });

        return id_venta;
    } catch (e) {
        console.error("Error al guardar venta: ", e);
        throw e;
    }
}

/**
 * Guarda una entrada de inventario en 'entradas_inventario'.
 */
export async function guardarEntradaInventario(registro: any) {
    try {
        const id_entrada_num = await getNextId('inventario');
        const id_entrada = `INV-${id_entrada_num.toString().padStart(5, '0')}`;

        const invRef = doc(db, 'entradas_inventario', id_entrada);

        await setDoc(invRef, {
            id_entrada: id_entrada,
            almacen_destino: registro.almacen_destino || 'Almacén 1', // Default por si acaso
            ...registro,
            fecha_registro: serverTimestamp()
        });

        return id_entrada;
    } catch (e) {
        console.error("Error guardando entrada de inventario:", e);
        throw e;
    }
}

// ==========================================
// INVENTARIO - ROLLOS DE TELA
// ==========================================

export const guardarIngresoRollo = async (registro: any) => {
    try {
        const docRef = await addDoc(collection(db, 'inventario_rollos'), {
            ...registro,
            fecha_registro: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar rollo de tela:", error);
        throw error;
    }
};

/**
 * Guarda un registro de producción (Corte o Costura)
 */
export async function guardarRegistroProduccion(coleccion: 'registros_corte' | 'registros_costura', registro: any) {
    try {
        const contadorName = coleccion === 'registros_corte' ? 'corte' : 'costura';
        const prefijo = coleccion === 'registros_corte' ? 'CT-' : 'CS-';

        const id_num = await getNextId(contadorName);
        const id_registro = `${prefijo}${id_num.toString().padStart(5, '0')}`;

        const docRef = doc(db, coleccion, id_registro);

        await setDoc(docRef, {
            id_registro: id_registro,
            ...registro,
            fecha_registro: serverTimestamp()
        });

        return id_registro;
    } catch (e) {
        console.error(`Error guardando registro en ${coleccion}:`, e);
        throw e;
    }
}

// ==========================================
// FORMULARIOS - CONFIGURACION
// ==========================================

export const updateOpcionConfiguracion = async (opcion: 'categoria' | 'tipo_prenda' | 'color', data: any) => {
    const configRef = doc(db, 'configuracion', 'opciones_formulario');
    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(configRef);
            if (!docSnap.exists()) throw new Error("Documento no existe");
            const configData = docSnap.data();

            if (data.action === 'eliminar') {
                if (opcion === 'categoria') {
                    delete configData.categorias[data.valorActual];
                    transaction.update(configRef, { categorias: configData.categorias });
                } else if (opcion === 'tipo_prenda') {
                    const arr = configData.categorias[data.categoria] || [];
                    configData.categorias[data.categoria] = arr.filter((x: string) => x !== data.valorActual);
                    transaction.update(configRef, { categorias: configData.categorias });
                } else if (opcion === 'color') {
                    configData.colores = (configData.colores || []).filter((x: string) => x !== data.valorActual);
                    transaction.update(configRef, { colores: configData.colores });
                }
            } else if (data.action === 'editar') {
                if (opcion === 'categoria') {
                    const tipos = configData.categorias[data.valorActual] || [];
                    delete configData.categorias[data.valorActual];
                    configData.categorias[data.nuevoValor] = tipos;
                    transaction.update(configRef, { categorias: configData.categorias });
                } else if (opcion === 'tipo_prenda') {
                    const arr = configData.categorias[data.categoria] || [];
                    const idx = arr.indexOf(data.valorActual);
                    if (idx !== -1) arr[idx] = data.nuevoValor;
                    configData.categorias[data.categoria] = arr;
                    transaction.update(configRef, { categorias: configData.categorias });
                } else if (opcion === 'color') {
                    const arr = configData.colores || [];
                    const idx = arr.indexOf(data.valorActual);
                    if (idx !== -1) arr[idx] = data.nuevoValor;
                    configData.colores = arr;
                    transaction.update(configRef, { colores: configData.colores });
                }
            }
        });
        return true;
    } catch (e) {
        console.error("Error actualizando opcion:", e);
        throw e;
    }
};

/**
 * Obtiene las opciones de configuración (Categorías, Tipos, Colores) desde Firestore.
 * Si no existen, retorna y crea una estructura por defecto.
 */
export async function getOpcionesFormulario() {
    const configRef = doc(db, 'configuracion', 'opciones_formulario');

    try {
        const docSnap = await runTransaction(db, async (transaction) => {
            const configDoc = await transaction.get(configRef);

            if (!configDoc.exists()) {
                // Estructura por defecto si es la primera vez
                const defaultData = {
                    categorias: {
                        Poleras: ['Reactiva', 'Oversize', 'Hoodie'],
                        Buzos: ['Joggers', 'Baggy', 'Parachute'],
                        Shorts: ['Urbano', 'Deportivo'],
                    },
                    colores: ['Negro', 'Blanco', 'Gris', 'Azul Marino']
                };
                transaction.set(configRef, defaultData);
                return defaultData;
            }

            return configDoc.data();
        });

        return docSnap;
    } catch (e) {
        console.error("Error obteniendo opciones de formulario: ", e);
        throw e;
    }
}

/**
 * Guarda una nueva opción (categoría, tipo de prenda o color) en Firestore
 */
export async function guardarNuevaOpcion(tipo: 'categoria' | 'tipo_prenda' | 'color', data: { categoria?: string, nuevoValor: string }) {
    const configRef = doc(db, 'configuracion', 'opciones_formulario');

    try {
        await runTransaction(db, async (transaction) => {
            const configDoc = await transaction.get(configRef);
            if (!configDoc.exists()) throw new Error("Documento de configuración no existe");

            const configData = configDoc.data();

            if (tipo === 'categoria' && data.categoria) {
                // Añadir nueva categoría
                if (!configData.categorias[data.categoria]) {
                    configData.categorias[data.categoria] = [];
                    transaction.update(configRef, { categorias: configData.categorias });
                }
            } else if (tipo === 'tipo_prenda' && data.categoria && data.nuevoValor) {
                // Añadir nuevo tipo a una categoría existente
                if (configData.categorias[data.categoria]) {
                    if (!configData.categorias[data.categoria].includes(data.nuevoValor)) {
                        configData.categorias[data.categoria].push(data.nuevoValor);
                        transaction.update(configRef, { categorias: configData.categorias });
                    }
                }
            } else if (tipo === 'color' && data.nuevoValor) {
                // Añadir nuevo color
                if (!configData.colores) configData.colores = [];
                if (!configData.colores.includes(data.nuevoValor)) {
                    configData.colores.push(data.nuevoValor);
                    transaction.update(configRef, { colores: configData.colores });
                }
            }
        });
        return true;
    } catch (e) {
        console.error(`Error guardando nueva opción de ${tipo}:`, e);
        throw e;
    }
}
