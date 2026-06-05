(function(){
  'use strict';

  function normalizeCategory(cat){
    if(!cat) return '';
    return String(cat).toLowerCase().trim();
  }

  function getEl(id){ return document.getElementById(id); }

  function formatPrice(num){
    const n = Number(num);
    if(!isFinite(n)) return '$0';
    return '$' + n.toLocaleString('es-ES');
  }

  async function fetchCourses(){
    const res = await fetch('/backend/api/cursos-get.php', { credentials: 'include' });
    const data = await res.json();
    if(!data || data.success === false) {
      throw new Error(data?.message || 'Error al obtener cursos');
    }
    return Array.isArray(data.data) ? data.data : [];
  }

  function isCourseCategory(course){
    const cat = normalizeCategory(course?.category);
    // DB parece guardar 'cursos' o 'curso'
    return cat === 'cursos' || cat === 'curso';
  }

  function fillSelectWithCourses(sel, courses){
    if(!sel) return;

    sel.innerHTML = '<option value="">Selecciona un curso</option>';

    courses.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.dataset.price = Number(c.price) || 0;
      opt.textContent = `${c.title || ''} (${formatPrice(c.price)})`;
      sel.appendChild(opt);
    });
  }

  async function init(){
    const contentCourseSelect = getEl('content-course-select');
    const contentFilterSelect = getEl('content-filter-select');

    if(!contentCourseSelect && !contentFilterSelect) return;

    let courses;
    try{
      courses = await fetchCourses();
    }catch(e){
      console.error(e);
      if(contentCourseSelect) contentCourseSelect.innerHTML = '<option value="">Error cargando cursos</option>';
      if(contentFilterSelect) contentFilterSelect.innerHTML = '<option value="">Error cargando cursos</option>';
      return;
    }

    const onlyCourses = courses.filter(isCourseCategory);

    // Llenar selector de "Agregar Contenido" (solo cursos)
    fillSelectWithCourses(contentCourseSelect, onlyCourses);

    // Llenar selector de filtro/lista de contenido (si existe)
    if(contentFilterSelect){
      fillSelectWithCourses(contentFilterSelect, onlyCourses);
      // Si existe lógica de filtro en otro JS, no la rompemos.
      // Este select se usa típicamente para mostrar el contenido del curso.
      // Aquí solo garantizamos que tenga SOLO cursos.
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

