import { NextResponse } from "next/server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Estructura de respuesta Mock en caso de que no haya API Key configurada localmente
const datosPruebaFallback = {
    insights_principales: {
        color_mas_vendido: "Negro",
        prenda_mas_vendida: "Polera Oversize",
        prenda_mas_producida: "Buzos Joggers",
        urgencia_compra_tela: "Franela Gris Melange",
        eficiencia_taller_nota: "Taller Hermanos reporta 4.8% de merma (estable)."
    },
    grafico_demanda_telas: [
        { nombre: "Franela Negra", stock_actual: 15, demanda_proyectada: 25 },
        { nombre: "Franela Gris", stock_actual: 5, demanda_proyectada: 22 },
        { nombre: "Jersey Blanco", stock_actual: 30, demanda_proyectada: 18 },
        { nombre: "Jersey Azul", stock_actual: 8, demanda_proyectada: 15 },
        { nombre: "Fresh Terry Rojo", stock_actual: 12, demanda_proyectada: 10 }
    ],
    grafico_demanda_prendas: [
        { nombre: "Polera Oversize", stock_actual: 45, demanda_proyectada: 90 },
        { nombre: "Buzos Joggers", stock_actual: 20, demanda_proyectada: 65 },
        { nombre: "Short Urbano", stock_actual: 80, demanda_proyectada: 40 },
        { nombre: "Hoodie Reactiva", stock_actual: 15, demanda_proyectada: 50 }
    ],
    sugerencias_reabastecimiento_telas: [
        {
            tipo_tela: "Franela",
            color: "Gris Melange",
            cantidad_rollos_sugerida: 5,
            prioridad: "Alta",
            razon_inteligente: "El stock actual de 5 rollos es insuficiente frente al aumento proyectado del 30% en pedidos de Buzos Joggers para la temporada de invierno."
        },
        {
            tipo_tela: "Jersey",
            color: "Azul Marino",
            cantidad_rollos_sugerida: 3,
            prioridad: "Media",
            razon_inteligente: "La demanda de Poleras reactivas color azul marino subió en las últimas 2 semanas. Quedan solo 8 rollos en inventario."
        }
    ],
    sugerencias_confeccion_prendas: [
        {
            categoria: "Buzos",
            tipo_prenda: "Joggers",
            color: "Negro",
            cantidad_confeccion_sugerida: 120,
            prioridad: "Alta",
            justificacion: "Se registran ingresos constantes de costura pero el quiebre de stock es inminente por las altas ventas en tienda."
        },
        {
            categoria: "Poleras",
            tipo_prenda: "Oversize",
            color: "Negro",
            cantidad_confeccion_sugerida: 80,
            prioridad: "Alta",
            justificacion: "La polera oversize negra es la prenda estrella y el ritmo de ingresos de taller no está equiparando las salidas por caja."
        }
    ],
    sugerencias_corte: [
        {
            tipo_tela: "Franela",
            color: "Gris Melange",
            lote_corte_estimado: 150,
            tallas_prioritarias: "S: 30, M: 60, L: 60",
            indicacion_optimizacion: "Cortar aprovechando el ancho de 1.80m del rollo. Se estima un rendimiento de 1.2 kg por prenda terminada."
        },
        {
            tipo_tela: "Franela",
            color: "Negro",
            lote_corte_estimado: 200,
            tallas_prioritarias: "M: 100, L: 100",
            indicacion_optimizacion: "Priorizar corte para el taller 'Taller de Costura Sur' para alimentar su cola de producción de buzos."
        }
    ],
    alertas_produccion: [
        {
            nivel: "Crítica",
            mensaje: "Urgente: El taller de costura 'Taller de Costura Sur' tiene un retraso de 3 días en la devolución de prendas. Se sugiere contactarlos antes de enviar más lotes."
        },
        {
            nivel: "Advertencia",
            mensaje: "Alerta de Merma: Se detectó un incremento de merma inusual (6.2%) en los rollos de tipo 'Fresh Terry' color rojo. Revisar calidad del proveedor de tela."
        }
    ]
};

// Esquema JSON estricto requerido para que Gemini devuelva exactamente lo que el frontend necesita
const esquemaRespuesta = {
    type: "OBJECT",
    properties: {
        insights_principales: {
            type: "OBJECT",
            properties: {
                color_mas_vendido: { type: "STRING" },
                prenda_mas_vendida: { type: "STRING" },
                prenda_mas_producida: { type: "STRING" },
                urgencia_compra_tela: { type: "STRING" },
                eficiencia_taller_nota: { type: "STRING" }
            },
            required: ["color_mas_vendido", "prenda_mas_vendida", "prenda_mas_producida", "urgencia_compra_tela", "eficiencia_taller_nota"]
        },
        grafico_demanda_telas: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    nombre: { type: "STRING" },
                    stock_actual: { type: "NUMBER" },
                    demanda_proyectada: { type: "NUMBER" }
                },
                required: ["nombre", "stock_actual", "demanda_proyectada"]
            }
        },
        grafico_demanda_prendas: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    nombre: { type: "STRING" },
                    stock_actual: { type: "NUMBER" },
                    demanda_proyectada: { type: "NUMBER" }
                },
                required: ["nombre", "stock_actual", "demanda_proyectada"]
            }
        },
        sugerencias_reabastecimiento_telas: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    tipo_tela: { type: "STRING" },
                    color: { type: "STRING" },
                    cantidad_rollos_sugerida: { type: "NUMBER" },
                    prioridad: { type: "STRING", enum: ["Alta", "Media", "Baja"] },
                    razon_inteligente: { type: "STRING" }
                },
                required: ["tipo_tela", "color", "cantidad_rollos_sugerida", "prioridad", "razon_inteligente"]
            }
        },
        sugerencias_confeccion_prendas: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    categoria: { type: "STRING" },
                    tipo_prenda: { type: "STRING" },
                    color: { type: "STRING" },
                    cantidad_confeccion_sugerida: { type: "NUMBER" },
                    prioridad: { type: "STRING", enum: ["Alta", "Media", "Baja"] },
                    justificacion: { type: "STRING" }
                },
                required: ["categoria", "tipo_prenda", "color", "cantidad_confeccion_sugerida", "prioridad", "justificacion"]
            }
        },
        sugerencias_corte: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    tipo_tela: { type: "STRING" },
                    color: { type: "STRING" },
                    lote_corte_estimado: { type: "NUMBER" },
                    tallas_prioritarias: { type: "STRING" },
                    indicacion_optimizacion: { type: "STRING" }
                },
                required: ["tipo_tela", "color", "lote_corte_estimado", "tallas_prioritarias", "indicacion_optimizacion"]
            }
        },
        alertas_produccion: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    nivel: { type: "STRING", enum: ["Crítica", "Advertencia", "Normal"] },
                    mensaje: { type: "STRING" }
                },
                required: ["nivel", "mensaje"]
            }
        }
    },
    required: [
        "insights_principales", 
        "grafico_demanda_telas", 
        "grafico_demanda_prendas", 
        "sugerencias_reabastecimiento_telas", 
        "sugerencias_confeccion_prendas", 
        "sugerencias_corte", 
        "alertas_produccion"
    ]
};

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;

    // Si no está la API Key, usar el simulador local para pruebas
    if (!apiKey) {
        console.warn("GEMINI_API_KEY no encontrada en .env.local. Retornando datos predictivos simulados (fallback local).");
        // Simular retardo de red de la IA
        await new Promise(resolve => setTimeout(resolve, 1500));
        const fallbackConAlerta = {
            ...datosPruebaFallback,
            alertas_produccion: [
                {
                    nivel: "Advertencia",
                    mensaje: "GEMINI_API_KEY no configurada en .env.local. Mostrando predicciones de respaldo simuladas."
                },
                ...datosPruebaFallback.alertas_produccion
            ]
        };
        return NextResponse.json(fallbackConAlerta);
    }

    try {
        // 1. Obtener histórico de ventas (últimas 100)
        const ventasSnap = await getDocs(query(collection(db, "ventas"), orderBy("fecha_registro", "desc"), limit(100)));
        const ventas: Record<string, unknown>[] = [];
        ventasSnap.forEach(d => {
            const data = d.data();
            ventas.push({
                total: data.total_venta,
                productos: data.productos?.map((p: { categoria?: string; color?: string; talla?: string; cantidad?: number }) => ({
                    categoria: p.categoria || "Otros",
                    color: p.color || "Varios",
                    talla: p.talla || "U",
                    cantidad: p.cantidad || 0
                }))
            });
        });

        // 2. Obtener stock actual de rollos de tela
        const rollosSnap = await getDocs(collection(db, "inventario_rollos"));
        const rollos: Record<string, unknown>[] = [];
        rollosSnap.forEach(d => {
            const data = d.data();
            if (data.disponible !== false) {
                rollos.push({
                    tipo_tela: data.tipo_tela || "Desconocida",
                    color: data.color || "Varios",
                    cantidad: data.cantidad_rollos || 0
                });
            }
        });

        // 3. Obtener histórico de cortes (últimos 50)
        const cortesSnap = await getDocs(query(collection(db, "registros_corte"), orderBy("fecha_registro", "desc"), limit(50)));
        const cortes: Record<string, unknown>[] = [];
        cortesSnap.forEach(d => {
            const data = d.data();
            cortes.push({
                tipo_tela: data.tipo_tela || "Desconocida",
                color: data.color || "Varios",
                cantidad_cortada: data.cantidad_cortada || 0
            });
        });

        // 4. Obtener ingresos de prendas terminadas desde talleres (últimos 100)
        const entradasSnap = await getDocs(query(collection(db, "entradas_inventario"), orderBy("fecha_registro", "desc"), limit(100)));
        const entradas: Record<string, unknown>[] = [];
        entradasSnap.forEach(d => {
            const data = d.data();
            entradas.push({
                categoria: data.categoria || "Desconocido",
                tipo_prenda: data.tipo_producto || "Varios",
                cantidad: data.cantidad || data.total_ingresado || 0,
                variantes: data.variantes?.map((v: { color?: string; talla?: string; cantidad?: number }) => ({
                    color: v.color || "Varios",
                    talla: v.talla || "U",
                    cantidad: v.cantidad || 0
                }))
            });
        });

        // 5. Construir Prompt con los datos consolidados de Firestore
        const promptText = `
        Eres el analista de Inteligencia Artificial para el sistema de control de inventarios "Jotape ERP" en el rubro textil.
        Tu labor es evaluar los datos reales de ventas, stock e ingresos para emitir:
        1. Resumen de Insights principales (Prenda más vendida, prenda más confeccionada ingresada, color más vendido, tela con mayor urgencia de compra y estado de talleres).
        2. Un listado comparativo entre el stock de telas actual y la demanda que proyectas para el siguiente período por tipo/color de tela (máximo 6 elementos).
        3. Un listado comparativo entre el stock de prendas terminadas actual y la demanda que proyectas para el siguiente período por categoría/tipo de prenda (máximo 6 elementos).
        4. Recomendaciones concretas de reabastecimiento de telas (Qué tela comprar, color, cuántos rollos, prioridad de compra alta/media/baja y la justificación lógica).
        5. Sugerencias de Confección/Costura (Qué prenda coser, color, categoría, cantidad sugerida, prioridad y por qué).
        6. Órdenes sugeridas de corte de tela en el taller (Tipo de tela, color, cuántas piezas cortar, qué tallas priorizar y cómo optimizar la merma).
        7. Alertas de cuello de botella o anomalías en producción/confección.

        DATOS REALES DEL SISTEMA:
        - Inventario de rollos de tela disponible hoy:
        ${JSON.stringify(rollos)}

        - Historial de cortes de tela realizados recientemente en el taller:
        ${JSON.stringify(cortes)}

        - Historial de ingresos de prendas confeccionadas a inventario (entradas desde talleres):
        ${JSON.stringify(entradas)}

        - Resumen de ventas cerradas:
        ${JSON.stringify(ventas)}

        Analiza y devuelve tu pronóstico estructurado estrictamente bajo el esquema JSON solicitado.
        `;

        // 6. Consumir la API oficial de Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: promptText }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: esquemaRespuesta,
                    temperature: 0.2
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en API de Gemini: ${response.status} - ${errorText}`);
        }

        const resData = await response.json();
        const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!outputText) {
            throw new Error("La API de Gemini no retornó un texto válido.");
        }

        const parsedJSON = JSON.parse(outputText);
        return NextResponse.json(parsedJSON);

    } catch (e: unknown) {
        console.error("Error procesando predicciones con IA (Gemini). Activando fallback local:", e);
        const err = e as Error;
        const fallbackConAlerta = {
            ...datosPruebaFallback,
            alertas_produccion: [
                {
                    nivel: "Advertencia",
                    mensaje: `El servidor de IA está saturado o no disponible temporalmente (${err.message || "Error de demanda"}). Mostrando predicciones de respaldo simuladas.`
                },
                ...datosPruebaFallback.alertas_produccion
            ]
        };
        return NextResponse.json(fallbackConAlerta);
    }
}
