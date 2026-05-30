import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function RecipeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', description: '', prep_time: '', cook_time: '', servings: '',
    image_url: '', category_id: '', tag_ids: [], ingredients: [], steps: []
  })
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    api.get('/recipes/categories').then(r => setCategories(r.data))
    api.get('/recipes/tags').then(r => setTags(r.data))
    if (isEdit) {
      api.get(`/recipes/${id}`).then(r => {
        const d = r.data
        setForm({
          title: d.title, description: d.description || '', prep_time: d.prep_time || '',
          cook_time: d.cook_time || '', servings: d.servings || '', image_url: d.image_url || '',
          category_id: d.category?.id || '', tag_ids: d.tags.map(t => t.id),
          ingredients: d.ingredients.map(i => ({name: i.name, amount: i.amount || '', unit: i.unit || ''})),
          steps: d.steps.map(s => ({order: s.order, description: s.description})),
        })
      })
    }
  }, [id])

  const addIngredient = () => setForm({...form, ingredients: [...form.ingredients, {name:'', amount:'', unit:''}]})
  const addStep = () => setForm({...form, steps: [...form.steps, {order: form.steps.length + 1, description:''}]})

  const updateIngredient = (idx, field, val) => {
    const ings = [...form.ingredients]
    ings[idx] = {...ings[idx], [field]: val}
    setForm({...form, ingredients: ings})
  }

  const updateStep = (idx, val) => {
    const steps = [...form.steps]
    steps[idx] = {...steps[idx], description: val}
    setForm({...form, steps: steps})
  }

  const removeIngredient = (idx) => setForm({...form, ingredients: form.ingredients.filter((_,i) => i !== idx)})
  const removeStep = (idx) => {
    const steps = form.steps.filter((_,i) => i !== idx).map((s, i) => ({...s, order: i+1}))
    setForm({...form, steps})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      prep_time: form.prep_time ? parseInt(form.prep_time) : null,
      cook_time: form.cook_time ? parseInt(form.cook_time) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    }
    try {
      if (isEdit) {
        await api.put(`/recipes/${id}`, payload)
        navigate(`/recipes/${id}`)
      } else {
        const res = await api.post('/recipes', payload)
        navigate(`/recipes/${res.data.id}`)
      }
    } catch (err) {
      alert(err.response?.data?.detail || '保存失败')
    }
  }

  return (
    <div style={{maxWidth:'700px', margin:'24px auto'}}>
      <h1 style={{marginBottom:'20px'}}>{isEdit ? '编辑食谱' : '新建食谱'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>标题 *</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
            <div className="form-group">
              <label>准备时间(分钟)</label>
              <input type="number" value={form.prep_time} onChange={e => setForm({...form, prep_time: e.target.value})} />
            </div>
            <div className="form-group">
              <label>烹饪时间(分钟)</label>
              <input type="number" value={form.cook_time} onChange={e => setForm({...form, cook_time: e.target.value})} />
            </div>
            <div className="form-group">
              <label>份量(人份)</label>
              <input type="number" value={form.servings} onChange={e => setForm({...form, servings: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>图片URL</label>
            <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div className="form-group">
              <label>分类</label>
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">无分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>标签</label>
              <select multiple value={form.tag_ids.map(String)} onChange={e => setForm({...form, tag_ids: Array.from(e.target.selectedOptions, o => parseInt(o.value))})}>
                {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{marginTop:'16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
            <h3>食材</h3>
            <button type="button" className="btn-secondary" onClick={addIngredient}>添加食材</button>
          </div>
          {form.ingredients.map((ing, idx) => (
            <div key={idx} style={{display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center'}}>
              <input placeholder="名称" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} style={{flex:2}} />
              <input placeholder="用量" value={ing.amount} onChange={e => updateIngredient(idx, 'amount', e.target.value)} style={{flex:1}} />
              <input placeholder="单位" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} style={{flex:1}} />
              <button type="button" className="btn-danger" onClick={() => removeIngredient(idx)} style={{padding:'8px 10px'}}>×</button>
            </div>
          ))}
        </div>

        <div className="card" style={{marginTop:'16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
            <h3>步骤</h3>
            <button type="button" className="btn-secondary" onClick={addStep}>添加步骤</button>
          </div>
          {form.steps.map((step, idx) => (
            <div key={idx} style={{display:'flex', gap:'8px', marginBottom:'8px', alignItems:'flex-start'}}>
              <span style={{padding:'10px 0', fontWeight:'bold', minWidth:'24px'}}>{idx+1}.</span>
              <textarea rows={2} value={step.description} onChange={e => updateStep(idx, e.target.value)} style={{flex:1}} />
              <button type="button" className="btn-danger" onClick={() => removeStep(idx)} style={{padding:'8px 10px'}}>×</button>
            </div>
          ))}
        </div>

        <div style={{marginTop:'20px', display:'flex', gap:'12px'}}>
          <button type="submit" className="btn-primary" style={{padding:'12px 32px'}}>保存食谱</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>取消</button>
        </div>
      </form>
    </div>
  )
}

export default RecipeForm
