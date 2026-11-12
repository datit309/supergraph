import { reconcileReferences, referenceKey } from '../mobile/references.js'
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
    const { added, changed, removed, hadSnapshot } = reconcileReferences(this, extracted)
    const isDelta = options.delta === true && hadSnapshot
    const format = elem => {
      let line = `${elem.ref} [${elem.type}]`
      if (elem.label) line += ` "${elem.label}"`
      if (elem.value && elem.value !== elem.label) line += ` value: "${elem.value}"`
      line += ` bounds: [${elem.rect.x}, ${elem.rect.y}, ${elem.rect.width}, ${elem.rect.height}]`
      return line
    }
    const lines = []
    if (isDelta) {
      lines.push('[Delta Snapshot: iOS Accessibility Tree]')
      for (const elem of added) lines.push(`+ ${format(elem)}`)
      for (const elem of changed) lines.push(`~ ${format(elem)}`)
      for (const elem of removed) lines.push(`- [${elem.type}] "${elem.label}" (removed)`)
      if (!added.length && !removed.length && !changed.length) lines.push('(no UI changes detected)')
    } else {
      lines.push(`[iOS Accessibility Tree | App: ${options.appBundle || 'active'} | Nodes: ${extracted.length}]`)
      for (const elem of extracted) lines.push(format(elem))
    }
    return { isDelta, text: lines.join('\n'), elements: extracted, refMap: this.refMap }
  }

  elementKey(elem) {
    return referenceKey(elem)
  }

  resolveRef(ref) {
    return this.refMap.get(ref) || null
  }
}
