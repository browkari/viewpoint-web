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
      {/* Modal de Registrarse he iniciar sesion*/}
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
            <button type="submit" className="btn-abrir-modal btn-abrir-modal-registro">
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
        {/*Barra de Navegacion */}
          <header className="navbar">
            {/* Contenedor que siempre se ve (Logo y Botón) */}
            <div className="navbar-header-movil">
              <div className="navbar-logo">
                <h1>🐈 Viewpoint</h1>
              </div>
              
              {/* Botón hamburguesa que solo se verá en teléfonos */}
              <button 
                className="btn-menu-principal" 
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              >
                {menuMovilAbierto ? '✖' : '☰'}
              </button>
            </div>
            
            {/* Contenedor que se colapsa en teléfonos */}
            <div className={`navbar-colapsable ${menuMovilAbierto ? 'abierto' : ''}`}>
              <nav className="navbar-links">
                {categoriasFiltro.map(cat => (
                  <button
                    key={cat}
                    className={`nav-tab ${filtroActivo === cat ? 'activo' : ''}`}
                    onClick={() => {
                      setFiltroActivo(cat);
                      setMenuMovilAbierto(false); 
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </nav>

              <div className="navbar-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                            setMenuEstadoAbierto(false); 
                          }}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="Botones-header">
                  <a 
                    href={`https://t.me/viewpoint_web_manager_bot?start=${sesion.user.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-telegram"
                    style={{
                      alignItems: 'center',
                      backgroundColor: '#0088cc98',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '1.2rem',
                      marginBottom: '0.2rem',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Vincular con mi Telegram"
                  >
                    🤖 Vincular Telegram
                  </a>
                  <button className="btn-abrir-modal" onClick={() => setModalAbierto(true)}>
                    + Agregar Nuevo
                  </button>
                </div>
              </div>
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
          {/*Config edit */}
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
                  {/* Tarjeta estilo */}
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
                      
                      {/* --- NUEVOS BOTONES DE EDICIÓN --- */}
                      
                      {/* Botón para la computadora (Imagen) */}
                      <button className="btn-editar btn-editar-pc" onClick={() => iniciarEdicion(item)} title="Editar">
                        <img src="editarboton.png" alt="editar" />
                      </button>

                      {/* Botón para el celular (Lápiz Cute) */}
                      <button className="btn-accion btn-editar-movil" onClick={() => iniciarEdicion(item)} title="Editar">
                        ✏️
                      </button>
                      
                      {/* --------------------------------- */}

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
              {/* Modal agregar nuevo */}
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
      
      {/* Modal librito */}
      {lecturaAbierta && (
        <div className="modal-fondo">
          
          {/* cajita de boton cerrar y modal */}
          <div style={{ position: 'relative', width: '90%', maxWidth: '28rem' }}>
            
            <button className="btn-cerrar-afuera" onClick={() => setLecturaAbierta(null)}>
              ✖
            </button>

            <div className="modal-contenido librito-modal" style={{ width: '100%', maxWidth: 'none' }}>
              
              {/* controles librito */}
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

              <div className={`pagina-fisica ${claseAnimacion}`}>
                <div className="contenido-pagina">
                  <h3 className="numero-capitulo">
                    {lecturaAbierta.categoria === 'Pelicula' 
                      ? 'Reseña de la Película' 
                      : `Capítulo ${capituloActual}`}
                  </h3>
                
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