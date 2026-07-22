import { apiRequest } from './api'
import type { AuthResponse, User } from '../types/auth'

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getAuthenticatedUser() {
  return apiRequest<{ user: User }>('/user')
}

export function logout() {
  return apiRequest<{ message: string }>('/logout', { method: 'POST' })
}
