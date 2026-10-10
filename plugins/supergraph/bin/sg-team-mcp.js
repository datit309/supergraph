#!/usr/bin/env node
import { TeamMcpServer } from '../team/mcp-server.js'

const server = new TeamMcpServer(process.cwd())
server.startStdio()
