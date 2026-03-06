const speakeasy = require('speakeasy')
const secret = process.argv[2]
if(!secret){
  console.error('Missing secret arg')
  process.exit(2)
}
const token = speakeasy.totp({ secret, encoding: 'base32' })
console.log(token)
