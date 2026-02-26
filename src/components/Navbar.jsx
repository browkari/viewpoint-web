import React from 'react';

function Navbar({
  categoriasFiltro,
  filtroActivo,
  setFiltroActivo,
  estadosFiltro,
  estadoFiltro,
  setEstadoFiltro,
  menuEstadoAbierto,
  setMenuEstadoAbierto,
  menuMovilAbierto,
  setMenuMovilAbierto,
  sesion,
  setModalAbierto,
}) {
  return (
    <header className="navbar">
      <div className="navbar-header-movil">
        <div className="navbar-logo">
          <h1>🐈 Viewpoint</h1>
        </div>

        <button
          className="btn-menu-principal"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
        >
          {menuMovilAbierto ? '✖' : '☰'}
        </button>
      </div>

      <div
        className={`navbar-colapsable ${menuMovilAbierto ? 'abierto' : ''}`}
      >
        <nav className="navbar-links">
          {categoriasFiltro.map((cat) => (
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

        <div
          className="navbar-actions"
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
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
                {estadosFiltro.map((est) => (
                  <button
                    key={est}
                    className={`dropdown-item ${
                      estadoFiltro === est ? 'activo' : ''
                    }`}
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              title="Vincular con mi Telegram"
            >
              🤖 Vincular Telegram
            </a>
            <button
              className="btn-abrir-modal"
              onClick={() => setModalAbierto(true)}
            >
              + Agregar Nuevo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

