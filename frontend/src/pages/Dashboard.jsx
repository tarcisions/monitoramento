import React, { useState, useEffect } from 'react'
import api from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    totalRobos: 0,
    robosAtivos: 0,
    totalJobs: 0,
    jobsAtivos: 0,
    execucoesRecentes: []
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [robosRes, jobsRes, execucoesRes] = await Promise.all([
        api.get('/robos/'),
        api.get('/jobs/'),
        api.get('/execucoes/?page_size=5')
      ])

      setStats({
        totalRobos: robosRes.data.count || robosRes.data.length,
        robosAtivos: robosRes.data.results ? 
          robosRes.data.results.filter(r => r.ativo).length : 
          robosRes.data.filter(r => r.ativo).length,
        totalJobs: jobsRes.data.count || jobsRes.data.length,
        jobsAtivos: jobsRes.data.results ? 
          jobsRes.data.results.filter(j => j.ativo).length : 
          jobsRes.data.filter(j => j.ativo).length,
        execucoesRecentes: execucoesRes.data.results || execucoesRes.data
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const getStatusClass = (status) => {
    return `status-badge status-${status}`
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3>Robôs</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
            {stats.robosAtivos}/{stats.totalRobos}
          </p>
          <p>Ativos/Total</p>
        </div>

        <div className="card">
          <h3>Jobs</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
            {stats.jobsAtivos}/{stats.totalJobs}
          </p>
          <p>Ativos/Total</p>
        </div>
      </div>

      <div className="card">
        <h3>Execuções Recentes</h3>
        {stats.execucoesRecentes.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Robô</th>
                <th>Job</th>
                <th>Status</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {stats.execucoesRecentes.map(execucao => (
                <tr key={execucao.id}>
                  <td>{execucao.robo_nome}</td>
                  <td>{execucao.job_nome}</td>
                  <td>
                    <span className={getStatusClass(execucao.status)}>
                      {execucao.status}
                    </span>
                  </td>
                  <td>{new Date(execucao.criado_em).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhuma execução encontrada</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard

