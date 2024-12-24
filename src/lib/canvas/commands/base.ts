import { CommandMeta, InteractionCommand } from "@/types"

export abstract class BaseCommand implements InteractionCommand {
  readonly targetId: string
  readonly meta: CommandMeta = {
    timestamp: Date.now(),
    debug: {},
  }
  protected debug: boolean
  constructor(
    targetId: string = crypto.randomUUID().substring(0, 4),
    debug: boolean = false
  ) {
    this.targetId = targetId
    this.debug = debug
  }

  abstract get type(): string
  abstract execute(): void
  abstract undo(): void

  redo(): void {
    this.execute()
  }

  protected log(message: string, data?: Record<string, unknown>): void {
    if (!this.debug) return

    console.debug(`[${this.type}] ${message}`, {
      targetId: this.targetId,
      timestamp: this.meta.timestamp,
      ...data,
    })
  }

  protected addDebugInfo(key: string, value: unknown): void {
    if (!this.debug) return
    this.meta.debug = { ...this.meta.debug, [key]: value }
  }
}
