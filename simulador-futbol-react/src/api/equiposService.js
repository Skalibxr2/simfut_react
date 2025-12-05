import { httpRequest } from './httpClient.js'

const BASE_PATH = '/api/equipos'

export function fetchEquipos(signal) {
  return httpRequest(BASE_PATH, { signal })
}

export function createEquipo(payload) {
  return httpRequest(BASE_PATH, { method: 'POST', body: payload })
}

export function updateEquipo(id, payload) {
  return httpRequest(`${BASE_PATH}/${id}`, { method: 'PUT', body: payload })
}

export function deleteEquipo(id) {
  return httpRequest(`${BASE_PATH}/${id}`, { method: 'DELETE' })
}
