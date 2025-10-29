// Base URL for API requests
export const BASE_URL =
  'http://indian-steel-env.eba-emsdmyth.ap-south-1.elasticbeanstalk.com';

export const endpoints = {
  // Customer endpoints
  customers: '/api/v1/customers',
  customersByStatus: status =>
    `/api/v1/customers/status/${encodeURIComponent(status)}`,
  customersSearch: '/api/v1/customers/search',
  customersReminder: '/api/v1/customers/reminder',

  // Project endpoints
  projects: '/api/v1/projects',
  projectById: id => `/api/v1/projects/${id}`,
  projectsByStatus: status =>
    `/api/v1/projects/status/${encodeURIComponent(status)}`,
  projectsByDate: date => `/api/v1/projects/date/${encodeURIComponent(date)}`,
  projectsByCustomer: customerId => `/api/v1/projects/customer/${customerId}`,
  projectsSearch: '/api/v1/projects/search',

  // Project sub-resources
  projectGps: id => `/api/v1/projects/${id}/gps`,
  projectVoice: id => `/api/v1/projects/${id}/voice`,
  projectImages: id => `/api/v1/projects/${id}/images`,
  projectStatus: id => `/api/v1/projects/${id}/status`,
  projectInvoice: id => `/api/v1/projects/${id}/invoice`,

  // Project related entities
  advances: '/api/v1/projects/advances',
  advancesByProject: projectId => `/api/v1/projects/${projectId}/advances`,

  items: '/api/v1/projects/items',
  itemsByProject: projectId => `/api/v1/projects/${projectId}/items`,
  itemById: id => `/api/v1/projects/items/${id}`,

  paymentsIn: '/api/v1/projects/payments-in',
  paymentsInByProject: projectId => `/api/v1/projects/${projectId}/payments-in`,

  paymentsOut: '/api/v1/projects/payments-out',
  paymentsOutByProject: projectId =>
    `/api/v1/projects/${projectId}/payments-out`,

  // Quotation endpoints
  quotations: '/api/v1/quotations',
  quotationById: id => `/api/v1/quotations/${id}`,
  quotationItemsByQuotation: id => `/api/v1/quotations/${id}/items`,
  quotationsSearch: '/api/v1/quotations/search',
  quotationsByCustomerId: customerId =>
    `/api/v1/quotations/customer/${customerId}`,
  quotationItems: '/api/v1/quotations/items',
  quotationItemById: itemId => `/api/v1/quotations/items/${itemId}`,

  // Unit endpoints
  units: '/api/v1/units',
  unitById: id => `/api/v1/units/${id}`,
  unitCreate: '/api/v1/units',
  unitUpdate: id => `/api/v1/units/${id}`,
  unitDelete: id => `/api/v1/units/${id}`,

  // User endpoints
  users: '/api/v1/users',
  userById: id => `/api/v1/users/${id}`,
  userRole: id => `/api/v1/users/role/${id}`,
  userPassword: id => `/api/v1/users/password/${id}`,
  userRoleByUsername: username => `/api/v1/users/role/username/${username}`,
  userPasswordByUsername: username =>
    `/api/v1/users/password/username/${username}`,
};

export function buildUrl(path, queryParams) {
  const url = new URL(path, BASE_URL);
  if (queryParams && typeof queryParams === 'object') {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}`.length > 0) {
        url.searchParams.append(k, String(v));
      }
    });
  }
  return url.toString();
}
