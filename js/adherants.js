// adherants.js
const initialMembersData = [
    { id: 1, name: "tata", email: "tatat@mail.com", phone: "0612345678", registrationDate: "2023-01-15", password: "pass123" },
    { id: 2, name: "titi", email: "titititi@mail.com", phone: "0787654321", registrationDate: "2023-03-20", password: "pass456" }
];

// Helper: format date YYYY-MM-DD -> DD/MM/YYYY
function formatDate(d) {
    if (!d) return 'N/A';
    try {
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
    } catch (e) {
        return d;
    }
}

// recuperer les donnees Adhérents
// Reste en window.getMembers pour être accessible depuis script.js
window.getMembers = function() {
    const data = localStorage.getItem('members');
    return data ? JSON.parse(data) : initialMembersData;
}

// sauvegarder les donnees Adhérents
function saveMembers(members) {
    localStorage.setItem('members', JSON.stringify(members));
}
window.saveMembers = saveMembers;

// tableau de adherants
// Reste en window.renderMemberTable pour être appelé depuis script.js
window.renderMemberTable = function(filter = '') {
    const members = window.getMembers();
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return; // nothing to render on this page
    tbody.innerHTML = '';
    
    const searchTerm = filter.toLowerCase(); // Utilisation d'une seule variable locale
    
    const Members_filter = members.filter(member => {
        const name = member.name.toLowerCase();
        const email = member.email.toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });

    Members_filter.forEach(member => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${member.password || ''}</td>
            <td>${formatDate(member.registrationDate)}</td>
            <td>
                <button class="btn-primary" onclick="editMember(${member.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-red" onclick="deleteMember(${member.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// rechercher adherant (only if input exists)
const searchMemberInput = document.getElementById('search-member');
if (searchMemberInput) {
    searchMemberInput.addEventListener('input', (e) => {
        window.renderMemberTable(e.target.value);
    });
}


// ajouter & modifier adherant
const memberForm = document.getElementById('member-form');
if (memberForm) {
    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let members = window.getMembers();
        const id = document.getElementById('member-id').value;
    // Récupère la langue du localStorage (pas besoin de la redéfinir à 'fr')
    const lang = localStorage.getItem('lang') || 'fr'; 
    
    const newMember = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('member-name').value,
        email: document.getElementById('member-email').value,
        phone: document.getElementById('member-phone').value,
        password: document.getElementById('member-password').value,
        // Correction de la logique de conservation de la date
        registrationDate: id 
            ? members.find(m => m.id == id)?.registrationDate 
            : new Date().toISOString().slice(0, 10)
    };

    if (id) {
        // si modifier
        members = members.map(m => m.id == id ? newMember : m);
    } else {
        // si creer
        members.push(newMember);
    }

    saveMembers(members);
    window.closeModal('member-modal');
    window.renderMemberTable();
    // Utilisation des objets de traduction dans window.translations (doit être chargé avant)
    Swal.fire({ icon: 'success', title: window.translations[lang].msg_saved, timer: 1000, showConfirmButton: false });
    // mettre a jour dashboard apres creer    
    window.changeSection('dashboard');
    });
}

// modifier adherent
window.editMember = (id) => {
    const members = window.getMembers();
    // Utilisation de .find pour récupérer l'objet
    const member = members.find(m => m.id === id); 
    if (member) {
        document.getElementById('member-id').value = member.id;
        document.getElementById('member-name').value = member.name;
        document.getElementById('member-email').value = member.email;
        document.getElementById('member-phone').value = member.phone;
        document.getElementById('member-password').value = member.password;
        window.openModal('member-modal');
    }
};

// supp adherant
window.deleteMember = (id) => {
    const lang = localStorage.getItem('lang') || 'fr';
    Swal.fire({
        title: window.translations[lang].msg_confirm,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: window.translations[lang].btn_cancel || 'Annuler', // Clé de traduction ajoutée
        confirmButtonText: window.translations[lang].btn_confirm_delete || 'Oui, supprimer' // Clé de traduction ajoutée
    }).then((result) => {
        if (result.isConfirmed) {
            let members = window.getMembers();
            // Utilisation de .filter pour la suppression
            members = members.filter(m => m.id !== id);
            saveMembers(members);
            window.renderMemberTable();
            Swal.fire(window.translations[lang].msg_deleted, '', 'success');
            // maj apres supp
            window.changeSection('dashboard');
        }
    });
};