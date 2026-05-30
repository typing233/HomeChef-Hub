import { useState, useEffect } from 'react'
import api from '../services/api'

function Families() {
  const [families, setFamilies] = useState([])
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { loadFamilies() }, [])

  const loadFamilies = () => {
    api.get('/families').then(r => setFamilies(r.data))
  }

  const createFamily = async (e) => {
    e.preventDefault()
    if (!newName) return
    await api.post('/families', { name: newName })
    setNewName('')
    loadFamilies()
  }

  const joinFamily = async (e) => {
    e.preventDefault()
    if (!joinCode) return
    try {
      await api.post('/families/join', { invite_code: joinCode })
      setJoinCode('')
      setMessage('成功加入家庭！')
      loadFamilies()
    } catch (err) {
      setMessage(err.response?.data?.detail || '加入失败')
    }
  }

  return (
    <div style={{maxWidth:'700px', margin:'24px auto'}}>
      <h1 style={{marginBottom:'24px'}}>家庭群组</h1>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px'}}>
        <div className="card">
          <h3 style={{marginBottom:'12px'}}>创建家庭</h3>
          <form onSubmit={createFamily} style={{display:'flex', gap:'8px'}}>
            <input placeholder="家庭名称" value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="btn-primary">创建</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{marginBottom:'12px'}}>加入家庭</h3>
          <form onSubmit={joinFamily} style={{display:'flex', gap:'8px'}}>
            <input placeholder="邀请码" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
            <button className="btn-primary">加入</button>
          </form>
          {message && <p style={{marginTop:'8px', fontSize:'13px', color:'var(--success)'}}>{message}</p>}
        </div>
      </div>

      {families.map(family => (
        <div key={family.id} className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3>{family.name}</h3>
            <span style={{fontSize:'13px', color:'var(--text-light)', background:'#f5f5f5', padding:'4px 12px', borderRadius:'4px', fontFamily:'monospace'}}>
              邀请码: {family.invite_code}
            </span>
          </div>
          <div style={{marginTop:'12px'}}>
            <p style={{fontSize:'14px', color:'var(--text-light)', marginBottom:'8px'}}>成员 ({family.members.length}人):</p>
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {family.members.map(m => (
                <span key={m.id} className="tag" style={{padding:'4px 12px'}}>
                  {m.display_name || m.username}
                  {m.id === family.owner_id && ' (创建者)'}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {families.length === 0 && (
        <div style={{textAlign:'center', padding:'40px', color:'var(--text-light)'}}>
          <p>您还没有加入任何家庭群组</p>
          <p>创建一个新家庭或使用邀请码加入</p>
        </div>
      )}
    </div>
  )
}

export default Families
