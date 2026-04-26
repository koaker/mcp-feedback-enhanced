// WebSocket 消息类型定义

// 服务端 → 客户端
export type ServerMessage =
  | ConnectionEstablishedMessage
  | SessionUpdatedMessage
  | StatusUpdateMessage
  | CommandOutputMessage
  | CommandCompleteMessage
  | CommandErrorMessage
  | NotificationMessage
  | HeartbeatResponseMessage
  | PingMessage

export interface ConnectionEstablishedMessage {
  type: 'connection_established'
  messageCode: string
}

export interface SessionUpdatedMessage {
  type: 'session_updated'
  action: string
  messageCode: string
  session_info: {
    session_id: string
    project_directory: string
    summary: string
    status: string
  }
}

export interface StatusUpdateMessage {
  type: 'status_update'
  status_info: {
    status: string
    message: string
    feedback_completed: boolean
    has_websocket: boolean
    created_at: number
    last_activity: number
    project_directory: string
    summary: string
    session_id: string
  }
}

export interface CommandOutputMessage {
  type: 'command_output'
  output: string
}

export interface CommandCompleteMessage {
  type: 'command_complete'
  exit_code: number
}

export interface CommandErrorMessage {
  type: 'command_error'
  error: string
}

export interface NotificationMessage {
  type: 'notification'
  code: string
  severity: 'success' | 'warning' | 'error' | 'info'
  status?: string
  reason?: string
}

export interface HeartbeatResponseMessage {
  type: 'heartbeat_response'
  timestamp: number
}

export interface PingMessage {
  type: 'ping'
  timestamp: number
}

// 客户端 → 服务端
export type ClientMessage =
  | SubmitFeedbackMessage
  | RunCommandMessage
  | GetStatusMessage
  | HeartbeatMessage
  | UserTimeoutMessage
  | PongMessage
  | UpdateTimeoutSettingsMessage

export interface SubmitFeedbackMessage {
  type: 'submit_feedback'
  feedback: string
  images: Array<{ name: string; data: string; size: number }>
  settings?: {
    image_size_limit?: number
    enable_base64_detail?: boolean
  }
}

export interface RunCommandMessage {
  type: 'run_command'
  command: string
}

export interface GetStatusMessage {
  type: 'get_status'
}

export interface HeartbeatMessage {
  type: 'heartbeat'
  timestamp: number
}

export interface UserTimeoutMessage {
  type: 'user_timeout'
}

export interface PongMessage {
  type: 'pong'
  timestamp: number
}

export interface UpdateTimeoutSettingsMessage {
  type: 'update_timeout_settings'
  settings: {
    enabled: boolean
    seconds?: number
  }
}
