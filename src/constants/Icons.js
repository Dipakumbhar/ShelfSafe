/**
 * Centralized icon configuration for Shelfsafe
 *
 * All icon names map to MaterialIcons from react-native-vector-icons.
 * Import this config wherever you need an icon name — never hardcode strings.
 */

const ICONS = {
  // Navigation
  dashboard: 'dashboard',
  products: 'inventory-2',
  add: 'add-circle',
  profile: 'person',

  // Actions
  scan: 'photo-camera',
  addProduct: 'add-circle-outline',
  search: 'search',
  filter: 'filter-list',
  edit: 'edit',
  delete: 'delete-outline',
  close: 'close',
  back: 'arrow-back',
  forward: 'chevron-right',
  check: 'check-circle',
  refresh: 'refresh',
  send: 'send',
  report: 'description',

  // Status & Alerts
  warning: 'warning-amber',
  error: 'error-outline',
  info: 'info-outline',
  success: 'check-circle-outline',
  alert: 'notification-important',

  // Product & Inventory
  product: 'inventory-2',
  category: 'category',
  batch: 'tag',
  calendar: 'calendar-today',
  quantity: 'straighten',
  notes: 'notes',
  expiry: 'event-busy',

  // User & Auth
  email: 'email',
  password: 'lock',
  visibility: 'visibility',
  visibilityOff: 'visibility-off',
  logout: 'logout',
  login: 'login',
  signup: 'person-add',

  // Shop & Admin
  shop: 'storefront',
  location: 'place',
  notifications: 'notifications',
  privacy: 'security',
  about: 'info',
  compliance: 'verified',
  nonCompliance: 'gpp-bad',

  // Scan & OCR
  lightbulb: 'lightbulb-outline',
  shelfLife: 'inventory-2',

  // Admin
  complianceOK: 'verified',
  complianceFail: 'gpp-bad',
  sendWarning: 'outgoing-mail',
  generateReport: 'description',
  arrowForward: 'arrow-forward',

  // Misc
  empty: 'inbox',
  camera: 'photo-camera',
  autoFix: 'auto-fix-high',
};

export default ICONS;
