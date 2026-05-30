import { Link } from 'react-router-dom'

function Navbar({ user, onLogout }) {
  return (
    <nav className="nav">
      <div className="container" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <Link to="/" className="nav-brand">HomeChef Hub</Link>
        <ul className="nav-links">
          <li><Link to="/">食谱</Link></li>
          <li><Link to="/recipes/import">导入</Link></li>
          <li><Link to="/meal-plans">餐食计划</Link></li>
          <li><Link to="/shopping">购物清单</Link></li>
          <li><Link to="/families">家庭</Link></li>
        </ul>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'14px', color:'var(--text-light)'}}>{user.display_name}</span>
          <button className="btn-secondary" onClick={onLogout}>退出</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
