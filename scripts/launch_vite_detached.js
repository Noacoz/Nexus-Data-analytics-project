const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const cwd = path.resolve(__dirname, '..')
const out = fs.openSync(path.join(cwd, 'vite.out.log'), 'a')
const err = fs.openSync(path.join(cwd, 'vite.err.log'), 'a')

const child = spawn(process.execPath, ['start-vite.js'], {
  cwd,
  detached: true,
  stdio: ['ignore', out, err]
})

child.unref()
console.log('Launched Vite detached, pid=', child.pid)
