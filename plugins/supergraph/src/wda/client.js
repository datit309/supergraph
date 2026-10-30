/**
 * Direct Lightweight HTTP REST Client for Appium WebDriverAgent (iOS).
 * Bypasses the heavy Appium Server middleware to talk directly to WDA port 8100.
 */

export class WdaClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.WDA_URL || 'http://127.0.0.1:8100').replace(/\/$/, '')
    this.sessionId = options.sessionId || null
    this.timeout = options.timeout || 15000
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      }

      if (options.body) {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
      }

      const res = await fetch(url, fetchOptions)
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const errorMsg = data?.value?.message || data?.message || `HTTP ${res.status} ${res.statusText}`
        throw new Error(`WDA Request failed (${path}): ${errorMsg}`)
      }

      return data
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Health check and device metadata
   */
  async status() {
    return this.request('/status')
  }

  /**
   * Create new test session with app bundleId
   */
  async createSession(bundleId, capabilities = {}) {
    const body = {
      capabilities: {
        alwaysMatch: {
          bundleId,
          arguments: capabilities.arguments || [],
          environment: capabilities.environment || {},
          shouldWaitForQuiescence: capabilities.shouldWaitForQuiescence ?? false,
          ...capabilities,
        },
      },
    }

    const res = await this.request('/session', { method: 'POST', body })
    this.sessionId = res.sessionId || res.value?.sessionId
    return res
  }

  /**
   * Terminate active test session
   */
  async deleteSession() {
    if (!this.sessionId) return null
    try {
      const res = await this.request(`/session/${this.sessionId}`, { method: 'DELETE' })
      return res
    } finally {
      this.sessionId = null
    }
  }

  /**
   * Dump complete accessibility source tree in JSON format
   */
  async source(format = 'json') {
    const sessionPrefix = this.sessionId ? `/session/${this.sessionId}` : ''
    return this.request(`${sessionPrefix}/source?format=${format}`)
  }

  /**
   * Capture real device screen as Base64 PNG
   */
  async screenshot() {
    const res = await this.request('/screenshot')
    return res.value // Base64 string
  }

  /**
   * Get active window size / screen resolution
   */
  async windowSize() {
    const sessionPrefix = this.sessionId ? `/session/${this.sessionId}` : ''
    return this.request(`${sessionPrefix}/window/size`)
  }

  /**
   * Tap specific screen coordinates (x, y)
   */
  async tap(x, y) {
    if (!this.sessionId) throw new Error('No active WDA session. Call createSession first.')
    return this.request(`/session/${this.sessionId}/wda/tap/nil`, {
      method: 'POST',
      body: { x: Math.round(x), y: Math.round(y) },
    })
  }

  /**
   * Click an element by WDA element ID
   */
  async tapElement(elementId) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/element/${elementId}/click`, {
      method: 'POST',
      body: {},
    })
  }

  /**
   * Fill text into an element by element ID
   */
  async fill(elementId, text) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/element/${elementId}/value`, {
      method: 'POST',
      body: { value: Array.from(String(text)) },
    })
  }

  /**
   * Type keys into active focused input
   */
  async typeKeys(text) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/keys`, {
      method: 'POST',
      body: { value: Array.from(String(text)) },
    })
  }

  /**
   * Dismiss virtual keyboard
   */
  async dismissKeyboard() {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/keyboard/dismiss`, {
      method: 'POST',
      body: {},
    }).catch(() => null) // Ignore if keyboard was not open
  }

  /**
   * Press physical/virtual hardware button
   */
  async pressButton(name) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/pressButton`, {
      method: 'POST',
      body: { name },
    })
  }

  /**
   * Press Home button / return to SpringBoard
   */
  async pressHome() {
    return this.request('/wda/homescreen', { method: 'POST', body: {} })
  }

  /**
   * Drag / Swipe gesture
   */
  async swipe(fromX, fromY, toX, toY, duration = 0.5) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/dragfromtoforduration`, {
      method: 'POST',
      body: {
        fromX: Math.round(fromX),
        fromY: Math.round(fromY),
        toX: Math.round(toX),
        toY: Math.round(toY),
        duration: Number(duration),
      },
    })
  }

  /**
   * Launch application by bundleId
   */
  async appLaunch(bundleId) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/app/launch`, {
      method: 'POST',
      body: { bundleId },
    })
  }

  /**
   * Terminate application by bundleId
   */
  async appTerminate(bundleId) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/app/terminate`, {
      method: 'POST',
      body: { bundleId },
    })
  }

  /**
   * Activate / Bring application to foreground
   */
  async appActivate(bundleId) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/wda/app/activate`, {
      method: 'POST',
      body: { bundleId },
    })
  }

  /**
   * Get alert text
   */
  async alertText() {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/alert/text`)
  }

  /**
   * Accept alert (e.g. click "Allow" on permission dialog)
   */
  async alertAccept() {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/alert/accept`, { method: 'POST', body: {} })
  }

  /**
   * Dismiss alert (e.g. click "Don't Allow" on permission dialog)
   */
  async alertDismiss() {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/alert/dismiss`, { method: 'POST', body: {} })
  }

  /**
   * Open URL or deep link scheme
   */
  async openUrl(url) {
    if (!this.sessionId) throw new Error('No active WDA session.')
    return this.request(`/session/${this.sessionId}/url`, {
      method: 'POST',
      body: { url },
    })
  }
}
