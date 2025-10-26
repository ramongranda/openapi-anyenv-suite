#!/usr/bin/env node
import { spawn } from 'child_process'

const args = process.argv.slice(2)
const child = spawn(process.execPath, ['scripts/serve.mjs', ...args], { stdio: 'inherit', cwd: process.cwd(), env: process.env })
child.on('close', (code) => process.exit(code))
