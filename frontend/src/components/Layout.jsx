import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout, getUserFromToken } from '../services/auth'

function Layout({ children, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = getUserFromToken()

  const handleLogout = () => {
    logout()
    onLogout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/dashboard">
            <i className="bi bi-robot me-2"></i>
            Sistema RPA
          </Link>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                  <i className="bi bi-speedometer2 me-1"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/robos')}`} to="/robos">
                  <i className="bi bi-cpu me-1"></i>
                  Robôs
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/jobs')}`} to="/jobs">
                  <i className="bi bi-gear me-1"></i>
                  Jobs
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/execucoes')}`} to="/execucoes">
                  <i className="bi bi-play-circle me-1"></i>
                  Execuções
                </Link>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/grafana" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-graph-up me-1"></i>
                  Monitoramento
                </a>
              </li>
            </ul>
            
            <div className="navbar-nav">
              <div className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="bi bi-person-circle me-1"></i>
                  {usuario?.username}
                </a>
                <ul className="dropdown-menu">
                  <li><h6 className="dropdown-header">Grupos: {usuario?.grupos?.join(', ')}</h6></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Sair
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 bg-light">
        <div className="container-fluid py-4">
          {children}
        </div>
      </main>

      <footer className="bg-dark text-light py-3">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <small>&copy; 2024 Sistema RPA Monitoramento</small>
            </div>
            <div className="col-md-6 text-end">
              <small>
                <a href="/prometheus" className="text-light me-3" target="_blank" rel="noopener noreferrer">
                  Prometheus
                </a>
                <a href="/grafana" className="text-light" target="_blank" rel="noopener noreferrer">
                  Grafana
                </a>
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
