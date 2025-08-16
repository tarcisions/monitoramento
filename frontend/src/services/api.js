import axios from 'axios'
import { getToken, removeToken } from './auth'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const robosAPI = {
  listar: () => api.get('/robos/'),
  obter: (id) => api.get(`/robos/${id}/`),
  criar: (dados) => api.post('/robos/', dados),
  atualizar: (id, dados) => api.put(`/robos/${id}/`, dados),
  deletar: (id) => api.delete(`/robos/${id}/`),
  ping: (id) => api.post(`/robos/${id}/ping/`),
  estatisticas: () => api.get('/robos/estatisticas/'),
}

export const jobsAPI = {
  listar: () => api.get('/jobs/'),
  obter: (id) => api.get(`/jobs/${id}/`),
  criar: (dados) => api.post('/jobs/', dados),
  atualizar: (id, dados) => api.put(`/jobs/${id}/`, dados),
  deletar: (id) => api.delete(`/jobs/${id}/`),
  estatisticas: () => api.get('/jobs/estatisticas/'),
}

export const execucoesAPI = {
  listar: (params = {}) => api.get('/execucoes/', { params }),
  obter: (id) => api.get(`/execucoes/${id}/`),
  criar: (dados) => api.post('/execucoes/', dados),
  iniciar: (id) => api.post(`/execucoes/${id}/iniciar/`),
  pausar: (id) => api.post(`/execucoes/${id}/pausar/`),
  parar: (id) => api.post(`/execucoes/${id}/parar/`),
  retomar: (id) => api.post(`/execucoes/${id}/retomar/`),
  logs: (id) => api.get(`/execucoes/${id}/logs/`),
  estatisticas: () => api.get('/execucoes/estatisticas/'),
}

export const logsAPI = {
  listar: (params = {}) => api.get('/logs/', { params }),
}

export const statusAPI = {
  listar: () => api.get('/status/'),
}

export default api
