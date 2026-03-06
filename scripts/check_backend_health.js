const http = require('http')
const url = 'http://localhost:4000/health'
http.get(url, (res) => {
  console.log('HTTP', res.statusCode)
  let body = ''
  res.on('data', (d) => body += d.toString())
  res.on('end', () => console.log(body || '(no body)'))
}).on('error', (err) => {
  console.error('ERR', err.message)
  process.exitCode = 1
})
