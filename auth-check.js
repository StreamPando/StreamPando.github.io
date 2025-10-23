/**
 * Script de protection avancé pour pages sécurisées
 * Version 2.0 - Améliorations sécurité et fonctionnalités
 */

// Configuration avancée
const CONFIG = {
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 heures
    LOGIN_PAGE: 'index.html',
    SESSION_WARNING_TIME: 5 * 60 * 1000, // Avertir 5 min avant expiration
    AUTO_REFRESH_INTERVAL: 10 * 60 * 1000, // Rafraîchir session toutes les 10 min
    SESSION_CHECK_INTERVAL: 60 * 1000, // Vérifier la session toutes les minutes
    INACTIVITY_TIMEOUT: 60 * 60 * 1000, // Déconnexion après 1h d'inactivité
    DEBUG_MODE: false // Mettre à true pour les logs de debug
};

// Variables globales
let sessionWarningShown = false;
let inactivityTimer = null;
let lastActivity = Date.now();

/**
 * Logger pour debug
 */
function debugLog(message, data = null) {
    if (CONFIG.DEBUG_MODE) {
        console.log(`[AuthProtection] ${message}`, data || '');
    }
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Vérifier la validité de la session
 */
function isSessionValid() {
    const loginTime = localStorage.getItem('loginTime');
    
    if (!loginTime) {
        debugLog('Aucun timestamp de connexion trouvé');
        return false;
    }
    
    const currentTime = Date.now();
    const timeDiff = currentTime - parseInt(loginTime);
    
    debugLog(`Temps écoulé depuis connexion: ${Math.floor(timeDiff / 60000)} minutes`);
    return timeDiff <= CONFIG.SESSION_DURATION;
}

/**
 * Vérifier l'inactivité de l'utilisateur
 */
function isUserActive() {
    const timeDiff = Date.now() - lastActivity;
    debugLog(`Temps d'inactivité: ${Math.floor(timeDiff / 60000)} minutes`);
    return timeDiff <= CONFIG.INACTIVITY_TIMEOUT;
}

/**
 * Nettoyer toutes les données de session
 */
function clearAllSessionData() {
    const keysToRemove = [
        'isAuthenticated', 'loginTime', 'username', 'returnUrl',
        'sessionWarningShown', 'lastActivity'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    debugLog('Toutes les données de session supprimées');
}

/**
 * Rediriger vers la page de connexion avec raison
 */
function redirectToLogin(reason = '', showAlert = false) {
    debugLog(`Redirection: ${reason}`);
    
    if (showAlert) {
        alert(`Session terminée: ${reason}`);
    }
    
    // Sauvegarder l'URL actuelle pour redirection après connexion
    localStorage.setItem('returnUrl', window.location.href);
    
    // Nettoyer et rediriger
    clearAllSessionData();
    window.location.href = CONFIG.LOGIN_PAGE;
}

/**
 * Obtenir le temps restant avant expiration
 */
function getTimeRemaining() {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return 0;
    
    const elapsed = Date.now() - parseInt(loginTime);
    return Math.max(0, CONFIG.SESSION_DURATION - elapsed);
}

/**
 * Formater le temps en format lisible
 */
function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}

/**
 * Afficher un avertissement d'expiration de session
 */
function showSessionWarning() {
    if (sessionWarningShown) return;
    
    sessionWarningShown = true;
    const timeRemaining = getTimeRemaining();
    
    const extend = confirm(
        `Votre session expire dans ${formatTime(timeRemaining)}.\n\n` +
        'Voulez-vous prolonger votre session ?'
    );
    
    if (extend) {
        extendSession();
        sessionWarningShown = false;
    }
}

/**
 * Prolonger la session
 */
function extendSession() {
    localStorage.setItem('loginTime', Date.now().toString());
    lastActivity = Date.now();
    debugLog('Session prolongée');
}

/**
 * Mettre à jour l'activité de l'utilisateur
 */
function updateActivity() {
    lastActivity = Date.now();
    localStorage.setItem('lastActivity', lastActivity.toString());
    
    if (isAuthenticated()) {
        // Renouveler automatiquement la session si elle est proche d'expirer
        const timeRemaining = getTimeRemaining();
        if (timeRemaining < CONFIG.AUTO_REFRESH_INTERVAL) {
            extendSession();
        }
    }
}

/**
 * Vérification principale d'authentification
 */
function requireAuth() {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        redirectToLogin('Non authentifié');
        return false;
    }
    
    // Vérifier la validité de la session
    if (!isSessionValid()) {
        redirectToLogin('Session expirée', true);
        return false;
    }
    
    // Vérifier l'inactivité
    if (!isUserActive()) {
        redirectToLogin('Déconnexion pour inactivité', true);
        return false;
    }
    
    // Avertir si la session va bientôt expirer
    const timeRemaining = getTimeRemaining();
    if (timeRemaining <= CONFIG.SESSION_WARNING_TIME && !sessionWarningShown) {
        showSessionWarning();
    }
    
    updateActivity();
    return true;
}

/**
 * Déconnexion manuelle
 */
function logoutFromProtectedPage(confirmLogout = true) {
    if (confirmLogout && !confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        return;
    }
    
    debugLog('Déconnexion manuelle');
    redirectToLogin('Déconnexion manuelle');
}

/**
 * Obtenir des informations détaillées sur l'utilisateur
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }
    
    const loginTime = parseInt(localStorage.getItem('loginTime'));
    const timeRemaining = getTimeRemaining();
    const lastActivityTime = parseInt(localStorage.getItem('lastActivity')) || loginTime;
    
    return {
        username: localStorage.getItem('username'),
        loginTime: loginTime,
        lastActivity: lastActivityTime,
        timeRemaining: timeRemaining,
        timeRemainingFormatted: formatTime(timeRemaining),
        inactivityTime: Date.now() - lastActivityTime,
        isAuthenticated: true,
        sessionValid: isSessionValid(),
        userActive: isUserActive()
    };
}

/**
 * Ajouter un bouton de déconnexion avec styles
 */
function addLogoutButton(containerId = 'logout-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        debugLog(`Conteneur ${containerId} non trouvé`);
        return;
    }
    
    // Éviter les doublons
    if (container.querySelector('.logout-btn')) {
        debugLog('Bouton de déconnexion déjà présent');
        return;
    }
    
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Se déconnecter';
    logoutBtn.className = 'logout-btn';
    logoutBtn.title = 'Cliquez pour vous déconnecter';
    
    // Styles de base
    logoutBtn.style.cssText = `
        border: none;
        background: transparent;
        color: black;
        padding: 0 0;
        left: 10px;
        cursor: pointer;
        font-size: 14px;
        margin: 10px 0;
        transition: background 0.3s ease;
    `;
    
    // Événements
    logoutBtn.addEventListener('click', () => logoutFromProtectedPage(true));
    logoutBtn.addEventListener('mouseover', function() {
        this.style.background = '#00000079';
    });
    logoutBtn.addEventListener('mouseout', function() {
        this.style.background = 'transparent';
    });
    
    container.appendChild(logoutBtn);
    debugLog('Bouton de déconnexion ajouté');
}

/**
 * Afficher les informations de session dans la console
 */
function displaySessionInfo() {
    const user = getCurrentUser();
    if (!user) {
        debugLog('Aucune session active');
        return;
    }
    
    console.group('📊 Informations de session');
    console.log('👤 Utilisateur:', user.username);
    console.log('🕐 Connecté depuis:', new Date(user.loginTime).toLocaleString());
    console.log('⏰ Session expire dans:', user.timeRemainingFormatted);
    console.log('🔄 Dernière activité:', new Date(user.lastActivity).toLocaleString());
    console.log('✅ Session valide:', user.sessionValid);
    console.log('🎯 Utilisateur actif:', user.userActive);
    console.groupEnd();
}

/**
 * Surveiller l'activité utilisateur
 */
function setupActivityMonitoring() {
    const events = ['click', 'keypress', 'mousemove', 'scroll', 'touchstart'];
    
    events.forEach(eventType => {
        document.addEventListener(eventType, updateActivity, { passive: true });
    });
    
    debugLog('Surveillance d\'activité configurée');
}

/**
 * Configuration des vérifications périodiques
 */
function setupPeriodicChecks() {
    // Vérification de session principale
    setInterval(() => {
        if (!requireAuth()) {
            debugLog('Vérification périodique: session invalide');
            return;
        }
    }, CONFIG.SESSION_CHECK_INTERVAL);
    
    debugLog(`Vérifications périodiques configurées (${CONFIG.SESSION_CHECK_INTERVAL / 1000}s)`);
}

/**
 * Gestion de la visibilité de la page
 */
function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            debugLog('Page redevenue visible, vérification de session...');
            if (!requireAuth()) {
                return;
            }
        }
    });
}

/**
 * Gestion de la fermeture/rechargement de page
 */
function setupPageUnloadHandler() {
    window.addEventListener('beforeunload', function(e) {
        // Optionnel: avertir si des données non sauvegardées
        // e.preventDefault();
        // return 'Êtes-vous sûr de vouloir quitter cette page ?';
    });
}

/**
 * Initialisation complète du système de protection
 */
function initAdvancedProtection() {
    debugLog('=== Initialisation du système de protection avancé ===');
    
    // Restaurer la dernière activité si elle existe
    const savedActivity = localStorage.getItem('lastActivity');
    if (savedActivity) {
        lastActivity = parseInt(savedActivity);
    }
    
    // Vérification initiale
    if (!requireAuth()) {
        return;
    }
    
    // Configurer tous les systèmes de surveillance
    setupActivityMonitoring();
    setupPeriodicChecks();
    setupVisibilityHandler();
    setupPageUnloadHandler();
    
    // Informations de debug
    displaySessionInfo();
    
    debugLog('✅ Système de protection initialisé avec succès');
}

// =========================
// FONCTIONS UTILITAIRES
// =========================

/**
 * Forcer l'expiration de la session (pour debug)
 */
function expireSessionNow() {
    if (CONFIG.DEBUG_MODE) {
        localStorage.setItem('loginTime', (Date.now() - CONFIG.SESSION_DURATION - 1000).toString());
        debugLog('Session forcée à expirer');
    }
}

/**
 * Obtenir des statistiques de session
 */
function getSessionStats() {
    const user = getCurrentUser();
    if (!user) return null;
    
    return {
        sessionDuration: CONFIG.SESSION_DURATION,
        timeElapsed: Date.now() - user.loginTime,
        timeRemaining: user.timeRemaining,
        percentageUsed: ((Date.now() - user.loginTime) / CONFIG.SESSION_DURATION * 100).toFixed(1),
        inactivityDuration: Date.now() - user.lastActivity
    };
}

// Exposer certaines fonctions globalement pour usage manuel
window.AuthProtection = {
    getCurrentUser,
    getSessionStats,
    displaySessionInfo,
    extendSession,
    logoutFromProtectedPage,
    expireSessionNow: CONFIG.DEBUG_MODE ? expireSessionNow : null
};

// Auto-initialisation
document.addEventListener('DOMContentLoaded', initAdvancedProtection);