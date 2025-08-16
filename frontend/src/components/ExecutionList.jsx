import React, { useState, useEffect } from 'react'
import { execucoesAPI, robosAPI, jobsAPI } from '../services/api'

function ExecutionList() {
  const [execucoes, setExecucoes] = useState([])
  const [robos, setRobos] = useState([])
  const [jobs, setJobs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtros, setFiltros] = useState({
    status: '',
    robo: '',
    job: ''
  })
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  })

  useEffect(() => {
    carregarDados()
  }, [filtros, paginacao.currentPage])

  useEffect(() => {
    carregarRobosEJobs()
  }, [])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const params = {
        page: paginacao.currentPage,
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value)
        )
      }
      
      const response = await execucoesAPI.listar(params)
      setExecucoes(response.data.results)
      
      setPaginacao(prev => ({
        ...prev,
        totalPages: Math.ceil(response.data.count / 20),
        totalItems: response.data.count
      }))
    } catch (error) {
      console.error('Erro ao carregar execuções:', error)
    } finally {
      setCarregando(false)
    }
  }

  const carregarRobosEJobs = async () => {
    try {
      const [robosResp, jobsResp] = await Promise.all([
        robosAPI.listar(),
        jobsAPI.listar()
      ])
      
      setRobos(robosResp.data.results)
      setJobs(jobsResp.data.results)
    } catch (error) {
      console.error('Erro ao carregar robôs e jobs:', error)
    }
  }

  const handleFiltroChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
    setPaginacao(prev => ({ ...prev, currentPage: 1 }))
  }

  const limparFiltros = () => {
    setFiltros({ status: '', robo: '', job: '' })
    setPaginacao(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleAcaoExecucao = async (id, acao) => {
    try {
      setCarregando(true)
      
      switch (acao) {
        case 'iniciar':
          await execucoesAPI.iniciar(id)
          break
        case 'pausar':
          await execucoesAPI.pausar(id)
          break
        case 'parar':
          await execucoesAPI.parar(id)
          break
        case 'retomar':
          await execucoesAPI.retomar(id)
          break
      }
      
      await carregarDados()
    } catch (error) {
      console.error(`Erro ao ${acao} execução:`, error)
      alert(`Erro ao ${acao} execução: ${error.response?.data?.erro || error.message}`)
    } finally {
      setCarregando(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'queued': 'bg-secondary',
      'running': 'bg-primary',
      'paused': 'bg-warning text-dark',
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

  const renderAcoes = (execucao) => {
    const acoes = []

    if (execucao.pode_iniciar) {
      acoes.push(
        <button
          key="iniciar"
          className="btn btn-sm btn-success me-1"
          onClick={() => handleAcaoExecucao(execucao.id, 'iniciar')}
          disabled={carregando}
        >
          <i className="bi bi-play-fill"></i>
        </button>
      )
    }

    if (execucao.pode_pausar) {
      acoes.push(
        <button
          key="pausar"
          className="btn btn-sm btn-warning me-1"
          onClick={() => handleAcaoExecucao(execucao.id, 'pausar')}
          disabled={carregando}
        >
          <i className="bi bi-pause-fill"></i>
        </button>
      )
    }

    if (execucao.pode_retomar) {
      acoes.push(
        <button
          key="retomar"
          className="btn btn-sm btn-info me-1"
          onClick={() => handleAcaoExecucao(execucao.id, 'retomar')}
          disabled={carregando}
        >
          <i className="bi bi-play-fill"></i>
        </button>
      )
    }

    if (execucao.pode_parar) {
      acoes.push(
        <button
          key="parar"
          className="btn btn-sm btn-danger me-1"
          onClick={() => handleAcaoExecucao(execucao.id, 'parar')}
          disabled={carregando}
        >
          <i className="bi bi-stop-fill"></i>
        </button>
      )
    }

    return acoes.length > 0 ? acoes : <span className="text-muted">-</span>
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              Execuções ({paginacao.totalItems})
            </h5>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={carregarDados}
              disabled={carregando}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              name="status"
              value={filtros.status}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os Status</option>
              <option value="queued">Na Fila</option>
              <option value="running">Executando</option>
              <option value="paused">Pausado</option>
              <option value="stopped">Parado</option>
              <option value="failed">Falhou</option>
              <option value="success">Sucesso</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              name="robo"
              value={filtros.robo}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os Robôs</option>
              {robos.map(robo => (
                <option key={robo.id} value={robo.id}>
                  {robo.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              name="job"
              value={filtros.job}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <button
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={limparFiltros}
            >
              <i className="bi bi-x-circle me-1"></i>
              Limpar Filtros
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : execucoes.length === 0 ? (
          <div className="text-center text-muted py-3">
            <i className="bi bi-inbox fs-1"></i>
            <p className="mt-2">Nenhuma execução encontrada</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Robô</th>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Iniciado em</th>
                    <th>Finalizado em</th>
                    <th>Duração</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {execucoes.map(execucao => (
                    <tr key={execucao.id}>
                      <td>#{execucao.id}</td>
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
                        {execucao.finalizado_em ? 
                          new Date(execucao.finalizado_em).toLocaleString('pt-BR') : 
                          '-'
                        }
                      </td>
                      <td>
                        {Math.round(execucao.duracao_segundos)}s
                      </td>
                      <td>
                        {renderAcoes(execucao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginacao.totalPages > 1 && (
              <nav className="mt-3">
                <ul className="pagination pagination-sm justify-content-center">
                  <li className={`page-item ${paginacao.currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginacao(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={paginacao.currentPage === 1 || carregando}
                    >
                      Anterior
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, paginacao.totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <li key={pageNumber} className={`page-item ${paginacao.currentPage === pageNumber ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPaginacao(prev => ({ ...prev, currentPage: pageNumber }))}
                          disabled={carregando}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    )
                  })}
                  
                  <li className={`page-item ${paginacao.currentPage === paginacao.totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPaginacao(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={paginacao.currentPage === paginacao.totalPages || carregando}
                    >
                      Próxima
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ExecutionList
