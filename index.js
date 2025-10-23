// Configuration - Hash SHA-256 des identifiants
const VALID_USERNAME_HASH = "d2aec61d2aa1d9b2baa5e20d5ecc24601065a00ffac4319183af560e877891eb";
const VALID_PASSWORD_HASH = "c91745e81818bad9305f35209536ba566f2c74d72658bc090ac4f999bdc096f0";

// NOTE: En production, remplacez ces hash par les vrais hash générés

// Durée de session (en millisecondes)
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Vérifier si l'utilisateur est déjà connecté
 */
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
    if (isLoggedIn) {
        // Si déjà connecté, rediriger vers le jeu
        window.location.href = '0_LeJeux.html';
        return true;
    }
    return false;
}

/**
 * Générer un hash SHA-256 d'une chaîne
 * @param {string} text - Texte à hasher
 * @returns {Promise<string>} - Hash SHA-256 en hexadécimal
 */
async function generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Fonction de connexion avec vérification des hash
 * @param {string} username - Nom d'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<boolean>} - True si connexion réussie
 */
async function login(username, password) {
    try {
        // Générer les hash des entrées utilisateur
        const usernameHash = await generateHash(username);
        const passwordHash = await generateHash(password);
        
        // Comparer avec les hash stockés
        if (usernameHash === VALID_USERNAME_HASH && passwordHash === VALID_PASSWORD_HASH) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('loginTime', Date.now().toString());
            localStorage.setItem('username', username); // On peut stocker le nom en clair pour l'affichage
            
            // Redirection vers la page du jeu
            window.location.href = '0_LeJeux.html';
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur lors du hashage:', error);
        return false;
    }
}

/**
 * Fonction de déconnexion
 */
function logout() {
    // Supprimer toutes les données de session
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('username');
    
    // Afficher le formulaire de connexion
    showLoginForm();
    
    // Message de confirmation (optionnel)
    console.log('Déconnexion réussie');
}

/**
 * Afficher le contenu principal
 */
function showMainContent() {
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');
    
    if (loginForm && mainContent) {
        loginForm.style.display = 'none';
        mainContent.style.display = 'block';
    }
}

/**
 * Afficher le formulaire de connexion
 */
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');
    const errorDiv = document.getElementById('errorMessage');
    
    if (loginForm && mainContent) {
        loginForm.style.display = 'block';
        mainContent.style.display = 'none';
    }
    
    if (errorDiv) {
        errorDiv.textContent = '';
    }
    
    // Réinitialiser les champs du formulaire
    const form = document.getElementById('authForm');
    if (form) {
        form.reset();
    }
}

/**
 * Vérifier l'expiration de la session
 */
function checkSessionExpiry() {
    const loginTime = localStorage.getItem('loginTime');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && loginTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(loginTime);
        
        if (timeDiff > SESSION_DURATION) {
            console.log('Session expirée');
            logout();
            showError('Votre session a expiré. Veuillez vous reconnecter.');
            return false;
        }
    }
    return true;
}

/**
 * Afficher un message d'erreur
 * @param {string} message - Message d'erreur à afficher
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
    }
}

/**
 * Gérer la soumission du formulaire
 * @param {Event} e - Événement de soumission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation côté client
    if (!username || !password) {
        showError('Veuillez remplir tous les champs');
        return;
    }
    
    // Afficher un indicateur de chargement
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Connexion...';
    submitBtn.disabled = true;
    
    try {
        // Tentative de connexion (asynchrone maintenant)
        const loginSuccess = await login(username, password);
        
        if (loginSuccess) {
            if (errorDiv) {
                errorDiv.textContent = '';
            }
            console.log('Connexion réussie pour:', username);
            // La redirection se fait dans la fonction login()
        } else {
            showError('Nom d\'utilisateur ou mot de passe incorrect');
            
            // Vider les champs en cas d'erreur
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            
            // Focus sur le champ username
            document.getElementById('username').focus();
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        showError('Erreur technique. Veuillez réessayer.');
    } finally {
        // Restaurer le bouton
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Renouveler la session (actualiser le timestamp)
 */
function renewSession() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
        localStorage.setItem('loginTime', Date.now().toString());
    }
}

/**
 * Initialisation de l'application
 */
function initApp() {
    // Vérifier d'abord l'expiration de session
    checkSessionExpiry();
    
    // Puis vérifier l'authentification
    checkAuth();
    
    // Ajouter l'écouteur d'événement pour le formulaire
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Ajouter des écouteurs pour renouveler la session sur activité
    document.addEventListener('click', renewSession);
    document.addEventListener('keypress', renewSession);
    
    console.log('Application initialisée');
}

/**
 * Vérification périodique de la session
 */
function startSessionMonitoring() {
    // Vérifier la session toutes les 5 minutes
    setInterval(() => {
        checkSessionExpiry();
    }, 5 * 60 * 1000);
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    startSessionMonitoring();
});

// Vérifier la session quand la page devient visible (changement d'onglet)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        checkSessionExpiry();
    }
});

// Optionnel : Déconnexion automatique à la fermeture de l'onglet
window.addEventListener('beforeunload', function() {
    // Décommentez la ligne suivante si vous voulez une déconnexion automatique
    // logout();
});