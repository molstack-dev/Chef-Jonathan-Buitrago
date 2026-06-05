<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="content-language" content="es">
    <meta name="robots" content="noindex, nofollow">
    <title>Reproductor Seguro - Chef Jonathan Buitrago</title>
    <style>
        :root {
            --bg-primary: #0f0f0f;
            --bg-secondary: #1a1a1a;
            --bg-card: #252525;
            --text-primary: #ffffff;
            --text-secondary: #a1a1a1;
            --accent: #d4af37;
            --accent-hover: #f5c842;
            --error-bg: #450a0a;
            --error-text: #fca5a5;
            --error-border: #7f1d1d;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        .hidden { display: none !important; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .player-container {
            width: 100%;
            max-width: 1000px;
            padding: 20px;
        }

        .video-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: var(--bg-secondary);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .video-wrapper iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .video-info {
            padding: 20px;
            background: var(--bg-secondary);
            border-radius: 0 0 12px 12px;
        }

        .video-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        .video-meta {
            font-size: 0.875rem;
            color: var(--text-secondary);
            display: flex;
            gap: 16px;
        }

        .video-meta svg {
            width: 16px;
            height: 16px;
            vertical-align: middle;
            margin-right: 4px;
        }

        /* Error State */
        .error-card {
            background: var(--error-bg);
            border: 1px solid var(--error-border);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            margin: 40px auto;
        }

        .error-card svg {
            width: 64px;
            height: 64px;
            color: var(--error-text);
            margin-bottom: 20px;
        }

        .error-card h2 {
            font-size: 1.5rem;
            color: var(--error-text);
            margin-bottom: 12px;
        }

        .error-card p {
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .error-card .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: var(--accent);
            color: #000;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            transition: background 0.2s;
        }

        .error-card .btn:hover {
            background: var(--accent-hover);
        }

        .error-card .error-code {
            font-family: monospace;
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 16px;
        }

        /* Loading */
        .loading {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--bg-card);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading p {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        /* Token info bar */
        .token-info {
            background: var(--bg-card);
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-family: monospace;
        }

        .token-info span {
            color: var(--accent);
        }

        .hidden {
            display: none !important;
        }

        .completion-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.72);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 50;
        }

        .completion-dialog {
            width: 100%;
            max-width: 520px;
            background: #121212;
            border: 1px solid rgba(212, 175, 55, 0.18);
            border-radius: 20px;
            box-shadow: 0 24px 58px rgba(0, 0, 0, 0.45);
            padding: 28px;
            color: var(--text-primary);
            animation: appearModal 260ms ease-out;
        }

        .completion-title {
            margin-bottom: 14px;
            font-size: 1.55rem;
            color: #f8f8f8;
        }

        .completion-text {
            margin-bottom: 24px;
            line-height: 1.6;
            color: #c9c9c9;
            font-size: 0.98rem;
        }

        .completion-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .completion-actions button {
            border: none;
            border-radius: 12px;
            padding: 12px 18px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: transform 0.18s ease, background 0.18s ease;
        }

        .completion-actions button:hover {
            transform: translateY(-1px);
        }

        .btn-primary {
            background: var(--accent);
            color: #111;
            font-weight: 700;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: #f3f4f6;
        }

        @keyframes appearModal {
            from {
                opacity: 0;
                transform: translateY(18px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Context menu disabled */
        .no-context {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
    </style>
</head>
<body class="no-context">
    <div id="app" class="player-container">
        <div class="loading">
            <div class="spinner"></div>
            <p>Verificando acceso seguro...</p>
        </div>
    </div>

    <script>
    const APP = {
        // === CONFIGURACIÓN ===
        apiEndpoint: '/backend/api/signed-token.php',

        // === ESTADOS ===
        state: {
            courseId: null,
            contentId: null,
            data: null,
            error: null,
            statusCode: null
        },

        // === INIT ===
        init() {
            const params = new URLSearchParams(window.location.search);
            this.state.courseId = params.get('course_id');
            this.state.contentId = params.get('content_id');

            if (!this.state.courseId && !this.state.contentId) {
                this.showError('ID de contenido no proporcionado', 400);
                return;
            }

            this.fetchSecureVideo();
        },

        // === FETCH CON TOKEN ===
        async fetchSecureVideo() {
            try {
                const params = {};
                if (this.state.courseId) params.course_id = this.state.courseId;
                if (this.state.contentId) params.content_id = this.state.contentId;

                const response = await fetch(this.apiEndpoint + '?' + new URLSearchParams(params));
                const result = await response.json();

                this.state.statusCode = response.status;

                if (result.success) {
                    this.state.data = result.data;
                    this.renderVideo();
                } else {
                    this.showError(result.error || 'Acceso denegado', response.status);
                }
            } catch (err) {
                this.showError('Error de conexión con el servidor', 503);
            }
        },

        // === RENDER VIDEO ===
        renderVideo() {
            const data = this.state.data;
            const videoId = data.video_id;

            let iframeSrc;
            if (videoId) {
                // YouTube unlisted video
                iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
            } else {
                iframeSrc = data.video_url;
            }

            const html = `
                <div class="video-wrapper">
                    <iframe
                        id="lesson-player"
                        src="${iframeSrc}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowfullscreen
                        referrerpolicy="strict-origin-when-cross-origin"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                        loading="lazy"
                    ></iframe>
                </div>
                <div class="video-info">
                    <h1 class="video-title">${this.escapeHtml(data.title)}</h1>
                    <div class="video-meta">
                        ${data.duration ? `
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                                ${data.duration}
                            </span>
                        ` : ''}
                        ${data.course_title ? `
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                                </svg>
                                ${this.escapeHtml(data.course_title)}
                            </span>
                        ` : ''}
                    </div>
                    <div class="token-info">
                        🔒 Acceso seguro: expira al terminar el video
                    </div>
                </div>
                <div id="completion-modal" class="hidden completion-overlay">
                    <div class="completion-dialog">
                        <h2 class="completion-title">Lección completada</h2>
                        <p id="completion-modal-message" class="completion-text"></p>
                        <div class="completion-actions">
                            <button id="completion-yes-btn" class="btn-primary">Sí, continuar</button>
                            <button id="completion-no-btn" class="btn-secondary">No, volver a mis cursos</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = html;
            this.setupCompletionModal();
            this.loadYouTubeApi();
        },

        // === CREAR YT PLAYER ===
        loadYouTubeApi() {
            if (!this.state.data || !this.state.data.video_id) {
                return;
            }

            if (window.YT && window.YT.Player) {
                this.createPlayer();
                return;
            }

            window.onYouTubeIframeAPIReady = () => {
                this.createPlayer();
            };

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        },

        createPlayer() {
            if (!this.state.data || !this.state.data.video_id) {
                return;
            }

            if (this.player) {
                return;
            }

            this.player = new YT.Player('lesson-player', {
                events: {
                    onStateChange: (event) => this.onPlayerStateChange(event)
                }
            });
        },

        async onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.ENDED) {
                await this.markLessonCompleted();
                this.showCompletionPrompt();
            }
        },

        async markLessonCompleted() {
            if (this.state.completedMarked || !this.state.contentId || !this.state.courseId) {
                return;
            }

            this.state.completedMarked = true;
            try {
                const response = await fetch('/backend/api/content-progress.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        course_id: this.state.courseId,
                        content_id: this.state.contentId
                    })
                });
                const result = await response.json();
                if (result.success && window.opener && window.opener.location.origin === window.location.origin) {
                    window.opener.postMessage({
                        type: 'lesson-completed',
                        courseId: this.state.courseId,
                        contentId: this.state.contentId,
                        progressPercent: result.progress_percent
                    }, window.location.origin);
                }
            } catch (err) {
                // No bloquear la experiencia si la actualización de progreso falla
            }
        },

        setupCompletionModal() {
            const yesBtn = document.getElementById('completion-yes-btn');
            const noBtn = document.getElementById('completion-no-btn');
            const modal = document.getElementById('completion-modal');

            if (yesBtn) {
                yesBtn.addEventListener('click', () => {
                    const nextId = this.state.data.next_content_id;
                    if (nextId) {
                        window.location.href = `/reproductor.php?content_id=${nextId}&course_id=${encodeURIComponent(this.state.courseId)}`;
                    } else {
                        window.close();
                        setTimeout(() => {
                            if (!window.closed) {
                                modal.classList.add('hidden');
                            }
                        }, 300);
                    }
                });
            }

            if (noBtn) {
                noBtn.addEventListener('click', () => {
                    window.close();
                    setTimeout(() => {
                        if (!window.closed) {
                            modal.classList.add('hidden');
                        }
                    }, 300);
                });
            }
        },

        showCompletionPrompt() {
            const modal = document.getElementById('completion-modal');
            const messageEl = document.getElementById('completion-modal-message');
            const yesBtn = document.getElementById('completion-yes-btn');
            const noBtn = document.getElementById('completion-no-btn');
            const nextId = this.state.data.next_content_id;

            if (!modal || !messageEl || !yesBtn) {
                return;
            }

            if (nextId) {
                messageEl.textContent = `La lección terminó. ¿Deseas continuar con la siguiente lección: "${this.escapeHtml(this.state.data.next_content_title || 'Siguiente lección')}"?`;
                yesBtn.textContent = 'Sí, continuar';
                if (noBtn) {
                    noBtn.textContent = 'No, cerrar reproductor';
                    noBtn.classList.remove('hidden');
                }
            } else {
                messageEl.textContent = 'Has terminado el curso. Puedes cerrar esta ventana cuando quieras.';
                yesBtn.textContent = 'Cerrar reproductor';
                if (noBtn) {
                    noBtn.classList.add('hidden');
                }
            }

            modal.classList.remove('hidden');
        },

        // === RENDER ERROR ===
        showError(message, statusCode) {
            const errors = {
                401: { title: 'Inicia Sesión', desc: 'Debes iniciar sesión para ver este contenido.' },
                403: { title: 'Sin Autorización', desc: 'No tienes permiso para ver este video. Asegúrate de tener una suscripción activa.' },
                404: { title: 'Contenido No Encontrado', desc: 'El video solicitado no existe o ha sido eliminado.' },
                503: { title: 'Sin Conexión', desc: 'No se pudo conectar con el servidor. Intenta de nuevo más tarde.' }
            };

            const info = errors[statusCode] || { title: 'Error', desc: message };

            const html = `
                <div class="error-card">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4m0 4h.01"/>
                    </svg>
                    <h2>${info.title}</h2>
                    <p>${info.desc}</p>
                    ${statusCode === 401 ? `
                        <a href="/views/user/user.html" class="btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-5L5 5m7 0L5 5"/>
                            </svg>
                            Iniciar Sesión
                        </a>
                    ` : `
                        <a href="/views/user/mis-cursos.html" class="btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            Volver a Mis Cursos
                        </a>
                    `}
                    <div class="error-code">Código: ${statusCode}</div>
                </div>
            `;

            document.getElementById('app').innerHTML = html;
        },

        // === HELPERS ===
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Iniciar cuando carga el DOM
    document.addEventListener('DOMContentLoaded', () => APP.init());
    </script>
</body>
</html>
