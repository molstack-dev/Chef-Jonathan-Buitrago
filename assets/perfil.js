// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
    let currentUserData = {};

    // ===== Cargar datos del usuario =====
    async function loadUserData() {

        try {
            const response = await fetch('../../backend/api/users.php?action=get_current_user', { credentials: 'include' });
            if (!response.ok) throw new Error('Error al obtener usuario');

            const data = await response.json();
            currentUserData = data;

            // Llenar datos personales
            document.getElementById('profile-name').value = data.name || '';
            document.getElementById('profile-email').value = data.email || '';

            // Llenar preferencias de notificación
            document.getElementById('notify-email-checkbox').checked = data.notify_email !== false;
            document.getElementById('notify-whatsapp-checkbox').checked = data.notify_whatsapp === true;

            return data;
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            showAlert('Error al cargar datos del usuario', 'error');
            return null;
        }
    }

    loadUserData();

    // ===== Editar Nombre y Email (Información Personal) =====
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');

    if (editProfileBtn && profileNameInput && profileEmailInput) {
        // Inicialmente readonly
        profileNameInput.readOnly = true;
        profileEmailInput.readOnly = true;

        editProfileBtn.addEventListener('click', async function() {
            // Si ya está habilitado, no hacemos nada (el guardado se hace desde profile-update.php cuando se confirma)
            // Habilitar inputs
            profileNameInput.readOnly = false;
            profileEmailInput.readOnly = false;

            // Crear botones si no existen
            let actions = document.getElementById('profile-actions');
            if (!actions) {
                actions = document.createElement('div');
                actions.id = 'profile-actions';
                actions.className = 'flex justify-end gap-3 mt-4';
                const container = document.querySelector('.product-card.mb-8');
                // Inserción robusta: al final del bloque de Información Personal
                if (container) container.appendChild(actions);
                else document.body.appendChild(actions);
            }

            actions.innerHTML = `
                <button type="button" id="cancel-profile-edit" class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" id="save-profile-edit" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Guardar</button>
            `;

            const cancelBtn = document.getElementById('cancel-profile-edit');
            const saveBtn = document.getElementById('save-profile-edit');

            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    profileNameInput.readOnly = true;
                    profileEmailInput.readOnly = true;
                    actions.remove();
                });
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', async function() {
                    const name = profileNameInput.value.trim();
                    const email = profileEmailInput.value.trim();

                    if (!name || !email) {
                        showAlert('Nombre y email son requeridos', 'error');
                        return;
                    }

                    try {
                        const response = await fetch('../../backend/api/profile-update.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ name, email })
                        });

                        const data = await response.json();
                        if (data.success) {
                            showAlert('Perfil actualizado exitosamente', 'success');
                            profileNameInput.readOnly = true;
                            profileEmailInput.readOnly = true;
                            actions.remove();

                            // refrescar valores locales
                            currentUserData = { ...currentUserData, name, email };
                        } else {
                            showAlert(data.message || 'Error al actualizar perfil', 'error');
                        }
                    } catch (err) {
                        console.error(err);
                        showAlert('Error de conexión con el servidor', 'error');
                    }
                });
            }
        });
    }

    // ===== Cambiar Contraseña =====
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value.trim();
            const newPassword = document.getElementById('new-password').value.trim();
            const confirmNewPassword = document.getElementById('confirm-new-password').value.trim();

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showAlert('Todos los campos son requeridos', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showAlert('Las contraseñas nuevas no coinciden', 'error');
                return;
            }

            if (newPassword === currentPassword) {
                showAlert('La nueva contraseña debe ser diferente a la actual', 'error');
                return;
            }

            try {
                const response = await fetch('../../backend/api/password-change.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Contraseña actualizada exitosamente', 'success');
                    changePasswordForm.reset();
                } else {
                    showAlert(data.message || 'Error al cambiar contraseña', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }

    // ===== Cambiar Pregunta de Seguridad =====
    const changeSecurityForm = document.getElementById('change-security-form');
    if (changeSecurityForm) {
        changeSecurityForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const verifyPassword = document.getElementById('security-verify-password').value.trim();
            const newQuestion = document.getElementById('new-security-question').value.trim();
            const newAnswer = document.getElementById('new-security-answer').value.trim();

            if (!verifyPassword || !newQuestion || !newAnswer) {
                showAlert('Todos los campos son requeridos', 'error');
                return;
            }

            try {
                const response = await fetch('../../backend/api/update-security.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        password: verifyPassword,
                        security_question: newQuestion,
                        security_answer: newAnswer
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Pregunta de seguridad actualizada exitosamente', 'success');
                    changeSecurityForm.reset();
                } else {
                    showAlert(data.message || 'Error al cambiar pregunta de seguridad', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }

    // ===== Guardar Preferencias de Notificación =====
    const notificationsForm = document.getElementById('notifications-form');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const notify_email = document.getElementById('notify-email-checkbox').checked;
            const notify_whatsapp = document.getElementById('notify-whatsapp-checkbox').checked;

            try {
                const response = await fetch('../../backend/api/update-notifications.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        notify_email,
                        notify_whatsapp
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Preferencias de notificación guardadas exitosamente', 'success');
                } else {
                    showAlert(data.message || 'Error al guardar preferencias', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }

    // ===== Eliminar Cuenta =====
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmEmailInput = document.getElementById('confirm-email-input');

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function() {
            if (!currentUserData.email) {
                const userData = await loadUserData();
                if (!userData) {
                    showAlert('No se pudo obtener el email del usuario', 'error');
                    return;
                }
            }

            deleteConfirmationModal.classList.remove('hidden');
            confirmEmailInput.value = '';
            confirmEmailInput.placeholder = `Escribe: ${currentUserData.email}`;
            confirmDeleteBtn.disabled = true;
            confirmEmailInput.focus();
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmationModal.classList.add('hidden');
        });
    }

    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', function() {
            const inputValue = this.value.trim().toLowerCase();
            const storedEmail = (currentUserData.email || '').toLowerCase();
            confirmDeleteBtn.disabled = (inputValue !== storedEmail);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            const inputValue = confirmEmailInput.value.trim().toLowerCase();
            const storedEmail = (currentUserData.email || '').toLowerCase();

            if (inputValue !== storedEmail) {
                showAlert('El email no coincide. Por favor ingresa: ' + currentUserData.email, 'error');
                return;
            }

            if (!confirm('¿Estás completamente seguro de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
                return;
            }

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Eliminando...';

            try {
                const response = await fetch('../../backend/api/usuarios.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        action: 'delete_account'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Tu cuenta ha sido eliminada exitosamente.', 'success');
                    setTimeout(() => {
                        window.location.href = '../../index.html';
                    }, 2000);
                } else {
                    showAlert(data.message || 'No se pudo eliminar la cuenta', 'error');
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = 'Eliminar Permanentemente';
                }
            } catch (error) {
                console.error('Error al eliminar cuenta:', error);
                showAlert('Error al procesar la solicitud. Intenta de nuevo.', 'error');
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Eliminar Permanentemente';
            }
        });
    }

    if (deleteConfirmationModal) {
        deleteConfirmationModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }
});