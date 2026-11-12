import { parseAndroidSource } from '../mobile/android-source.js'
import { reconcileReferences, referenceKey } from '../mobile/references.js'
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
    const match = /^\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]$/.exec(boundsStr)
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
    const label = (node.text || node.contentDesc || node['content-desc'] || '').toString().trim()
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
        checked: node.checked === 'true' ? true : node.checked === 'false' ? false : (node.checked ?? null),
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
    const rootNode = parseAndroidSource(sourceTree?.value ?? sourceTree)
    const extracted = this.extractElements(rootNode, [])
    const { added, changed, removed, hadSnapshot } = reconcileReferences(this, extracted)
    const isDelta = options.delta === true && hadSnapshot
    const format = elem => {
      let line = `${elem.ref} [${elem.type}]`
      if (elem.label) line += ` "${elem.label}"`
      if (elem.resourceId) line += ` id: "${elem.resourceId}"`
      if (elem.checked !== null) line += ` checked: ${elem.checked}`
      line += ` bounds: [${elem.rect.x}, ${elem.rect.y}, ${elem.rect.width}, ${elem.rect.height}]`
      return line
    }
    const lines = []
    if (isDelta) {
      lines.push('[Delta Snapshot: Android Accessibility Tree]')
      for (const elem of added) lines.push(`+ ${format(elem)}`)
      for (const elem of changed) lines.push(`~ ${format(elem)}`)
      for (const elem of removed) lines.push(`- [${elem.type}] "${elem.label}" (removed)`)
      if (!added.length && !removed.length && !changed.length) lines.push('(no UI changes detected)')
    } else {
      lines.push(`[Android Accessibility Tree | Package: ${options.appPackage || 'active'} | Nodes: ${extracted.length}]`)
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
