// Profile page logic

function getUserData() {
  const auth = sessionStorage.getItem('fbc_auth');
  if (!auth) return null;
  return JSON.parse(auth);
}

// Load favorites list
function loadFavorites() {
  const user = getUserData();
  const listEl = document.getElementById('favorites-list');
  
  if (!user || !user.favorites || user.favorites.length === 0) {
    listEl.innerHTML = `<div style="color: var(--text3); font-size: 12px; padding: 16px 0; text-align: center;">No tienes imágenes favoritas</div>`;
    return;
  }

  listEl.innerHTML = user.favorites.map(fav => {
    // Use the stored path directly (includes category folder and filename with extension)
    return `
      <a href="${fav.path}" class="fav-link" target="_blank">
        <span class="fav-icon">★</span>
        <div class="fav-text">
          <div class="fav-name">${fav.name}</div>
          <div class="fav-cat">📂 ${fav.category}</div>
        </div>
        <span class="fav-arrow">→</span>
      </a>
    `;
  }).join('');
}

// LEVEL SYSTEM EMBEDDED
const LEVELS = {
    1: {
        id: 1,
        name: "Agente",
        description: "Nivel básico, solo lectura de archivos públicos",
        permissions: [
            "read_public_files",
            "view_categories",
            "search_files"
        ]
    },
    2: {
        id: 2,
        name: "Investigador",
        description: "Puede ver y editar documentos de investigación",
        permissions: [
            "read_public_files",
            "read_restricted_files",
            "view_categories",
            "search_files",
            "add_comments"
        ]
    },
    3: {
        id: 3,
        name: "Supervisor",
        description: "Acceso completo a todos los casos, puede aprobar solicitudes",
        permissions: [
            "read_public_files",
            "read_restricted_files",
            "read_confidential_files",
            "view_categories",
            "search_files",
            "add_comments",
            "approve_requests",
            "manage_cases"
        ]
    },
    4: {
        id: 4,
        name: "Director",
        description: "Control total de departamento, puede asignar niveles",
        permissions: [
            "read_all_files",
            "view_categories",
            "search_files",
            "add_comments",
            "approve_requests",
            "manage_cases",
            "assign_levels",
            "view_audit_logs"
        ]
    },
    5: {
        id: 5,
        name: "Administrador",
        description: "Acceso absoluto al sistema",
        permissions: [
            "*",
            "manage_users",
            "system_configuration",
            "delete_files"
        ]
    }
};

function getLevelInfo(levelId) {
    return LEVELS[levelId] || LEVELS[1];
}

function getLevelName(levelId) {
    const level = getLevelInfo(levelId);
    return level.name;
}

function getLevelDisplayText(levelId) {
    const level = getLevelInfo(levelId);
    return `${level.name} - Nivel ${levelId}`;
}

function hasPermission(levelId, permission) {
    const level = getLevelInfo(levelId);
    if (level.permissions.includes("*")) {
        return true;
    }
    return level.permissions.includes(permission);
}

// AUTH
function checkAuth() {
    const auth = sessionStorage.getItem('fbc_auth');
    if (!auth) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(auth);
}

// COPY CODE
function copyCode() {
    const code = document.getElementById('export-code').textContent;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '¡Copiado!';
            btn.style.borderColor = '#27ae60';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.borderColor = '';
            }, 1500);
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Código copiado al portapapeles');
        });
    }
}

// EXPORT USER CODE
function exportUserCode() {
    const currentUser = getUserData();
    if (!currentUser) {
        alert('No hay usuario logueado');
        return;
    }

    try {
        const codeData = btoa(JSON.stringify({
            u: currentUser.username,
            l: currentUser.level,
            x: currentUser.viewedImages ? currentUser.viewedImages.length : 0,
            f: currentUser.favorites || [],
            v: currentUser.viewedImages || []
        }));
        
        document.getElementById('export-code').textContent = codeData;
        document.getElementById('export-code').classList.add('visible');
        document.getElementById('copy-code-btn').style.display = 'inline-block';
    } catch(e) {
        alert('Error al generar código: ' + e.message);
    }
}

// SHOW IMPORT
function showImport() {
    document.getElementById('import-section').style.display = 'block';
}

// IMPORT USER CODE
function importUserCode() {
    const code = document.getElementById('import-code-input').value.trim();
    if (!code) {
        alert('Por favor ingrese un código');
        return;
    }
    
    try {
        const decoded = atob(code);
        if (!decoded) {
            throw new Error('Código vacío');
        }
        const data = JSON.parse(decoded);
        
        // Validate required fields
        if (!data.u || !data.l) {
            throw new Error('Código incompleto');
        }
        
        const importedUser = {
            username: data.u,
            level: data.l,
            xp: data.x || 0,
            favorites: data.f || [],
            viewedImages: data.v || [],
            loggedAt: Date.now()
        };
        
        sessionStorage.setItem('fbc_auth', JSON.stringify(importedUser));
        window.location.reload();
    } catch(e) {
        alert('Código inválido. Asegúrese de copiar el código completo.');
    }
}

// Initialize profile page
function initProfile() {
  const user = checkAuth();
  if (!user) return;
  
  const levelInfo = getLevelInfo(user.level);

  // Safely update DOM elements
  const usernameEl = document.getElementById('profile-username');
  const levelNameEl = document.getElementById('profile-level-name');
  const xpTextEl = document.getElementById('xp-text');
  const xpBarEl = document.getElementById('xp-bar');
  const dotsContainer = document.getElementById('level-dots');
  const permissionsContainer = document.getElementById('permissions-list');

  if (usernameEl) usernameEl.textContent = user.username;
  if (levelNameEl) levelNameEl.textContent = getLevelDisplayText(user.level);

  // Level indicator dots
  if (dotsContainer) {
    const maxLevel = Object.keys(LEVELS).length;
    for (let i = 1; i <= maxLevel; i++) {
        const dot = document.createElement('div');
        dot.classList.add('level-dot');
        if (i <= user.level) {
            dot.classList.add('unlocked');
        }
        dotsContainer.appendChild(dot);
    }
  }

  // XP Bar - based on viewed images (286 max)
  const totalImages = 286;
  const viewedCount = user.viewedImages ? user.viewedImages.length : 0;
  const percentage = Math.min((viewedCount / totalImages) * 100, 100);

  if (xpTextEl) xpTextEl.textContent = `${viewedCount} / ${totalImages} XP`;
  setTimeout(() => {
      if (xpBarEl) xpBarEl.style.width = percentage + '%';
  }, 150);

  // Permissions list
  if (permissionsContainer) {
    const allPermissions = [
        { id: 'read_public_files', name: 'Leer archivos públicos', desc: 'Acceso a documentos de nivel 1' },
        { id: 'view_categories', name: 'Ver categorías', desc: 'Ver todas las secciones del archivo' },
        { id: 'search_files', name: 'Buscar archivos', desc: 'Motor de búsqueda completo' },
        { id: 'read_restricted_files', name: 'Leer archivos restringidos', desc: 'Acceso a documentos nivel 2' },
        { id: 'add_comments', name: 'Agregar comentarios', desc: 'Comentar en expedientes' },
        { id: 'read_confidential_files', name: 'Leer archivos confidenciales', desc: 'Acceso a documentos nivel 3' },
        { id: 'approve_requests', name: 'Aprobar solicitudes', desc: 'Autorizar operaciones' },
        { id: 'manage_cases', name: 'Gestionar casos', desc: 'Modificar expedientes' },
        { id: 'assign_levels', name: 'Asignar niveles', desc: 'Cambiar nivel de otros agentes' },
        { id: 'view_audit_logs', name: 'Ver registros de auditoría', desc: 'Historial completo del sistema' },
        { id: 'manage_users', name: 'Gestionar usuarios', desc: 'Crear y eliminar cuentas' },
        { id: 'system_configuration', name: 'Configuración del sistema', desc: 'Acceso total a configuración' },
        { id: 'delete_files', name: 'Eliminar archivos', desc: 'Borrar permanentemente documentos' }
    ];

    allPermissions.forEach(perm => {
        const hasAccess = hasPermission(user.level, perm.id);
        
        const item = document.createElement('div');
        item.className = 'permission-item';
        item.innerHTML = `
            <div class="permission-status ${hasAccess ? 'active' : 'inactive'}"></div>
            <div class="permission-name">${perm.name}</div>
            <div class="permission-desc">${perm.desc}</div>
        `;
        
        permissionsContainer.appendChild(item);
    });
  }

  setTimeout(loadFavorites, 100);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    initProfile();
}