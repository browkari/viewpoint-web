import React from 'react';

function LibritoModal({
  lecturaAbierta,
  setLecturaAbierta,
  cambiarPagina,
  capituloActual,
  claseAnimacion,
  notas,
  editandoNota,
  setEditandoNota,
  nuevaNota,
  setNuevaNota,
  guardarNota,
  abrirEdicionNota,
}) {
  if (!lecturaAbierta) return null;

  const limiteCapitulos =
    lecturaAbierta.categoria === 'Pelicula'
      ? 1
      : Math.max(1, lecturaAbierta.progreso_actual);

  return (
    <div className="modal-fondo">
      <div style={{ position: 'relative', width: '90%', maxWidth: '28rem' }}>
        <button
          className="btn-cerrar-afuera"
          onClick={() => setLecturaAbierta(null)}
        >
          ✖
        </button>

        <div
          className="modal-contenido librito-modal"
          style={{ width: '100%', maxWidth: 'none' }}
        >
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
                visibility:
                  capituloActual < limiteCapitulos ? 'visible' : 'hidden',
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
                const notaDelCapitulo = notas.find(
                  (n) => n.capitulo === capituloActual,
                );

                if (notaDelCapitulo && !editandoNota) {
                  return (
                    <div className="vista-nota">
                      <div className="texto-nota-largo">
                        {notaDelCapitulo.texto}
                      </div>
                      <div
                        className="grupo-botones"
                        style={{ marginTop: '1rem' }}
                      >
                        <button
                          className="btn-editar-nota"
                          onClick={() => abrirEdicionNota(notaDelCapitulo)}
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <form
                    className="formulario-nuevo"
                    onSubmit={(e) => guardarNota(e, capituloActual)}
                  >
                    <textarea
                      className="input-editar textarea-nota"
                      placeholder={
                        lecturaAbierta.categoria === 'Pelicula'
                          ? 'Escribe tus notas sobre la película aquí...'
                          : `Escribe tus notas para el capítulo ${capituloActual}...`
                      }
                      value={nuevaNota.texto}
                      onChange={(e) =>
                        setNuevaNota({
                          ...nuevaNota,
                          texto: e.target.value,
                        })
                      }
                      required
                    />
                    <div
                      className="grupo-botones"
                      style={{ marginTop: '1rem' }}
                    >
                      <button type="submit" className="btn-guardar">
                        {editandoNota ? 'Actualizar Nota' : 'Guardar Nota'}
                      </button>
                      {editandoNota && (
                        <button
                          type="button"
                          className="btn-cancelar"
                          onClick={() => {
                            setEditandoNota(false);
                            setNuevaNota({ id: null, capitulo: '', texto: '' });
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibritoModal;

