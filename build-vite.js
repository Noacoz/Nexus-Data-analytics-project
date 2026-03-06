(async () => {
  try {
    const { build } = await import('vite')
    await build({ configFile: 'vite.config.mjs' })
    console.log('Vite build complete')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
