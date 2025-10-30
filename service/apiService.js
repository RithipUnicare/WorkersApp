import { BASE_URL, endpoints, buildUrl } from './configuration';
import axios from 'axios';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    const customError = new Error(
      error.response?.data?.message ||
        error.message ||
        'An unknown error occurred',
    );
    customError.status = error.response?.status;
    customError.data = error.response?.data || {};
    return Promise.reject(customError);
  },
);

async function handleResponse(response, parse = 'json') {
  const { status, data } = response;
  console.log(status, data);
  if (status >= 400) {
    const error = new Error(response.data?.message || `HTTP ${status}`);
    error.status = status;
    error.data = response.data || {};
    throw error;
  }

  if (status === 204) return null;
  if (parse === 'blob') return data;
  if (parse === 'text')
    return typeof data === 'string' ? data : JSON.stringify(data);
  return data;
}

async function jsonRequest(method, path, body, headers = {}) {
  const url = buildUrl(path);
  const config = { headers };

  const response = await api.request({
    method,
    url,
    data: body,
    ...config,
  });

  return handleResponse(response, 'json');
}

async function queryRequest(path, query) {
  const url = buildUrl(path, query);
  const response = await api.get(url);
  return handleResponse(response, 'json');
}

async function deleteRequest(path) {
  const url = buildUrl(path);
  const response = await api.delete(url);
  return handleResponse(response);
}

async function multipartRequest(method, path, formData) {
  const url = buildUrl(path);
  const response = await api.request({
    method,
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return handleResponse(response, 'json');
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
      formData.append('name', filename);
      formData.append('file', {
        uri: file,
        name: filename,
        type,
      });
    }
    return multipartRequest('POST', endpoints.projectVoice(id), formData);
  },
  addSiteImages: async (projectId, imageUris = []) => {
    const formData = new FormData();

    imageUris.forEach((uri, index) => {
      if (!uri.startsWith('file://') && !uri.includes('cache')) return;

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
    const url = buildUrl(endpoints.projectInvoice(id));
    const response = await api.get(url, { responseType: 'blob' });
    return handleResponse(response, 'blob');
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
  updatePaymentIn: (id, payload) =>
    jsonRequest('PUT', endpoints.paymentsInById(id), payload),
  deletePaymentIn: id => deleteRequest(endpoints.paymentsInById(id)),
  createPaymentOut: payload =>
    jsonRequest('POST', endpoints.paymentsOut, payload),
  getPaymentsOut: projectId =>
    queryRequest(endpoints.paymentsOutByProject(projectId)),
  updatePaymentOut: (id, payload) =>
    jsonRequest('PUT', endpoints.paymentsOutById(id), payload),
  deletePaymentOut: id => deleteRequest(endpoints.paymentsOutById(id)),
  getProjectItems: projectId =>
    queryRequest(endpoints.itemsByProject(projectId)),
  deleteSiteImage: id => deleteRequest(endpoints.projectImages(id)),
  deleteVoiceRecording: (id, voiceId) =>
    deleteRequest(`${endpoints.projectVoice(id)}/${voiceId}`),
};

export const QuotationAPI = {
  create: payload => jsonRequest('POST', endpoints.quotations, payload),
  getById: id => queryRequest(endpoints.quotationById(id)),
  getAll: () => queryRequest(endpoints.quotations),
  update: (id, payload) =>
    jsonRequest('PUT', endpoints.quotationById(id), payload),
  delete: id => deleteRequest(endpoints.quotationById(id)),

  createItem: payload => jsonRequest('POST', endpoints.quotationItems, payload),
  updateItem: (itemId, payload) =>
    jsonRequest('PUT', endpoints.quotationItemById(itemId), payload),
  deleteItem: itemId => deleteRequest(endpoints.quotationItemById(itemId)),
  getItems: quotationId =>
    queryRequest(endpoints.quotationItemsByQuotation(quotationId)),

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
  create: payload => jsonRequest('POST', endpoints.users, payload),
  getById: id => queryRequest(endpoints.userById(id)),
  getAll: () => queryRequest(endpoints.users),
  update: (id, payload) => jsonRequest('PUT', endpoints.userById(id), payload),
  delete: id => deleteRequest(endpoints.userById(id)),
  bulkDelete: ids => deleteRequest(`${endpoints.users}?ids=${ids.join(',')}`),

  getRoleById: id => queryRequest(endpoints.userRole(id)),
  updateRoleById: (id, payload) =>
    jsonRequest('PUT', endpoints.userRole(id), payload),
  getRoleByUsername: username =>
    queryRequest(endpoints.userRoleByUsername(username)),

  getPasswordById: id => queryRequest(endpoints.userPassword(id)),
  updatePasswordById: (id, payload) =>
    jsonRequest('PUT', endpoints.userPassword(id), payload),
  getPasswordByUsername: username =>
    queryRequest(endpoints.userPasswordByUsername(username)),
};
