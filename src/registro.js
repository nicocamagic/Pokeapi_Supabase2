import { supabase } from './supabase.js';
import { mostrarLogin } from './login.js'; // Para volver al login luego del registro

export function mostrarRegistro() {
  document.getElementById('app').innerHTML = `
    <section>
      <h2>Registro</h2>
      <form id="registro-form">
        <input type="text" name="nombre" placeholder="Nombre" required />
        <input type="email" name="correo" placeholder="Correo" required />
        <input type="password" name="password" placeholder="Contraseña" required />
        <input type="date" name="fechaNacimiento" required />
        <input type="text" name="telefono" placeholder="Teléfono" required />
        <button type="submit">Registrarse</button>
      </form>
      <p id="error" style="color:red;"></p>
      <h2>Ya tengo cuenta y quiero loguearme</h2>
      <button id="ir-login">Login</button>
    </section>
  `;

  // Volver a login
  document.getElementById('ir-login').addEventListener('click', () => {
    mostrarLogin();
  });

  // Manejo del formulario de registro
  document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const nombre = form.nombre.value.trim();
    const correo = form.correo.value.trim();
    const password = form.password.value.trim();
    const fechaNacimiento = form.fechaNacimiento.value;
    const telefono = form.telefono.value.trim();
    const errorElement = document.getElementById('error');

    errorElement.textContent = '';

    try {
      // 1. Crear usuario en Auth
      const { data, error: errorAuth } = await supabase.auth.signUp({
        email: correo,
        password: password,
      });

      if (errorAuth) {
        throw new Error(errorAuth.message);
      }

      const uid = data.user?.id;
      if (!uid) {
        throw new Error("Error obteniendo ID del usuario.");
      }

      // 2. Insertar datos adicionales en tabla
      const { error: errorInsert } = await supabase.from('usuario').insert([
        {
          id: uid,
          nombre,
          correo,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          roll: 'usuario',
        },
      ]);

      if (errorInsert) {
        throw new Error('Usuario creado pero error en base de datos: ' + errorInsert.message);
      }

      // Redirige al login después del registro exitoso
      mostrarLogin();
    } catch (error) {
      errorElement.textContent = error.message;
    }
  });
}
