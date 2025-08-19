import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/AuthContext'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Robos from './pages/Robos'
import Jobs from './pages/Jobs'
import Execucoes from './pages/Execucoes'
import Monitoramento from './pages/Monitoramento'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Header />
                <div className="container">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/robos" element={
              <ProtectedRoute>
                <Header />
                <div className="container">
                  <Robos />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Header />
                <div className="container">
                  <Jobs />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/execucoes" element={
              <ProtectedRoute>
                <Header />
                <div className="container">
                  <Execucoes />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/monitoramento" element={
              <ProtectedRoute>
                <Header />
                <div className="container">
                  <Monitoramento />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

