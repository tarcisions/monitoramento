import React, { useState, useEffect } from 'react'
import api from '../services/api'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    comando: '',
    timeout_s: 300,
    parametros_padrao: '{}',
    ativo: true
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs/')
      setJobs(response.data.results || response.data)
    } catch (error) {
      console.error('Erro ao carregar jobs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        parametros_padrao: JSON.parse(formData.parametros_padrao)
      }
      await api.post('/jobs/', data)
      setFormData({ nome: '', comando: '', timeout_s: 300, parametros_padrao: '{}', ativo: true })
      setShowForm(false)
      loadJobs()
    } catch (error) {
      console.error('Erro ao criar job:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este job?')) {
      try {
        await api.delete(`/jobs/${id}/`)
        loadJobs()
      } catch (error) {
        console.error('Erro ao excluir job:', error)
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Jobs</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Job'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Novo Job</h3>
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
              <label>Comando:</label>
              <textarea
                value={formData.comando}
                onChange={(e) => setFormData({...formData, comando: e.target.value})}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Timeout (segundos):</label>
              <input
                type="number"
                value={formData.timeout_s}
                onChange={(e) => setFormData({...formData, timeout_s: parseInt(e.target.value)})}
                required
              />
            </div>

            <div className="form-group">
              <label>Parâmetros Padrão (JSON):</label>
              <textarea
                value={formData.parametros_padrao}
                onChange={(e) => setFormData({...formData, parametros_padrao: e.target.value})}
                rows="3"
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
              <th>Comando</th>
              <th>Timeout</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>{job.nome}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.comando}
                </td>
                <td>{job.timeout_s}s</td>
                <td>
                  <span className={`status-badge ${job.ativo ? 'status-success' : 'status-stopped'}`}>
                    {job.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{new Date(job.criado_em).toLocaleString('pt-BR')}</td>
                <td>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(job.id)}
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

export default Jobs

