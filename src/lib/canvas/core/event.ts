export class CanvasEventEmitter<
  Events extends Record<string, (...args: any[]) => void>
> {
  private listeners: {
    [K in keyof Events]?: Set<Events[K]>
  } = {}

  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): void {
    const eventListeners = this.listeners[event]
    if (!eventListeners) return

    eventListeners.forEach((listener) => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error)
      }
    })
  }

  /**
   * Register a listener for the given event.
   * @param event The event to listen for.
   * @param listener The listener to register.
   * @returns A function that unregisters the listener.
   */
  on<E extends keyof Events>(event: E, listener: Events[E]): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }

    this.listeners[event]!.add(listener)

    return () => {
      this.listeners[event]!.delete(listener)

      if (this.listeners[event]!.size === 0) {
        delete this.listeners[event]
      }
    }
  }

  /**
   * Remove a listener for the given event.
   * @param event The event to remove the listener from.
   * @param listener The listener to remove.
   */
  off<E extends keyof Events>(event: E, listener: Events[E]): void {
    if (!this.listeners[event]) return

    this.listeners[event]!.delete(listener)

    if (this.listeners[event]!.size === 0) {
      delete this.listeners[event]
    }
  }

  /**
   * Remove all listeners for the given event.
   * @param event The event to remove all listeners from.
   */
  clear(event?: keyof Events): void {
    if (event) {
      delete this.listeners[event]
    } else {
      this.listeners = {}
    }
  }
}
