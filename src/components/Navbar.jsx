import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar page-shell" aria-label="Main navigation">
        <NavLink className="brand" to="/" aria-label="Digital Notice Board home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>Digital Notice Board</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Home
          </NavLink>
          <NavLink to="/admin/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Admin
          </NavLink>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
