(function() {
    var allCourses = [];

    function getCategoryLabel(cat) {
        var map = { cursos: 'Curso', asesorias: 'Asesoría', eventos: 'Evento', seminarios: 'Seminario', diplomados: 'Diplomado' };
        return map[cat] || cat || 'Curso';
    }

    function getBadgeClass(cat) {
        var map = { cursos: 'bg-purple-600', asesorias: 'bg-amber-600', eventos: 'bg-green-600', seminarios: 'bg-blue-600', diplomados: 'bg-red-600' };
        return map[cat] || 'bg-gray-600';
    }

    function renderCourses(filter) {
        var grid = document.getElementById('courses-grid');
        if (!grid) return;

        var filtered = filter === 'all' ? allCourses : allCourses.filter(function(c) {
            return c.category === filter;
        });

        // Fallback: if DB uses singular form (evento instead of eventos)
        if (filtered.length === 0 && filter !== 'all') {
            var map = { cursos: 'cursos', asesorias: 'asesorias', eventos: 'evento' };
            var dbCat = map[filter] || filter;
            filtered = allCourses.filter(function(c) { return c.category === dbCat; });
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No hay cursos en esta categoría.</div>';
            return;
        }

        grid.innerHTML = '';
        filtered.forEach(function(c) {
            var card = document.createElement('div');
            card.className = 'product-card p-6 rounded-xl bg-gray-800 bg-opacity-90 fade-in flex flex-col h-full';
            card.setAttribute('data-category', c.category || 'cursos');
            card.setAttribute('data-title', c.title || '');
            card.setAttribute('data-detail', (c.description_detail || c.description || ''));
            // Guardar precio numérico puro para evitar problemas de formato
            card.setAttribute('data-price', Number(c.price) || 0);

            var imgHtml = c.image
                ? '<div class="rounded-lg mb-4 overflow-hidden flex items-center justify-center bg-gray-700" style="height: auto;"><img src="' + c.image + '" class="max-h-full max-w-full object-contain rounded-lg" alt="' + c.title + '"></div>'
                : '';

            // Botón de inscripción redirige a registro.html
            var inscriptionBtn = '<a href="registro.html" class="flex-1 text-center py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">Inscribirse</a>';

            card.innerHTML =
                imgHtml +
                '<div class="mb-4">' +
                '<span class="inline-block px-3 py-1 ' + getBadgeClass(c.category) + ' text-white rounded-full text-sm">' + getCategoryLabel(c.category) + '</span>' +
                '</div>' +
                '<h4 class="text-2xl font-semibold mb-3 text-white">' + c.title + '</h4>' +
                '<div class="flex justify-between items-center mb-4">' +
                '<span class="text-amber-500 font-bold">$' + Number(c.price).toLocaleString('es-ES') + '</span>' +
                '<span class="text-gray-400 text-sm">' + (c.duration || '') + '</span>' +
                '</div>' +
                '<div class="mb-4 flex-grow">' +
                '<p class="text-gray-400 text-sm">' + (c.description || '') + '</p>' +
                '</div>' +
                '<div class="flex justify-end space-x-3 mt-auto">' +
                '<button class="ver-detalles-btn flex-1 text-center py-2 purple-border-button rounded-lg font-semibold transition-colors">Ver Detalles</button>' +
                inscriptionBtn +
                '</div>';

            grid.appendChild(card);
        });

        // Delegation de eventos para botón "Ver Detalles"
        grid.addEventListener('click', function(e) {
            if (e.target.classList.contains('ver-detalles-btn')) {
                var card = e.target.closest('.product-card');
                if (card && typeof showCourseDetails === 'function') {
                    showCourseDetails(
                        card.getAttribute('data-title'),
                        card.getAttribute('data-detail')
                    );
                }
            }
        });
    }

    function setupFilters() {
        var btns = document.querySelectorAll('.filter-btn');
        btns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                btns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderCourses(btn.getAttribute('data-filter'));
            });
        });
    }

    async function loadCatalogCourses() {
        var grid = document.getElementById('courses-grid');
        if (!grid) return;

        try {
            var resp = await fetch('/backend/api/cursos-get.php');
            var result = await resp.json();

            if (!result.success || result.data.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No hay cursos disponibles.</div>';
                return;
            }

            allCourses = result.data;
            setupFilters();
            renderCourses('all');
        } catch (e) {
            console.error('Error loading courses:', e);
            grid.innerHTML = '<div class="col-span-full text-center text-red-400 py-8">Error: ' + e.message + '</div>';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCatalogCourses);
    } else {
        loadCatalogCourses();
    }
})();

