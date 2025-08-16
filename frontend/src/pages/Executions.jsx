import React, { useState, useEffect } from 'react'
import { execucoesAPI, robosAPI, jobsAPI } from '../services/api'
import ExecutionList from '../components/ExecutionList'

function Executions() {
  const [robos, setRobos] = useState([])
  const [jobs, setJobs] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [novaExecucao, setNovaExecucao] = useState({
    robo: '',
    job: '',
    parametros: '{}'
  })
  const [erros, setErros] = useState({})

  useEffect(() => {
    carregarRobosEJobs()
  }, [])

  const carregarRobosEJobs = async () => {
    try {
      const [robosResp, jobsResp] = await Promise.all([
        robosAPI.listar(),
        jobsAPI.listar()
      ])
      
      setRobos(robosResp.data.results.filter(r => r.ativo))
      setJobs(jobsResp.data.results.filter(j => j.ativo))
    } catch (error) {
      console.error('Erro ao carregar robôs e jobs:', error)
    }
  }

  const handleNovaExecucao = () => {
    setNovaExecucao({
      robo: '',
      job: '',
      parametros: '{}'
    })
    setErros({})
    setMostrarFormulario(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNovaExecucao(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (erros[name]) {
      setErros(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleJobChange = (e) => {
    const jobId = e.target.value
    const job = jobs.find(j => j.id === parseInt(jobId))
    
    setNovaExecucao(prev => ({
      ...prev,
      job: jobId,
      parametros: job ? JSON.stringify(job.parametros_padrao, null, 2) : '{}'
    }))
  }

  const formatarParametros = () => {
    try {
      const parsed = JSON.parse(novaExecucao.parametros)
      setNovaExecucao(prev => ({
        ...prev,
        parametros: JSON.stringify(parsed, null, 2)
      }))
    } catch {
      // Ignora se JSON for inválido
    }
  }

  const validarJSON = (jsonString) => {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  const validarFormulario = () => {
    const novosErros = {}

    if (!novaExecucao.robo) {
      novosErros.robo = 'Robô é obrigatório'
    }

    if (!novaExecucao.job) {
      novosErros.job = 'Job é obrigatório'
    }

    if (!validarJSON(novaExecucao.parametros)) {
      novosErros.parametros = 'JSON inválido'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }

    setCarregando(true)

    try {
      const dados = {
        robo: parseInt(novaExecucao.robo),
        job: parseInt(novaExecucao.job),
        parametros: JSON.parse(novaExecucao.parametros)
      }

      await execucoesAPI.criar(dados)
      setMostrarFormulario(false)
      // ExecutionList se atualiza automaticamente
    } catch (error) {
      console.error('Erro ao criar execução:', error)
      if (error.response?.data) {
        setErros(error.response.data)
      }
    } finally {
      setCarregando(false)
    }
  }

  if (mostrarFormulario) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <i className="bi bi-plus-circle me-2"></i>
            Nova Execução
          </h1>
          <button
            className="btn btn-secondary"
            onClick={() => setMostrarFormulario(false)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Voltar
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="robo" className="form-label">
                      Robô
                    </label>
                    <select
                      className={`form-select ${erros.robo ? 'is-invalid' : ''}`}
                      id="robo"
                      name="robo"
                      value={novaExecucao.robo}
                      onChange={handleChange}
                      disabled={carregando}
                    >
                      <option value="">Selecione um robô...</option>
                      {robos.map(robo => (
                        <option key={robo.id} value={robo.id}>
                          {robo.nome} ({robo.host})
                        </option>
                      ))}
                    </select>
                    {erros.robo && (
                      <div className="invalid-feedback">
                        {erros.robo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="job" className="form-label">
                      Job
                    </label>
                    <select
                      className={`form-select ${erros.job ? 'is-invalid' : ''}`}
                      id="job"
                      name="job"
                      value={novaExecucao.job}
                      onChange={handleJobChange}
                      disabled={carregando}
                    >
                      <option value="">Selecione um job...</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.nome}
                        </option>
                      ))}
                    </select>
                    {erros.job && (
                      <div className="invalid-feedback">
                        {erros.job}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="parametros" className="form-label">
                  Parâmetros (JSON)
                </label>
                <div className="input-group">
                  <textarea
                    className={`form-control ${erros.parametros ? 'is-invalid' : ''}`}
                    id="parametros"
                    name="parametros"
                    value={novaExecucao.parametros}
                    onChange={handleChange}
                    disabled={carregando}
                    rows="6"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={formatarParametros}
                    disabled={carregando}
                  >
                    <i className="bi bi-braces me-1"></i>
                    Formatar
                  </button>
                </div>
                {erros.parametros && (
                  <div className="invalid-feedback">
                    {erros.parametros}
                  </div>
                )}
                <div className="form-text">
                  Parâmetros que serão passados para o job como variáveis de ambiente
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={carregando}
                >
                  {carregando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Criando...</span>
                      </span>
                      Criando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Criar Execução
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={carregando}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-play-circle me-2"></i>
          Execuções
        </h1>
        <button
          className="btn btn-primary"
          onClick={handleNovaExecucao}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Nova Execução
        </button>
      </div>

      <ExecutionList />
    </div>
  )
}

export default Executions
