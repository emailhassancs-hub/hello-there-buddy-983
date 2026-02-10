import { SigninPayload, SigninResponse, SignupPayload } from '@/types/auth.types'
import { apiFetch } from './api'

export async function signup(payload: SignupPayload): Promise<{ success: boolean, message?: string }> {
  return apiFetch('/auth/signup', { method: 'POST', body: payload, skipAuth: true })
}

export async function signin(payload: SigninPayload): Promise<SigninResponse> {
  return apiFetch('/auth/signin', { method: 'POST', body: payload, skipAuth: true })
}

export async function verifyEmail(token: string): Promise<{ success: boolean, isApproved: boolean }> {
  return apiFetch('/auth/verify-email', { method: 'POST', body: { token }, skipAuth: true })
}

export async function resendVerification(email: string): Promise<{ success: boolean }> {
  return apiFetch('/auth/resend-verification', { method: 'POST', body: { email }, skipAuth: true })
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: { email }, skipAuth: true })
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean, message: string }> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: { token, password }, skipAuth: true })
}

