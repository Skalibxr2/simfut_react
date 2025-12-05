const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
let authToken = null

export function setAuthToken(token) {
  authToken = token || null
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return null
}

function buildHeaders(body, customHeaders) {
  const headers = { ...(customHeaders || {}) }
  const isFormData = body instanceof FormData
  if (body && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  return headers
}

export async function httpRequest(path, { method = 'GET', body, headers, ...rest } = {}) {
  const requestBody = body && !(body instanceof FormData) ? JSON.stringify(body) : body
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    body: requestBody,
    headers: buildHeaders(body, headers),
    ...rest,
  })

  const data = await parseBody(response).catch(() => null)

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Error en la solicitud'
    throw new Error(message)
  }

  return data
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
