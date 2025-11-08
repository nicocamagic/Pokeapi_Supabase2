import { supabase } from './supabase.js';
import { mostrarAdministrador } from "./administrador.js";

export async function mostrarDatos() {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Cargando...</p>';

  // Obtener usuario autenticado (forma segura)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    app.innerHTML = '<p>No hay sesión activa</p>';
    return;
  }

  // Intentar obtener el registro en la tabla 'usuario'
  let { data: usuario, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('id', user.id)
    .single();

  // Si no existe, crear automáticamente el registro según tu preferencia (opción C)
  if (error && error.code === 'PGRST116' || !usuario) {
    // Intentamos insertar (si existe ya en la tabla puede fallar, por eso lo envolvemos)
    const nuevo = {
      id: user.id,
      correo: user.email,
      nombre: "",
      roll: "user"
    };

    const { data: inserted, error: insertError } = await supabase
      .from('usuario')
      .insert([nuevo])
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear usuario automáticamente:', insertError);
      app.innerHTML = '<p>Error al obtener o crear el registro del usuario</p>';
      return;
    }

    usuario = inserted;
  }

  if (!usuario) {
    app.innerHTML = '<p>Error al obtener usuario</p>';
    return;
  }

  // Inyectar estilos para galería (si aún no existen)
  if (!document.getElementById('usuario-galeria-styles')) {
    const style = document.createElement('style');
    style.id = 'usuario-galeria-styles';
    style.innerHTML = `
      #galeria {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        align-items: start;
        margin-top: 10px;
      }
      .galeria-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        background: #f8f8f8;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        transition: transform 180ms ease, opacity 180ms ease;
      }
      .galeria-item img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }
      .galeria-meta {
        padding: 8px;
        font-size: 13px;
      }
      .galeria-meta .fecha {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
      }
      .btn-eliminar-imagen {
        display: inline-block;
        padding: 6px 8px;
        font-size: 13px;
        border: none;
        cursor: pointer;
        background: #ff4d4f;
        color: white;
        border-radius: 6px;
      }
      .galeria-item.removing {
        opacity: 0;
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  // Interfaz de usuario
  app.innerHTML = `
    <div>
      <h2>Perfil de Usuario</h2>
      <center>
      <label>Nombre: <input id="nombre" value="${escapeHtml(usuario.nombre ?? '')}" /></label><br/>
      <label>Correo: <input id="correo" value="${escapeHtml(usuario.correo ?? user.email)}" /></label><br/>
      <label>Fecha de nacimiento: <input type="date" id="fechaNacimiento" value="${usuario.fecha_nacimiento ?? ''}" /></label><br/>
      <label>Teléfono: <input id="telefono" value="${escapeHtml(usuario.telefono ?? '')}" /></label><br/>
      <label>Rol: ${escapeHtml(usuario.roll ?? usuario.rol ?? '')}</label><br/>
      <br/>
      <button id="btn-guardar">Guardar cambios</button>

      <br/>
      <br/>

      <hr/>

      <h3>Agregar imagen</h3>
      <input type="text" id="nueva-url" placeholder="URL de la imagen"/>
      <button id="btn-agregar-url">Guardar</button>

      <h3>Imágenes guardadas</h3>
      <div id="galeria"></div>

      <hr/>
      <h2>Quiero cerrar sesión</h2>
      <button id="btn-cerrar-sesion">Cerrar sesión</button>
      ${usuario.roll === "admin" ? `<button class="c-nav-item" id="btn-administrador">Administrador</button>` : ""}

      <br/><br/><br/><br/><br/>

      </center>
    </div>
  `;

  // Función para formatear fecha de created_at (si existe)
  function formatFecha(fechaStr) {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return fechaStr;
    }
  }

  // Cargar imágenes y mostrarlas en grid
  async function cargarImagenes() {
    const { data: imagenes, error: imgError } = await supabase
      .from('multimedia')
      .select('*')
      .eq('usuarioid', user.id)
      .order('created_at', { ascending: false });

    const galeria = document.getElementById('galeria');
    galeria.innerHTML = '';

    if (imgError) {
      console.error('Error al cargar imágenes:', imgError);
      galeria.innerHTML = '<p>Error cargando imágenes</p>';
      return;
    }

    if (!imagenes || imagenes.length === 0) {
      galeria.innerHTML = '<p>No hay imágenes guardadas.</p>';
      return;
    }

    imagenes.forEach(img => {
      const item = document.createElement('div');
      item.className = 'galeria-item';
      item.dataset.id = img.id;

      const fechaTexto = formatFecha(img.created_at);

      item.innerHTML = `
        <img src="${escapeHtml(img.url)}" alt="imagen" loading="lazy" />
        <div class="galeria-meta">
          <span class="fecha">${escapeHtml(fechaTexto)}</span>
          <button class="btn-eliminar-imagen" data-id="${img.id}">Eliminar</button>
        </div>
      `;

      galeria.appendChild(item);

      // Listener para eliminar con animación
      const btn = item.querySelector('.btn-eliminar-imagen');
      btn.addEventListener('click', async () => {
        const idImg = btn.dataset.id;
        // animación
        item.classList.add('removing');

        // esperar la transición (180ms + margen)
        setTimeout(async () => {
          const { error: delError } = await supabase.from('multimedia').delete().eq('id', idImg);
          if (delError) {
            alert('Error al eliminar la imagen');
            console.error(delError);
            // quitar clase removing si falló
            item.classList.remove('removing');
          } else {
            // remover del DOM
            item.remove();
          }
        }, 200);
      });
    });
  }

  // Inicializar galería
  await cargarImagenes();

  // Guardar cambios en perfil
  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const actualizado = {
      nombre: document.getElementById('nombre').value,
      correo: document.getElementById('correo').value,
      fecha_nacimiento: document.getElementById('fechaNacimiento').value || null,
      telefono: document.getElementById('telefono').value,
    };

    const { error: updateError } = await supabase
      .from('usuario')
      .update(actualizado)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error al actualizar usuario:', updateError);
      alert('Error al actualizar');
    } else {
      alert('Datos actualizados');
    }
  });

  // Agregar imagen por URL
  document.getElementById('btn-agregar-url').addEventListener('click', async () => {
    const url = document.getElementById('nueva-url').value.trim();
    if (!url) return alert('Ingresa una URL válida');

    const { error: insertImgError } = await supabase
      .from('multimedia')
      .insert([{ url, usuarioid: user.id }]);

    if (insertImgError) {
      console.error('Error al agregar imagen:', insertImgError);
      alert('Error al agregar imagen');
    } else {
      document.getElementById('nueva-url').value = '';
      cargarImagenes();
    }
  });

  // Cerrar sesión
  document.getElementById('btn-cerrar-sesion').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload(); // recarga la app
  });

  // Botón administrador (solo si existe)
  const btnAdmin = document.getElementById('btn-administrador');
  if (btnAdmin) {
    btnAdmin.addEventListener('click', async () => {
      mostrarAdministrador();
    });
  }

  // --- utilidades ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
