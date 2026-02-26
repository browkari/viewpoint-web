import React from 'react';

function LecturaCard({
  item,
  editandoId,
  datosEdicion,
  setDatosEdicion,
  setEditandoId,
  subiendo,
  sumarCapitulo,
  iniciarEdicion,
  guardarEdicion,
  eliminarLectura,
  abrirLibrito,
  setArchivoImagen,
}) {
  const estaEditando = editandoId === item.id;

  if (estaEditando) {
    return (
      <div className="tarjeta-lectura">
        <div className="modo-edicion">
          <div className="grupo-inputs">
            <label className="label-editar">Titulo: </label>
            <input
              className="input-editar"
              value={datosEdicion.titulo}
              onChange={(e) =>
                setDatosEdicion({ ...datosEdicion, titulo: e.target.value })
              }
            />
          </div>

          <div className="grupo-inputs grupo-inputs-editar">
            <div
              className="grupo-inputs"
              style={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <input
                className="input-editar"
                placeholder="URL Imagen (opcional si subes archivo)"
                value={datosEdicion.imagen_url}
                onChange={(e) =>
                  setDatosEdicion({
                    ...datosEdicion,
                    imagen_url: e.target.value,
                  })
                }
              />
              <label
                className="label-editar"
                style={{ marginTop: '0.5rem' }}
              >
                O sube una desde tu dispositivo:
              </label>
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
            <select
              className="select-editar"
              value={datosEdicion.categoria}
              onChange={(e) =>
                setDatosEdicion({
                  ...datosEdicion,
                  categoria: e.target.value,
                })
              }
            >
              <option value="Manhwa">Manhwa</option>
              <option value="Novela">Novela</option>
              <option value="Anime">Anime</option>
              <option value="Serie">Serie</option>
              <option value="Donghua">Donghua</option>
              <option value="Pelicula">Pelicula</option>
            </select>
            <select
              className="select-editar "
              value={datosEdicion.estado}
              onChange={(e) =>
                setDatosEdicion({
                  ...datosEdicion,
                  estado: e.target.value,
                })
              }
            >
              <option value="En progreso">En progreso</option>
              <option value="Completado">Completado</option>
              <option value="Pausado">Pausado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          {datosEdicion.categoria !== 'Pelicula' && (
            <div className="grupo-inputs grupo-inputs-editar">
              <label className="label-editar">Cap:</label>
              <input
                type="number"
                className="input-numero"
                value={datosEdicion.progreso_actual}
                onChange={(e) =>
                  setDatosEdicion({
                    ...datosEdicion,
                    progreso_actual: Number(e.target.value),
                  })
                }
              />
              <label className="label-editar">de</label>
              <input
                type="number"
                className="input-numero"
                value={datosEdicion.progreso_total}
                onChange={(e) =>
                  setDatosEdicion({
                    ...datosEdicion,
                    progreso_total: Number(e.target.value),
                  })
                }
              />
            </div>
          )}

          <div className="grupo-botones">
            <button
              className="btn-guardar"
              onClick={() => guardarEdicion(item.id)}
              disabled={subiendo}
            >
              {subiendo ? 'Guardando... ⏳' : 'Guardar'}
            </button>
            <button
              className="btn-cancelar"
              onClick={() => setEditandoId(null)}
            >
              Cancelar
            </button>
            <button
              className="btn-eliminar"
              onClick={() => eliminarLectura(item.id)}
              title="Eliminar"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tarjeta-lectura">
      <h3>{item.titulo}</h3>

      <div className="img-tarjeta-cuerpo">
        {item.imagen_url ? (
          <img
            src={item.imagen_url}
            alt={item.titulo}
            className="portada-img"
          />
        ) : (
          <div className="portada-placeholder">Sin portada 🐈</div>
        )}
        <div className="texto-lectura">
          <p>
            <strong>Categoría:</strong> {item.categoria}
          </p>
          <p>
            <strong>Progreso:</strong>{' '}
            {item.categoria === 'Pelicula'
              ? 'Película única'
              : `Cap. ${item.progreso_actual} / ${
                  item.progreso_total || '?'
                }`}
          </p>
          <p>
            <strong>Estado:</strong> {item.estado}
          </p>
        </div>
      </div>

      <div className="grupo-botones">
        {item.categoria !== 'Pelicula' && (
          <button
            className="btn-sumar"
            onClick={() =>
              sumarCapitulo(
                item.id,
                item.progreso_actual,
                item.progreso_total,
                item.estado,
              )
            }
          >
            +1 Capitulo
          </button>
        )}

        <button
          className="btn-editar btn-editar-pc"
          onClick={() => iniciarEdicion(item)}
          title="Editar"
        >
          <img src="editarboton.png" alt="editar" />
        </button>

        <button
          className="btn-accion btn-editar-movil"
          onClick={() => iniciarEdicion(item)}
          title="Editar"
        >
          ✏️
        </button>

        <button
          className="btn-editar-librito"
          onClick={() => abrirLibrito(item)}
          title="Ver Notas"
        >
          📖
        </button>
      </div>
    </div>
  );
}

export default LecturaCard;

