/**
 * Compact Accessibility Tree Parser for Android UiAutomator2 Server.
 * Transforms bulky Android UI hierarchy dumps into dense, token-efficient text with @ref handles.
 */

const CLASS_NORMALIZATION = {
  'android.widget.Button': 'Button',
  'android.widget.ImageButton': 'Button',
  'android.widget.EditText': 'TextField',
  'android.widget.TextView': 'StaticText',
  'android.widget.ImageView': 'Image',
  'android.widget.CheckBox': 'CheckBox',
  'android.widget.RadioButton': 'RadioButton',
  'android.widget.Switch': 'Switch',
  'android.widget.SeekBar': 'Slider',
  'android.widget.Spinner': 'Picker',
}

const INTERACTIVE_TYPES = new Set([
  'Button',
  'TextField',
  'StaticText',
  'Image',
  'CheckBox',
  'RadioButton',
  'Switch',
  'Slider',
  'Picker',
])

export class UiAutomator2TreeParser {
  constructor() {
    this.refMap = new Map()
    this.previousElements = []
  }

  /**
   * Parse Android bounds string: "[100,850][980,1000]" -> { x, y, width, height }
   */
  parseBounds(boundsStr) {
    if (!boundsStr || typeof boundsStr !== 'string') {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    const match = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(boundsStr)
    if (!match) return { x: 0, y: 0, width: 0, height: 0 }
    const x1 = parseInt(match[1], 10)
    const y1 = parseInt(match[2], 10)
    const x2 = parseInt(match[3], 10)
    const y2 = parseInt(match[4], 10)
    return {
      x: x1,
      y: y1,
      width: Math.max(0, x2 - x1),
      height: Math.max(0, y2 - y1),
    }
  }

  normalizeType(className) {
    if (!className) return 'View'
    if (CLASS_NORMALIZATION[className]) return CLASS_NORMALIZATION[className]
    const parts = className.split('.')
    return parts[parts.length - 1]
  }

  extractElements(node, collected = []) {
    if (!node || typeof node !== 'object') return collected

    const type = this.normalizeType(node.class)
    const rect = typeof node.bounds === 'string' ? this.parseBounds(node.bounds) : (node.rect || { x: 0, y: 0, width: 0, height: 0 })
    const label = (node.text || node.contentDesc || '').toString().trim()
    const resourceId = node.resourceId || node['resource-id'] || null
    const elementId = node.ELEMENT || node['element-6066-11e4-a52e-4f735466cecf'] || null

    const isVisibleSize = rect.width > 0 && rect.height > 0
    const isActionableType = INTERACTIVE_TYPES.has(type)

    let shouldInclude = false
    if (isVisibleSize && isActionableType) {
      if (type === 'StaticText' || type === 'Image') {
        shouldInclude = label.length > 0
      } else {
        shouldInclude = true
      }
    }

    if (shouldInclude) {
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      collected.push({
        type,
        label,
        resourceId,
        rect,
        center: { x: centerX, y: centerY },
        elementId,
        checked: node.checked ?? null,
      })
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this.extractElements(child, collected)
      }
    }

    return collected
  }

  parse(sourceTree, options = {}) {
    const rootNode = sourceTree?.value || sourceTree
    const extracted = this.extractElements(rootNode, [])
    const deltaMode = options.delta === true

    if (deltaMode && this.previousElements.length > 0) {
      const added = []
      const removed = []
      const prevMap = new Map(this.previousElements.map(e => [this.elementKey(e), e]))
      const currMap = new Map(extracted.map(e => [this.elementKey(e), e]))

      for (const curr of extracted) {
        const key = this.elementKey(curr)
        if (!prevMap.has(key)) {
          added.push(curr)
        }
      }

      for (const prev of this.previousElements) {
        const key = this.elementKey(prev)
        if (!currMap.has(key)) {
          removed.push(prev)
        }
      }

      this.refMap.clear()
      const lines = []
      lines.push('[Delta Snapshot: Android Accessibility Tree]')

      let refIndex = 1
      for (const elem of added) {
        const ref = `@e${refIndex++}`
        this.refMap.set(ref, elem)
        lines.push(`+ ${ref} [${elem.type}] "${elem.label}" bounds: [${elem.rect.x}, ${elem.rect.y}, ${elem.rect.width}, ${elem.rect.height}]`)
      }

      for (const elem of removed) {
        lines.push(`- [${elem.type}] "${elem.label}" (removed)`)
      }

      if (added.length === 0 && removed.length === 0) {
        lines.push('(no UI changes detected)')
      }

      this.previousElements = extracted
      return {
        isDelta: true,
        text: lines.join('\n'),
        elements: extracted,
        refMap: this.refMap,
      }
    }

    this.refMap.clear()
    const lines = []
    const appPackage = options.appPackage || 'active'
    lines.push(`[Android Accessibility Tree | Package: ${appPackage} | Nodes: ${extracted.length}]`)

    let refIndex = 1
    for (const elem of extracted) {
      const ref = `@e${refIndex++}`
      this.refMap.set(ref, elem)
      elem.ref = ref

      let line = `${ref} [${elem.type}]`
      if (elem.label) line += ` "${elem.label}"`
      if (elem.resourceId) line += ` id: "${elem.resourceId}"`
      line += ` bounds: [${elem.rect.x}, ${elem.rect.y}, ${elem.rect.width}, ${elem.rect.height}]`
      lines.push(line)
    }

    this.previousElements = extracted
    return {
      isDelta: false,
      text: lines.join('\n'),
      elements: extracted,
      refMap: this.refMap,
    }
  }

  elementKey(elem) {
    return `${elem.type}:${elem.label}:${elem.rect.x},${elem.rect.y},${elem.rect.width},${elem.rect.height}`
  }

  resolveRef(ref) {
    return this.refMap.get(ref) || null
  }
}
