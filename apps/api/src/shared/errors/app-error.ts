export interface AppErrorDetail {
  path: string
  message: string
}

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: AppErrorDetail[]

  constructor(statusCode: number, code: string, message: string, details?: AppErrorDetail[]) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
