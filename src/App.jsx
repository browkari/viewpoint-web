import { useEffect, useState } from 'react'
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
  
  const categoriasFiltro = ['Todo', 'Manhwa', 'Novela', 'Anime', 'Serie']
  
  const [nuevaLectura, setNuevaLectura] = useState({
    titulo: '',
    categoria: 'Manhwa',
    progreso_actual: 0,
    progreso_total: '',
    estado: 'Pendiente',
    imagen_url: ''
  })

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
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session))
    obtenerLecturas()
  }, [])

  async function obtenerLecturas() {
    const { data, error } = await supabase
      .from('mi_entretenimiento')
      .select('*')
    if (error) console.error("Hubo un error:", error)
    else setLecturas(data)
  }

  async function sumarCapitulo(id, progresoActual) {
    const nuevoProgreso = progresoActual + 1
    const { error } = await supabase
      .from('mi_entretenimiento')
      .update({ progreso_actual: nuevoProgreso })
      .eq('id', id)
    if (error) console.error("Hubo un error al guardar:", error)
    else obtenerLecturas()
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
    const { error } = await supabase
      .from('mi_entretenimiento')
      .update(datosEdicion)
      .eq('id', id)
    if (error) console.error("Error al editar:", error)
    else {
      setEditandoId(null)
      obtenerLecturas()
    }
  }

  async function agregarLectura(e) {
    e.preventDefault()
    const lecturaParaGuardar = {
      ...nuevaLectura,
      progreso_actual: Number(nuevaLectura.progreso_actual),
      progreso_total: nuevaLectura.progreso_total ? Number(nuevaLectura.progreso_total) : null
    }
    const { error } = await supabase
      .from('mi_entretenimiento')
      .insert([lecturaParaGuardar])
    if (error) console.error("Error al agregar:", error)
    else {
      obtenerLecturas()
      setNuevaLectura({ titulo: '', categoria: 'Manhwa', progreso_actual: 0, progreso_total: '', estado: 'Pendiente', imagen_url: '' })
      setModalAbierto(false)
    }
  }

  const normalizarTexto = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  }

  const lecturasFiltradas = lecturas.filter(item => {
    const coincideCategoria = filtroActivo === 'Todo' || item.categoria === filtroActivo
    const tituloLimpio = normalizarTexto(item.titulo)
    const busquedaLimpia = normalizarTexto(busqueda)
    return coincideCategoria && tituloLimpio.includes(busquedaLimpia)
  })

  return (
    <div className="app-container">
      {!sesion ? (
        <div className="modal-fondo modal-fondo-registro">
          <form className="modal-contenido-registro" onSubmit={esRegistro ? registrarse : iniciarSesion}>
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
            <div className="navbar-actions">
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
                      <label className="label-editar">Link img: </label>
                      <input 
                        className="input-editar"
                        value={datosEdicion.imagen_url} 
                        onChange={(e) => setDatosEdicion({...datosEdicion, imagen_url: e.target.value})}
                      />
                    </div>
                    <div className="grupo-inputs grupo-inputs-editar">
                      <select className="select-editar" value={datosEdicion.categoria} onChange={(e) => setDatosEdicion({...datosEdicion, categoria: e.target.value})}>
                        <option value="Manhwa">Manhwa</option>
                        <option value="Novela">Novela</option>
                        <option value="Anime">Anime</option>
                        <option value="Serie">Serie</option>
                      </select>
                      <select className="select-editar " value={datosEdicion.estado} onChange={(e) => setDatosEdicion({...datosEdicion, estado: e.target.value})}>
                        <option value="En progreso">En progreso</option>
                        <option value="Completado">Completado</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </div>
                    <div className="grupo-inputs grupo-inputs-editar">
                      <label className="label-editar">Cap:</label>
                      <input type="number" className="input-numero" value={datosEdicion.progreso_actual} onChange={(e) => setDatosEdicion({...datosEdicion, progreso_actual: Number(e.target.value)})}/>
                      <label className="label-editar">de</label>
                      <input type="number" className="input-numero" value={datosEdicion.progreso_total} onChange={(e) => setDatosEdicion({...datosEdicion, progreso_total: Number(e.target.value)})}/>
                    </div>
                    <div className="grupo-botones">
                      <button className="btn-guardar" onClick={() => guardarEdicion(item.id)}>Guardar</button>
                      <button className="btn-cancelar" onClick={() => setEditandoId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{item.titulo}</h3>
                    <div className="img-tarjeta-cuerpo">
                      {item.imagen_url ? <img src={item.imagen_url} alt={item.titulo} className="portada-img" /> : <div className="portada-placeholder">Sin portada 🐈</div>}
                      <div className='texto-lectura'>
                        <p><strong>Categoría:</strong> {item.categoria}</p>
                        <p><strong>Progreso:</strong> Cap. {item.progreso_actual} / {item.progreso_total || '?'}</p>
                        <p><strong>Estado:</strong> {item.estado}</p>
                      </div>
                    </div>
                    <div className="grupo-botones">
                      <button className="btn-sumar" onClick={() => sumarCapitulo(item.id, item.progreso_actual)}>+1 Capitulo</button>
                      <button className="btn-editar" onClick={() => iniciarEdicion(item)}>
                        <img src="src/assets/editarboton.png" alt="editar" />
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
                  <input className="input-editar" placeholder="URL Imagen" value={nuevaLectura.imagen_url} onChange={(e) => setNuevaLectura({...nuevaLectura, imagen_url: e.target.value})} />
                  <div className="grupo-inputs">
                    <select className="select-editar" value={nuevaLectura.categoria} onChange={(e) => setNuevaLectura({...nuevaLectura, categoria: e.target.value})}>
                      <option value="Manhwa">Manhwa</option>
                      <option value="Novela">Novela</option>
                      <option value="Anime">Anime</option>
                    </select>
                    <select className="select-editar" value={nuevaLectura.estado} onChange={(e) => setNuevaLectura({...nuevaLectura, estado: e.target.value})}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                    </select>
                  </div>
                  <div className="grupo-inputs">
                    <input type="number" className="input-numero" value={nuevaLectura.progreso_actual} onChange={(e) => setNuevaLectura({...nuevaLectura, progreso_actual: e.target.value})} />
                    <input type="number" className="input-numero" placeholder="Total" value={nuevaLectura.progreso_total} onChange={(e) => setNuevaLectura({...nuevaLectura, progreso_total: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-guardar">Guardar</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App