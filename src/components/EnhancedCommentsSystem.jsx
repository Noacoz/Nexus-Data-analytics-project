import React, { useState } from 'react'
import { pushToast, Icon } from '../lib/shims'

const API_KEY = 'dev-key'

export default function EnhancedCommentsSystem({ datasetId='demo' }){
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const addComment = () => {
    if(!newComment.trim()) return
    const payload = { user: 'You', text: newComment }
    fetch(`/api/comments/${encodeURIComponent(datasetId)}`, { method: 'POST', headers: {'content-type':'application/json','x-api-key': API_KEY}, body: JSON.stringify(payload) })
      .then(r=>r.json()).then(j=>{
        if(j.ok && j.comment){ setComments(prev=>[j.comment,...prev]); setNewComment(''); pushToast('Comment added successfully','success') }
        else { throw new Error('api') }
      }).catch(()=>{
        // fallback to localStorage
        const comment = { id: Date.now(), user: 'You', text: newComment, time: 'Just now', avatar: 'AJ', likes:0, liked:false, replies:[] }
        setComments(prev=>[comment,...prev]); setNewComment(''); pushToast('Comment added (local)','success')
        try{ localStorage.setItem(`comments_${datasetId}`, JSON.stringify([comment, ...comments])) }catch(e){}
      })
  }

  const deleteComment = (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    fetch(`/api/comments/${encodeURIComponent(datasetId)}/${commentId}`, { method: 'DELETE', headers: {'x-api-key': API_KEY} })
      .then(r=>r.json()).then(j=>{
        if(j.ok){ setComments(prev=>prev.filter(c=>c.id!==commentId)); pushToast('Comment deleted','info') }
        else throw new Error('api')
      }).catch(()=>{
        setComments(prev=>prev.filter(c=>c.id!==commentId)); pushToast('Comment deleted (local)','info')
      })
  }

  const toggleLike = (commentId) => {
    fetch(`/api/comments/${encodeURIComponent(datasetId)}/${commentId}/toggle-like`, { method: 'POST', headers: {'x-api-key': API_KEY} })
      .then(r=>r.json()).then(j=>{
        if(j.ok && j.comment) setComments(prev=> prev.map(c => c.id===commentId ? j.comment : c ))
        else throw new Error('api')
      }).catch(()=>{
        setComments(prev=> prev.map(c => c.id===commentId ? {...c, liked: !c.liked, likes: c.liked? Math.max(0,c.likes-1): (c.likes||0)+1 } : c ))
      })
  }

  const startReply = (commentId) => { setReplyingTo(commentId); setReplyText('') }
  const submitReply = (parentId) => {
    if(!replyText.trim()) return
    const payload = { user: 'You', text: replyText }
    fetch(`/api/comments/${encodeURIComponent(datasetId)}/${parentId}/reply`, { method: 'POST', headers: {'content-type':'application/json','x-api-key': API_KEY}, body: JSON.stringify(payload) })
      .then(r=>r.json()).then(j=>{
        if(j.ok && j.reply){ setComments(prev=> prev.map(c => c.id===parentId ? {...c, replies: [...(c.replies||[]), j.reply]} : c)); setReplyingTo(null); setReplyText(''); pushToast('Reply added','success') }
        else throw new Error('api')
      }).catch(()=>{
        const reply = { id: Date.now(), user: 'You', text: replyText, time: 'Just now', avatar: 'AJ' }
        setComments(prev=> prev.map(c => c.id===parentId ? {...c, replies: [...(c.replies||[]), reply]} : c))
        setReplyingTo(null); setReplyText(''); pushToast('Reply added (local)','success')
      })
  }

  // Load comments from API or fallback to localStorage/hardcoded
  React.useEffect(()=>{
    fetch(`/api/comments/${encodeURIComponent(datasetId)}`).then(r=>r.json()).then(j=>{
      if(j.ok && Array.isArray(j.comments)){ setComments(j.comments); return }
      throw new Error('api')
    }).catch(()=>{
      try{
        const s = localStorage.getItem(`comments_${datasetId}`)
        if(s) setComments(JSON.parse(s))
        else setComments([
          { id: 1, user: 'Sarah Chen', text: 'This dataset looks clean! Have we considered adding region-based segmentation?', time: '2 hours ago', avatar: 'SC', likes: 3, liked: false },
          { id: 2, user: 'Marcus Rivera', text: 'I noticed the Q1 numbers are slightly lower than projected. Should we investigate the dip in March?', time: '1 day ago', avatar: 'MR', likes: 1, liked: false }
        ])
      }catch(e){ setComments([]) }
    })
  }, [datasetId])

  return (
    <div style={{padding:12}}>
      <h2 style={{fontSize:18,fontWeight:700}}>Discussion</h2>
      <div style={{marginTop:8}}>
        <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder='Add a comment...' style={{width:'100%',height:80,padding:8,background:'#071028',borderRadius:8,color:'#e6eef8'}} />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <button onClick={addComment} disabled={!newComment.trim()}>Add Comment</button>
          <div style={{color:'#94a3b8'}}>{newComment.length}/500 characters</div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        {comments.map(comment => (
+        <div key={comment.id} style={{marginBottom:12}}>
+          <div style={{padding:12,background:'#0b1524',borderRadius:8}}>
+            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:8}}>
+              <div style={{display:'flex',gap:8,alignItems:'center'}}>
+                <div style={{width:34,height:34,borderRadius:999,background:'linear-gradient(90deg,#6366f1,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#fff',fontSize:12,fontWeight:700}}>{comment.avatar}</span></div>
+                <div>
+                  <div style={{fontWeight:700}}>{comment.user} <span style={{color:'#94a3b8',fontSize:12,marginLeft:8}}>{comment.time}</span></div>
+                  <div style={{color:'#cbd5e1'}}>{comment.text}</div>
+                </div>
+              </div>
+              <div>
+                {comment.user === 'You' && <button onClick={()=>deleteComment(comment.id)} style={{color:'#f87171'}}>Delete</button>}
+              </div>
+            </div>
+
+            <div style={{display:'flex',gap:12}}>
+              <button onClick={()=>toggleLike(comment.id)} style={{background:'transparent'}}>{comment.liked? '❤️' : '🤍'} <span style={{marginLeft:6}}>{comment.likes}</span></button>
+              <button onClick={()=>startReply(comment.id)}>Reply</button>
+            </div>
+
+            {replyingTo === comment.id && (
+              <div style={{marginTop:8}}>
+                <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} style={{width:'100%',height:60,padding:8}} />
+                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:6}}>
+                  <button onClick={()=>setReplyingTo(null)}>Cancel</button>
+                  <button onClick={()=>submitReply(comment.id)} disabled={!replyText.trim()}>Reply</button>
+                </div>
+              </div>
+            )}
+
+            {comment.replies && comment.replies.length>0 && (
+              <div style={{marginTop:8,marginLeft:12}}>
+                {comment.replies.map(reply => (
+                  <div key={reply.id} style={{padding:8,background:'#071028',borderRadius:8,marginBottom:6}}>
+                    <div style={{fontWeight:700}}>{reply.user} <span style={{color:'#94a3b8',fontSize:12,marginLeft:8}}>{reply.time}</span></div>
+                    <div style={{color:'#cbd5e1'}}>{reply.text}</div>
+                  </div>
+                ))}
+              </div>
+            )}
+          </div>
+        </div>
+        ))}
+      </div>
+
+      {comments.length === 0 && (
+        <div style={{textAlign:'center',padding:24}}>
+          <div style={{fontSize:34}}>💬</div>
+          <div style={{color:'#94a3b8'}}>No comments yet. Start the discussion!</div>
+        </div>
+      )}
+    </div>
+  )
+}
*** End Patch