import { supabase } from "./supabase.js"; // Asegúrate de tener este archivo configurado con createClient
import { mostrarRegistro } from "./registro.js";

export function mostrarLogin() {
  document.querySelector("#app").innerHTML = `
    <div>
      <h2>Login</h2>
      <form id="login-form">
        <input type="email" id="email" placeholder="Email" required />
        <input type="password" id="password" placeholder="Contraseña" required />
        <button type="submit">Iniciar sesión</button>
      </form>
      </br>
      <h2>No tiene cuenta</h2>
      </br>
      <center>
      <button id="btn-registro">Regístrese</button>
      </center>
    </div>
  `;

  // Manejo del formulario de login
  document.querySelector("#login-form").addEventListener("submit", handleLogin);

  // Navegar al registro
  document.querySelector("#btn-registro").addEventListener("click", mostrarRegistro);
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value.trim();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error("Error al iniciar sesión: " + error.message);
    }

    console.log("Login exitoso", data.user);
    location.reload(); // Recargar la página tras el login exitoso
  } catch (error) {
    alert(error.message);
  }
}
