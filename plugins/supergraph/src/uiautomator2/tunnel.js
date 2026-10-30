/**
 * Android ADB Device Discovery and Port Forwarding Tunnel (adb forward).
 */

import { execSync, spawn } from 'node:child_process'

export class UiAutomator2DeviceTunnel {
  constructor(options = {}) {
    this.localPort = options.localPort || 6790
    this.remotePort = options.remotePort || 6790
    this.serverProcess = null
  }

  /**
   * List connected Android Physical Devices & Emulators via ADB
   */
  async listDevices() {
    const devices = []
    try {
      const output = execSync('adb devices -l', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 3000 })
      const lines = output.split('\n').slice(1) // Skip "List of devices attached"

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const parts = trimmed.split(/\s+/)
        const serial = parts[0]
        const state = parts[1]

        if (state === 'device') {
          const modelMatch = /model:([^\s]+)/.exec(trimmed)
          const deviceMatch = /device:([^\s]+)/.exec(trimmed)
          const isEmulator = serial.startsWith('emulator-')

          devices.push({
            serial,
            name: modelMatch ? modelMatch[1].replace(/_/g, ' ') : (deviceMatch ? deviceMatch[1] : 'Android Device'),
            type: isEmulator ? 'emulator' : 'real_device',
            connected: true,
          })
        }
      }
    } catch {}

    return devices
  }

  /**
   * Forward port 6790 from Android device to host
   */
  forwardPort(serial = null) {
    try {
      const prefix = serial ? `adb -s ${serial}` : 'adb'
      execSync(`${prefix} forward tcp:${this.localPort} tcp:${this.remotePort}`, {
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 3000,
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if UiAutomator2 Server is installed on device
   */
  isServerInstalled(serial = null) {
    try {
      const prefix = serial ? `adb -s ${serial}` : 'adb'
      const pkgs = execSync(`${prefix} shell pm list packages`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 4000 })
      return pkgs.includes('io.appium.uiautomator2.server')
    } catch {
      return false
    }
  }

  /**
   * Start instrumentation server in background if not running
   */
  startServer(serial = null) {
    if (this.serverProcess) return this.serverProcess
    const args = []
    if (serial) args.push('-s', serial)
    args.push('shell', 'am', 'instrument', '-w', 'io.appium.uiautomator2.server.test/androidx.test.runner.AndroidJUnitRunner')

    try {
      this.serverProcess = spawn('adb', args, {
        stdio: 'ignore',
        detached: true,
      })
      this.serverProcess.unref()
      return this.serverProcess
    } catch {
      return null
    }
  }
}
