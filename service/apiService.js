import { BASE_URL, endpoints, buildUrl } from './configuration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { logoutUser } from '../utils/sessionManager';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let logoutCallback = null;
export const setLogoutCallback = cb => {
  logoutCallback = cb;
};

const clearAuthStorage = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'user']);
  } catch (e) {
    console.error('Error clearing auth storage:', e);
  }
};

api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  async error => {
    const customError = new Error(
      error.response?.data?.message ||
        error.message ||
        'An unknown error occurred',
    );
    customError.status = error.response?.status;
    customError.data = error.response?.data || {};

    if (customError.status === 401) {
      await clearAuthStorage();

      Alert.alert('Session Expired', 'Please log in again.', [
        { text: 'OK', onPress: () => logoutUser() },
      ]);

      if (logoutCallback && typeof logoutCallback === 'function') {
        logoutCallback();
      }
    }

    return Promise.reject(customError);
  },
);

async function handleResponse(response, parse = 'json') {
  const { status, data } = response;

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
  console.log('Response:', response);
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
  updateStatus: (id, payload) =>
    jsonRequest('PATCH', endpoints.updateCustomerStatus(id), payload),
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
  updateVoice: (id, file, exist = false) => {
    const formData = new FormData();
    if (!exist) {
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
    } else {
      const filename = `voice_note_${id}.mp3`;
      formData.append('name', filename);
      formData.append('file', {
        uri: file,
        name: filename,
        type: 'audio/mpeg',
      });
    }

    return multipartRequest('POST', endpoints.projectVoice(id), formData);
  },
  addSiteImages: async (projectId, imageUris = [], fromQuotation = false) => {
    const formData = new FormData();

    if (!fromQuotation) {
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
    } else {
      imageUris.forEach((uri, index) => {
        if (!uri) return;
        const filename = `site_image_${index}.jpg`;
        const type = 'image/jpeg';
        formData.append('files', {
          uri,
          name: filename,
          type,
        });
      });
    }

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
  addItemImages: async (itemId, imageUris = [], exist = false) => {
    const formData = new FormData();

    if (!exist) {
      imageUris.forEach((uri, index) => {
        if (!uri || (!uri.startsWith('file://') && !uri.includes('cache')))
          return;
        const filename = uri.split('/').pop() || `item_image_${index}.jpg`;
        const type = 'image/jpeg';
        formData.append('files', {
          uri,
          name: filename,
          type,
        });
      });
    } else {
      imageUris.forEach((uri, index) => {
        console.log('uri', uri);
        if (!uri) return;

        const fileUri = typeof uri === 'string' ? uri : uri.imageUrl;

        if (!fileUri) return;

        const filename = `item_image_${index}.jpg`;
        const type = 'image/jpeg';

        formData.append('files', {
          uri: fileUri,
          name: filename,
          type,
        });
      });
    }

    if ([...formData._parts].length === 0) return;

    return multipartRequest(
      'POST',
      endpoints.projectItemImages(itemId),
      formData,
    );
  },

  deleteItemImage: (itemId, imageId) =>
    deleteRequest(endpoints.projectItemImageById(itemId, imageId)),
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
  getPendingPayments: () => queryRequest(endpoints.pendingPayments),
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
  updateQuotationStatus: (id, payload) =>
    jsonRequest('PATCH', `${endpoints.quotationById(id)}/status`, payload),

  getVoiceRecordings: id => queryRequest(endpoints.quotationVoice(id)),
  addVoiceRecording: (id, file) => {
    const formData = new FormData();
    if (file && (file.startsWith('file://') || file.includes('cache'))) {
      const filename = file.split('/').pop() || `voice_note_${id}.mp3`;
      const type = 'audio/mpeg';
      formData.append('name', filename);
      formData.append('file', {
        uri: file,
        name: filename,
        type,
      });
    }
    return multipartRequest('POST', endpoints.quotationVoice(id), formData);
  },
  updateVoiceRecording: (id, voiceId, { name, file } = {}) => {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (file && (file.startsWith('file://') || file.includes('cache'))) {
      const filename = file.split('/').pop() || `voice_note_${id}.mp3`;
      const type = 'audio/mpeg';
      formData.append('file', { uri: file, name: filename, type });
    }
    return multipartRequest(
      'PUT',
      endpoints.quotationVoiceById(id, voiceId),
      formData,
    );
  },
  deleteVoiceRecording: (id, voiceId) =>
    deleteRequest(endpoints.quotationVoiceById(id, voiceId)),

  updateLocation: (id, payload) =>
    jsonRequest('POST', endpoints.quotationLocation(id), payload),

  getSiteImages: id => queryRequest(endpoints.quotationImages(id)),
  addSiteImages: async (quotationId, imageUris = []) => {
    const formData = new FormData();

    imageUris.forEach((uri, index) => {
      if (!uri || (!uri.startsWith('file://') && !uri.includes('cache')))
        return;
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
      endpoints.quotationImages(quotationId),
      formData,
    );
  },

  addItemImages: async (itemId, imageUris = []) => {
    const formData = new FormData();

    imageUris.forEach((uri, index) => {
      if (!uri || (!uri.startsWith('file://') && !uri.includes('cache')))
        return;
      const filename = uri.split('/').pop() || `item_image_${index}.jpg`;
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
      endpoints.quotationItemImages(itemId),
      formData,
    );
  },

  deleteItemImage: (itemId, imageId) =>
    deleteRequest(endpoints.quotationItemImageById(itemId, imageId)),
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

export const AuthAPI = {
  login: async payload => {
    const res = await jsonRequest('POST', endpoints.authLogin, payload);
    try {
      const token =
        res?.data || res?.token || res?.data?.accessToken || res?.accessToken;
      if (token) await AsyncStorage.setItem('token', token);
    } catch (e) {}
    return res;
  },
  workerLogin: async payload => {
    const res = await jsonRequest('POST', endpoints.authWorkerLogin, payload);
    try {
      const token =
        res?.data || res?.token || res?.data?.accessToken || res?.accessToken;
      if (token) await AsyncStorage.setItem('token', token);
    } catch (e) {}
    return res;
  },
};
