import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { supabase } from './supabase' 
import './App.css'
import AuthModal from './components/AuthModal'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import LecturaCard from './components/LecturaCard'
import AgregarLecturaModal from './components/AgregarLecturaModal'
import LibritoModal from './components/LibritoModal'

function App() {
  const [lecturas, setLecturas] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [datosEdicion, setDatosEdicion] = useState({})
  const [filtroActivo, setFiltroActivo] = useState('Todo')
  const [sesion, setSesion] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [esRegistro, setEsRegistro] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [lecturaAbierta, setLecturaAbierta] = useState(null); 
  const [notas, setNotas] = useState([]);
  const [editandoNota, setEditandoNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({ id: null, capitulo: '', texto: '' });
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [capituloActual, setCapituloActual] = useState(1);
  const [claseAnimacion, setClaseAnimacion] = useState(''); 
  const estadosFiltro = ['Todos', 'Pendiente', 'En progreso', 'Pausado', 'Completado'];
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false); 
  const [menuEstadoAbierto, setMenuEstadoAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  
  const categoriasFiltro = ['Todo', 'Manhwa', 'Novela', 'Anime', 'Serie', 'Pelicula']
  
  const [nuevaLectura, setNuevaLectura] = useState({
    titulo: '',
    categoria: 'Manhwa',
    progreso_actual: 0,
    progreso_total: '',
    estado: 'Pendiente',
    imagen_url: ''
  })

  // --- LÓGICA DEL LIBRITO ---
  async function abrirLibrito(item) {
    setEditandoNota(false);
    setNuevaNota({ id: null, capitulo: '', texto: '' });
    setLecturaAbierta(item);
    
    const capInicial = item.categoria === 'Pelicula' ? 1 : Math.max(1, item.progreso_actual);
    setCapituloActual(capInicial);
    
    const { data, error } = await supabase
      .from('notas_lectura')
      .select('*')
      .eq('lectura_id', item.id)
      .order('capitulo', { ascending: false }); 

    if (error) console.error("Error cargando notas:", error);
    else setNotas(data);
  }

  function abrirEdicionNota(notaVieja) {
    setNuevaNota({ id: notaVieja.id, capitulo: notaVieja.capitulo, texto: notaVieja.texto });
    setEditandoNota(true);
  }

  // Guardar o Actualizar la nota
  async function guardarNota(e, capituloFijo) {
    e.preventDefault();

    if (editandoNota && nuevaNota.id) {
      const { error } = await supabase
        .from('notas_lectura')
        .update({ texto: nuevaNota.texto })
        .eq('id', nuevaNota.id);

      if (error) console.error("Error al actualizar nota:", error);
    } else {
      const notaParaGuardar = {
        lectura_id: lecturaAbierta.id,
        user_id: sesion.user.id,
        capitulo: capituloFijo,
        texto: nuevaNota.texto
      };

      const { error } = await supabase
        .from('notas_lectura')
        .insert([notaParaGuardar]);

      if (error) console.error("Error al guardar nota:", error);
    }

    setNuevaNota({ id: null, capitulo: '', texto: '' }); 
    setEditandoNota(false);
    
    const { data, error } = await supabase
      .from('notas_lectura')
      .select('*')
      .eq('lectura_id', lecturaAbierta.id)
      .order('capitulo', { ascending: false }); 

    if (error) console.error("Error recargando notas:", error);
    else setNotas(data);
  }
  const cambiarPagina = (direccion) => {
    if (!lecturaAbierta) return;
    
    const limiteCapitulos = lecturaAbierta.categoria === 'Pelicula' 
      ? 1 
      : Math.max(1, lecturaAbierta.progreso_actual);

    if (direccion > 0 && capituloActual >= limiteCapitulos) return;
    if (direccion < 0 && capituloActual <= 1) return;
    setEditandoNota(false);
    setNuevaNota({ id: null, capitulo: '', texto: '' });
    setClaseAnimacion(direccion > 0 ? 'deslizando-adelante' : 'deslizando-atras');
    
    setTimeout(() => {
      setCapituloActual(prev => prev + direccion); 
    }, 200); 

    setTimeout(() => {
      setClaseAnimacion('');
    }, 400); 
  };

  async function iniciarSesion(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Error: " + error.message)
    else setSesion(data.session)
  }

  async function registrarse(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) alert("Error: " + error.message)
    else alert("¡Revisa tu correo para confirmar el registro!")
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setSesion(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session));
  }, []);

  useEffect(() => {
    if (sesion) {
      obtenerLecturas(); 
    } else {
      setLecturas([]); 
    }
  }, [sesion]);

  async function subirImagen(file) {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${sesion.user.id}/${fileName}`; 

    const { error: uploadError } = await supabase.storage
      .from('portadas')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('portadas')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function obtenerLecturas() {
    const { data, error } = await supabase
      .from('mi_entretenimiento')
      .select('*')
    if (error) console.error("Hubo un error:", error)
    else setLecturas(data)
  }

  // FUNCION DE SUMAR CAPITULO
  async function sumarCapitulo(id, progresoActual, progresoTotal, estadoActual) {
    if (progresoTotal && progresoActual >= progresoTotal) {
      Swal.fire({
          title: '¡Límite alcanzado!',
          text: 'No puedes sumar más capítulos. 🎉',
          icon: 'info',
          background: '#4b1535a9',
          color: '#fccbed',
          confirmButtonColor: '#e48e67'
        });
      return; 
    }

    const nuevoProgreso = progresoActual + 1;
    
    let datosParaActualizar = { 
      progreso_actual: nuevoProgreso 
    };

    if (progresoTotal && nuevoProgreso >= progresoTotal) {
      datosParaActualizar.estado = 'Completado';
      Swal.fire({
          title: '¡Felicidades!',
          text: 'Has terminado esta lectura. ✨',
          icon: 'success',
          background: '#4b1535a9',
          color: '#fccbed',
          borderradius: '1rem',
          confirmButtonColor: '#e48e67'
        });
        
    } else if (estadoActual === 'Pendiente') {
      datosParaActualizar.estado = 'En progreso';
    }

    const { error } = await supabase
      .from('mi_entretenimiento')
      .update(datosParaActualizar)
      .eq('id', id); 

    if (error) {
      console.error("Hubo un error al guardar:", error);
    } else {
      obtenerLecturas();
    }
  }

  function iniciarEdicion(item) {
    setEditandoId(item.id)
    setDatosEdicion({
      titulo: item.titulo,
      categoria: item.categoria,
      progreso_actual: item.progreso_actual,
      progreso_total: item.progreso_total || 0,
      estado: item.estado,
      imagen_url: item.imagen_url || '' 
    })
  }

  async function guardarEdicion(id) {
    setSubiendo(true);
    let urlFinal = datosEdicion.imagen_url;

    if (archivoImagen) {
      const urlSubida = await subirImagen(archivoImagen);
      if (urlSubida) urlFinal = urlSubida;
    }

    const datosParaActualizar = {
      ...datosEdicion,
      imagen_url: urlFinal
    };

    const { error } = await supabase.from('mi_entretenimiento').update(datosParaActualizar).eq('id', id);
    
    if (error) console.error("Error al editar:", error);
    else {
      setEditandoId(null);
      setArchivoImagen(null); 
      obtenerLecturas();
    }
    setSubiendo(false);
  }

  async function eliminarLectura(id) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar lectura?',
      text: "¡Esta acción no se puede deshacer y borrará también tus notas! 😿",
      icon: 'warning',
      background: '#4b1535a9', 
      color: '#fccbed',      
      showCancelButton: true,
      confirmButtonColor: '#b83d5c', 
      cancelButtonColor: '#87418b',  
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    await supabase
      .from('notas_lectura')
      .delete()
      .eq('lectura_id', id);

    const { error } = await supabase
      .from('mi_entretenimiento')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error al eliminar:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al borrar en la base de datos.',
        icon: 'error',
        background: '#4b1535a9',
        color: '#fccbed'
      });
    } else {
      obtenerLecturas();
      
      Swal.fire({
        title: '¡Eliminada!',
        text: 'La tarjeta y sus notas desaparecieron en el vacío.',
        icon: 'success',
        background: '#4b1535a9',
        color: '#fccbed',
        confirmButtonColor: '#e48e67', 
        timer: 2000, 
        showConfirmButton: false
      });
    }
  }

  async function agregarLectura(e) {
    e.preventDefault();
    setSubiendo(true); 
    
    let urlFinal = nuevaLectura.imagen_url;

    if (archivoImagen) {
      const urlSubida = await subirImagen(archivoImagen);
      if (urlSubida) urlFinal = urlSubida;
    }

    const lecturaParaGuardar = {
      ...nuevaLectura,
      imagen_url: urlFinal, 
      user_id: sesion.user.id,
      progreso_actual: Number(nuevaLectura.progreso_actual),
      progreso_total: nuevaLectura.progreso_total ? Number(nuevaLectura.progreso_total) : null
    };

    const { error } = await supabase.from('mi_entretenimiento').insert([lecturaParaGuardar]);

    if (error) console.error("Error al agregar:", error);
    else {
      obtenerLecturas();
      setNuevaLectura({ titulo: '', categoria: 'Manhwa', progreso_actual: 0, progreso_total: '', estado: 'Pendiente', imagen_url: '' });
      setArchivoImagen(null); 
      setModalAbierto(false);
    }
    setSubiendo(false);
  }

  const normalizarTexto = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  }

  const lecturasFiltradas = lecturas.filter(item => {
    const coincideCategoria = filtroActivo === 'Todo' || item.categoria === filtroActivo;
    const coincideEstado = estadoFiltro === 'Todos' || item.estado === estadoFiltro;
    const tituloLimpio = normalizarTexto(item.titulo);
    const busquedaLimpia = normalizarTexto(busqueda);
    const coincideBusqueda = tituloLimpio.includes(busquedaLimpia);
    return coincideCategoria && coincideEstado && coincideBusqueda;
  });

  return (
    <div className="app-container">
      {!sesion ? (
        <AuthModal
          esRegistro={esRegistro}
          setEsRegistro={setEsRegistro}
          iniciarSesion={iniciarSesion}
          registrarse={registrarse}
          setEmail={setEmail}
          setPassword={setPassword}
        />
      ) : (
        <>
          <Navbar
            categoriasFiltro={categoriasFiltro}
            filtroActivo={filtroActivo}
            setFiltroActivo={setFiltroActivo}
            estadosFiltro={estadosFiltro}
            estadoFiltro={estadoFiltro}
            setEstadoFiltro={setEstadoFiltro}
            menuEstadoAbierto={menuEstadoAbierto}
            setMenuEstadoAbierto={setMenuEstadoAbierto}
            menuMovilAbierto={menuMovilAbierto}
            setMenuMovilAbierto={setMenuMovilAbierto}
            sesion={sesion}
            setModalAbierto={setModalAbierto}
          />

          <SearchBar busqueda={busqueda} setBusqueda={setBusqueda} />

          <div className="container container-lecturas">
            {lecturasFiltradas.map((item) => (
              <LecturaCard
                key={item.id}
                item={item}
                editandoId={editandoId}
                datosEdicion={datosEdicion}
                setDatosEdicion={setDatosEdicion}
                setEditandoId={setEditandoId}
                subiendo={subiendo}
                sumarCapitulo={sumarCapitulo}
                iniciarEdicion={iniciarEdicion}
                guardarEdicion={guardarEdicion}
                eliminarLectura={eliminarLectura}
                abrirLibrito={abrirLibrito}
                setArchivoImagen={setArchivoImagen}
              />
            ))}
          </div>

          <button
            onClick={cerrarSesion}
            className="btn-cancelar"
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              zIndex: 100,
            }}
          >
            Cerrar Sesión
          </button>

          {modalAbierto && (
            <AgregarLecturaModal
              nuevaLectura={nuevaLectura}
              setNuevaLectura={setNuevaLectura}
              archivoImagen={archivoImagen}
              setArchivoImagen={setArchivoImagen}
              subiendo={subiendo}
              agregarLectura={agregarLectura}
              setModalAbierto={setModalAbierto}
            />
          )}
        </>
      )}

      {lecturaAbierta && (
        <LibritoModal
          lecturaAbierta={lecturaAbierta}
          setLecturaAbierta={setLecturaAbierta}
          cambiarPagina={cambiarPagina}
          capituloActual={capituloActual}
          claseAnimacion={claseAnimacion}
          notas={notas}
          editandoNota={editandoNota}
          setEditandoNota={setEditandoNota}
          nuevaNota={nuevaNota}
          setNuevaNota={setNuevaNota}
          guardarNota={guardarNota}
          abrirEdicionNota={abrirEdicionNota}
        />
      )}
    </div>
  )
}

export default App