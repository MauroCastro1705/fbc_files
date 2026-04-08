/**
 * ==============================================
 * FBC AUTH LEVEL SYSTEM
 * Archivo de configuración y manejo de niveles
 * ==============================================
 * 
 * Este archivo centraliza toda la lógica de niveles de acceso.
 * Podés modificarlo a tu gusto para agregar, cambiar
 * o eliminar niveles según las necesidades del sistema.
 * 
 * Cómo usar:
 * 1. Modificá los niveles en el objeto LEVELS debajo
 * 2. Agregá nuevas reglas, permisos o lógica que necesites
 * 3. Este archivo se importa automáticamente en todas las páginas
 * 
 */

/**
 * CONFIGURACIÓN DE NIVELES
 * =========================
 * 
 * Acá definís TODOS los niveles de acceso del sistema.
 * Cada nivel tiene:
 * - id: número único del nivel (mismo que se guarda en users.json)
 * - name: nombre descriptivo que se muestra en la interfaz
 * - description: texto interno para referencia
 * - permissions: array de permisos que podés expandir a futuro
 * 
 * PODÉS MODIFICAR ESTE OBJETO SIN PROBLEMAS,
 * la interfaz se actualizará automáticamente.
 */
export const LEVELS = {
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
        description: "Puede ver documentos de investigación",
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
            "*", // Comodín: todos los permisos
            "manage_users",
            "system_configuration",
            "delete_files"
        ]
    }

    // ──────────────────────────────────────────
    // EJEMPLO PARA AGREGAR UN NUEVO NIVEL:
    //
    // 6: {
    //     id: 6,
    //     name: "Agente Especial",
    //     description: "Nivel especial para operaciones encubiertas",
    //     permissions: [ ... ]
    // }
    // ──────────────────────────────────────────
};

/**
 * Obtiene toda la información de un nivel por su ID
 * @param {number} levelId - Número del nivel
 * @returns {object} Datos completos del nivel
 */
export function getLevelInfo(levelId) {
    return LEVELS[levelId] || LEVELS[1];
}

/**
 * Obtiene el nombre legible de un nivel
 * @param {number} levelId - Número del nivel
 * @returns {string} Nombre del nivel
 */
export function getLevelName(levelId) {
    const level = getLevelInfo(levelId);
    return level.name;
}

/**
 * Devuelve el texto completo para mostrar en la barra superior
 * @param {number} levelId - Número del nivel
 * @returns {string} Formato: "Nombre - Nivel X"
 */
export function getLevelDisplayText(levelId) {
    const level = getLevelInfo(levelId);
    return `${level.name} - Nivel ${levelId}`;
}

/**
 * Verifica si un nivel tiene un permiso específico
 * @param {number} levelId - Número del nivel a verificar
 * @param {string} permission - Nombre del permiso (ej: "delete_files")
 * @returns {boolean} True si tiene permiso
 */
export function hasPermission(levelId, permission) {
    const level = getLevelInfo(levelId);
    
    // Si tiene permiso comodín "*" puede hacer TODO
    if (level.permissions.includes("*")) {
        return true;
    }
    
    return level.permissions.includes(permission);
}

/**
 * Obtiene todos los niveles disponibles
 * @returns {array} Array con todos los niveles ordenados por ID
 */
export function getAllLevels() {
    return Object.values(LEVELS).sort((a, b) => a.id - b.id);
}

/**
 * Verifica si un nivel es superior o igual a otro
 * @param {number} checkLevel - Nivel a chequear
 * @param {number} minimumLevel - Nivel mínimo requerido
 * @returns {boolean} True si es igual o superior
 */
export function isLevelAtLeast(checkLevel, minimumLevel) {
    return checkLevel >= minimumLevel;
}

/**
 * ==================================================
 * COMO AGREGAR NUEVA LÓGICA:
 * ==================================================
 * 
 * Si querés agregar una nueva función para manejar
 * permisos, reglas o comportamiento de niveles,
 * simplemente la escribís acá y la exportas.
 * 
 * Ejemplo:
 * 
 * export function puedeVerExpediente(levelId, expedienteNivel) {
 *     return levelId >= expedienteNivel;
 * }
 * 
 * Después la usas en cualquier página importándola:
 * import { puedeVerExpediente } from './auth-levels.js';
 * 
 * ==================================================
 * 
 * ESTE SISTEMA ESTÁ PREPARADO PARA EXPANDIRSE:
 * - Agregá campos nuevos al objeto LEVELS
 * - Creá nuevas funciones de validación
 * - Integralo con el resto del sistema
 * - No hace falta tocar el resto del código
 * 
 */