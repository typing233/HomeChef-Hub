import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    api.get('/recipes/categories').then(r => setCategories(r.data))
  }, [])

  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (selectedCat) params.category_id = selectedCat
    api.get('/recipes', { params }).then(r => setRecipes(r.data))
  }, [search, selectedCat])

  return (
    <div>
      <div className="page-header">
        <h1>我的食谱</h1>
        <div style={{display:'flex', gap:'8px'}}>
          <Link to="/recipes/import"><button className="btn-secondary">导入食谱</button></Link>
          <Link to="/recipes/new"><button className="btn-primary">新建食谱</button></Link>
        </div>
      </div>

      <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
        <input
          placeholder="搜索食谱..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{flex:1}}
        />
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{width:'160px'}}>
          <option value="">所有分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid">
        {recipes.map(recipe => (
          <Link to={`/recipes/${recipe.id}`} key={recipe.id} style={{textDecoration:'none', color:'inherit'}}>
            <div className="card recipe-card">
              {recipe.image_url && <img src={recipe.image_url} alt={recipe.title} />}
              <h3>{recipe.title}</h3>
              {recipe.description && <p style={{fontSize:'14px', color:'var(--text-light)', marginTop:'4px'}}>{recipe.description.slice(0, 80)}</p>}
              <div style={{marginTop:'8px'}}>
                {recipe.category && <span className="tag">{recipe.category.name}</span>}
                {recipe.tags?.map(t => <span key={t.id} className="tag">{t.name}</span>)}
              </div>
              {(recipe.prep_time || recipe.cook_time) && (
                <p style={{fontSize:'12px', color:'var(--text-light)', marginTop:'8px'}}>
                  {recipe.prep_time && `准备 ${recipe.prep_time}分钟`}
                  {recipe.prep_time && recipe.cook_time && ' · '}
                  {recipe.cook_time && `烹饪 ${recipe.cook_time}分钟`}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {recipes.length === 0 && (
        <div style={{textAlign:'center', padding:'60px', color:'var(--text-light)'}}>
          <p>还没有食谱，开始创建或导入吧！</p>
        </div>
      )}
    </div>
  )
}

export default Recipes
