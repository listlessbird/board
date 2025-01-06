import { BaseObject } from "@/lib/canvas/objects/base"

export class SelectionManager {
  private selectedObjects: Set<BaseObject>
  private listeners: Set<() => void> = new Set()

  constructor() {
    console.log("[DEBUG] SelectionManager created")
    this.selectedObjects = new Set()
    this.listeners = new Set()
  }

  select(object: BaseObject): void {
    if (!object) {
      console.warn("[DEBUG] Attempted to select null object")
      return
    }
    console.debug("[DEBUG] SelectionManager selecting:", {
      objId: object.id,
      type: object.type,
      currentSelections: Array.from(this.selectedObjects).map((o) => o.id),
    })
    this.clearSelection()
    object.selected = true
    this.selectedObjects.add(object)
    this.notifyListeners()
  }

  clearSelection(): void {
    if (this.selectedObjects.size === 0) return

    this.selectedObjects.forEach((o) => (o.selected = false))
    this.selectedObjects.clear()
    this.notifyListeners()
  }

  getSelectedObjects(): BaseObject[] {
    return Array.from(this.selectedObjects)
  }

  /**
   * Subscribe to selection changes
   * @param listener - callback to be called when selection changes
   * @returns - unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    console.log("[DEBUG] SelectionManager notifying listeners")
    this.listeners.forEach((listenerfn) => listenerfn())
  }
}
