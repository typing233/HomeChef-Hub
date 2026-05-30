import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)

  useEffect(() => {
    api.get(`/recipes/${id}`).then(r => setRecipe(r.data)).catch(() => navigate('/'))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('确定删除该食谱？')) return
    await api.delete(`/recipes/${id}`)
    navigate('/')
  }

  if (!recipe) return <p>加载中...</p>

  return (
    <div style={{maxWidth:'800px', margin:'24px auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h1>{recipe.title}</h1>
        <div style={{display:'flex', gap:'8px'}}>
          <Link to={`/recipes/${id}/edit`}><button className="btn-primary">编辑</button></Link>
          <button className="btn-danger" onClick={handleDelete}>删除</button>
        </div>
      </div>

      {recipe.image_url && <img src={recipe.image_url} alt={recipe.title} style={{width:'100%', maxHeight:'400px', objectFit:'cover', borderRadius:'12px', marginBottom:'20px'}} />}

      <div className="card">
        {recipe.description && <p style={{marginBottom:'16px'}}>{recipe.description}</p>}
        <div style={{display:'flex', gap:'20px', flexWrap:'wrap', fontSize:'14px', color:'var(--text-light)'}}>
          {recipe.prep_time && <span>准备时间: {recipe.prep_time}分钟</span>}
          {recipe.cook_time && <span>烹饪时间: {recipe.cook_time}分钟</span>}
          {recipe.servings && <span>份量: {recipe.servings}人份</span>}
        </div>
        {recipe.source_url && <p style={{marginTop:'8px', fontSize:'13px'}}><a href={recipe.source_url} target="_blank" rel="noreferrer" style={{color:'var(--primary)'}}>查看原始来源</a></p>}
        <div style={{marginTop:'12px'}}>
          {recipe.category && <span className="tag">{recipe.category.name}</span>}
          {recipe.tags.map(t => <span key={t.id} className="tag">{t.name}</span>)}
        </div>
      </div>

      <div className="card" style={{marginTop:'16px'}}>
        <h3 style={{marginBottom:'12px'}}>食材</h3>
        <ul style={{paddingLeft:'20px'}}>
          {recipe.ingredients.map(ing => (
            <li key={ing.id} style={{marginBottom:'6px'}}>
              {ing.amount && `${ing.amount} `}{ing.unit && `${ing.unit} `}{ing.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{marginTop:'16px'}}>
        <h3 style={{marginBottom:'12px'}}>步骤</h3>
        <ol style={{paddingLeft:'20px'}}>
          {recipe.steps.map(step => (
            <li key={step.id} style={{marginBottom:'12px'}}>{step.description}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default RecipeDetail
