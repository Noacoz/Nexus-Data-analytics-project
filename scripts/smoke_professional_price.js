const http = require('http')

const data = JSON.stringify({ messages: [{ role: 'user', content: "What is the Professional plan price?" }] })

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
}

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode)
  res.setEncoding('utf8')
  res.on('data', (chunk) => {
    process.stdout.write(chunk)
  })
  res.on('end', () => {
    console.log('\nResponse ended')
    process.exit(0)
  })
})

req.on('error', (e) => {
  console.error('Request error', e)
  process.exit(1)
})

req.write(data)
req.end()
