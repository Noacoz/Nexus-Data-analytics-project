// using global fetch (Node 18+)

const API_KEY = 'dev-key'
const base = 'http://localhost:4000'
const ds = 'demo'

async function run(){
  console.log('GET initial')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('POST comment')
  const post = await (await fetch(`${base}/api/comments/${ds}`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'Smoke test comment' }) })).json()
  console.log(post)
  const id = post.comment && post.comment.id

  console.log('Replying')
  const reply = await (await fetch(`${base}/api/comments/${ds}/${id}/reply`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'A reply' }) })).json()
  console.log(reply)

  console.log('Toggle like')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}/toggle-like`, { method: 'POST', headers: {'x-api-key':API_KEY} })).json())

  console.log('GET after')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('DELETE comment')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}`, { method:'DELETE', headers: {'x-api-key':API_KEY} })).json())

  console.log('Final GET')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())
}

run().catch(e=>{ console.error(e); process.exit(1) })
const fetch = require('node-fetch')

const API_KEY = 'dev-key'
const base = 'http://localhost:4000'
const ds = 'demo'

async function run(){
  console.log('GET initial')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('POST comment')
  const post = await (await fetch(`${base}/api/comments/${ds}`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'Smoke test comment' }) })).json()
  console.log(post)
  const id = post.comment && post.comment.id

  console.log('Replying')
  const reply = await (await fetch(`${base}/api/comments/${ds}/${id}/reply`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'A reply' }) })).json()
  console.log(reply)

  console.log('Toggle like')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}/toggle-like`, { method: 'POST', headers: {'x-api-key':API_KEY} })).json())

  console.log('GET after')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('DELETE comment')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}`, { method:'DELETE', headers: {'x-api-key':API_KEY} })).json())

  console.log('Final GET')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())
}

run().catch(e=>{ console.error(e); process.exit(1) })
const http = require('http')
const fetch = require('node-fetch')

const API_KEY = 'dev-key'
const base = 'http://localhost:4000'
const ds = 'demo'

async function run(){
  console.log('GET initial')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('POST comment')
  const post = await (await fetch(`${base}/api/comments/${ds}`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'Smoke test comment' }) })).json()
  console.log(post)
  const id = post.comment && post.comment.id

  console.log('Replying')
  const reply = await (await fetch(`${base}/api/comments/${ds}/${id}/reply`, { method: 'POST', headers: {'content-type':'application/json','x-api-key':API_KEY}, body: JSON.stringify({ user:'CLI', text:'A reply' }) })).json()
  console.log(reply)

  console.log('Toggle like')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}/toggle-like`, { method: 'POST', headers: {'x-api-key':API_KEY} })).json())

  console.log('GET after')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())

  console.log('DELETE comment')
  console.log(await (await fetch(`${base}/api/comments/${ds}/${id}`, { method:'DELETE', headers: {'x-api-key':API_KEY} })).json())

  console.log('Final GET')
  console.log(await (await fetch(`${base}/api/comments/${ds}`)).json())
}

run().catch(e=>{ console.error(e); process.exit(1) })
