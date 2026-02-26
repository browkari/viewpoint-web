import React from 'react';

function AuthModal({ esRegistro, setEsRegistro, iniciarSesion, registrarse, setEmail, setPassword }) {
  return (
    <div className="modal-fondo modal-fondo-registro">
      <form
        className="modal-contenido-registro"
        onSubmit={esRegistro ? registrarse : iniciarSesion}
      >
        <img className="modal-fondo-gif" src="iniciarsesion.gif" alt="" />
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
        <button
          type="submit"
          className="btn-abrir-modal btn-abrir-modal-registro"
        >
          {esRegistro ? 'Registrarme' : 'Entrar'}
        </button>
        <p className="texto-login">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <span
            className="link-auth"
            onClick={() => setEsRegistro(!esRegistro)}
          >
            {esRegistro ? ' Inicia sesión' : ' Regístrate aquí'}
          </span>
        </p>
      </form>
    </div>
  );
}

export default AuthModal;

