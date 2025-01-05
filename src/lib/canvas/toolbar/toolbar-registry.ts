import {
  GlobalToolbarAction,
  ObjectToolbarAction,
  ObjectTypeMap,
  ToolbarActionGroup,
  ToolbarActionRegistry,
} from "@/types"

class ToolbarRegistry {
  private static instance: ToolbarRegistry
  private actions: ToolbarActionRegistry = {
    global: [],
    objectSpecific: {} as ToolbarActionRegistry["objectSpecific"],
  }
  private groups: ToolbarActionGroup[] = []

  private constructor() {
    // register default groups
    this.registerGroup({ id: "global", label: "Global Actions", order: 0 })
    this.registerGroup({ id: "general", label: "General", order: 1 })
    this.registerGroup({ id: "transform", label: "Transform", order: 2 })
    this.registerGroup({ id: "style", label: "Style", order: 3 })
  }

  static getInstance() {
    if (!ToolbarRegistry.instance) {
      ToolbarRegistry.instance = new ToolbarRegistry()
    }
    console.log("GETTING TOOLBAR INSTANCE")
    console.log("toolbar", ToolbarRegistry.instance)
    return ToolbarRegistry.instance
  }

  registerGroup(group: ToolbarActionGroup) {
    this.groups.push(group)
    this.groups.sort((a, b) => a.order - b.order)
  }

  registerGlobalAction(action: GlobalToolbarAction) {
    this.actions.global.push({ ...action, global: true })
    this.actions.global.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  registerAction<T extends keyof ObjectTypeMap>(
    objectType: T,
    action: ObjectToolbarAction
  ) {
    if (!this.actions.objectSpecific[objectType]) {
      this.actions.objectSpecific[objectType] = []
    }

    this.actions.objectSpecific[objectType].push(action)

    this.actions.objectSpecific[objectType].sort((a, b) => {
      const groupA = this.groups.find((g) => g.id === a.group)
      const groupB = this.groups.find((g) => g.id === b.group)

      if (groupA && groupB && groupA.order !== groupB.order) {
        return groupA.order - groupB.order
      }

      return (a.order || 0) - (b.order || 0)
    })
  }

  getGlobalActions(): GlobalToolbarAction[] {
    return this.actions.global
  }

  getObjectActions<T extends keyof ObjectTypeMap>(
    objectType: T,
    obj: ObjectTypeMap[T]
  ): ObjectToolbarAction[] {
    const actions = this.actions.objectSpecific[objectType] || []
    return actions.filter((a) => !a.isVisible || a.isVisible(obj))
  }
  getGroups(): ToolbarActionGroup[] {
    return [...this.groups]
  }
}

export const toolbarRegistry = ToolbarRegistry.getInstance()
