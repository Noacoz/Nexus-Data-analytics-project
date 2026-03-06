(async ()=>{
  const { build } = await import('vite')
  const { spawn } = await import('child_process')
  const path = await import('path')
  const fs = await import('fs')
  const root = process.cwd()
  try{
    console.log('Building...')
    await build({ configFile: 'vite.config.mjs' })
    console.log('Build complete')

    // find a free port (5000-5010)
    const net = await import('net')
    async function findFreePort(start, end){
      for(let p=start;p<=end;p++){
        const s = net.createServer().unref()
        try{
          await new Promise((res, rej)=> s.listen(p, ()=>res()).on('error', e=>rej(e)))
          s.close()
          return p
        }catch(e){ /* try next */ }
      }
      throw new Error('No free port found')
    }
    const port = await findFreePort(5000,5010)
    console.log('Starting server on port', port)
    const server = spawn(process.execPath, [path.join(root,'server.js')], { stdio: ['ignore','pipe','pipe'], env: { ...process.env, PORT: String(port) } })
    server.stdout.on('data', d=> process.stdout.write(`[server] ${d}`))
    server.stderr.on('data', d=> process.stderr.write(`[server.err] ${d}`))

    // wait for server to report listening
    await new Promise((resolve, reject)=>{
      const to = setTimeout(()=>reject(new Error('Server start timeout')),10000)
      server.stdout.on('data', chunk=>{
        const s = String(chunk)
        if(s.includes('Serving dist on port') || s.includes('listening')){ clearTimeout(to); resolve() }
      })
      server.stderr.on('data', chunk=>{
        // some servers log to stderr; treat as start signal if contains port
        const s = String(chunk)
        if(s.includes('Serving dist on port') || s.includes('listening')){ clearTimeout(to); resolve() }
      })
    })

    console.log('Running headless check...')
    const checker = spawn(process.execPath, [path.join(root,'scripts','headless_check.js'),`http://localhost:${port}/nexus_analytics_final.html`], { stdio:'inherit' })
    const code = await new Promise(r=> checker.on('exit', r))
    console.log('Headless check exited with', code)

    server.kill()
    process.exit(code)
  }catch(err){
    console.error(err)
    process.exit(2)
  }
})()
