import type { AnalyzeArtResponse } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const ANALYZE_ENDPOINT = import.meta.env.VITE_ANALYZE_ENDPOINT ?? '/api/analyze-art'

function buildAnalyzeUrl() {
  const endpoint = ANALYZE_ENDPOINT.startsWith('/') ? ANALYZE_ENDPOINT : `/${ANALYZE_ENDPOINT}`
  return `${API_BASE_URL}${endpoint}`
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const maybeDetail = (data as { detail?: unknown }).detail
  if (typeof maybeDetail === 'string' && maybeDetail.trim()) {
    return maybeDetail
  }

  return null
}

export async function analyzeArtwork(file: File): Promise<AnalyzeArtResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(buildAnalyzeUrl(), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const payload = await response.json()
      const parsedDetail = extractErrorMessage(payload)
      if (parsedDetail) {
        detail = parsedDetail
      }
    } catch {
      // keep default detail
    }
    throw new Error(detail)
  }

  return (await response.json()) as AnalyzeArtResponse
}
