import axios, { AxiosError } from 'axios'
import { env } from '../config/env'

type ApiError = { error?: string }

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})

httpClient.interceptors.request.use((config) => {
  const passcode = sessionStorage.getItem('trunov-passcode')
  if (passcode) config.headers.set('x-passcode', passcode)
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => Promise.reject(new Error(
    error.response?.data.error ??
    (error.code === 'ECONNABORTED' ? 'Request timed out' : 'Unable to reach the server'),
  )),
)
