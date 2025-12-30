// user.js - Logic for user interface: browsing books, cart management

// Get cart from localStorage
function getCart() {
    const data = localStorage.getItem('cart');
    return data ? JSON.parse(data) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Render books for users
function renderUserBooks(filter = '') {
    const books = getBooks();
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';

    const searchTerm = filter.toLowerCase();
    const filteredBooks = books.filter(book => {
        const title = book.title.toLowerCase();
        const author = book.author.toLowerCase();
        return (title.includes(searchTerm) || author.includes(searchTerm)) && book.status === "Dispo";
    });

    filteredBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        const lang = localStorage.getItem('lang') || 'fr';
        const addLabel = (window.translations && window.translations[lang] && window.translations[lang].btn_add_to_cart) || 'Ajouter au panier';
        const borrowLabel = (window.translations && window.translations[lang] && window.translations[lang].btn_borrow) || 'Emprunter';
        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Auteur:</strong> ${book.author}</p>
            <p><strong>Catégorie:</strong> ${book.category}</p>
            <p><strong>Prix:</strong> ${book.price} DH</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
                <button class="btn-primary" onclick="addToCart(${book.id})">${addLabel}</button>
                <button class="btn-secondary" onclick="borrowBook(${book.id})">${borrowLabel}</button>
            </div>
        `;
        grid.appendChild(bookCard);
    });
}

// Add book to cart
window.addToCart = (bookId) => {
    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    let cart = getCart();
    const existing = cart.find(item => item.id === bookId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...book, quantity: 1 });
    }
    saveCart(cart);
    const lang = localStorage.getItem('lang') || 'fr';
    const addedMsg = (window.translations && window.translations[lang] && window.translations[lang].added_to_cart) || 'Ajouté au panier';
    Swal.fire({ icon: 'success', title: addedMsg, timer: 1000 });
    updateCartCount();
};

// Render cart
function renderCart() {
    const cart = getCart();
    const tbody = document.getElementById('cart-table-body');
    tbody.innerHTML = '';

    let total = 0;
    cart.forEach(item => {
        const tr = document.createElement('tr');
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        tr.innerHTML = `
            <td>${item.title}</td>
            <td>${item.author}</td>
            <td>${itemTotal} DH</td>
            <td>
                <button class="btn-secondary" onclick="changeQuantity(${item.id}, -1)">-</button>
                ${item.quantity}
                <button class="btn-secondary" onclick="changeQuantity(${item.id}, 1)">+</button>
                <button class="btn-red" onclick="removeFromCart(${item.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('cart-total').textContent = total;
}

// Change quantity in cart
window.changeQuantity = (bookId, delta) => {
    let cart = getCart();
    const item = cart.find(item => item.id === bookId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== bookId);
        }
        saveCart(cart);
        renderCart();
        updateCartCount();
    }
};

// Remove from cart
window.removeFromCart = (bookId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== bookId);
    saveCart(cart);
    renderCart();
    updateCartCount();
};

// Update cart count in nav
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartNav = document.getElementById('nav-cart');
    if (cartNav) {
        const lang = localStorage.getItem('lang') || 'fr';
        const cartLabel = (window.translations && window.translations[lang] && window.translations[lang].cart_nav) || 'Panier';
        cartNav.innerHTML = `<i class="fa-solid fa-shopping-cart"></i> <span>${cartLabel} (${count})</span>`;
    }
}

// Checkout
if (document.getElementById('checkout-btn')) {
    document.getElementById('checkout-btn').addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) {
        const lang = localStorage.getItem('lang') || 'fr';
        const emptyMsg = (window.translations && window.translations[lang] && window.translations[lang].cart_empty) || 'Panier vide';
        Swal.fire({ icon: 'warning', title: emptyMsg });
        return;
    }
    // Simulate checkout
    const lang2 = localStorage.getItem('lang') || 'fr';
    const orderMsg = (window.translations && window.translations[lang2] && window.translations[lang2].order_placed) || 'Commande passée!';
    Swal.fire({ icon: 'success', title: orderMsg, text: 'Merci pour votre achat.' });
    saveCart([]);
    renderCart();
    updateCartCount();
    });
}

// Search user books
if (document.getElementById('search-user-book')) {
    document.getElementById('search-user-book').addEventListener('input', (e) => {
        renderUserBooks(e.target.value);
    });
}

// Borrow a book: mark as Emprunté and register borrower
window.borrowBook = (bookId) => {
    // Ensure user is logged in
    let userRaw = null;
    try { userRaw = localStorage.getItem('user'); } catch (e) { userRaw = null; }
    if (!userRaw) {
        const lang = localStorage.getItem('lang') || 'fr';
        const pls = (window.translations && window.translations[lang] && window.translations[lang].please_login) || 'Veuillez vous connecter';
        Swal.fire({ icon: 'warning', title: pls }).then(() => { window.location.href = 'index.html'; });
        return;
    }
    let userObj = null;
    try { userObj = JSON.parse(userRaw); } catch (e) { userObj = null; }
    if (!userObj || userObj.type !== 'user') {
        // if admin or malformed, redirect to auth
        const lang3 = localStorage.getItem('lang') || 'fr';
        const plsUser = (window.translations && window.translations[lang3] && window.translations[lang3].please_login_user) || 'Veuillez vous connecter en tant qu\'utilisateur';
        Swal.fire({ icon: 'warning', title: plsUser }).then(() => { window.location.href = 'index.html'; });
        return;
    }

    const books = getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (book.status === 'Emprunté') {
        const lang4 = localStorage.getItem('lang') || 'fr';
        const already = (window.translations && window.translations[lang4] && window.translations[lang4].already_borrowed) || 'Déjà emprunté';
        Swal.fire({ icon: 'info', title: already });
        return;
    }

    // mark as borrowed
    book.status = 'Emprunté';
    book.borrower = { id: userObj.id || userObj.email, name: userObj.name };
    book.borrowDate = new Date().toISOString().slice(0,10);

    saveBooks(books);

    const lang5 = localStorage.getItem('lang') || 'fr';
    const borrowed = (window.translations && window.translations[lang5] && window.translations[lang5].book_borrowed) || 'Livre emprunté';
    Swal.fire({ icon: 'success', title: borrowed, text: `${book.title} emprunté par ${userObj.name}`, timer: 1200, showConfirmButton: false });
    // re-render lists
    renderUserBooks();
    if (typeof renderBookTable === 'function') renderBookTable();
    if (typeof renderDashboard === 'function') renderDashboard();
};

// no-op