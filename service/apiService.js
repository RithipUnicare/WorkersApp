import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { BASE_URL, endpoints, buildUrl } from './configuration';

async function handleResponse(res, parse = 'json') {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.log(res);
    let errorData;
    try {
      errorData = text ? JSON.parse(text) : {};
    } catch {
      errorData = { message: text || 'An unknown error occurred' };
    }

    const error = new Error(errorData.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  if (parse === 'blob') return res.blob();
  if (parse === 'text') return res.text();
  return res.status !== 204 ? res.json().catch(() => ({})) : null;
}

async function jsonRequest(method, path, body, headers = {}) {
  const res = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(res, 'json');
}

async function queryRequest(path, query) {
  const url = buildUrl(path, query);
  const res = await fetch(url);
  return handleResponse(res, 'json');
}

async function deleteRequest(path) {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

async function multipartRequest(method, path, formData) {
  const res = await fetch(buildUrl(path), {
    method,
    body: formData,
    headers: {},
  });
  return handleResponse(res, 'json');
}

export const CustomerAPI = {
  create: payload => jsonRequest('POST', endpoints.customers, payload),
  getById: id => queryRequest(`${endpoints.customers}/${id}`),
  getAll: () => queryRequest(endpoints.customers),
  getByStatus: status => queryRequest(endpoints.customersByStatus(status)),
  searchByName: name => queryRequest(endpoints.customersSearch, { name }),
  searchByContactNo: contactNo =>
    queryRequest(endpoints.customersSearch, { contactNo }),
  getReminder: () => queryRequest(endpoints.customersReminder),
  update: (id, payload) =>
    jsonRequest('PUT', `${endpoints.customers}/${id}`, payload),
  delete: id => deleteRequest(`${endpoints.customers}/${id}`),
};

export const ProjectAPI = {
  create: payload => jsonRequest('POST', endpoints.projects, payload),
  getById: id => queryRequest(endpoints.projectById(id)),
  getAll: () => queryRequest(endpoints.projects),
  getByStatus: status => queryRequest(endpoints.projectsByStatus(status)),
  getByDate: date => queryRequest(endpoints.projectsByDate(date)),
  getByCustomerId: customerId =>
    queryRequest(endpoints.projectsByCustomer(customerId)),
  searchByCustomerName: customerName =>
    queryRequest(endpoints.projectsSearch, { customerName }),
  searchByCustomerContactNo: customerContactNo =>
    queryRequest(endpoints.projectsSearch, { customerContactNo }),
  update: (id, payload) =>
    jsonRequest('PUT', endpoints.projectById(id), payload),
  delete: id => deleteRequest(endpoints.projectById(id)),
  updateGps: (id, payload) =>
    jsonRequest('PUT', endpoints.projectGps(id), payload),
  updateVoice: (id, file) => {
    const formData = new FormData();
    if (file.startsWith('file://') || file.includes('cache')) {
      const filename = file.split('/').pop() || `voice_note_${id}.mp3`;
      const type = 'audio/mpeg';
      formData.append('file', {
        uri: file,
        name: filename,
        type,
      });
    }
    // formData.append('file', file);
    return multipartRequest('PUT', endpoints.projectVoice(id), formData);
  },
  addSiteImages: async (projectId, imageUris = []) => {
    const formData = new FormData();

    imageUris.forEach((uri, index) => {
      if (!uri.startsWith('file://') && !uri.includes('cache')) return; // skip remote

      const filename = uri.split('/').pop() || `site_image_${index}.jpg`;
      const type = 'image/jpeg';

      formData.append('files', {
        uri,
        name: filename,
        type,
      });
    });

    if ([...formData._parts].length === 0) return;

    return multipartRequest(
      'POST',
      endpoints.projectImages(projectId),
      formData,
    );
  },
  getSiteImages: id => queryRequest(endpoints.projectImages(id)),
  updateStatus: (id, status) =>
    jsonRequest('PUT', endpoints.projectStatus(id), status),
  getInvoicePdf: async id => {
    const res = await fetch(buildUrl(endpoints.projectInvoice(id)));
    return handleResponse(res, 'blob');
  },
  createAdvance: payload => jsonRequest('POST', endpoints.advances, payload),
  getAdvances: projectId =>
    queryRequest(endpoints.advancesByProject(projectId)),
  createItem: payload => jsonRequest('POST', endpoints.items, payload),
  getItems: projectId => queryRequest(endpoints.itemsByProject(projectId)),
  updateItem: (id, payload) =>
    jsonRequest('PUT', endpoints.itemById(id), payload),
  deleteItem: id => deleteRequest(endpoints.itemById(id)),
  createPaymentIn: payload =>
    jsonRequest('POST', endpoints.paymentsIn, payload),
  getPaymentsIn: projectId =>
    queryRequest(endpoints.paymentsInByProject(projectId)),
  createPaymentOut: payload =>
    jsonRequest('POST', endpoints.paymentsOut, payload),
  getPaymentsOut: projectId =>
    queryRequest(endpoints.paymentsOutByProject(projectId)),
  getProjectItems: projectId =>
    queryRequest(endpoints.itemsByProject(projectId)),
};

export const QuotationAPI = {
  // Quotations CRUD
  create: payload => jsonRequest('POST', endpoints.quotations, payload),
  getById: id => queryRequest(endpoints.quotationById(id)),
  getAll: () => queryRequest(endpoints.quotations),
  update: (id, payload) =>
    jsonRequest('PUT', endpoints.quotationById(id), payload),
  delete: id => deleteRequest(endpoints.quotationById(id)),

  // Items
  createItem: payload => jsonRequest('POST', endpoints.quotationItems, payload),
  updateItem: (itemId, payload) =>
    jsonRequest('PUT', endpoints.quotationItemById(itemId), payload),
  deleteItem: itemId => deleteRequest(endpoints.quotationItemById(itemId)),
  getItems: quotationId =>
    queryRequest(endpoints.quotationItemsByQuotation(quotationId)),

  // Search and filters
  searchByCustomerName: customerName =>
    queryRequest(endpoints.quotationsSearch, { customerName }),
  searchByCustomerContactNo: customerContactNo =>
    queryRequest(endpoints.quotationsSearch, { customerContactNo }),
  getByCustomerId: customerId =>
    queryRequest(endpoints.quotationsByCustomerId(customerId)),
};

export const UnitAPI = {
  create: payload => jsonRequest('POST', endpoints.units, payload),
  getById: id => queryRequest(endpoints.unitById(id)),
  getAll: () => queryRequest(endpoints.units),
  update: (id, payload) => jsonRequest('PUT', endpoints.unitById(id), payload),
  delete: id => deleteRequest(endpoints.unitById(id)),
};

export const UserAPI = {
  // Basic CRUD operations
  create: payload => jsonRequest('POST', endpoints.users, payload),
  getById: id => queryRequest(endpoints.userById(id)),
  getAll: () => queryRequest(endpoints.users),
  update: (id, payload) => jsonRequest('PUT', endpoints.userById(id), payload),
  delete: id => deleteRequest(endpoints.userById(id)),
  bulkDelete: ids => deleteRequest(`${endpoints.users}?ids=${ids.join(',')}`),

  // Role operations
  getRoleById: id => queryRequest(endpoints.userRole(id)),
  updateRoleById: (id, payload) =>
    jsonRequest('PUT', endpoints.userRole(id), payload),
  getRoleByUsername: username =>
    queryRequest(endpoints.userRoleByUsername(username)),

  // Password operations
  getPasswordById: id => queryRequest(endpoints.userPassword(id)),
  updatePasswordById: (id, payload) =>
    jsonRequest('PUT', endpoints.userPassword(id), payload),
  getPasswordByUsername: username =>
    queryRequest(endpoints.userPasswordByUsername(username)),
};
