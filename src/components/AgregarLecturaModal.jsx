import React from 'react';

function AgregarLecturaModal({
  nuevaLectura,
  setNuevaLectura,
  archivoImagen,
  setArchivoImagen,
  subiendo,
  agregarLectura,
  setModalAbierto,
}) {
  return (
    <div className="modal-fondo">
      <div className="modal-contenido">
        <button
          className="btn-cerrar-modal"
          onClick={() => setModalAbierto(false)}
        >
          ✖
        </button>
        <form className="formulario-nuevo" onSubmit={agregarLectura}>
          <h3>📥 Agregar Nuevo</h3>
          <input
            className="input-editar"
            placeholder="Título"
            value={nuevaLectura.titulo}
            onChange={(e) =>
              setNuevaLectura({ ...nuevaLectura, titulo: e.target.value })
            }
            required
          />
          <div
            className="grupo-inputs"
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <input
              className="input-editar"
              placeholder="URL Imagen (opcional si subes archivo)"
              value={nuevaLectura.imagen_url}
              onChange={(e) =>
                setNuevaLectura({
                  ...nuevaLectura,
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
          <div className="grupo-inputs">
            <select
              className="select-editar"
              value={nuevaLectura.categoria}
              onChange={(e) =>
                setNuevaLectura({
                  ...nuevaLectura,
                  categoria: e.target.value,
                })
              }
            >
              <option value="Manhwa">Manhwa</option>
              <option value="Novela">Novela</option>
              <option value="Donghua">Donghua</option>
              <option value="Anime">Anime</option>
              <option value="Serie">Serie</option>
              <option value="Pelicula">Película</option>
            </select>
            <select
              className="select-editar"
              value={nuevaLectura.estado}
              onChange={(e) =>
                setNuevaLectura({
                  ...nuevaLectura,
                  estado: e.target.value,
                })
              }
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En progreso">En progreso</option>
              <option value="Pausado">Pausado</option>
              <option value="Completado">Completado</option>
            </select>
          </div>
          {nuevaLectura.categoria !== 'Pelicula' && (
            <div className="grupo-inputs">
              <label className="label-editar">Cap: </label>
              <input
                type="number"
                className="input-numero"
                value={nuevaLectura.progreso_actual}
                onChange={(e) =>
                  setNuevaLectura({
                    ...nuevaLectura,
                    progreso_actual: e.target.value,
                  })
                }
              />
              <label className="label-editar">de: </label>
              <input
                type="number"
                className="input-numero"
                placeholder="Total"
                value={nuevaLectura.progreso_total}
                onChange={(e) =>
                  setNuevaLectura({
                    ...nuevaLectura,
                    progreso_total: e.target.value,
                  })
                }
              />
            </div>
          )}
          <button type="submit" className="btn-guardar" disabled={subiendo}>
            {subiendo ? 'Subiendo... ⏳' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgregarLecturaModal;

