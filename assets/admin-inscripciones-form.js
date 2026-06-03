// Conecta el formulario de admin-inscripciones con el backend PHP (local)
(function(){
  function getEl(id){ return document.getElementById(id); }

  async function fetchJSON(url, opts){
    opts = opts || {};
    if (!opts.credentials) opts.credentials = 'include';
    const res = await fetch(url, opts);
    const data = await res.json();
    return {res, data};
  }

  async function loadUsersSelect(){
    const sel = getEl('inscription-user');
    if(!sel) return;
    // Usamos endpoint existente (PHP) para usuarios: usuarios-get.php
    // Si no existe en tu BD, ajustamos más adelante.
    try{
      const {data} = await fetchJSON('/backend/api/usuarios-get.php');
      // Esperamos {success:true,data:[...]}
      const items = Array.isArray(data?.data) ? data.data : [];
      sel.innerHTML = '<option value="">Seleccionar Usuario</option>';
      items.forEach(u=>{
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name || ''} (${u.email || ''})`;
        sel.appendChild(opt);
      });
    }catch(e){
      // Si falla, dejamos vacío pero no rompemos
      console.error('loadUsersSelect error', e);
    }
  }

  async function loadCoursesSelect(){
    const sel = getEl('inscription-course');
    if(!sel) return;
    try{
      const {data} = await fetchJSON('/backend/api/cursos-get.php');
      const items = Array.isArray(data?.data) ? data.data : [];
      sel.innerHTML = '<option value="">Seleccionar Servicio</option>';
      items.forEach(c=>{
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.dataset.price = Number(c.price) || 0;
        opt.textContent = `${c.title || ''} ($${Number(c.price||0).toLocaleString('es-ES')})`;
        sel.appendChild(opt);
      });
    }catch(e){
      console.error('loadCoursesSelect error', e);
    }
  }

  function setup(){
    const form = getEl('register-inscription-form');
    if(!form) return;

    // Evitar binds duplicados
    if(form._boundInscripciones) return;
    form._boundInscripciones = true;

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();

      const userId = Number(getEl('inscription-user').value);
      const courseId = Number(getEl('inscription-course').value);
      const status = getEl('inscription-status').value || 'pending';
      const coursePrice = Number(getEl('inscription-course').options[getEl('inscription-course').selectedIndex]?.dataset?.price) || 0;

      if(!userId || !courseId){
        showToast('Selecciona usuario y servicio', 'error');
        return;
      }

      try{
        const payload = { user_id: userId, course_id: courseId, payment_status: status, course_price: coursePrice };
        const {data} = await fetchJSON('/backend/api/inscripciones.php', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        });

        if(data?.success){
          showToast('Inscripción registrada', 'success');
          form.reset();
          if(typeof loadInscriptionList === 'function') await loadInscriptionList();
        }else{
          showToast(data?.message || 'No se pudo registrar', 'error');
        }
      }catch(err){
        console.error(err);
        showToast('Error al registrar inscripción', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Carga selects primero
    await loadUsersSelect();
    await loadCoursesSelect();
    // Conecta submit
    setup();
  });
})();

