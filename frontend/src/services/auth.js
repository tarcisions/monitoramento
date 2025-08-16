import axios from 'axios'

const TOKEN_KEY = 'rpa_access_token'
const REFRESH_TOKEN_KEY = 'rpa_refresh_token'

export const login = async (username, password) => {
  try {
    const response = await axios.post('/api/auth/login/', {
      username,
      password
    })

    const { access, refresh } = response.data
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)

    return { success: true, data: response.data }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Erro ao fazer login' 
    }
  }
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const agora = Date.now() / 1000
    return payload.exp > agora
  } catch {
    return false
  }
}

export const getUserFromToken = () => {
  const token = getToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      username: payload.nome_usuario,
      email: payload.email,
      isAdmin: payload.eh_admin,
      grupos: payload.grupos || []
    }
  } catch {
    return null
  }
}

export const refreshToken = async () => {
  try {
    const refresh = getRefreshToken()
    if (!refresh) return false

    const response = await axios.post('/api/auth/refresh/', {
      refresh
    })

    const { access } = response.data
    localStorage.setItem(TOKEN_KEY, access)
    return true
  } catch {
    removeToken()
    return false
  }
}
