#!/usr/bin/env node
import { UiAutomator2McpServer } from '../src/uiautomator2/mcp-server.js'

const server = new UiAutomator2McpServer({
  baseUrl: process.env.UIAUTOMATOR2_URL || 'http://127.0.0.1:6790',
})
server.startStdio()
