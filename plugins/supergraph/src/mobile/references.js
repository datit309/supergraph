/** Reconcile one complete snapshot, retaining live handles and never recycling removed ones. */
export function reconcileReferences(parser, elements) {
  const previous = new Map()
  for (const element of parser.previousElements) {
    const key = parser.elementKey(element)
    if (!previous.has(key)) previous.set(key, [])
    previous.get(key).push(element)
  }
  // Repeated resource IDs/names do not identify an individual native element.
  // Never let occurrence order silently redirect an old handle after list changes.
  const counts = new Map()
  for (const element of elements) {
    const key = parser.elementKey(element)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const ambiguous = new Set([...previous].filter(([, group]) => group.length > 1).map(([key]) => key))
  for (const [key, count] of counts) if (count > 1) ambiguous.add(key)
  const added = [], changed = []
  parser.nextRefIndex ??= 1
  parser.refMap.clear()
  for (const element of elements) {
    const key = parser.elementKey(element)
    const old = ambiguous.has(key) ? undefined : previous.get(key)?.shift()
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
  return JSON.stringify([element.type, id || null, id ? null : element.rect, id ? null : element.label])
}
