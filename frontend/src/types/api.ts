// REST API 响应类型

export interface TranslationsResponse {
  'zh-TW': Record<string, unknown>
  'zh-CN': Record<string, unknown>
  en: Record<string, unknown>
}

export interface ApiResponse<T = unknown> {
  status?: 'success' | 'error'
  messageCode?: string
  error?: string
  data?: T
}

export interface SessionHistoryData {
  sessions: unknown[]
  lastCleanup: number
}

export interface Settings {
  layoutMode?: string
  logLevel?: string
  enable_base64_detail?: boolean
  image_size_limit?: number
  language?: string
  autoSubmitEnabled?: boolean
  autoSubmitSeconds?: number
  timeoutEnabled?: boolean
  timeoutSeconds?: number
  theme?: 'dark' | 'light'
  [key: string]: unknown
}

export interface LogLevelResponse {
  logLevel: string
}
