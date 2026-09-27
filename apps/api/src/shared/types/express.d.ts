declare global {
  namespace Express {
    interface Request {
      userId?: string
      /** Correlation id for the in-flight request, set by LoggingInterceptor. */
      requestId?: string
    }
  }
}

export {}
