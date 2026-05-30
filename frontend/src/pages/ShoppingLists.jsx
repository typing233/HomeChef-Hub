import { useState, useEffect } from 'react'
import api from '../services/api'

function ShoppingLists() {
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState('')
  const [lists, setLists] = useState([])
  const [newItemName, setNewItemName] = useState({})
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    api.get('/families').then(r => {
      setFamilies(r.data)
      if (r.data.length > 0) setSelectedFamily(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedFamily) loadLists()
  }, [selectedFamily])

  const loadLists = () => {
    api.get(`/shopping-lists/family/${selectedFamily}`).then(r => setLists(r.data))
  }

  const createList = async () => {
    await api.post('/shopping-lists', { family_id: parseInt(selectedFamily), title: '新购物清单' })
    loadLists()
  }

  const toggleItem = async (itemId) => {
    const list = lists.find(l => l.items.some(i => i.id === itemId))
    const item = list.items.find(i => i.id === itemId)
    await api.put(`/shopping-lists/items/${itemId}`, { checked: !item.checked })
    loadLists()
  }

  const addItem = async (listId) => {
    const name = newItemName[listId]
    if (!name) return
    await api.post(`/shopping-lists/${listId}/items`, { name })
    setNewItemName({...newItemName, [listId]: ''})
    loadLists()
  }

  const deleteItem = async (itemId) => {
    await api.delete(`/shopping-lists/items/${itemId}`)
    loadLists()
  }

  const deleteList = async (listId) => {
    if (!confirm('确定删除该购物清单？')) return
    await api.delete(`/shopping-lists/${listId}`)
    loadLists()
  }

  const startEdit = (item) => {
    setEditing({ id: item.id, name: item.name, amount: item.amount || '', unit: item.unit || '' })
  }

  const saveEdit = async () => {
    if (!editing) return
    await api.put(`/shopping-lists/items/${editing.id}`, {
      name: editing.name,
      amount: editing.amount || null,
      unit: editing.unit || null,
    })
    setEditing(null)
    loadLists()
  }

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
        <h1>购物清单</h1>
        <div style={{display:'flex', gap:'8px'}}>
          <select value={selectedFamily} onChange={e => setSelectedFamily(e.target.value)} style={{width:'160px'}}>
            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn-primary" onClick={createList}>新建清单</button>
        </div>
      </div>

      {lists.map(list => (
        <div key={list.id} className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
            <h3>{list.title || '购物清单'}</h3>
            <button className="btn-danger" onClick={() => deleteList(list.id)} style={{fontSize:'12px'}}>删除</button>
          </div>

          {list.items.map(item => (
            <div key={item.id} className={`shopping-item ${item.checked ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
              />
              {editing && editing.id === item.id ? (
                <div style={{display:'flex', gap:'6px', flex:1, alignItems:'center'}}>
                  <input
                    value={editing.amount}
                    onChange={e => setEditing({...editing, amount: e.target.value})}
                    placeholder="数量"
                    style={{width:'70px'}}
                  />
                  <input
                    value={editing.unit}
                    onChange={e => setEditing({...editing, unit: e.target.value})}
                    placeholder="单位"
                    style={{width:'60px'}}
                  />
                  <input
                    value={editing.name}
                    onChange={e => setEditing({...editing, name: e.target.value})}
                    placeholder="名称"
                    style={{flex:1}}
                  />
                  <button className="btn-primary" onClick={saveEdit} style={{padding:'4px 10px', fontSize:'12px'}}>保存</button>
                  <button className="btn-secondary" onClick={() => setEditing(null)} style={{padding:'4px 10px', fontSize:'12px'}}>取消</button>
                </div>
              ) : (
                <>
                  <span style={{flex:1, cursor:'pointer'}} onClick={() => startEdit(item)}>
                    {item.amount && `${item.amount} `}{item.unit && `${item.unit} `}{item.name}
                  </span>
                  <button
                    onClick={() => startEdit(item)}
                    style={{background:'none', color:'var(--primary)', fontSize:'12px', padding:'0 6px'}}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{background:'none', color:'var(--danger)', fontSize:'16px', padding:'0 4px'}}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}

          <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
            <input
              placeholder="添加项目..."
              value={newItemName[list.id] || ''}
              onChange={e => setNewItemName({...newItemName, [list.id]: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && addItem(list.id)}
            />
            <button className="btn-secondary" onClick={() => addItem(list.id)}>添加</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ShoppingLists
