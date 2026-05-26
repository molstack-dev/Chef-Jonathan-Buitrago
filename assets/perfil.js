// Profile page functionality - Delete account modal
document.addEventListener('DOMContentLoaded', function() {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmEmailInput = document.getElementById('confirm-email-input');

    let userEmail = '';

    async function obtenerEmailDelUsuario() {
        try {
            const response = await fetch('../../backend/api/users.php?action=get_current_user');
            if (!response.ok) throw new Error('Error al obtener usuario');

            const data = await response.json();
            if (data.email) {
                userEmail = data.email.trim();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al obtener email del servidor:', error);
            return false;
        }
    }

    obtenerEmailDelUsuario();

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function() {
            if (!userEmail) {
                const success = await obtenerEmailDelUsuario();
                if (!success) {
                    showAlert('No se pudo obtener el email del usuario. Intenta de nuevo.', 'error');
                    return;
                }
            }
            deleteConfirmationModal.classList.remove('hidden');
            confirmEmailInput.value = '';
            confirmEmailInput.placeholder = `Escribe: ${userEmail}`;
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
            const storedEmail = userEmail.toLowerCase();
            confirmDeleteBtn.disabled = (inputValue !== storedEmail);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            const inputValue = confirmEmailInput.value.trim().toLowerCase();
            const storedEmail = userEmail.toLowerCase();

            if (inputValue !== storedEmail) {
                showAlert('El email no coincide. Por favor ingresa: ' + userEmail, 'error');
                return;
            }

            if (!confirm('¿Estás completamente seguro de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
                return;
            }

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Eliminando...';

            try {
                const response = await fetch('../../backend/api/users.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete_account',
                        email: userEmail
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

    // Profile form handlers
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileForm = document.getElementById('profile-form');
    const profileInputs = profileForm ? profileForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]') : [];

    if (editProfileBtn && profileForm) {
        editProfileBtn.addEventListener('click', function() {
            profileInputs.forEach(input => input.disabled = false);
            document.getElementById('profile-actions').classList.remove('hidden');
            editProfileBtn.classList.add('hidden');
        });
    }

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn && profileForm) {
        cancelEditBtn.addEventListener('click', function() {
            profileInputs.forEach(input => input.disabled = true);
            document.getElementById('profile-actions').classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            profileForm.reset();
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('profile-name')?.value.trim();
            const email = document.getElementById('profile-email')?.value.trim();

            if (!name || !email) {
                showAlert('Nombre y email son requeridos', 'error');
                return;
            }

            try {
                const response = await fetch('../../backend/api/profile-update.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Perfil actualizado exitosamente', 'success');
                    profileInputs.forEach(input => input.disabled = true);
                    document.getElementById('profile-actions').classList.add('hidden');
                    editProfileBtn.classList.remove('hidden');
                } else {
                    showAlert(data.message || 'Error al actualizar perfil', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }

    // Password change form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password')?.value;
            const newPassword = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showAlert('Todos los campos son requeridos', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showAlert('Las contraseñas nuevas no coinciden', 'error');
                return;
            }

            try {
                const response = await fetch('../../backend/api/password-change.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Contraseña actualizada exitosamente', 'success');
                    passwordForm.reset();
                } else {
                    showAlert(data.message || 'Error al cambiar contraseña', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }
});
