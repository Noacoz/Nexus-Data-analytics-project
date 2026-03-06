(async () => {
  try {
    const { createServer } = await import('vite')
    const server = await createServer({ configFile: 'vite.config.mjs' })
    await server.listen()
    server.printUrls()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
