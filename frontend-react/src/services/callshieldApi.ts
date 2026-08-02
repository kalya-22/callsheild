function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8000/api/v1'
  }

  const host = window.location.hostname
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api/v1'
  }

  return `${window.location.protocol}//${host}:8000/api/v1`
}

export const API_BASE_URL =
  import.meta.env.VITE_CALLSHIELD_API_BASE_URL ?? getDefaultApiBaseUrl()

export type RiskLevel = 'low' | 'medium' | 'high'

export type ChunkPrediction = {
  chunk_id: string
  start_time_seconds: number
  end_time_seconds: number
  predicted_label: string
  raw_predicted_label?: string
  ai_probability: number
  ai_confidence_percent?: number
  risk_level?: RiskLevel
  warning?: boolean
}

export type PredictionResult = {
  prediction_id?: number
  filename: string
  predicted_label: string
  ai_probability: number
  ai_confidence_percent?: number
  risk_level: RiskLevel
  warning: boolean
  chunk_count: number
  ai_chunk_count?: number
  average_ai_confidence?: number
  average_ai_confidence_percent?: number
  overall_risk_score?: number
  overall_risk_percent?: number
  final_call_verdict?: string
  created_at?: string
  chunk_predictions: ChunkPrediction[]
}

export type LiveChunkResult = {
  chunk_id: string
  predicted_label: string
  ai_probability: number
  ai_confidence_percent: number
  risk_level: RiskLevel
  warning: boolean
  chunk_count: number
  current_chunk_risk: number
  current_chunk_risk_percent: number
  final_call_verdict: string
}

export type CallRiskSummary = {
  currentChunkRisk: number
  overallCallRisk: number
  aiChunks: number
  totalChunks: number
  averageAiConfidence: number
  finalCallVerdict: string
  warning: boolean
  callDurationSeconds?: number
}

export type BackendStatus = {
  service: string
  status: string
  model_ready: boolean
  database_ready: boolean
  features_ready: boolean
  prediction_count: number
  model_path: string
  database_path: string
}

export type HistoryItem = {
  prediction_id: number
  filename: string
  predicted_label: string
  ai_probability: number
  risk_level: RiskLevel
  warning: boolean
  chunk_count: number
  created_at: string
}


export type AuthResponse = {
  token: string
  user: {
    user_id: number
    full_name: string
    email: string
  }
}

export type AuthUser = AuthResponse['user']

export type AuthError = {
  detail?: string
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function getStatus(): Promise<BackendStatus> {
  return readJson<BackendStatus>(await fetch(`${API_BASE_URL}/status`))
}

export async function predictAudio(file: File): Promise<PredictionResult> {
  const formData = new FormData()
  formData.append('file', file)
  return readJson<PredictionResult>(
    await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    }),
  )
}

export async function predictChunk(blob: Blob, filename = 'live_chunk.wav'): Promise<LiveChunkResult> {
  const formData = new FormData()
  formData.append('file', blob, filename)
  return readJson<LiveChunkResult>(
    await fetch(`${API_BASE_URL}/predict-chunk`, {
      method: 'POST',
      body: formData,
    }),
  )
}

export async function getHistory(limit = 50): Promise<HistoryItem[]> {
  return readJson<HistoryItem[]>(await fetch(`${API_BASE_URL}/history?limit=${limit}`))
}

export async function clearHistory(): Promise<void> {
  await readJson(await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' }))
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem('callshield_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export async function googleSignIn(idToken: string, clientId?: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, client_id: clientId }),
  })
}

export async function loginUser(email: string, password: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function signupUser(fullName: string, email: string, password: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password }),
  })
}

export async function readAuthError(response: Response): Promise<string> {
  try {
    const body = await response.json() as AuthError
    return body.detail || `Authentication failed with status ${response.status}`
  } catch {
    return `Authentication failed with status ${response.status}`
  }
}
