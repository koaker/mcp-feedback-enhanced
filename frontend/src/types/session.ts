// 会话状态枚举
export type SessionStatus =
  | 'waiting'
  | 'active'
  | 'feedback_submitted'
  | 'completed'
  | 'error'
  | 'timeout'
  | 'expired'

// 用户消息记录
export interface UserMessage {
  timestamp: number
  content: string
  images: ImageItem[]
  submission_method: string
  type: string
}

// 会话信息
export interface Session {
  session_id: string
  project_directory: string
  summary: string
  status: SessionStatus
  status_message: string
  created_at: number
  last_activity: number
  feedback_completed: boolean
  has_websocket: boolean
  is_current: boolean
  user_messages: UserMessage[]
}

// 当前会话详情
export interface CurrentSession {
  session_id: string
  project_directory: string
  summary: string
  feedback_completed: boolean
  command_logs: string[]
  images_count: number
}

// 图片项
export interface ImageItem {
  name: string
  data: string // base64
  size: number
}

// 会话状态（简要）
export interface SessionStatusInfo {
  has_session: boolean
  status: string
  session_info?: {
    project_directory: string
    summary: string
    feedback_completed: boolean
  }
  messageCode?: string
}
