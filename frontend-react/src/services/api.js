import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Servo APIs
export const getServos = async () => {
  const response = await api.get('/api/servos')
  return response.data
}

export const setServoAngle = async (servoId, angle) => {
  const response = await api.post(`/api/servos/${servoId}/angle`, { angle })
  return response.data
}

export const getServoPosition = async (servoId) => {
  const response = await api.get(`/api/servos/${servoId}/position`)
  return response.data
}

export const getAllPositions = async () => {
  const response = await api.get('/api/servos/positions')
  return response.data
}

export const addServo = async (servoId, config) => {
  const response = await api.post('/api/servos', { servo_id: servoId, config })
  return response.data
}

export const updateServo = async (servoId, config) => {
  const response = await api.put(`/api/servos/${servoId}`, config)
  return response.data
}

export const removeServo = async (servoId) => {
  const response = await api.delete(`/api/servos/${servoId}`)
  return response.data
}

export const sweepServo = async (servoId, params = {}) => {
  const response = await api.post(`/api/servos/${servoId}/sweep`, params)
  return response.data
}

export const centerAllServos = async () => {
  const response = await api.post('/api/servos/center_all')
  return response.data
}

// Health API
export const checkHealth = async () => {
  const response = await api.get('/api/health')
  return response.data
}

export default api
