import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { supabase } from './supabase' 
import './App.css'

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
  const [menuEstadoAbierto, setMenuEstadoAbierto] = useState(false);
  const [capituloActual, setCapituloActual] = useState(1);
  const [claseAnimacion, setClaseAnimacion] = useState(''); 
  const estadosFiltro = ['Todos', 'Pendiente', 'En progreso', 'Pausado', 'Completado'];
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false); 
  
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
    setCapituloActual(1); // ¡NUEVO! Siempre abre el libro en el cap 1
    
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
    abrirLibrito(lecturaAbierta); 
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
    // Cambiamos los nombres de las clases a "deslizando"
    setClaseAnimacion(direccion > 0 ? 'deslizando-adelante' : 'deslizando-atras');
    
    setTimeout(() => {
      setCapituloActual(prev => prev + direccion); 
    }, 200); // A los 200ms (mitad del camino), cambiamos el texto

    setTimeout(() => {
      setClaseAnimacion('');
    }, 400); // A los 400ms termina la animación
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

  // vigila la sesion
  useEffect(() => {
    if (sesion) {
      obtenerLecturas(); 
    } else {
      setLecturas([]); // limpiar pantalla si no hay sesion
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
    // 1. Evitamos que pase del límite
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
    
    // 2. Preparamos una "cajita" con los datos a guardar
    let datosParaActualizar = { 
      progreso_actual: nuevoProgreso 
    };

    // 3. La lógica automática
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
      // Si apenas vas a empezar a leerlo, lo pasamos a En progreso
      datosParaActualizar.estado = 'En progreso';
    }

    // 4. Enviamos la cajita a Supabase
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
      setArchivoImagen(null); // Limpiamos
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

    // --- ¡LA SOLUCIÓN! ---
    // 1. PRIMERO: Le decimos a Supabase que borre todas las notas asociadas a esta lectura
    await supabase
      .from('notas_lectura')
      .delete()
      .eq('lectura_id', id);

    // 2. SEGUNDO: Ahora que está limpia, procedemos a borrar la tarjeta principal
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
    setSubiendo(true); // Bloqueamos temporalmente
    
    let urlFinal = nuevaLectura.imagen_url;

    // Si la persona seleccionó un archivo de su compu/celular, lo subimos
    if (archivoImagen) {
      const urlSubida = await subirImagen(archivoImagen);
      if (urlSubida) urlFinal = urlSubida;
    }

    const lecturaParaGuardar = {
      ...nuevaLectura,
      imagen_url: urlFinal, // Usamos la URL nueva o la que haya escrito
      user_id: sesion.user.id,
      progreso_actual: Number(nuevaLectura.progreso_actual),
      progreso_total: nuevaLectura.progreso_total ? Number(nuevaLectura.progreso_total) : null
    };

    const { error } = await supabase.from('mi_entretenimiento').insert([lecturaParaGuardar]);

    if (error) console.error("Error al agregar:", error);
    else {
      obtenerLecturas();
      setNuevaLectura({ titulo: '', categoria: 'Manhwa', progreso_actual: 0, progreso_total: '', estado: 'Pendiente', imagen_url: '' });
      setArchivoImagen(null); // Limpiamos el archivo
      setModalAbierto(false);
    }
    setSubiendo(false);
  }

  const normalizarTexto = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  }

  const lecturasFiltradas = lecturas.filter(item => {
    // 1. Revisa la categoría
    const coincideCategoria = filtroActivo === 'Todo' || item.categoria === filtroActivo;
    
    // 2. NUEVO: Revisa el estado (Completado, Pendiente, etc.)
    const coincideEstado = estadoFiltro === 'Todos' || item.estado === estadoFiltro;
    
    // 3. Revisa la búsqueda por texto
    const tituloLimpio = normalizarTexto(item.titulo);
    const busquedaLimpia = normalizarTexto(busqueda);
    const coincideBusqueda = tituloLimpio.includes(busquedaLimpia);
    
    // Solo muestra la tarjeta si pasa los 3 filtros a la vez
    return coincideCategoria && coincideEstado && coincideBusqueda;
  });

  return (
    <div className="app-container">
      {!sesion ? (
        <div className="modal-fondo modal-fondo-registro">
          <form className="modal-contenido-registro" onSubmit={esRegistro ? registrarse : iniciarSesion}>
            <img  className="modal-fondo-gif" src="iniciarsesion.gif" alt=""/>
            <h2>{esRegistro ? 'Crear Cuenta' : 'Viewpoint Login'}</h2>
            <div className="grupo-inputs-modal">
              <input 
                className="input-editar" 
                type="email" 
                placeholder="Tu correo" 
                required
                onChange={(e) => setEmail(e.target.value)} 
              />
              <input 
                className="input-editar" 
                type="password" 
                placeholder="Tu contraseña" 
                required
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn-abrir-modal">
              {esRegistro ? 'Registrarme' : 'Entrar'}
            </button>
            <p className="texto-login">
              {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} 
              <span className="link-auth" onClick={() => setEsRegistro(!esRegistro)}>
                {esRegistro ? ' Inicia sesión' : ' Regístrate aquí'}
              </span>
            </p>
          </form>
        </div>
      ) : (
        <>
          <header className="navbar">
            <div className="navbar-logo">
              <h1>🐈 Viewpoint</h1>
            </div>
            
            <nav className="navbar-links">
              {categoriasFiltro.map(cat => (
                <button
                  key={cat}
                  className={`nav-tab ${filtroActivo === cat ? 'activo' : ''}`}
                  onClick={() => setFiltroActivo(cat)}
                >
                  {cat}
                </button>
              ))}
            </nav>

            {/* Agrupamos la hamburguesa y el botón de agregar para que no rompan el diseño */}
            <div className="navbar-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              
              {/* --- MENÚ HAMBURGUESA --- */}
              <div className="menu-estados-container" style={{ position: 'relative' }}>
                <button 
                  className="btn-hamburguesa" 
                  onClick={() => setMenuEstadoAbierto(!menuEstadoAbierto)}
                  title="Filtrar por estado"
                >
                  ☰
                </button>
                
                {menuEstadoAbierto && (
                  <div className="dropdown-estados">
                    {estadosFiltro.map(est => (
                      <button
                        key={est}
                        className={`dropdown-item ${estadoFiltro === est ? 'activo' : ''}`}
                        onClick={() => {
                          setEstadoFiltro(est);
                          setMenuEstadoAbierto(false); // Se cierra al elegir
                        }}
                      >
                        {est}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button className="btn-abrir-modal" onClick={() => setModalAbierto(true)}>
                + Agregar Nuevo
              </button>
            </div>
          </header>

          <div className="contenedor-busqueda">
            <input 
              type="text" 
              className="input-busqueda"
              placeholder="Buscar título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className='container container-lecturas'>
            {lecturasFiltradas.map((item) => (
              <div key={item.id} className="tarjeta-lectura">
                {editandoId === item.id ? (
                  <div className="modo-edicion">
                    <div className='grupo-inputs'>
                      <label className="label-editar">Titulo: </label>
                      <input 
                        className="input-editar"
                        value={datosEdicion.titulo} 
                        onChange={(e) => setDatosEdicion({...datosEdicion, titulo: e.target.value})}
                      />
                    </div>
                    <div className='grupo-inputs grupo-inputs-editar'>
                      <div className="grupo-inputs" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <input className="input-editar" placeholder="URL Imagen (opcional si subes archivo)" value={datosEdicion.imagen_url} onChange={(e) => setDatosEdicion({...datosEdicion, imagen_url: e.target.value})} />
                    <label className="label-editar" style={{ marginTop: '0.5rem' }}>O sube una desde tu dispositivo:</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="input-editar" 
                      onChange={(e) => setArchivoImagen(e.target.files[0])} 
                      style={{ padding: '0.4rem' }}
                    />
                  </div>
                    </div>
                    <div className="grupo-inputs grupo-inputs-editar">
                      <select className="select-editar" value={datosEdicion.categoria} onChange={(e) => setDatosEdicion({...datosEdicion, categoria: e.target.value})}>
                        <option value="Manhwa">Manhwa</option>
                        <option value="Novela">Novela</option>
                        <option value="Anime">Anime</option>
                        <option value="Serie">Serie</option>
                        <option value="Donghua">Donghua</option>
                        <option value="Pelicula">Pelicula</option>
              
                      </select>
                      <select className="select-editar " value={datosEdicion.estado} onChange={(e) => setDatosEdicion({...datosEdicion, estado: e.target.value})}>
                        <option value="En progreso">En progreso</option>
                        <option value="Completado">Completado</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </div>
                    {datosEdicion.categoria !== 'Pelicula' && (
                    <div className="grupo-inputs grupo-inputs-editar">
                      <label className="label-editar">Cap:</label>
                      <input type="number" className="input-numero" value={datosEdicion.progreso_actual} onChange={(e) => setDatosEdicion({...datosEdicion, progreso_actual: Number(e.target.value)})}/>
                      <label className="label-editar">de</label>
                      <input type="number" className="input-numero" value={datosEdicion.progreso_total} onChange={(e) => setDatosEdicion({...datosEdicion, progreso_total: Number(e.target.value)})}/>
                    </div>
                    )}
                    <div className="grupo-botones">
                      <button 
                        className="btn-guardar" 
                        onClick={() => guardarEdicion(item.id)} 
                        disabled={subiendo}>
                        {subiendo ? 'Guardando... ⏳' : 'Guardar'}
                      </button>
                      <button className="btn-cancelar" onClick={() => setEditandoId(null)}>Cancelar</button>
                      <button className="btn-eliminar" onClick={() => eliminarLectura(item.id)} title="Eliminar"> 🗑️ Eliminar </button>
                    </div>
                  </div>
                ) : (
                  <>
                   <h3>{item.titulo}</h3> 
                    
                    <div className="img-tarjeta-cuerpo">
                      {item.imagen_url ? <img src={item.imagen_url} alt={item.titulo} className="portada-img" /> : <div className="portada-placeholder">Sin portada 🐈</div>}
                      <div className='texto-lectura'>
                        <p><strong>Categoría:</strong> {item.categoria}</p>
                        <p><strong>Progreso:</strong> {item.categoria === 'Pelicula' ? 'Película única' : `Cap. ${item.progreso_actual} / ${item.progreso_total || '?'}`}</p>
                        <p><strong>Estado:</strong> {item.estado}</p>
                      </div>
                    </div>
                    <div className="grupo-botones">
                      {item.categoria !== 'Pelicula' && (
                        <button 
                          className="btn-sumar" 
                          onClick={() => sumarCapitulo(item.id, item.progreso_actual, item.progreso_total, item.estado)}
                        >
                          +1 Capitulo
                        </button>
                      )}
                      <button className="btn-editar" onClick={() => iniciarEdicion(item)}>
                        <img src="editarboton.png" alt="editar" />
                      </button>
                      <button className="btn-editar-librito" onClick={() => abrirLibrito(item)} title="Ver Notas">
                        📖
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button onClick={cerrarSesion} className="btn-cancelar" style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100 }}>
            Cerrar Sesión
          </button>

          {modalAbierto && (
            <div className="modal-fondo">
              <div className="modal-contenido">
                <button className="btn-cerrar-modal" onClick={() => setModalAbierto(false)}>✖</button>
                <form className="formulario-nuevo" onSubmit={agregarLectura}>
                  <h3>📥 Agregar Nuevo</h3>
                  <input className="input-editar" placeholder="Título" value={nuevaLectura.titulo} onChange={(e) => setNuevaLectura({...nuevaLectura, titulo: e.target.value})} required />
                  <div className="grupo-inputs" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <input className="input-editar" placeholder="URL Imagen (opcional si subes archivo)" value={nuevaLectura.imagen_url} onChange={(e) => setNuevaLectura({...nuevaLectura, imagen_url: e.target.value})} />
                    <label className="label-editar" style={{ marginTop: '0.5rem' }}>O sube una desde tu dispositivo:</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="input-editar" 
                      onChange={(e) => setArchivoImagen(e.target.files[0])} 
                      style={{ padding: '0.4rem' }}
                    />
                  </div>
                  <div className="grupo-inputs">
                    <select className="select-editar" value={nuevaLectura.categoria} onChange={(e) => setNuevaLectura({...nuevaLectura, categoria: e.target.value})}>
                      <option value="Manhwa">Manhwa</option>
                      <option value="Novela">Novela</option>
                      <option value="Donghua">Donghua</option>
                      <option value="Anime">Anime</option>
                      <option value="Serie">Serie</option>
                      <option value="Pelicula">Película</option>
                    </select>
                    <select className="select-editar" value={nuevaLectura.estado} onChange={(e) => setNuevaLectura({...nuevaLectura, estado: e.target.value})}>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Completado">Completado</option>
                    </select>
                  </div>
                  {nuevaLectura.categoria !== 'Pelicula' && (
                  <div className="grupo-inputs">
                    <label className="label-editar">Cap: </label>
                    <input type="number" className="input-numero" value={nuevaLectura.progreso_actual} onChange={(e) => setNuevaLectura({...nuevaLectura, progreso_actual: e.target.value})} />
                    <label className="label-editar">de: </label>
                    <input type="number" className="input-numero" placeholder="Total" value={nuevaLectura.progreso_total} onChange={(e) => setNuevaLectura({...nuevaLectura, progreso_total: e.target.value})} />
                  </div>
                  )}
                      <button type="submit" className="btn-guardar" disabled={subiendo}>
                        {subiendo ? 'Subiendo... ⏳' : 'Guardar'}
                      </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* --- MODAL DEL LIBRITO DE NOTAS --- */}
      {lecturaAbierta && (
        <div className="modal-fondo">
          
          {/* NUEVO: Una caja invisible para agrupar el botón y el modal */}
          <div style={{ position: 'relative', width: '90%', maxWidth: '28rem' }}>
            
            {/* El botón ahora está AFUERA del librito-modal, pero anclado a la caja invisible */}
            <button className="btn-cerrar-afuera" onClick={() => setLecturaAbierta(null)}>
              ✖
            </button>

            {/* Le decimos al modal que ocupe el 100% de esta caja nueva */}
            <div className="modal-contenido librito-modal" style={{ width: '100%', maxWidth: 'none' }}>
              
              {/* Controles del libro (Arriba) */}
              <div className="controles-libro">
                <button 
                  className="btn-pagina" 
                  onClick={() => cambiarPagina(-1)}
                  style={{ visibility: capituloActual > 1 ? 'visible' : 'hidden' }}
                >
                  ◀ Ant
                </button>
                
                <h2 className="titulo-libro">📖 {lecturaAbierta.titulo}</h2>
                
                <button 
                  className="btn-pagina" 
                  onClick={() => cambiarPagina(1)}
                  style={{ 
                    visibility: capituloActual < (lecturaAbierta.categoria === 'Pelicula' ? 1 : Math.max(1, lecturaAbierta.progreso_actual)) 
                      ? 'visible' 
                      : 'hidden' 
                  }}
                >
                  Sig ▶
                </button>
              </div>

              {/* La Página Física (Aquí ocurre la animación) */}
              <div className={`pagina-fisica ${claseAnimacion}`}>
                <div className="contenido-pagina">
                  <h3 className="numero-capitulo">
                    {lecturaAbierta.categoria === 'Pelicula' 
                      ? 'Reseña de la Película' 
                      : `Capítulo ${capituloActual}`}
                  </h3>
                  
                  {/* Buscamos si hay una nota para este capítulo en específico */}
                  {(() => {
                    const notaDelCapitulo = notas.find(n => n.capitulo === capituloActual);
                    
                    if (notaDelCapitulo && !editandoNota) {
                      return (
                        <div className="vista-nota">
                          <div className="texto-nota-largo">
                            {notaDelCapitulo.texto}
                          </div>
                          <div className="grupo-botones" style={{ marginTop: '1rem' }}>
                            <button className="btn-editar-nota" onClick={() => abrirEdicionNota(notaDelCapitulo)}>
                              ✏️ Editar
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <form className="formulario-nuevo" onSubmit={(e) => guardarNota(e, capituloActual)}>
                          <textarea 
                            className="input-editar textarea-nota" 
                            placeholder={lecturaAbierta.categoria === 'Pelicula' 
                              ? "Escribe tus notas sobre la película aquí..." 
                              : `Escribe tus notas para el capítulo ${capituloActual}...`}
                            value={nuevaNota.texto}
                            onChange={(e) => setNuevaNota({...nuevaNota, texto: e.target.value})}
                            required
                          />
                          <div className="grupo-botones" style={{ marginTop: '1rem' }}>
                            <button type="submit" className="btn-guardar">
                              {editandoNota ? 'Actualizar Nota' : 'Guardar Nota'}
                            </button>
                            {editandoNota && (
                              <button type="button" className="btn-cancelar" onClick={() => {
                                setEditandoNota(false);
                                setNuevaNota({ id: null, capitulo: '', texto: '' });
                              }}>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </form>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
    </div>
  )
}

export default App
