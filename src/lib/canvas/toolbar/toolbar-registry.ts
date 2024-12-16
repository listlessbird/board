import {
  ObjectTypeMap,
  ToolbarAction,
  ToolbarActionGroup,
  ToolbarActionRegistry,
} from "@/types"

class ToolbarRegistry {
  private static instance: ToolbarRegistry
  private actions: ToolbarActionRegistry = {} as ToolbarActionRegistry
  private groups: ToolbarActionGroup[] = []

  private constructor() {
    // register default groups
    this.registerGroup({ id: "general", label: "General", order: 0 })
    this.registerGroup({ id: "transform", label: "Transform", order: 1 })
    this.registerGroup({ id: "style", label: "Style", order: 2 })
  }

  static getInstance() {
    if (!ToolbarRegistry.instance) {
      ToolbarRegistry.instance = new ToolbarRegistry()
    }
    return ToolbarRegistry.instance
  }

  registerGroup(group: ToolbarActionGroup) {
    this.groups.push(group)
    this.groups.sort((a, b) => a.order - b.order)
  }
  registerAction<T extends keyof ObjectTypeMap>(
    objectType: T,
    action: ToolbarAction
  ) {
    if (!this.actions[objectType]) {
      this.actions[objectType] = []
    }

    this.actions[objectType].push(action)

    // sort actions by order
    this.actions[objectType].sort((a, b) => {
      const groupA = this.groups.find((g) => g.id === a.group)
      const groupB = this.groups.find((g) => g.id === b.group)

      if (groupA && groupB) {
        if (groupA.order !== groupB.order) {
          return groupA.order - groupB.order
        }
      }

      return (a.order || 0) - (b.order || 0)
    })
  }

  getActions<T extends keyof ObjectTypeMap>(
    objectType: T,
    obj: ObjectTypeMap[T]
  ): ToolbarAction[] {
    const actions = this.actions[objectType] || []
    return actions.filter((a) => !a.isVisible || a.isVisible(obj))
  }
  getGroups(): ToolbarActionGroup[] {
    return [...this.groups]
  }
}

export const toolbarRegistry = ToolbarRegistry.getInstance()
