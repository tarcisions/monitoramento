import React, { useState, useEffect } from 'react'
import { jobsAPI } from '../services/api'
import JobForm from '../components/JobForm'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [jobEditando, setJobEditando] = useState(null)

  useEffect(() => {
    carregarJobs()
  }, [])

  const carregarJobs = async () => {
    try {
      setCarregando(true)
      const response = await jobsAPI.listar()
      setJobs(response.data.results)
    } catch (error) {
      console.error('Erro ao carregar jobs:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleNovoJob = () => {
    setJobEditando(null)
    setMostrarFormulario(true)
  }

  const handleEditarJob = (job) => {
    setJobEditando(job)
    setMostrarFormulario(true)
  }

  const handleSalvar = async () => {
    setMostrarFormulario(false)
    setJobEditando(null)
    await carregarJobs()
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setJobEditando(null)
  }

  const handleExcluir = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir o job "${nome}"?`)) {
      return
    }

    try {
      await jobsAPI.deletar(id)
      await carregarJobs()
    } catch (error) {
      console.error('Erro ao excluir job:', error)
      alert('Erro ao excluir job. Verifique se não há execuções associadas.')
    }
  }

  const truncarTexto = (texto, limite = 50) => {
    if (texto.length <= limite) return texto
    return texto.substring(0, limite) + '...'
  }

  if (mostrarFormulario) {
    return (
      <JobForm
        job={jobEditando}
        onSave={handleSalvar}
        onCancel={handleCancelar}
      />
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-gear me-2"></i>
          Jobs
        </h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={carregarJobs}
            disabled={carregando}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Atualizar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNovoJob}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Novo Job
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-gear fs-1 text-muted"></i>
            <h5 className="mt-3">Nenhum job cadastrado</h5>
            <p className="text-muted">Clique em "Novo Job" para cadastrar seu primeiro job</p>
            <button
              className="btn btn-primary"
              onClick={handleNovoJob}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Cadastrar Primeiro Job
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {jobs.map(job => (
            <div key={job.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    {job.nome}
                  </h6>
                  <span className={`badge ${job.ativo ? 'bg-success' : 'bg-secondary'}`}>
                    {job.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="card-body">
                  <dl className="row mb-3">
                    <dt className="col-sm-4">Comando:</dt>
                    <dd className="col-sm-8">
                      <code className="small">
                        {truncarTexto(job.comando)}
                      </code>
                    </dd>
                    
                    <dt className="col-sm-4">Timeout:</dt>
                    <dd className="col-sm-8">{job.timeout_s}s</dd>
                    
                    <dt className="col-sm-4">Criado por:</dt>
                    <dd className="col-sm-8">{job.criado_por_nome}</dd>
                    
                    <dt className="col-sm-4">Criado em:</dt>
                    <dd className="col-sm-8">
                      {new Date(job.criado_em).toLocaleDateString('pt-BR')}
                    </dd>
                  </dl>
                  
                  {Object.keys(job.parametros_padrao || {}).length > 0 && (
                    <div>
                      <small className="text-muted">Parâmetros:</small>
                      <div className="badge-container">
                        {Object.keys(job.parametros_padrao).map(param => (
                          <span key={param} className="badge bg-light text-dark me-1 mb-1">
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleEditarJob(job)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleExcluir(job.id, job.nome)}
                    >
                      <i className="bi bi-trash me-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Jobs
