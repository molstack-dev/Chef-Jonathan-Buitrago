// mis-cursos.js - Carga contenido de cursos para usuarios inscritos

async function loadMyCourses() {
    const container = document.getElementById('enrolled-courses');
    if (!container) return;

    try {
        const response = await fetch('../../backend/api/inscripciones.php');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const paidCourses = result.data.filter(r => r.payment_status === 'paid');

            if (paidCourses.length > 0) {
                container.innerHTML = '';
                for (const reg of paidCourses) {
                    await loadCourseCard(container, {
                        id: reg.course_id,
                        title: reg.course_title
                    }, reg);
                }
            } else {
                container.innerHTML = '<p class="text-gray-400 text-center py-6">No tienes cursos con pago aprobado.</p>';
            }
        } else {
            container.innerHTML = '<p class="text-gray-400 text-center py-6">No tienes cursos inscritos.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-400 text-center py-6">Error al cargar cursos</p>';
    }
}

async function loadCourseCard(container, course, registration) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-gray-800 rounded-xl overflow-hidden mb-6';

    const progressPercent = typeof registration.progress_percent === 'number'
        ? registration.progress_percent
        : registration.status === 'completed'
            ? 100
            : (registration.progress || 25);

    wrapper.innerHTML = `
        <div class="p-6 cursor-pointer hover:bg-gray-750 transition-colors" onclick="toggleCourseLessons(${course.id}, this)">
            <div class="flex items-center justify-between gap-4">
                <div class="flex-1">
                    <h5 class="text-xl font-semibold text-white">${course.title}</h5>
                    <p class="text-gray-400 text-sm mt-1">${registration.course_price ? '$' + Number(registration.course_price).toLocaleString() : ''}</p>
                </div>
                <div class="text-right">
                    <span id="progress-label-${course.id}" class="text-amber-500 font-semibold">${progressPercent}%</span>
                    <div class="w-28 bg-gray-600 rounded-full h-2 mt-1">
                        <div id="progress-bar-${course.id}" class="bg-amber-500 h-2 rounded-full" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <svg id="arrow-${course.id}" class="w-6 h-6 text-gray-400 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>
        <div id="course-lessons-${course.id}" class="hidden px-6 pb-6">
            <div class="space-y-3">
                <p class="text-gray-400 text-center py-4">Cargando contenido...</p>
            </div>
        </div>
    `;
    container.appendChild(wrapper);
}

window.toggleCourseLessons = async function(courseId, headerElement) {
    const contentDiv = document.getElementById('course-lessons-' + courseId);
    const arrow = document.getElementById('arrow-' + courseId);

    // Si ya está visible, ocultar
    if (!contentDiv.classList.contains('hidden')) {
        contentDiv.classList.add('hidden');
        arrow.classList.remove('rotate-180');
        return;
    }

    // Mostrar y cargar contenido
    contentDiv.classList.remove('hidden');
    arrow.classList.add('rotate-180');

    // Si ya tiene contenido cargado, no volver a cargar
    const lessonsContainer = contentDiv.querySelector('.space-y-3');
    if (lessonsContainer.children.length > 0 && lessonsContainer.querySelector('.bg-gray-700')) {
        return;
    }

    await loadCourseLessons(courseId, contentDiv);
}

async function loadCourseLessons(courseId, contentDiv, forceReload = false) {
    const lessonsContainer = contentDiv.querySelector('.space-y-3');
    if (!lessonsContainer) return;

    if (!forceReload && lessonsContainer.children.length > 0 && lessonsContainer.querySelector('.bg-gray-700')) {
        return;
    }

    lessonsContainer.innerHTML = '<p class="text-gray-400 text-center py-4">Cargando contenido...</p>';

    try {
        const response = await fetch('/backend/api/course-content-get.php?course_id=' + courseId);
        const result = await response.json();

        if (result.success && result.content && result.content.length > 0) {
            const total = result.content.length;
            const completedCount = result.content.filter(lesson => lesson.completed).length;
            const progressPercent = result.progress_percent ?? (total ? Math.round((completedCount / total) * 100) : 0);
            updateCourseProgress(courseId, progressPercent);

            lessonsContainer.innerHTML = '';
            result.content.forEach((lesson) => {
                const lessonEl = document.createElement('div');
                lessonEl.className = 'bg-gray-700 p-4 rounded-lg';

                const videoId = extractYouTubeId(lesson.video_url);
                const seenBadge = lesson.completed ? '<span class="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-200 px-2 py-1 text-[11px] font-semibold">✔ Visto</span>' : '';

                lessonEl.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-24 h-16 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                            ${videoId ? `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="Preview" class="w-full h-full object-cover rounded" onerror="this.style.display='none'">` : '<svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C3.156 3.193 3 3.361 3 3.616v17.462c0 3.064 2.933 5.076 6.615 5.076h9.77c3.604 0 11.631-.245 15.23 0 3.897-.228 4.616-3.132 4.616-3.132V3.616c0-.255-.156-.423-.615-.423z"/></svg>'}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <h6 class="text-white font-medium">${lesson.order_index}. ${lesson.title}</h6>
                                ${seenBadge}
                            </div>
                            <p class="text-gray-400 text-sm mt-1">${lesson.description || 'Sin descripción'}</p>
                            ${lesson.duration ? '<span class="text-gray-500 text-xs mt-1 inline-block">⏱ ' + lesson.duration + '</span>' : ''}
                        </div>
                        <button onclick="openSecurePlayer(${lesson.id}, ${courseId}, '${lesson.title.replace(/'/g, "\\'")}')" class="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm">
                            ▶ Ver
                        </button>
                    </div>
                `;
                lessonsContainer.appendChild(lessonEl);
            });
        } else {
            lessonsContainer.innerHTML = '<p class="text-gray-400 text-sm">Este curso aún no tiene lecciones.</p>';
        }
    } catch (error) {
        lessonsContainer.innerHTML = '<p class="text-red-400 text-sm">Error al cargar contenido</p>';
    }
}

async function refreshCourseProgress(courseId) {
    const contentDiv = document.getElementById('course-lessons-' + courseId);
    if (!contentDiv) return;

    const response = await fetch('/backend/api/course-content-get.php?course_id=' + courseId);
    const result = await response.json();
    if (result.success) {
        const progressPercent = result.progress_percent ?? 0;
        updateCourseProgress(courseId, progressPercent);
        if (!contentDiv.classList.contains('hidden')) {
            await loadCourseLessons(courseId, contentDiv, true);
        }
    }
}

function updateCourseProgress(courseId, progressPercent) {
    const label = document.getElementById(`progress-label-${courseId}`);
    const bar = document.getElementById(`progress-bar-${courseId}`);
    if (label) label.textContent = `${progressPercent}%`;
    if (bar) bar.style.width = `${progressPercent}%`;
}

function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function openSecurePlayer(contentId, courseId, title) {
    // Abre el reproductor seguro con token tiempo-limitado
    const playerUrl = `/reproductor.php?content_id=${contentId}&course_id=${courseId}`;
    window.open(playerUrl, '_blank', 'width=1024,height=600,menubar=no,location=no,resizable=yes,scrollbars=no,status=no');
}

function playLesson(videoUrl, title) {
    // Legacy - mantenido por compatibilidad
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
        alert('URL de video no válida');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="w-full max-w-4xl mx-4">
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-white text-lg">${title}</h4>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="aspect-video">
                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" class="w-full h-full rounded" frameborder="0" allowfullscreen allow="autoplay"></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data || {};
    if (data.type === 'lesson-completed' && data.courseId) {
        await refreshCourseProgress(data.courseId);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname;
    if (page.includes('mis-cursos')) {
        loadMyCourses();
    }
});
