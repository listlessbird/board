import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface LoggerOptions {
  enabled?: boolean
  prefix?: string
}

export class Logger {
  private enabled: boolean
  private prefix: string

  constructor(namespace: string, options: LoggerOptions = {}) {
    this.enabled = options.enabled ?? process.env.NODE_ENV === "development"
    this.prefix = options.prefix ?? `[${namespace}]`
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return
    console.debug(`${this.prefix} ${message}`, data)
  }

  error(message: string, error?: unknown): void {
    if (!this.enabled) return
    console.error(`${this.prefix} ${message}`, error)
  }
}

export function createLogger(
  namespace: string,
  options?: LoggerOptions
): Logger {
  return new Logger(namespace, options)
}
