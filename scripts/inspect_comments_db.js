const fs = require('fs')
const path = require('path')
const COMMENTS_DB = path.join(__dirname,'..','data','comments.db')
let sqlite3 = null
try { sqlite3 = require('sqlite3') } catch (e) { sqlite3 = null }

async function run(){
  console.log('Checking DB file:', COMMENTS_DB)
  if(!fs.existsSync(COMMENTS_DB)){
    console.log('DB file not found.'); process.exit(0)
  }
  if(!sqlite3){
    console.log('sqlite3 module not available in this runtime.'); process.exit(0)
  }
  const sqlite = sqlite3.verbose()
  const db = new sqlite.Database(COMMENTS_DB)
  db.serialize(()=>{
    db.get("SELECT count(*) as cnt FROM comments", (e,row)=>{
      if(e) console.error('comments count error',e);
      else console.log('comments_count:', row.cnt)
    })
    db.get("SELECT count(*) as cnt FROM replies", (e,row)=>{
      if(e) console.error('replies count error',e);
      else console.log('replies_count:', row.cnt)
    })
    db.all("SELECT id,datasetId,user,text,time,likes,liked,deleted FROM comments ORDER BY id DESC LIMIT 10", (e,rows)=>{
      if(e) console.error('comments sample error',e);
      else { console.log('comments_sample:'); console.dir(rows,{depth:2}) }
    })
    db.all("SELECT id,commentId,user,text,time FROM replies ORDER BY id DESC LIMIT 10", (e,rows)=>{
      if(e) console.error('replies sample error',e);
      else { console.log('replies_sample:'); console.dir(rows,{depth:2}) }
    })
  })
  db.close()
}
run()
