import React, { useState, useEffect } from 'react'
import api from '../services/api'

function Execucoes() {
  const [execucoes, setExecucoes] = useState([])
  const [robos, setRobos] = useState([])
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    robo: '',
    job: '',
    parametros: '{}'
  })

  useEffect(() => {
    loadExecucoes()
    loadRobos()
    loadJobs()
  }, [])

  const loadExecucoes = async () => {
    try {
      const response = await api.get('/execucoes/')
      setExecucoes(response.data.results || response.data)
    } catch (error) {
      console.error('Erro ao carregar execuções:', error)
    }
  }

  const loadRobos = async () => {
    try {
      const response = await api.get('/robos/')
      setRobos(response.data.results || response.data)
    } catch (error) {
      console.error('Erro ao carregar robôs:', error)
    }
  }

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
        parametros: JSON.parse(formData.parametros)
      }
      await api.post('/execucoes/', data)
      setFormData({ robo: '', job: '', parametros: '{}' })
      setShowForm(false)
      loadExecucoes()
    } catch (error) {
      console.error('Erro ao criar execução:', error)
    }
  }

  const handleAction = async (id, action) => {
    try {
      await api.post(`/execucoes/${id}/${action}/`)
      loadExecucoes()
    } catch (error) {
      console.error(`Erro ao ${action} execução:`, error)
    }
  }

  const getStatusClass = (status) => {
    return `status-badge status-${status}`
  }

  const getActionButtons = (execucao) => {
    const buttons = []
    
    if (execucao.status === 'queued') {
      buttons.push(
        <button 
          key="iniciar"
          className="btn btn-success" 
          style={{ marginRight: '0.5rem' }}
          onClick={() => handleAction(execucao.id, 'iniciar')}
        >
          Iniciar
        </button>
      )
    }
    
    if (execucao.status === 'running') {
      buttons.push(
        <button 
          key="pausar"
          className="btn btn-warning" 
          style={{ marginRight: '0.5rem' }}
          onClick={() => handleAction(execucao.id, 'pausar')}
        >
          Pausar
        </button>
      )
      buttons.push(
        <button 
          key="parar"
          className="btn btn-danger"
          onClick={() => handleAction(execucao.id, 'parar')}
        >
          Parar
        </button>
      )
    }
    
    if (execucao.status === 'paused') {
      buttons.push(
        <button 
          key="retomar"
          className="btn btn-success" 
          style={{ marginRight: '0.5rem' }}
          onClick={() => handleAction(execucao.id, 'retomar')}
        >
          Retomar
        </button>
      )
      buttons.push(
        <button 
          key="parar"
          className="btn btn-danger"
          onClick={() => handleAction(execucao.id, 'parar')}
        >
          Parar
        </button>
      )
    }
    
    return buttons
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Execuções</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nova Execução'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Nova Execução</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Robô:</label>
              <select
                value={formData.robo}
                onChange={(e) => setFormData({...formData, robo: e.target.value})}
                required
              >
                <option value="">Selecione um robô</option>
                {robos.filter(r => r.ativo).map(robo => (
                  <option key={robo.id} value={robo.id}>
                    {robo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Job:</label>
              <select
                value={formData.job}
                onChange={(e) => setFormData({...formData, job: e.target.value})}
                required
              >
                <option value="">Selecione um job</option>
                {jobs.filter(j => j.ativo).map(job => (
                  <option key={job.id} value={job.id}>
                    {job.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Parâmetros (JSON):</label>
              <textarea
                value={formData.parametros}
                onChange={(e) => setFormData({...formData, parametros: e.target.value})}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-success">
              Criar Execução
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Robô</th>
              <th>Job</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Iniciado em</th>
              <th>Finalizado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {execucoes.map(execucao => (
              <tr key={execucao.id}>
                <td>{execucao.robo_nome}</td>
                <td>{execucao.job_nome}</td>
                <td>
                  <span className={getStatusClass(execucao.status)}>
                    {execucao.status}
                  </span>
                </td>
                <td>{new Date(execucao.criado_em).toLocaleString('pt-BR')}</td>
                <td>
                  {execucao.iniciado_em ? 
                    new Date(execucao.iniciado_em).toLocaleString('pt-BR') : 
                    '-'
                  }
                </td>
                <td>
                  {execucao.finalizado_em ? 
                    new Date(execucao.finalizado_em).toLocaleString('pt-BR') : 
                    '-'
                  }
                </td>
                <td>
                  {getActionButtons(execucao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Execucoes

