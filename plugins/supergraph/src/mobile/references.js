/** Reconcile one complete snapshot, retaining live handles and never recycling removed ones. */
export function reconcileReferences(parser, elements) {
  const previous = new Map()
  for (const element of parser.previousElements) {
    const key = parser.elementKey(element)
    if (!previous.has(key)) previous.set(key, [])
    previous.get(key).push(element)
  }
  const added = [], changed = []
  parser.nextRefIndex ??= 1
  parser.refMap.clear()
  for (const element of elements) {
    const old = previous.get(parser.elementKey(element))?.shift()
    element.ref = old?.ref || `@e${parser.nextRefIndex++}`
    parser.refMap.set(element.ref, element)
    if (!old) added.push(element)
    else if (JSON.stringify(old) !== JSON.stringify(element)) changed.push(element)
  }
  const removed = [...previous.values()].flat()
  const hadSnapshot = parser.hasSnapshot === true
  parser.previousElements = elements
  parser.hasSnapshot = true
  return { added, changed, removed, hadSnapshot }
}

export function referenceKey(element) {
  const id = element.elementId || element.resourceId || element.rawName
  return JSON.stringify([element.type, id || null, id ? null : element.rect])
}
