/**
 * iOS Device Discovery and USB Tunnel Manager (iproxy / usbmuxd).
 */

import { execSync, spawn } from 'node:child_process'

export class WdaDeviceTunnel {
  constructor(options = {}) {
    this.iproxyProc = null
    this.localPort = options.localPort || 8100
    this.remotePort = options.remotePort || 8100
  }

  /**
   * List connected iOS Real Devices & Booted Simulators
   */
  async listDevices() {
    const devices = []

    // 1. Try idevice_id (libimobiledevice - Real Devices via USB)
    try {
      const output = execSync('idevice_id -l', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 3000 })
      const udids = output.split('\n').map(s => s.trim()).filter(Boolean)
      for (const udid of udids) {
        let name = 'iOS Device'
        try {
          name = execSync(`ideviceinfo -u ${udid} -k DeviceName`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
        } catch {}
        devices.push({
          udid,
          name,
          type: 'real_device',
          connected: true,
        })
      }
    } catch {}

    // 2. Try xcrun simctl list devices (Booted Simulators)
    try {
      const simOutput = execSync('xcrun simctl list devices booted -j', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 3000 })
      const parsed = JSON.parse(simOutput)
      if (parsed.devices) {
        for (const [runtime, list] of Object.entries(parsed.devices)) {
          for (const sim of list) {
            if (sim.state === 'Booted') {
              devices.push({
                udid: sim.udid,
                name: sim.name,
                type: 'simulator',
                runtime,
                connected: true,
              })
            }
          }
        }
      }
    } catch {}

    return devices
  }

  /**
   * Start iproxy tunnel for real device if port 8100 is not yet bound
   */
  startTunnel(udid = null) {
    if (this.iproxyProc) return this.iproxyProc

    const args = [String(this.localPort), String(this.remotePort)]
    if (udid) args.push(udid)

    try {
      this.iproxyProc = spawn('iproxy', args, {
        stdio: 'ignore',
        detached: true,
      })
      this.iproxyProc.unref()
      return this.iproxyProc
    } catch (err) {
      // iproxy might not be installed; fallback to direct connection (e.g. Wi-Fi / Simulator)
      return null
    }
  }

  /**
   * Stop running tunnel
   */
  stopTunnel() {
    if (this.iproxyProc) {
      try {
        this.iproxyProc.kill()
      } catch {}
      this.iproxyProc = null
    }
  }
}
