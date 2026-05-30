import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './services/api'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import ImportRecipe from './pages/ImportRecipe'
import MealPlans from './pages/MealPlans'
import ShoppingLists from './pages/ShoppingLists'
import Families from './pages/Families'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) return <div className="container" style={{textAlign:'center', padding:'100px'}}>加载中...</div>

  return (
    <BrowserRouter>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Recipes /> : <Navigate to="/login" />} />
          <Route path="/recipes/new" element={user ? <RecipeForm /> : <Navigate to="/login" />} />
          <Route path="/recipes/import" element={user ? <ImportRecipe /> : <Navigate to="/login" />} />
          <Route path="/recipes/:id" element={user ? <RecipeDetail /> : <Navigate to="/login" />} />
          <Route path="/recipes/:id/edit" element={user ? <RecipeForm /> : <Navigate to="/login" />} />
          <Route path="/meal-plans" element={user ? <MealPlans /> : <Navigate to="/login" />} />
          <Route path="/shopping" element={user ? <ShoppingLists /> : <Navigate to="/login" />} />
          <Route path="/families" element={user ? <Families /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
