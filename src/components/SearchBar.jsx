import React from 'react';

function SearchBar({ busqueda, setBusqueda }) {
  return (
    <div className="contenedor-busqueda">
      <input
        type="text"
        className="input-busqueda"
        placeholder="Buscar título..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
    </div>
  );
}

export default SearchBar;

