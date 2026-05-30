import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function ImportRecipe() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleImport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/recipes/import', { url })
      navigate(`/recipes/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || '导入失败，请检查URL是否有效')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:'600px', margin:'40px auto'}}>
      <h1 style={{marginBottom:'20px'}}>从网页导入食谱</h1>
      <div className="card">
        <p style={{marginBottom:'16px', color:'var(--text-light)'}}>
          粘贴食谱网页的URL，系统将自动抓取并解析标题、食材、步骤等信息。
        </p>
        <form onSubmit={handleImport}>
          <div className="form-group">
            <label>食谱网页URL</label>
            <input
              type="url"
              placeholder="https://example.com/recipe/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>
          {error && <p style={{color:'var(--danger)', marginBottom:'12px'}}>{error}</p>}
          <button className="btn-primary" disabled={loading} style={{padding:'12px 32px'}}>
            {loading ? '正在解析...' : '导入食谱'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ImportRecipe
