// auth.js - login/register page logic

// Helper: safely get members and save
function getMembersSafe() {
    return (typeof window.getMembers === 'function') ? window.getMembers() : [];
}

function saveMembersSafe(members) {
    if (typeof window.saveMembers === 'function') window.saveMembers(members);
}

// Show/hide auth sections
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const loginSection = document.getElementById('auth-login');
const registerSection = document.getElementById('auth-register');

if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => {
    if (loginSection) loginSection.classList.add('hidden');
    if (registerSection) registerSection.classList.remove('hidden');
});

if (showLoginBtn) showLoginBtn.addEventListener('click', () => {
    if (registerSection) registerSection.classList.add('hidden');
    if (loginSection) loginSection.classList.remove('hidden');
});

// Login handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const pass = document.getElementById('password').value;

        const lang = localStorage.getItem('lang') || 'fr';
        if (email === 'admin@app.com' && pass === 'admin123') {
            const userObj = { type: 'admin', name: 'Admin' };
            localStorage.setItem('user', JSON.stringify(userObj));
            // flag welcome to show after redirect
            localStorage.setItem('welcomeMessage', JSON.stringify({ type: 'admin', name: 'Admin' }));
            window.location.href = 'admin.html';
            return;
        }

        const members = getMembersSafe();
        const user = members.find(m => m.email === email && m.password === pass);
        if (user) {
            const userObj = { type: 'user', ...user };
            localStorage.setItem('user', JSON.stringify(userObj));
            // flag welcome to show after redirect
            localStorage.setItem('welcomeMessage', JSON.stringify({ type: 'user', name: user.name }));
            window.location.href = 'user.html';
            return;
        }

        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Email ou mot de passe incorrect' });
    });
}

// Register handler - auto-login to user page after registration
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;

        let members = getMembersSafe();
        if (members.find(m => m.email === email)) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Email déjà utilisé' });
            return;
        }

        const newMember = {
            id: Date.now(),
            name,
            email,
            phone,
            password,
            registrationDate: new Date().toISOString().slice(0,10)
        };

        members.push(newMember);
        saveMembersSafe(members);
        // Auto-login and redirect to user page, show welcome after redirect
        localStorage.setItem('user', JSON.stringify({ type: 'user', ...newMember }));
        localStorage.setItem('welcomeMessage', JSON.stringify({ type: 'user', name: newMember.name }));
        window.location.href = 'user.html';
    });
}

// Show logout or welcome messages if flagged (auth page)
document.addEventListener('DOMContentLoaded', () => {
    // logoutMessage appears when redirected after logout
    try {
        const logoutRaw = localStorage.getItem('logoutMessage');
        if (logoutRaw) {
            const lm = JSON.parse(logoutRaw);
            Swal.fire({ icon: 'success', title: lm.text || 'Déconnexion', timer: 1200, showConfirmButton: false });
            localStorage.removeItem('logoutMessage');
        }
    } catch (e) { /* ignore */ }
});

// If another tab logs in/out, react accordingly: redirect to appropriate page
// no-op
