import { useState, useEffect } from 'react'
import api from '../services/api'

function MealPlans() {
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState('')
  const [plans, setPlans] = useState([])
  const [recipes, setRecipes] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newPlan, setNewPlan] = useState({ title: '', start_date: '', end_date: '' })

  useEffect(() => {
    api.get('/families').then(r => {
      setFamilies(r.data)
      if (r.data.length > 0) setSelectedFamily(r.data[0].id)
    })
    api.get('/recipes').then(r => setRecipes(r.data))
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      api.get(`/meal-plans/family/${selectedFamily}`).then(r => setPlans(r.data))
    }
  }, [selectedFamily])

  const createPlan = async (e) => {
    e.preventDefault()
    await api.post('/meal-plans', { family_id: parseInt(selectedFamily), ...newPlan })
    setShowCreate(false)
    setNewPlan({ title: '', start_date: '', end_date: '' })
    api.get(`/meal-plans/family/${selectedFamily}`).then(r => setPlans(r.data))
  }

  const addMeal = async (planId, recipeId, date, mealType) => {
    await api.post(`/meal-plans/${planId}/meals`, { recipe_id: recipeId, date, meal_type: mealType })
    api.get(`/meal-plans/family/${selectedFamily}`).then(r => setPlans(r.data))
  }

  const deleteMeal = async (mealId) => {
    await api.delete(`/meal-plans/meals/${mealId}`)
    api.get(`/meal-plans/family/${selectedFamily}`).then(r => setPlans(r.data))
  }

  const deletePlan = async (planId) => {
    if (!confirm('确定删除该餐食计划？')) return
    await api.delete(`/meal-plans/${planId}`)
    api.get(`/meal-plans/family/${selectedFamily}`).then(r => setPlans(r.data))
  }

  const generateList = async (planId) => {
    const res = await api.post('/shopping-lists', { family_id: parseInt(selectedFamily), meal_plan_id: planId, title: '由餐食计划生成' })
    alert(`购物清单已生成，包含 ${res.data.items.length} 项`)
  }

  const mealTypeLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }

  if (families.length === 0) {
    return (
      <div style={{textAlign:'center', padding:'60px'}}>
        <p>请先创建或加入一个家庭群组</p>
        <a href="/families"><button className="btn-primary" style={{marginTop:'12px'}}>前往家庭页面</button></a>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>餐食计划</h1>
        <div style={{display:'flex', gap:'8px'}}>
          <select value={selectedFamily} onChange={e => setSelectedFamily(e.target.value)} style={{width:'160px'}}>
            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>新建计划</button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{marginBottom:'20px'}}>
          <form onSubmit={createPlan} style={{display:'flex', gap:'12px', alignItems:'end', flexWrap:'wrap'}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label>标题</label>
              <input value={newPlan.title} onChange={e => setNewPlan({...newPlan, title: e.target.value})} placeholder="本周餐食计划" />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>开始日期</label>
              <input type="date" value={newPlan.start_date} onChange={e => setNewPlan({...newPlan, start_date: e.target.value})} required />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label>结束日期</label>
              <input type="date" value={newPlan.end_date} onChange={e => setNewPlan({...newPlan, end_date: e.target.value})} required />
            </div>
            <button className="btn-primary">创建</button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
          </form>
        </div>
      )}

      {plans.map(plan => (
        <div key={plan.id} className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
            <h3>{plan.title || `${plan.start_date} ~ ${plan.end_date}`}</h3>
            <div style={{display:'flex', gap:'8px'}}>
              <button className="btn-primary" onClick={() => generateList(plan.id)}>生成购物清单</button>
              <button className="btn-danger" onClick={() => deletePlan(plan.id)}>删除</button>
            </div>
          </div>
          <p style={{fontSize:'13px', color:'var(--text-light)', marginBottom:'12px'}}>{plan.start_date} 至 {plan.end_date}</p>

          {plan.meals.length > 0 && (
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
              <thead>
                <tr style={{borderBottom:'1px solid #eee'}}>
                  <th style={{textAlign:'left', padding:'8px'}}>日期</th>
                  <th style={{textAlign:'left', padding:'8px'}}>餐次</th>
                  <th style={{textAlign:'left', padding:'8px'}}>食谱</th>
                  <th style={{padding:'8px'}}></th>
                </tr>
              </thead>
              <tbody>
                {plan.meals.map(meal => (
                  <tr key={meal.id} style={{borderBottom:'1px solid #f5f5f5'}}>
                    <td style={{padding:'8px'}}>{meal.date}</td>
                    <td style={{padding:'8px'}}>{mealTypeLabels[meal.meal_type]}</td>
                    <td style={{padding:'8px'}}>{meal.recipe?.title}</td>
                    <td style={{padding:'8px', textAlign:'right'}}>
                      <button className="btn-danger" style={{padding:'4px 8px', fontSize:'12px'}} onClick={() => deleteMeal(meal.id)}>移除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <AddMealForm planId={plan.id} recipes={recipes} onAdd={addMeal} />
        </div>
      ))}
    </div>
  )
}

function AddMealForm({ planId, recipes, onAdd }) {
  const [show, setShow] = useState(false)
  const [date, setDate] = useState('')
  const [mealType, setMealType] = useState('dinner')
  const [recipeId, setRecipeId] = useState('')

  const handleAdd = () => {
    if (!date || !recipeId) return
    onAdd(planId, parseInt(recipeId), date, mealType)
    setShow(false)
    setDate('')
    setRecipeId('')
  }

  if (!show) return <button className="btn-secondary" style={{marginTop:'12px'}} onClick={() => setShow(true)}>添加餐次</button>

  return (
    <div style={{display:'flex', gap:'8px', marginTop:'12px', alignItems:'end', flexWrap:'wrap'}}>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width:'150px'}} />
      <select value={mealType} onChange={e => setMealType(e.target.value)} style={{width:'100px'}}>
        <option value="breakfast">早餐</option>
        <option value="lunch">午餐</option>
        <option value="dinner">晚餐</option>
        <option value="snack">加餐</option>
      </select>
      <select value={recipeId} onChange={e => setRecipeId(e.target.value)} style={{width:'200px'}}>
        <option value="">选择食谱</option>
        {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
      <button className="btn-primary" onClick={handleAdd}>确认</button>
      <button className="btn-secondary" onClick={() => setShow(false)}>取消</button>
    </div>
  )
}

export default MealPlans
