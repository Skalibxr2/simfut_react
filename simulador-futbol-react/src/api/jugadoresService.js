import { httpRequest } from './httpClient.js'

const BASE_PATH = '/api/jugadores'

export function fetchJugadores(signal) {
  return httpRequest(BASE_PATH, { signal })
}

export function createJugador(payload) {
  return httpRequest(BASE_PATH, { method: 'POST', body: payload })
}

export function updateJugador(id, payload) {
  return httpRequest(`${BASE_PATH}/${id}`, { method: 'PUT', body: payload })
}

export function deleteJugador(id) {
  return httpRequest(`${BASE_PATH}/${id}`, { method: 'DELETE' })
}
