/**
 * Supergraph WebDriverAgent (iOS) MCP Server.
 * Exposes real iOS device and simulator automation tools over JSON-RPC 2.0 stdio.
 */

import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { WdaClient } from './client.js'
import { WdaTreeParser } from './parser.js'
import { WdaDeviceTunnel } from './tunnel.js'

export class WdaMcpServer {
  constructor(options = {}) {
    this.client = new WdaClient(options)
    this.parser = new WdaTreeParser()
    this.tunnel = new WdaDeviceTunnel(options)
    this.activeBundleId = null
    this.lastWindowSize = null
  }

  getTools() {
    return [
      {
        name: 'wda_status',
        description: 'Check status and health of the WebDriverAgent server on the iOS device/simulator.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'wda_device_list',
        description: 'List all connected iOS physical devices (USB/usbmuxd) and booted Simulators.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'wda_session_start',
        description: 'Start an automated testing session on the iOS device with the target app bundle ID.',
        inputSchema: {
          type: 'object',
          properties: {
            bundle_id: { type: 'string', description: 'App bundle identifier (e.g. com.example.myapp)' },
            capabilities: { type: 'object', description: 'Optional custom WDA capabilities' },
          },
          required: ['bundle_id'],
        },
      },
      {
        name: 'wda_session_stop',
        description: 'Terminate the current active iOS testing session.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'wda_snapshot',
        description: 'Capture token-efficient Compact Accessibility Tree with reusable @ref handles (saves ~95% tokens).',
        inputSchema: {
          type: 'object',
          properties: {
            delta: { type: 'boolean', description: 'Return only incremental UI changes compared to last snapshot' },
          },
        },
      },
      {
        name: 'wda_tap',
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
        name: 'wda_fill',
        description: 'Clear and fill text into an input field by @ref identifier.',
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
        name: 'wda_type',
        description: 'Type keys into the currently focused field.',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Characters or keystrokes to type' },
          },
          required: ['text'],
        },
      },
      {
        name: 'wda_press_button',
        description: 'Press a hardware or system button (home, volumeUp, volumeDown).',
        inputSchema: {
          type: 'object',
          properties: {
            button: {
              type: 'string',
              enum: ['home', 'volumeUp', 'volumeDown'],
              description: 'Button name',
            },
          },
          required: ['button'],
        },
      },
      {
        name: 'wda_dismiss_keyboard',
        description: 'Dismiss the on-screen virtual keyboard if open.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'wda_swipe',
        description: 'Perform a swipe gesture in a direction (up, down, left, right) or between coordinates.',
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
            duration: { type: 'number', description: 'Swipe duration in seconds (default 0.5)' },
          },
        },
      },
      {
        name: 'wda_wait',
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
        name: 'wda_screenshot',
        description: 'Capture a full-resolution screenshot from the real iOS device and save to disk.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Optional file path to save screenshot PNG' },
          },
        },
      },
      {
        name: 'wda_app_lifecycle',
        description: 'Manage app lifecycle (launch, terminate, activate, state).',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['launch', 'terminate', 'activate', 'state'],
              description: 'Lifecycle action',
            },
            bundle_id: { type: 'string', description: 'App bundle identifier' },
          },
          required: ['action'],
        },
      },
      {
        name: 'wda_handle_alert',
        description: 'Interact with iOS system permission dialogs (Camera, Location, Push Notifications).',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['accept', 'dismiss', 'get_text'],
              description: 'Alert action (accept = Allow, dismiss = Don\'t Allow)',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'wda_open_url',
        description: 'Open a URL in Safari or trigger a custom deep-link URI scheme.',
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
      case 'wda_status': {
        const status = await this.client.status()
        return {
          content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
        }
      }

      case 'wda_device_list': {
        const devices = await this.tunnel.listDevices()
        return {
          content: [{ type: 'text', text: JSON.stringify(devices, null, 2) }],
        }
      }

      case 'wda_session_start': {
        const res = await this.client.createSession(args.bundle_id, args.capabilities)
        this.activeBundleId = args.bundle_id
        return {
          content: [
            {
              type: 'text',
              text: `✅ Started WDA session ${this.client.sessionId} for bundle "${args.bundle_id}"`,
            },
          ],
        }
      }

      case 'wda_session_stop': {
        const sessionId = this.client.sessionId
        await this.client.deleteSession()
        this.activeBundleId = null
        return {
          content: [{ type: 'text', text: `Session ${sessionId} terminated.` }],
        }
      }

      case 'wda_snapshot': {
        const sourceData = await this.client.source('json')
        const parsed = this.parser.parse(sourceData, {
          delta: args.delta === true,
          appBundle: this.activeBundleId,
        })
        return {
          content: [{ type: 'text', text: parsed.text }],
        }
      }

      case 'wda_tap': {
        if (args.ref) {
          const elem = this.parser.resolveRef(args.ref)
          if (!elem) {
            throw new Error(`Element ref "${args.ref}" not found in current snapshot. Run wda_snapshot first.`)
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

      case 'wda_fill': {
        const elem = this.parser.resolveRef(args.ref)
        if (!elem) {
          throw new Error(`Element ref "${args.ref}" not found.`)
        }
        if (!elem.elementId) {
          // If no elementId, tap center then type keys
          await this.client.tap(elem.center.x, elem.center.y)
          await this.client.typeKeys(args.text)
        } else {
          await this.client.fill(elem.elementId, args.text)
        }
        return {
          content: [{ type: 'text', text: `Filled text into ${args.ref} [${elem.type}]: "${args.text}"` }],
        }
      }

      case 'wda_type': {
        await this.client.typeKeys(args.text)
        return {
          content: [{ type: 'text', text: `Typed: "${args.text}"` }],
        }
      }

      case 'wda_press_button': {
        if (args.button === 'home') {
          await this.client.pressHome()
        } else {
          await this.client.pressButton(args.button)
        }
        return {
          content: [{ type: 'text', text: `Pressed button: ${args.button}` }],
        }
      }

      case 'wda_dismiss_keyboard': {
        await this.client.dismissKeyboard()
        return {
          content: [{ type: 'text', text: 'Dismissed virtual keyboard.' }],
        }
      }

      case 'wda_swipe': {
        if (args.direction) {
          // Determine screen bounds (fallback to standard iPhone 393x852)
          const width = 393
          const height = 852
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

          await this.client.swipe(fromX, fromY, toX, toY, args.duration || 0.5)
          return {
            content: [{ type: 'text', text: `Swiped ${args.direction} (${fromX},${fromY}) -> (${toX},${toY})` }],
          }
        }

        if (args.from_x !== undefined && args.from_y !== undefined && args.to_x !== undefined && args.to_y !== undefined) {
          await this.client.swipe(args.from_x, args.from_y, args.to_x, args.to_y, args.duration || 0.5)
          return {
            content: [{ type: 'text', text: `Swiped from (${args.from_x},${args.from_y}) to (${args.to_x},${args.to_y})` }],
          }
        }

        throw new Error('Provide either "direction" (up|down|left|right) or from/to coordinates.')
      }

      case 'wda_wait': {
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
              e => (e.label && e.label.toLowerCase().includes(targetText)) ||
                   (e.value && e.value.toLowerCase().includes(targetText))
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

      case 'wda_screenshot': {
        const base64Data = await this.client.screenshot()
        const buffer = Buffer.from(base64Data, 'base64')

        let outPath = args.path
        if (!outPath) {
          const timestamp = Date.now()
          outPath = `screenshots/ios-wda-${timestamp}.png`
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

      case 'wda_app_lifecycle': {
        const bundleId = args.bundle_id || this.activeBundleId
        if (!bundleId) throw new Error('Missing bundle_id')

        let msg = ''
        if (args.action === 'launch') {
          await this.client.appLaunch(bundleId)
          this.activeBundleId = bundleId
          msg = `App ${bundleId} launched.`
        } else if (args.action === 'terminate') {
          await this.client.appTerminate(bundleId)
          msg = `App ${bundleId} terminated.`
        } else if (args.action === 'activate') {
          await this.client.appActivate(bundleId)
          this.activeBundleId = bundleId
          msg = `App ${bundleId} brought to foreground.`
        } else if (args.action === 'state') {
          const state = await this.client.appState(bundleId)
          msg = `App ${bundleId} state: ${JSON.stringify(state)}`
        }

        return { content: [{ type: 'text', text: msg }] }
      }

      case 'wda_handle_alert': {
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

      case 'wda_open_url': {
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
            name: 'supergraph-wda',
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
