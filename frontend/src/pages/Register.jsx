import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register', form)
      const loginRes = await api.post('/auth/login', { username: form.username, password: form.password })
      const token = loginRes.data.access_token
      localStorage.setItem('token', token)
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      onLogin(token, userRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form card">
        <h2 style={{marginBottom: '20px', textAlign: 'center'}}>注册</h2>
        {error && <p style={{color: 'var(--danger)', marginBottom: '12px'}}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>显示名称</label>
            <input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn-primary" style={{width:'100%', padding:'12px'}}>注册</button>
        </form>
        <p style={{marginTop: '16px', textAlign: 'center'}}>
          已有账户？<Link to="/login" style={{color:'var(--primary)'}}>登录</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
