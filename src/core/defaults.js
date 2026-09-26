// Valores por defecto y proforma de ejemplo. Sin imports en runtime: proforma.js importa de aquí y un import inverso crearía un ciclo.

/** @type {import('./proforma.js').Emisor} */
export const EMISOR_DEFAULT = {
  nombre: 'Jason Moya Brenes',
  cedula: '',
  ciudad: 'Paraíso, Cartago',
  direccion: 'Costa Rica',
  telefono: '',
  correo: 'jason.moyabrenes@gmail.com',
  actividad: 'Desarrollo y organización de software',
};

export const COMENTARIO_DEFAULT = 'Gracias por la confianza. El servicio contempla lo siguiente:';

/** @type {import('./proforma.js').Cliente} */
export const CLIENTE_VACIO = { nombre: '', cedulaJuridica: '', contacto: '', telefono: '', correo: '', direccion: '' };

// [título, descripción, precio en colones]: 8 servicios que suman ₡300.000,00.
const SERVICIOS_EJEMPLO = [
  ['Diagnóstico de Google Drive', 'Revisión de carpetas, archivos duplicados y permisos actuales.', '45000'],
  ['Diseño de estructura de carpetas', 'Jerarquía por áreas y proyectos con convención de nombres.', '40000'],
  ['Migración y reorganización', 'Traslado de archivos a la nueva estructura sin pérdida de historial.', '40000'],
  ['Limpieza de duplicados', 'Detección y depuración de archivos repetidos u obsoletos.', '35000'],
  ['Configuración de permisos', 'Accesos por rol y unidades compartidas por equipo.', '35000'],
  ['Unidades compartidas', 'Creación y configuración de unidades compartidas por área.', '40000'],
  ['Plantillas y nomenclatura', 'Plantillas de documentos y guía de nombres de archivo.', '35000'],
  ['Capacitación al equipo', 'Sesión práctica de uso y buenas prácticas (2 horas).', '30000'],
];

/**
 * Proforma precargada en la primera visita. Las fechas van vacías: el estado (F3) las pone con hoy.
 * @type {import('./proforma.js').Proforma}
 */
export const EJEMPLO = {
  numero: 'PROF-2026-001',
  fechaEmision: '',
  validaHasta: '',
  validaHastaManual: false,
  condicion: 'Contado',
  actividad: EMISOR_DEFAULT.actividad,
  cliente: {
    nombre: 'Comercial Los Andes S.A.',
    cedulaJuridica: '3-101-123456',
    contacto: 'María Fernández',
    telefono: '8888-0000',
    correo: 'maria@losandes.cr',
    direccion: 'San José, Costa Rica',
  },
  clienteId: null,
  lineas: SERVICIOS_EJEMPLO.map(([titulo, descripcion, precio], i) => ({
    id: `ejemplo-${i + 1}`,
    titulo,
    descripcion,
    cantidad: '1',
    precio,
  })),
  comentario: COMENTARIO_DEFAULT,
  incluye: 'Soporte por correo durante 15 días\nGuía de uso en PDF',
  noIncluye: 'Licencias de Google Workspace\nRecuperación de archivos borrados',
};
