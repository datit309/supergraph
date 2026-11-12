const invalid = () => { throw new Error('Invalid Android XML source') }
const validCodePoint = n => n === 9 || n === 10 || n === 13 || (n >= 32 && n <= 0xD7FF) || (n >= 0xE000 && n <= 0xFFFD) || (n >= 0x10000 && n <= 0x10FFFF)

function decode(value) {
  if (value.includes('<')) invalid()
  return value.replace(/&([^;]*);|&/g, (entity, name) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
    if (Object.hasOwn(named, name)) return named[name]
    if (!/^#(?:[0-9]+|x[0-9a-fA-F]+)$/.test(name || '')) invalid()
    const point = name[1] === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1))
    if (!validCodePoint(point)) invalid()
    return String.fromCodePoint(point)
  })
}

/** Parse the native hierarchy/node XML subset; no DTDs or external entities. */
export function parseAndroidSource(source) {
  if (typeof source !== 'string') return source
  const xml = source.replace(/^\uFEFF/, '')
  for (const char of xml) if (!validCodePoint(char.codePointAt(0))) invalid()
  const stack = []
  let root, offset = 0
  const tokens = /<!--[\s\S]*?-->|<\?xml\s[^?]*\?>|<\/[A-Za-z_][\w.:-]*\s*>|<[A-Za-z_][\w.:-]*(?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*\s*\/?>/gy
  while (offset < xml.length) {
    const whitespace = /^\s+/.exec(xml.slice(offset))
    if (whitespace) { offset += whitespace[0].length; continue }
    tokens.lastIndex = offset
    const match = tokens.exec(xml)
    if (!match) invalid()
    const token = match[0]
    offset = tokens.lastIndex
    if (token.startsWith('<!--')) {
      if (token.slice(4, -3).includes('--')) invalid()
      continue
    }
    if (token.startsWith('<?')) {
      if (root || stack.length || xml.slice(0, match.index).trim()) invalid()
      continue
    }
    if (token.startsWith('</')) {
      const tag = /^<\/([^\s>]+)/.exec(token)[1]
      if (stack.pop()?.tag !== tag) invalid()
      continue
    }
    const tag = /^<([^\s/>]+)/.exec(token)[1]
    if (tag !== 'hierarchy' && tag !== 'node' && !tag.includes('.')) invalid()
    const node = { children: [] }
    if (tag !== 'hierarchy' && tag !== 'node') node.class = tag
    const names = new Set()
    for (const attr of token.matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      if (names.has(attr[1])) invalid()
      names.add(attr[1])
      node[attr[1]] = decode(attr[2] ?? attr[3])
    }
    if (stack.length) stack.at(-1).node.children.push(node)
    else { if (root || tag !== 'hierarchy') invalid(); root = node }
    if (!token.endsWith('/>')) stack.push({ tag, node })
  }
  if (!root || stack.length) invalid()
  return root
}
