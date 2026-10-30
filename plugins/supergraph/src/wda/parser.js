/**
 * Compact Accessibility Tree Parser for WebDriverAgent (iOS).
 * Transforms bulky XCTest XML/JSON hierarchy (often 5k-50k tokens)
 * into a dense, token-efficient representation (150-400 tokens) with reusable @ref handles.
 */

const INTERACTIVE_TYPES = new Set([
  'Button',
  'TextField',
  'SecureTextField',
  'Cell',
  'Switch',
  'Slider',
  'SegmentedControl',
  'Picker',
  'Link',
  'SearchField',
  'TabBar',
  'NavigationBar',
  'StaticText',
  'Image',
])

export class WdaTreeParser {
  constructor() {
    this.refMap = new Map()
    this.previousElements = []
  }

  /**
   * Normalize XCUITest type name: "XCUIElementTypeButton" -> "Button"
   */
  normalizeType(rawType) {
    if (!rawType) return 'Unknown'
    return rawType.replace(/^XCUIElementType/, '')
  }

  /**
   * Traverse WDA JSON tree recursively and extract interactive/content elements
   */
  extractElements(node, collected = []) {
    if (!node || typeof node !== 'object') return collected

    const type = this.normalizeType(node.type)
    const rect = node.rect || { x: 0, y: 0, width: 0, height: 0 }
    const label = (node.label || node.name || node.value || '').toString().trim()
    const value = node.value !== undefined && node.value !== null ? node.value.toString().trim() : null
    const elementId = node.ELEMENT || node['element-6066-11e4-a52e-4f735466cecf'] || null

    // Filter out zero-size or invisible offscreen elements
    const isVisibleSize = rect.width > 0 && rect.height > 0
    const isActionableType = INTERACTIVE_TYPES.has(type)

    // For StaticText or Image, keep only if it has a non-empty label or identifier
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
        value,
        rect,
        center: { x: centerX, y: centerY },
        elementId,
        rawName: node.name || null,
      })
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this.extractElements(child, collected)
      }
    }

    return collected
  }

  /**
   * Parse WDA source tree into compact formatted text with @ref
   */
  parse(sourceTree, options = {}) {
    const rootNode = sourceTree?.value || sourceTree
    const extracted = this.extractElements(rootNode, [])
    const deltaMode = options.delta === true

    // Compute Delta if requested and previous elements exist
    if (deltaMode && this.previousElements.length > 0) {
      const added = []
      const removed = []
      const unchanged = []

      const prevMap = new Map(this.previousElements.map(e => [this.elementKey(e), e]))
      const currMap = new Map(extracted.map(e => [this.elementKey(e), e]))

      for (const curr of extracted) {
        const key = this.elementKey(curr)
        if (prevMap.has(key)) {
          unchanged.push(curr)
        } else {
          added.push(curr)
        }
      }

      for (const prev of this.previousElements) {
        const key = this.elementKey(prev)
        if (!currMap.has(key)) {
          removed.push(prev)
        }
      }

      // Re-index refMap
      this.refMap.clear()
      const lines = []
      lines.push('[Delta Snapshot: iOS Accessibility Tree]')

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

    // Full snapshot
    this.refMap.clear()
    const lines = []
    const appBundle = options.appBundle || 'active'
    lines.push(`[iOS Accessibility Tree | App: ${appBundle} | Nodes: ${extracted.length}]`)

    let refIndex = 1
    for (const elem of extracted) {
      const ref = `@e${refIndex++}`
      this.refMap.set(ref, elem)
      elem.ref = ref

      let line = `${ref} [${elem.type}]`
      if (elem.label) line += ` "${elem.label}"`
      if (elem.value && elem.value !== elem.label) line += ` value: "${elem.value}"`
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
