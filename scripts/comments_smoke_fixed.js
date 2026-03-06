// Clean smoke tester that uses global fetch
async function req(path, opts){
  const base = process.env.BASE || process.argv[2] || 'http://localhost:4000'
  const res = await fetch(base+path, opts)
  const text = await res.text()
  try{ return JSON.parse(text) }catch(e){ return text }
}

async function run(){
  console.log('GET initial')
  console.log(await req('/api/comments/demo'))

  console.log('POST comment')
  const post = await req('/api/comments/demo', { method:'POST', headers: {'content-type':'application/json','x-api-key':'dev-key'}, body: JSON.stringify({ user:'CLI', text:'Smoke test comment' }) })
  console.log(post)
  const id = post.comment && post.comment.id

  console.log('Reply')
  console.log(await req(`/api/comments/demo/${id}/reply`, { method:'POST', headers: {'content-type':'application/json','x-api-key':'dev-key'}, body: JSON.stringify({ user:'CLI', text:'a reply' }) }))

  console.log('Toggle like')
  console.log(await req(`/api/comments/demo/${id}/toggle-like`, { method:'POST', headers: {'x-api-key':'dev-key'} }))

  console.log('GET after')
  console.log(await req('/api/comments/demo'))

  console.log('DELETE')
  console.log(await req(`/api/comments/demo/${id}`, { method:'DELETE', headers: {'x-api-key':'dev-key'} }))

  console.log('Final GET')
  console.log(await req('/api/comments/demo'))
}

run().catch(e=>{ console.error(e); process.exit(1) })
