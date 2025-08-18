import React, { useState, useEffect } from 'react'
import api from '../services/api'

function Robos() {
  const [robos, setRobos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    host: '',
    token_agente: '',
    ativo: true
  })

  useEffect(() => {
    loadRobos()
  }, [])

  const loadRobos = async () => {
    try {
      const response = await api.get('/robos/')
      setRobos(response.data.results || response.data)
    } catch (error) {
      console.error('Erro ao carregar robôs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/robos/', formData)
      setFormData({ nome: '', host: '', token_agente: '', ativo: true })
      setShowForm(false)
      loadRobos()
    } catch (error) {
      console.error('Erro ao criar robô:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este robô?')) {
      try {
        await api.delete(`/robos/${id}/`)
        loadRobos()
      } catch (error) {
        console.error('Erro ao excluir robô:', error)
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Robôs</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Robô'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Novo Robô</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Host:</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({...formData, host: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Token do Agente:</label>
              <input
                type="text"
                value={formData.token_agente}
                onChange={(e) => setFormData({...formData, token_agente: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                />
                Ativo
              </label>
            </div>

            <button type="submit" className="btn btn-success">
              Salvar
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Host</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {robos.map(robo => (
              <tr key={robo.id}>
                <td>{robo.nome}</td>
                <td>{robo.host}</td>
                <td>
                  <span className={`status-badge ${robo.ativo ? 'status-success' : 'status-stopped'}`}>
                    {robo.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{new Date(robo.criado_em).toLocaleString('pt-BR')}</td>
                <td>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(robo.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Robos

