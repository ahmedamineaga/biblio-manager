
// declarations initiales si local storage est vide
const initialBooksData = [
    { id: 1, title: "La Boite a merveilles", author: "Ahmed Sefrioui", category: "Roman", status: "Dispo", price: 50 },
    { id: 2, title: "Le Dernier Jour d’un Condamné", author: "Victor Hugo", category: "Roman", status: "Emprunté", price: 40 }
];

// recuperer les donnees Livres
function getBooks() {
    const data = localStorage.getItem('books');
    return data ? JSON.parse(data) : initialBooksData;
}

// sauvegarder les donnees Livres
function saveBooks(books) {
    localStorage.setItem('books', JSON.stringify(books));
}


/* ---------------------------------------------------------
    (Auth, Navigation, CRUD)
--------------------------------------------------------- */

// Fonction pour afficher l'application (globale)
function showApp(userType) {
    // Ensure login/register hidden and app visible
    const loginSec = document.getElementById('login-section');
    if (loginSec) {
        loginSec.classList.remove('active');
        loginSec.classList.add('hidden');
    }
    const regSec = document.getElementById('register-section');
    if (regSec) regSec.classList.add('hidden');
    const app = document.getElementById('app-container');
    if (app) app.classList.remove('hidden');

   }

    const preferAdmin = (userType === 'admin');
    const hasDashboard = !!document.getElementById('dashboard');
    const hasUserBooks = !!document.getElementById('user-books');

    if (preferAdmin && hasDashboard) {
        window.changeSection('dashboard');
    } else if (hasUserBooks) {
        window.changeSection('user-books');
        // update user-related UI
        if (typeof updateCartCount === 'function') updateCartCount();
    } else {
        // fallback: show first content-section present
        const first = document.querySelector('.content-section');
        if (first && first.id) window.changeSection(first.id);
    }

    // Update user display 
    try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            const user = JSON.parse(userRaw);
            const ud = document.getElementById('user-display');
            if (ud && user && user.name) ud.textContent = user.name;
        }
    } catch (err) {
        console.warn('showApp: could not set user display', err);
    }
}

// verification authentification
document.addEventListener('DOMContentLoaded', () => {
    // ensure alert is present 
    const user = localStorage.getItem('user');
    const lang = localStorage.getItem('lang') || 'fr';
    
    const langSel = document.getElementById('language-selector');
    if (langSel) {
        langSel.value = lang;
        if (typeof window.applyLanguage === 'function') {
            window.applyLanguage(lang);
        }
    }

    if (user) {
        let userObj = null;
        try {
            userObj = JSON.parse(user);
        } catch (err) {
          
            if (user === 'admin') {
                userObj = { type: 'admin', name: 'Admin' };
                localStorage.setItem('user', JSON.stringify(userObj));
            } else {
                console.warn('Invalid user in localStorage, clearing it.');
                localStorage.removeItem('user');
            }
        }
        if (userObj) {
            // If this page doesn't contain admin sections, avoid trying to show admin view
            let effectiveType = userObj.type;
            if (effectiveType === 'admin' && !document.getElementById('dashboard')) {
                // current page is user-only, downgrade to 'user' to avoid errors
                effectiveType = 'user';
            }
            try {
                showApp(effectiveType);
            } catch (err) {
                console.error('Error showing app:', err);
                localStorage.removeItem('user');
            }
        }
    }

    // If redirected after login, show welcome message
    try {
        const welcomeRaw = localStorage.getItem('welcomeMessage');
        if (welcomeRaw) {
            const wm = JSON.parse(welcomeRaw);
            const lang = localStorage.getItem('lang') || 'fr';
            const title = (window.translations && window.translations[lang] && window.translations[lang].msg_welcome) || 'Bienvenue';
            Swal.fire({ icon: 'success', title: title, text: wm.type === 'admin' ? 'Bienvenue Admin' : `Bienvenue ${wm.name}`, timer: 1400, showConfirmButton: false });
            localStorage.removeItem('welcomeMessage');
        }
    } catch (e) { /* ignore */ }
});

// login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const lang = localStorage.getItem('lang') || 'fr';

    if (email === "admin@app.com" && pass === "admin123") {
        localStorage.setItem('user', JSON.stringify({ type: 'admin', name: 'Admin' }));
        showApp('admin');
        Swal.fire({ icon: 'success', title: window.translations[lang].msg_welcome, timer: 1500, showConfirmButton: false });
    } else {
        const members = window.getMembers ? window.getMembers() : [];
        const user = members.find(m => m.email === email && m.password === pass);
        if (user) {
            localStorage.setItem('user', JSON.stringify({ type: 'user', ...user }));
            showApp('user');
            Swal.fire({ icon: 'success', title: `Bienvenue ${user.name}`, timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'error', title: 'Erreur', text: window.translations[lang].msg_invalid_credentials });
        }
    }
});

// Register
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const password = document.getElementById('reg-password').value;

        let members = window.getMembers ? window.getMembers() : [];
        const existing = members.find(m => m.email === email);
        if (existing) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Email déjà utilisé' });
            return;
        }

        const newMember = {
            id: Date.now(),
            name,
            email,
            phone,
            password,
            registrationDate: new Date().toISOString().slice(0, 10)
        };
        members.push(newMember);
        if (typeof saveMembers === 'function') saveMembers(members);

        Swal.fire({ icon: 'success', title: 'Inscription réussie', text: 'Vous pouvez maintenant vous connecter' });
        showLogin();
    });
}

// Toggle between login and register (if buttons exist)
const showRegisterBtn = document.getElementById('show-register');
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
        const loginSec = document.getElementById('login-section');
        const regSec = document.getElementById('register-section');
        if (loginSec) loginSec.classList.add('hidden');
        if (regSec) regSec.classList.remove('hidden');
    });
}

const showLoginBtn = document.getElementById('show-login');
if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        showLogin();
    });
}

function showLogin() {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('login-section').classList.add('active');
}

// Logout (attach if button exists)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        const lang = localStorage.getItem('lang') || 'fr';
        // flag logout message to show on auth page after redirect
        try { localStorage.setItem('logoutMessage', JSON.stringify({ text: window.translations && window.translations[lang] && window.translations[lang].btn_logout ? 'Déconnecté' : 'Déconnexion réussie' })); } catch (e) { /* ignore */ }
        try { localStorage.removeItem('user'); } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
    });
}


// Changement de langue (only if selector exists)
const languageSelector = document.getElementById('language-selector');
if (languageSelector) {
    languageSelector.addEventListener('change', (e) => {
        if (typeof window.applyLanguage === 'function') {
            window.applyLanguage(e.target.value);
        }
        // persist selection so other modules read the correct lang
        try { localStorage.setItem('lang', e.target.value); } catch (err) { /* ignore */ }
        // Rafraîchir l'affichage de la section active
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) window.changeSection(activeSection.id);
    });
}

/* ---------------------------------------------------------
    4. FONCTIONS GLOBALES (Window) pour les onclick HTML
--------------------------------------------------------- */

// Navigation
window.changeSection = (id) => {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    // Afficher la section cible
    const target = document.getElementById(id);
    if (!target) {
        console.warn('changeSection: target not found', id);
        return;
    }
    target.classList.remove('hidden');
    target.classList.add('active');

    // Mettre à jour le menu actif
    document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
    const activeLi = document.querySelector(`#sidebar li[onclick="changeSection('${id}')"]`);
    if(activeLi) activeLi.classList.add('active');

    // Appel conditionnel des fonctions externes
    if (id === 'books') renderBookTable();
    if (id === 'members' && typeof window.renderMemberTable === 'function') window.renderMemberTable(); 
    if (id === 'dashboard') renderDashboard();
    if (id === 'user-books') renderUserBooks();
    if (id === 'cart') renderCart();
};

// Modals
window.openModal = (id) => {
    document.getElementById(id).classList.remove('hidden');
    
    // Réinitialiser le formulaire spécifique
    if (id === 'book-modal') {
        document.getElementById('book-form').reset();
        document.getElementById('book-id').value = '';
    } else if (id === 'member-modal') {
        document.getElementById('member-form').reset();
        document.getElementById('member-id').value = '';
    }
};

window.closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
};


/* ---------------------------------------------------------
    4.1. CRUD LIVRES
--------------------------------------------------------- */

// CRUD : Rendu du tableau
function renderBookTable(filter = '') {
    const books = getBooks();
    const tbody = document.getElementById('books-table-body');
    tbody.innerHTML = '';
    
    const searchTerm = filter.toLowerCase();
    const filteredBooks = books.filter(book => {
        const title = book.title.toLowerCase();
        const author = book.author.toLowerCase();
        return title.includes(searchTerm) || author.includes(searchTerm);
    });

    filteredBooks.forEach(book => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.status}</td>
            <td>
                <button class="btn-primary" onclick="editBook(${book.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-red" onclick="deleteBook(${book.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Ajouter l'écouteur d'événement pour la recherche de livres
document.getElementById('search-book').addEventListener('input', (e) => {
    renderBookTable(e.target.value);
});


// CRUD : Ajouter / Modifier
document.getElementById('book-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let books = getBooks();
    const id = document.getElementById('book-id').value;
    const lang = localStorage.getItem('lang') || 'fr';
    
    const newBook = {
        id: id ? parseInt(id) : Date.now(),
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        category: document.getElementById('book-category').value,
        price: parseFloat(document.getElementById('book-price').value),
        // Conserver le statut existant si édition, sinon "Dispo"
        status: id ? books.find(b => b.id == id)?.status : "Dispo"
    };

    if (id) {
        // Update (.map)
        books = books.map(b => b.id == id ? newBook : b);
    } else {
        // Create (.push)
        books.push(newBook);
    }

    saveBooks(books);
    window.closeModal('book-modal');
    renderBookTable();
    renderDashboard(); // Mise à jour du dashboard
    Swal.fire({ icon: 'success', title: window.translations[lang].msg_saved, timer: 1000, showConfirmButton: false });
});

// CRUD : Éditer
window.editBook = (id) => {
    const books = getBooks();
    const book = books.find(b => b.id === id); 
    if (book) {
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-category').value = book.category;
        document.getElementById('book-price').value = book.price;
        window.openModal('book-modal');
    }
};

// CRUD : Supprimer
window.deleteBook = (id) => {
    const lang = localStorage.getItem('lang') || 'fr';
    Swal.fire({
        title: window.translations[lang].msg_confirm,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: window.translations[lang].btn_cancel || 'Annuler',
        confirmButtonText: window.translations[lang].btn_confirm_delete || 'Oui, supprimer'
    }).then((result) => {
        if (result.isConfirmed) {
            let books = getBooks();
            books = books.filter(b => b.id !== id); 
            saveBooks(books);
            renderBookTable();
            renderDashboard(); // Mise à jour du dashboard
            Swal.fire(window.translations[lang].msg_deleted, '', 'success');
        }
    });
};


/* ---------------------------------------------------------
    5. DASHBOARD (Chart.js)
--------------------------------------------------------- */
let myChart = null;

function renderDashboard() {
    const books = getBooks();
    // Utiliser window.getMembers uniquement s'il est défini par adherants.js
    const members = (typeof window.getMembers === 'function') ? window.getMembers() : [];
    
    // KPIs
    document.getElementById('kpi-books').textContent = books.length;
    document.getElementById('kpi-members').textContent = members.length;
    const loanedBooks = books.filter(b => b.status === "Emprunté").length;
    document.getElementById('kpi-loans').textContent = loanedBooks;

    // Préparation données graphiques (.reduce)
    const stats = books.reduce((acc, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
    }, {});

    // Chart.js
    const ctx = document.getElementById('chart-pie').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }
    
    const lang = localStorage.getItem('lang') || 'fr';
    const categoriesLabels = Object.keys(stats).map(key => {
        const translationKey = `cat_${key.toLowerCase()}`;
        if (typeof window.translations !== 'undefined' && window.translations[lang] && window.translations[lang][translationKey]) {
            return window.translations[lang][translationKey];
        }
        return key;
    });


    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoriesLabels,
            datasets: [{
                data: Object.values(stats),
                backgroundColor: ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    // Utilisation de la clé de traduction title_books
                    text: (typeof window.translations !== 'undefined' && window.translations[lang] && window.translations[lang].title_books) 
                        ? window.translations[lang].title_books 
                        : 'Répartition des Livres par Catégorie'
                }
            }
        }
    });
}
