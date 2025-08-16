import React, { useState, useEffect } from 'react'
import { jobsAPI } from '../services/api'

function JobForm({ job, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    comando: '',
    timeout_s: 300,
    parametros_padrao: '{}',
    ativo: true
  })
  const [carregando, setCarregando] = useState(false)
  const [erros, setErros] = useState({})

  useEffect(() => {
    if (job) {
      setFormData({
        nome: job.nome || '',
        comando: job.comando || '',
        timeout_s: job.timeout_s || 300,
        parametros_padrao: JSON.stringify(job.parametros_padrao || {}, null, 2),
        ativo: job.ativo !== undefined ? job.ativo : true
      })
    }
  }, [job])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (erros[name]) {
      setErros(prev => ({
        ...prev,
        [name]: ''
      }))
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

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }

    if (!formData.comando.trim()) {
      novosErros.comando = 'Comando é obrigatório'
    }

    if (formData.timeout_s <= 0) {
      novosErros.timeout_s = 'Timeout deve ser maior que zero'
    }

    if (!validarJSON(formData.parametros_padrao)) {
      novosErros.parametros_padrao = 'JSON inválido'
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
        ...formData,
        parametros_padrao: JSON.parse(formData.parametros_padrao),
        timeout_s: parseInt(formData.timeout_s)
      }

      if (job) {
        await jobsAPI.atualizar(job.id, dados)
      } else {
        await jobsAPI.criar(dados)
      }
      onSave()
    } catch (error) {
      console.error('Erro ao salvar job:', error)
      if (error.response?.data) {
        setErros(error.response.data)
      }
    } finally {
      setCarregando(false)
    }
  }

  const formatarParametros = () => {
    try {
      const parsed = JSON.parse(formData.parametros_padrao)
      setFormData(prev => ({
        ...prev,
        parametros_padrao: JSON.stringify(parsed, null, 2)
      }))
    } catch {
      // Ignora se JSON for inválido
    }
  }

  const exemplosComando = [
    'python script.py',
    'python -m meu_modulo.main',
    '/usr/bin/robocorp run',
    'node automation.js',
    'bash script.sh'
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-gear me-2"></i>
          {job ? 'Editar Job' : 'Novo Job'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nome" className="form-label">
              Nome do Job
            </label>
            <input
              type="text"
              className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              disabled={carregando}
            />
            {erros.nome && (
              <div className="invalid-feedback">
                {erros.nome}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="comando" className="form-label">
              Comando de Execução
            </label>
            <textarea
              className={`form-control ${erros.comando ? 'is-invalid' : ''}`}
              id="comando"
              name="comando"
              value={formData.comando}
              onChange={handleChange}
              disabled={carregando}
              rows="3"
            />
            {erros.comando && (
              <div className="invalid-feedback">
                {erros.comando}
              </div>
            )}
            <div className="form-text">
              <strong>Exemplos:</strong> {exemplosComando.join(', ')}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="timeout_s" className="form-label">
              Timeout (segundos)
            </label>
            <input
              type="number"
              className={`form-control ${erros.timeout_s ? 'is-invalid' : ''}`}
              id="timeout_s"
              name="timeout_s"
              value={formData.timeout_s}
              onChange={handleChange}
              disabled={carregando}
              min="1"
            />
            {erros.timeout_s && (
              <div className="invalid-feedback">
                {erros.timeout_s}
              </div>
            )}
            <div className="form-text">
              Tempo máximo de execução em segundos (padrão: 300)
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="parametros_padrao" className="form-label">
              Parâmetros Padrão (JSON)
            </label>
            <div className="input-group">
              <textarea
                className={`form-control ${erros.parametros_padrao ? 'is-invalid' : ''}`}
                id="parametros_padrao"
                name="parametros_padrao"
                value={formData.parametros_padrao}
                onChange={handleChange}
                disabled={carregando}
                rows="4"
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
            {erros.parametros_padrao && (
              <div className="invalid-feedback">
                {erros.parametros_padrao}
              </div>
            )}
            <div className="form-text">
              Parâmetros em formato JSON que serão passados como variáveis de ambiente PARAM_*
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                disabled={carregando}
              />
              <label className="form-check-label" htmlFor="ativo">
                Job ativo
              </label>
            </div>
            <div className="form-text">
              Jobs inativos não podem ser executados
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
                    <span className="visually-hidden">Salvando...</span>
                  </span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Salvar
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={carregando}
            >
              <i className="bi bi-x-lg me-2"></i>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JobForm
