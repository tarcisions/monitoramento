import React, { useState, useEffect } from 'react'
import { robosAPI, execucoesAPI, jobsAPI } from '../services/api'

function Dashboard() {
  const [estatisticas, setEstatisticas] = useState({
    robos: { total_robos: 0, robos_ativos: 0, robos_conectados: 0 },
    execucoes: { total_execucoes_hoje: 0, taxa_sucesso: 0, tempo_medio_execucao: 0 },
    jobs: { total_jobs: 0, jobs_ativos: 0 }
  })
  const [execucoesRecentes, setExecucoesRecentes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarDados()
    const interval = setInterval(carregarDados, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarDados = async () => {
    try {
      const [robosEstat, execucoesEstat, jobsEstat, execucoesRecentes] = await Promise.all([
        robosAPI.estatisticas(),
        execucoesAPI.estatisticas(),
        jobsAPI.estatisticas(),
        execucoesAPI.listar({ page_size: 10 })
      ])

      setEstatisticas({
        robos: robosEstat.data,
        execucoes: execucoesEstat.data,
        jobs: jobsEstat.data
      })

      setExecucoesRecentes(execucoesRecentes.data.results || [])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setCarregando(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'queued': 'bg-secondary',
      'running': 'bg-primary',
      'paused': 'bg-warning',
      'stopped': 'bg-dark',
      'failed': 'bg-danger',
      'success': 'bg-success'
    }
    return badges[status] || 'bg-secondary'
  }

  const getStatusText = (status) => {
    const texts = {
      'queued': 'Na Fila',
      'running': 'Executando',
      'paused': 'Pausado',
      'stopped': 'Parado',
      'failed': 'Falhou',
      'success': 'Sucesso'
    }
    return texts[status] || status
  }

  if (carregando) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-speedometer2 me-2"></i>
          Dashboard
        </h1>
        <button className="btn btn-outline-primary" onClick={carregarDados}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Atualizar
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title">Robôs Conectados</h6>
                  <h2 className="mb-0">{estatisticas.robos.robos_conectados}</h2>
                  <small>de {estatisticas.robos.robos_ativos} ativos</small>
                </div>
                <i className="bi bi-cpu fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title">Taxa de Sucesso</h6>
                  <h2 className="mb-0">{estatisticas.execucoes.taxa_sucesso}%</h2>
                  <small>execuções hoje</small>
                </div>
                <i className="bi bi-check-circle fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title">Execuções Hoje</h6>
                  <h2 className="mb-0">{estatisticas.execucoes.total_execucoes_hoje}</h2>
                  <small>total executadas</small>
                </div>
                <i className="bi bi-play-circle fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title">Tempo Médio</h6>
                  <h2 className="mb-0">{Math.round(estatisticas.execucoes.tempo_medio_execucao)}s</h2>
                  <small>por execução</small>
                </div>
                <i className="bi bi-clock fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Execuções Recentes
              </h5>
            </div>
            <div className="card-body">
              {execucoesRecentes.length === 0 ? (
                <div className="text-center text-muted py-3">
                  <i className="bi bi-inbox fs-1"></i>
                  <p className="mt-2">Nenhuma execução encontrada</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Robô</th>
                        <th>Job</th>
                        <th>Status</th>
                        <th>Iniciado em</th>
                        <th>Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {execucoesRecentes.map(execucao => (
                        <tr key={execucao.id}>
                          <td>
                            <i className="bi bi-cpu me-2"></i>
                            {execucao.robo_nome}
                          </td>
                          <td>
                            <i className="bi bi-gear me-2"></i>
                            {execucao.job_nome}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(execucao.status)}`}>
                              {getStatusText(execucao.status)}
                            </span>
                          </td>
                          <td>
                            {new Date(execucao.iniciado_em).toLocaleString('pt-BR')}
                          </td>
                          <td>
                            {Math.round(execucao.duracao_segundos)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Links Úteis
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a
                  href="/grafana"
                  className="btn btn-outline-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-graph-up me-2"></i>
                  Grafana - Dashboards
                </a>
                <a
                  href="/prometheus"
                  className="btn btn-outline-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-speedometer me-2"></i>
                  Prometheus - Métricas
                </a>
                <a
                  href="/admin"
                  className="btn btn-outline-dark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-gear me-2"></i>
                  Django Admin
                </a>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Sistema
              </h5>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-6">Total Robôs:</dt>
                <dd className="col-sm-6">{estatisticas.robos.total_robos}</dd>
                
                <dt className="col-sm-6">Total Jobs:</dt>
                <dd className="col-sm-6">{estatisticas.jobs.total_jobs}</dd>
                
                <dt className="col-sm-6">Jobs Ativos:</dt>
                <dd className="col-sm-6">{estatisticas.jobs.jobs_ativos}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
