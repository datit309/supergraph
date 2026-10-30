/**
 * Supergraph UiAutomator2 (Android) MCP Server.
 * Exposes real Android device and emulator automation tools over JSON-RPC 2.0 stdio.
 */

import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { UiAutomator2Client } from './client.js'
import { UiAutomator2TreeParser } from './parser.js'
import { UiAutomator2DeviceTunnel } from './tunnel.js'

export class UiAutomator2McpServer {
  constructor(options = {}) {
    this.client = new UiAutomator2Client(options)
    this.parser = new UiAutomator2TreeParser()
    this.tunnel = new UiAutomator2DeviceTunnel(options)
    this.activePackage = null
  }

  getTools() {
    return [
      {
        name: 'uiauto_status',
        description: 'Check status and health of the UiAutomator2 Server on the Android device/emulator.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'uiauto_device_list',
        description: 'List all connected Android physical devices and emulators via ADB.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'uiauto_session_start',
        description: 'Start an automated testing session on the Android device with the target app package name.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: { type: 'string', description: 'App package name (e.g. com.example.myapp)' },
            capabilities: { type: 'object', description: 'Optional custom capabilities' },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'uiauto_session_stop',
        description: 'Terminate the active Android testing session.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'uiauto_snapshot',
        description: 'Capture token-efficient Compact Android Accessibility Tree with reusable @ref handles (saves ~95% tokens).',
        inputSchema: {
          type: 'object',
          properties: {
            delta: { type: 'boolean', description: 'Return only incremental UI changes compared to last snapshot' },
          },
        },
      },
      {
        name: 'uiauto_tap',
        description: 'Tap an element by @ref identifier (e.g. @e1) or exact screen coordinates (x, y).',
        inputSchema: {
          type: 'object',
          properties: {
            ref: { type: 'string', description: 'Element reference from snapshot (e.g. @e1)' },
            x: { type: 'number', description: 'X screen coordinate' },
            y: { type: 'number', description: 'Y screen coordinate' },
          },
        },
      },
      {
        name: 'uiauto_fill',
        description: 'Fill text into an input field by @ref identifier.',
        inputSchema: {
          type: 'object',
          properties: {
            ref: { type: 'string', description: 'Element reference from snapshot (e.g. @e2)' },
            text: { type: 'string', description: 'Text to input' },
          },
          required: ['ref', 'text'],
        },
      },
      {
        name: 'uiauto_press_keycode',
        description: 'Send physical/virtual keycode (3=Home, 4=Back, 24=VolUp, 25=VolDown, 66=Enter, 82=Menu).',
        inputSchema: {
          type: 'object',
          properties: {
            keycode: { type: 'number', description: 'Android KeyEvent code (e.g. 4 for Back, 3 for Home)' },
          },
          required: ['keycode'],
        },
      },
      {
        name: 'uiauto_hide_keyboard',
        description: 'Hide the on-screen soft keyboard if visible.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'uiauto_swipe',
        description: 'Perform swipe gesture in a direction (up, down, left, right) or between coordinates.',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['up', 'down', 'left', 'right'],
              description: 'Swipe direction',
            },
            from_x: { type: 'number' },
            from_y: { type: 'number' },
            to_x: { type: 'number' },
            to_y: { type: 'number' },
            steps: { type: 'number', description: 'Steps for smooth gesture (default 20)' },
          },
        },
      },
      {
        name: 'uiauto_wait',
        description: 'Wait for specific text or an element @ref to appear on screen (smart polling, zero sleep).',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Visible text to wait for' },
            ref: { type: 'string', description: 'Element reference to wait for' },
            timeout_ms: { type: 'number', description: 'Maximum wait time in ms (default 10000)' },
          },
        },
      },
      {
        name: 'uiauto_screenshot',
        description: 'Capture a full-resolution screenshot from the real Android device and save to disk.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Optional file path to save screenshot PNG' },
          },
        },
      },
      {
        name: 'uiauto_app_lifecycle',
        description: 'Manage app lifecycle (activate, terminate).',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['activate', 'terminate'],
              description: 'Lifecycle action',
            },
            package_name: { type: 'string', description: 'App package identifier' },
          },
          required: ['action'],
        },
      },
      {
        name: 'uiauto_handle_alert',
        description: 'Interact with Android runtime permission dialogs (Camera, Location, Notifications).',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['accept', 'dismiss', 'get_text'],
              description: 'Alert action (accept = Allow, dismiss = Deny)',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'uiauto_open_url',
        description: 'Open a URL in Chrome or trigger a custom deep-link URI scheme.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Target URL or deep-link URI' },
          },
          required: ['url'],
        },
      },
    ]
  }

  async executeTool(name, args = {}) {
    switch (name) {
      case 'uiauto_status': {
        const status = await this.client.status()
        return {
          content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
        }
      }

      case 'uiauto_device_list': {
        const devices = await this.tunnel.listDevices()
        return {
          content: [{ type: 'text', text: JSON.stringify(devices, null, 2) }],
        }
      }

      case 'uiauto_session_start': {
        const res = await this.client.createSession(args.package_name, args.capabilities)
        this.activePackage = args.package_name
        return {
          content: [
            {
              type: 'text',
              text: `✅ Started UiAutomator2 session ${this.client.sessionId} for package "${args.package_name}"`,
            },
          ],
        }
      }

      case 'uiauto_session_stop': {
        const sessionId = this.client.sessionId
        await this.client.deleteSession()
        this.activePackage = null
        return {
          content: [{ type: 'text', text: `Session ${sessionId} terminated.` }],
        }
      }

      case 'uiauto_snapshot': {
        const sourceData = await this.client.source('json')
        const parsed = this.parser.parse(sourceData, {
          delta: args.delta === true,
          appPackage: this.activePackage,
        })
        return {
          content: [{ type: 'text', text: parsed.text }],
        }
      }

      case 'uiauto_tap': {
        if (args.ref) {
          const elem = this.parser.resolveRef(args.ref)
          if (!elem) {
            throw new Error(`Element ref "${args.ref}" not found in current snapshot. Run uiauto_snapshot first.`)
          }
          if (elem.elementId) {
            await this.client.tapElement(elem.elementId)
          } else {
            await this.client.tap(elem.center.x, elem.center.y)
          }
          return {
            content: [{ type: 'text', text: `Tapped ${args.ref} [${elem.type}] "${elem.label}" at (${elem.center.x}, ${elem.center.y})` }],
          }
        }

        if (args.x !== undefined && args.y !== undefined) {
          await this.client.tap(args.x, args.y)
          return {
            content: [{ type: 'text', text: `Tapped screen at (${args.x}, ${args.y})` }],
          }
        }

        throw new Error('Provide either "ref" (e.g. @e1) or both "x" and "y" coordinates.')
      }

      case 'uiauto_fill': {
        const elem = this.parser.resolveRef(args.ref)
        if (!elem) {
          throw new Error(`Element ref "${args.ref}" not found.`)
        }
        if (!elem.elementId) {
          await this.client.tap(elem.center.x, elem.center.y)
          // Fallback typing
          await this.client.fill(null, args.text)
        } else {
          await this.client.fill(elem.elementId, args.text)
        }
        return {
          content: [{ type: 'text', text: `Filled text into ${args.ref} [${elem.type}]: "${args.text}"` }],
        }
      }

      case 'uiauto_press_keycode': {
        await this.client.pressKeyCode(args.keycode)
        return {
          content: [{ type: 'text', text: `Pressed Android keycode: ${args.keycode}` }],
        }
      }

      case 'uiauto_hide_keyboard': {
        await this.client.hideKeyboard()
        return {
          content: [{ type: 'text', text: 'Dismissed Android soft keyboard.' }],
        }
      }

      case 'uiauto_swipe': {
        if (args.direction) {
          const width = 1080
          const height = 2400
          const midX = width / 2
          const midY = height / 2

          let fromX = midX, fromY = midY, toX = midX, toY = midY
          if (args.direction === 'up') {
            fromY = height * 0.75
            toY = height * 0.25
          } else if (args.direction === 'down') {
            fromY = height * 0.25
            toY = height * 0.75
          } else if (args.direction === 'left') {
            fromX = width * 0.8
            toX = width * 0.2
          } else if (args.direction === 'right') {
            fromX = width * 0.2
            toX = width * 0.8
          }

          await this.client.swipe(fromX, fromY, toX, toY, args.steps || 20)
          return {
            content: [{ type: 'text', text: `Swiped ${args.direction} (${fromX},${fromY}) -> (${toX},${toY})` }],
          }
        }

        if (args.from_x !== undefined && args.from_y !== undefined && args.to_x !== undefined && args.to_y !== undefined) {
          await this.client.swipe(args.from_x, args.from_y, args.to_x, args.to_y, args.steps || 20)
          return {
            content: [{ type: 'text', text: `Swiped from (${args.from_x},${args.from_y}) to (${args.to_x},${args.to_y})` }],
          }
        }

        throw new Error('Provide either "direction" (up|down|left|right) or from/to coordinates.')
      }

      case 'uiauto_wait': {
        const timeoutMs = args.timeout_ms || 10000
        const startTime = Date.now()
        const targetText = args.text?.toLowerCase()
        const targetRef = args.ref

        while (Date.now() - startTime < timeoutMs) {
          const sourceData = await this.client.source('json')
          const parsed = this.parser.parse(sourceData)

          if (targetRef && this.parser.resolveRef(targetRef)) {
            return {
              content: [{ type: 'text', text: `Found ref "${targetRef}" within ${Date.now() - startTime}ms` }],
            }
          }

          if (targetText) {
            const match = parsed.elements.find(
              e => (e.label && e.label.toLowerCase().includes(targetText))
            )
            if (match) {
              return {
                content: [{ type: 'text', text: `Found text "${args.text}" on ${match.ref} [${match.type}] within ${Date.now() - startTime}ms` }],
              }
            }
          }

          await new Promise(r => setTimeout(r, 600))
        }

        throw new Error(`Wait timed out after ${timeoutMs}ms for ${targetText ? `text "${args.text}"` : `ref "${targetRef}"`}`)
      }

      case 'uiauto_screenshot': {
        const base64Data = await this.client.screenshot()
        const buffer = Buffer.from(base64Data, 'base64')

        let outPath = args.path
        if (!outPath) {
          const timestamp = Date.now()
          outPath = `screenshots/android-uiauto-${timestamp}.png`
        }

        const resolvedPath = path.resolve(process.cwd(), outPath)
        const parentDir = path.dirname(resolvedPath)
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true })
        }

        fs.writeFileSync(resolvedPath, buffer)
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to: ${resolvedPath} (${buffer.length} bytes)`,
            },
          ],
        }
      }

      case 'uiauto_app_lifecycle': {
        const pkg = args.package_name || this.activePackage
        if (!pkg) throw new Error('Missing package_name')

        let msg = ''
        if (args.action === 'activate') {
          await this.client.activateApp(pkg)
          this.activePackage = pkg
          msg = `App ${pkg} activated.`
        } else if (args.action === 'terminate') {
          await this.client.terminateApp(pkg)
          msg = `App ${pkg} terminated.`
        }

        return { content: [{ type: 'text', text: msg }] }
      }

      case 'uiauto_handle_alert': {
        if (args.action === 'accept') {
          await this.client.alertAccept()
          return { content: [{ type: 'text', text: 'Alert accepted (Allowed).' }] }
        }
        if (args.action === 'dismiss') {
          await this.client.alertDismiss()
          return { content: [{ type: 'text', text: 'Alert dismissed (Denied).' }] }
        }
        if (args.action === 'get_text') {
          const textRes = await this.client.alertText()
          return { content: [{ type: 'text', text: `Alert text: ${textRes?.value || ''}` }] }
        }
        throw new Error('Invalid alert action')
      }

      case 'uiauto_open_url': {
        await this.client.openUrl(args.url)
        return { content: [{ type: 'text', text: `Opened URL: ${args.url}` }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  }

  async handleMessage(msg) {
    const { id, method, params } = msg

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'supergraph-uiautomator2',
            version: '1.0.0',
          },
        },
      }
    }

    if (method === 'notifications/initialized') {
      return null
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: this.getTools(),
        },
      }
    }

    if (method === 'tools/call') {
      try {
        const result = await this.executeTool(params.name, params.arguments || {})
        return {
          jsonrpc: '2.0',
          id,
          result,
        }
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: err.message }],
            isError: true,
          },
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }
  }

  startStdio() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    })

    rl.on('line', async line => {
      const trimmed = line.trim()
      if (!trimmed) return
      try {
        const msg = JSON.parse(trimmed)
        const res = await this.handleMessage(msg)
        if (res) {
          process.stdout.write(JSON.stringify(res) + '\n')
        }
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: err.message },
          }) + '\n'
        )
      }
    })
  }
}
