import { useState, useMemo, useEffect } from 'react';
import { getOpcionesFormulario, guardarNuevaOpcion, updateOpcionConfiguracion } from '@/lib/firestoreUtils';
import { toast } from 'sonner';

const TALLAS_POR_PUBLICO = {
    Adultos: ['S', 'M', 'L', 'XL'],
    Niños: ['2', '4', '6', '8', '10', '12', '14', '16'],
};

export type Publico = keyof typeof TALLAS_POR_PUBLICO | '';

export function useFormulariosProducto() {
    // Datos dinámicos desde Firestore
    const [estructuraProductos, setEstructuraProductos] = useState<Record<string, string[]>>({});
    const [coloresDisponibles, setColoresDisponibles] = useState<string[]>([]);

    // Estado del Formulario
    const [categoria, setCategoria] = useState<string>('');
    const [tipoProducto, setTipoProducto] = useState<string>('');
    const [publico, setPublico] = useState<Publico>('');
    const [talla, setTalla] = useState<string>('');
    const [color, setColor] = useState<string>('');
    const [cantidad, setCantidad] = useState<number>(1);

    // Banderas
    const [isCargandoOpciones, setIsCargandoOpciones] = useState(true);

    // Cargar opciones al montar
    useEffect(() => {
        const cargarOpciones = async () => {
            try {
                const data: any = await getOpcionesFormulario();
                setEstructuraProductos(data.categorias || {});
                setColoresDisponibles(data.colores || []);
            } catch (error) {
                console.error("Error al cargar opciones de formulario", error);
                toast.error("No se pudieron cargar las configuraciones.");
            } finally {
                setIsCargandoOpciones(false);
            }
        };
        cargarOpciones();
    }, []);

    // Derivados 
    const tiposDisponibles = useMemo(() => {
        return categoria && estructuraProductos[categoria] ? estructuraProductos[categoria] : [];
    }, [categoria, estructuraProductos]);

    const tallasDisponibles = useMemo(() => {
        return publico ? TALLAS_POR_PUBLICO[publico] : [];
    }, [publico]);

    // Estado del Modal Custom para Opciones
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        modo: 'crear' | 'editar' | 'eliminar';
        tipo: 'categoria' | 'tipo_prenda' | 'color' | null;
        valorActual?: string;
        parentCat?: string;
        title: string;
        description?: string;
        placeholder?: string;
        initialValue?: string;
        isDelete?: boolean;
    }>({ isOpen: false, modo: 'crear', tipo: null, title: '' });
    const [isSubmittingModal, setIsSubmittingModal] = useState(false);

    const abrirModalNuevo = (tipo: 'categoria' | 'tipo_prenda' | 'color') => {
        setModalConfig({
            isOpen: true,
            modo: 'crear',
            tipo,
            title: tipo === 'categoria' ? 'Añadir Nueva Categoría' :
                tipo === 'tipo_prenda' ? 'Añadir Nuevo Tipo de Prenda' :
                    'Añadir Nuevo Color',
            placeholder: tipo === 'categoria' ? 'Ej: Pantalones' :
                tipo === 'tipo_prenda' ? 'Ej: Falda Escolar' :
                    'Ej: Azul Marino',
            initialValue: '',
            isDelete: false
        });
    };

    const abrirModalEditar = (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, parentCat?: string) => {
        setModalConfig({
            isOpen: true,
            modo: 'editar',
            tipo,
            valorActual,
            parentCat,
            title: `Renombrar ${tipo === 'categoria' ? 'Categoría' : tipo === 'tipo_prenda' ? 'Tipo de Prenda' : 'Color'}`,
            placeholder: `Nuevo nombre para '${valorActual}':`,
            initialValue: valorActual,
            isDelete: false
        });
    };

    const abrirModalEliminar = (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, parentCat?: string) => {
        setModalConfig({
            isOpen: true,
            modo: 'eliminar',
            tipo,
            valorActual,
            parentCat,
            title: `Eliminar ${tipo === 'categoria' ? 'Categoría' : tipo === 'tipo_prenda' ? 'Tipo de Prenda' : 'Color'}`,
            description: `¿Estás seguro que deseas eliminar '${valorActual}' de la lista de opciones de forma permanente?`,
            isDelete: true
        });
    };

    const cerrarModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setIsSubmittingModal(false);
    };

    const confirmarModal = async (valor: string) => {
        if (!modalConfig.tipo) return;
        setIsSubmittingModal(true);
        let exito = false;
        
        if (modalConfig.modo === 'crear') {
            if (modalConfig.tipo === 'categoria') exito = await asyncAddCategoria(valor);
            if (modalConfig.tipo === 'tipo_prenda') exito = await asyncAddTipoProducto(valor);
            if (modalConfig.tipo === 'color') exito = await asyncAddColor(valor);
        } else if (modalConfig.modo === 'editar') {
            exito = await asyncEditOpcion(modalConfig.tipo, modalConfig.valorActual!, valor, modalConfig.parentCat);
        } else if (modalConfig.modo === 'eliminar') {
            exito = await asyncDeleteOpcion(modalConfig.tipo, modalConfig.valorActual!, modalConfig.parentCat);
        }

        setIsSubmittingModal(false);
        if (exito) cerrarModal();
    };

    // Manejadores de Cambio (para resetear campos hijos)
    const handleCategoriaChange = (nuevaCategoria: string) => {
        setCategoria(nuevaCategoria);
        setTipoProducto(''); // Resetea el hijo
    };

    const handlePublicoChange = (nuevoPublico: string) => {
        setPublico(nuevoPublico as Publico);
        setTalla(''); // Resetea el hijo
    };

    // Funciones para guardar nuevas opciones dinámicas
    const asyncAddCategoria = async (nuevaCategoria: string) => {
        if (!nuevaCategoria.trim()) return false;
        try {
            await guardarNuevaOpcion('categoria', { categoria: nuevaCategoria, nuevoValor: nuevaCategoria });
            // Actualizar localmente
            setEstructuraProductos(prev => ({ ...prev, [nuevaCategoria]: [] }));
            setCategoria(nuevaCategoria);
            setTipoProducto('');
            toast.success("Categoría agregada exitosamente.");
            return true;
        } catch (error) {
            toast.error("Error al guardar la categoría.");
            return false;
        }
    };

    const asyncAddTipoProducto = async (nuevoTipo: string) => {
        if (!categoria || !nuevoTipo.trim()) return false;
        try {
            await guardarNuevaOpcion('tipo_prenda', { categoria, nuevoValor: nuevoTipo });
            // Actualizar localmente
            setEstructuraProductos(prev => ({
                ...prev,
                [categoria]: [...(prev[categoria] || []), nuevoTipo]
            }));
            setTipoProducto(nuevoTipo);
            toast.success("Tipo de prenda agregado.");
            return true;
        } catch (error) {
            toast.error("Error al guardar el tipo de prenda.");
            return false;
        }
    };

    const asyncAddColor = async (nuevoColor: string) => {
        if (!nuevoColor.trim()) return false;
        try {
            await guardarNuevaOpcion('color', { nuevoValor: nuevoColor });
            // Actualizar localmente
            setColoresDisponibles(prev => [...prev, nuevoColor]);
            setColor(nuevoColor);
            toast.success("Color agregado.");
            return true;
        } catch (error) {
            toast.error("Error al guardar el color.");
            return false;
        }
    };

    const asyncEditOpcion = async (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, nuevoValor: string, parentCat?: string) => {
        if (!nuevoValor.trim() || nuevoValor === valorActual) return false;
        try {
            await updateOpcionConfiguracion(tipo, {
                action: 'editar',
                valorActual,
                nuevoValor: nuevoValor.trim(),
                categoria: parentCat
            });
            toast.success("Actualizado correctamente.");
            
            // Reload local data
            const data: any = await getOpcionesFormulario();
            setEstructuraProductos(data.categorias || {});
            setColoresDisponibles(data.colores || []);
            
            // Update currently selected if it was the one modified
            if (tipo === 'categoria' && categoria === valorActual) setCategoria(nuevoValor.trim());
            if (tipo === 'tipo_prenda' && tipoProducto === valorActual) setTipoProducto(nuevoValor.trim());
            if (tipo === 'color' && color === valorActual) setColor(nuevoValor.trim());
            
            return true;
        } catch (error) {
            toast.error("Error al editar la opción.");
            return false;
        }
    };

    const asyncDeleteOpcion = async (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, parentCat?: string) => {
        try {
            await updateOpcionConfiguracion(tipo, {
                action: 'eliminar',
                valorActual,
                categoria: parentCat
            });
            toast.success("Eliminado correctamente.");
            
            // Reload local data
            const data: any = await getOpcionesFormulario();
            setEstructuraProductos(data.categorias || {});
            setColoresDisponibles(data.colores || []);
            
            // Clear current selection if it was deleted
            if (tipo === 'categoria' && categoria === valorActual) {
                setCategoria('');
                setTipoProducto('');
            }
            if (tipo === 'tipo_prenda' && tipoProducto === valorActual) setTipoProducto('');
            if (tipo === 'color' && color === valorActual) setColor('');
            
            return true;
        } catch (error) {
            toast.error("Error al eliminar la opción.");
            return false;
        }
    };

    const resetFormulario = () => {
        setCategoria('');
        setTipoProducto('');
        setPublico('');
        setTalla('');
        setColor('');
        setCantidad(1);
    };

    return {
        // Estado
        categoria,
        tipoProducto,
        publico,
        talla,
        color,
        cantidad,
        // Setters directos
        setColor,
        setCantidad,
        setTipoProducto,
        setTalla,
        // Derivados 
        tiposDisponibles,
        tallasDisponibles,
        categoriasDisponibles: Object.keys(estructuraProductos),
        publicosDisponibles: Object.keys(TALLAS_POR_PUBLICO),
        coloresDisponibles,
        isCargandoOpciones,
        // Custom Modal UI
        modalConfig,
        isSubmittingModal,
        abrirModalNuevo,
        abrirModalEditar,
        abrirModalEliminar,
        cerrarModal,
        confirmarModal,
        // Handlers
        handleCategoriaChange,
        handlePublicoChange,
        resetFormulario,
        // Handlers asíncronos para nuevos datos
        asyncAddCategoria,
        asyncAddTipoProducto,
        asyncAddColor,
        asyncEditOpcion,
        asyncDeleteOpcion
    };
}
