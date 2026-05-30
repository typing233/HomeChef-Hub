import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      const token = res.data.access_token
      localStorage.setItem('token', token)
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      onLogin(token, userRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form card">
        <h2 style={{marginBottom: '20px', textAlign: 'center'}}>登录 HomeChef Hub</h2>
        {error && <p style={{color: 'var(--danger)', marginBottom: '12px'}}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn-primary" style={{width:'100%', padding:'12px'}}>登录</button>
        </form>
        <p style={{marginTop: '16px', textAlign: 'center'}}>
          还没有账户？<Link to="/register" style={{color:'var(--primary)'}}>注册</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
