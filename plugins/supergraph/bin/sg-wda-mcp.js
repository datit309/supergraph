#!/usr/bin/env node
import { WdaMcpServer } from '../src/wda/mcp-server.js'

const server = new WdaMcpServer({
  baseUrl: process.env.WDA_URL || 'http://127.0.0.1:8100',
})
server.startStdio()
