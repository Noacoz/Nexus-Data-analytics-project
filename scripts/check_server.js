const http = require('http')

const url = 'http://localhost:5173/'
http.get(url, (res) => {
  console.log('HTTP', res.statusCode)
  res.resume()
}).on('error', (err) => {
  console.log('ERR', err.message)
  process.exitCode = 1
})
