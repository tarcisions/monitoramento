import React, { useState, useEffect } from 'react'
import { robosAPI } from '../services/api'

function RobotForm({ robo, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    host: '',
    token_agente: '',
    ativo: true
  })
  const [carregando, setCarregando] = useState(false)
  const [erros, setErros] = useState({})

  useEffect(() => {
    if (robo) {
      setFormData({
        nome: robo.nome || '',
        host: robo.host || '',
        token_agente: robo.token_agente || '',
        ativo: robo.ativo !== undefined ? robo.ativo : true
      })
    }
  }, [robo])

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

  const gerarToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({
      ...prev,
      token_agente: token
    }))
  }

  const validarFormulario = () => {
    const novosErros = {}

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }

    if (!formData.host.trim()) {
      novosErros.host = 'Host é obrigatório'
    }

    if (!formData.token_agente.trim()) {
      novosErros.token_agente = 'Token do agente é obrigatório'
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
      if (robo) {
        await robosAPI.atualizar(robo.id, formData)
      } else {
        await robosAPI.criar(formData)
      }
      onSave()
    } catch (error) {
      console.error('Erro ao salvar robô:', error)
      if (error.response?.data) {
        setErros(error.response.data)
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-cpu me-2"></i>
          {robo ? 'Editar Robô' : 'Novo Robô'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nome" className="form-label">
              Nome do Robô
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
            <label htmlFor="host" className="form-label">
              Host/IP
            </label>
            <input
              type="text"
              className={`form-control ${erros.host ? 'is-invalid' : ''}`}
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              disabled={carregando}
              placeholder="192.168.1.100 ou servidor.empresa.com"
            />
            {erros.host && (
              <div className="invalid-feedback">
                {erros.host}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="token_agente" className="form-label">
              Token do Agente
            </label>
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${erros.token_agente ? 'is-invalid' : ''}`}
                id="token_agente"
                name="token_agente"
                value={formData.token_agente}
                onChange={handleChange}
                disabled={carregando}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={gerarToken}
                disabled={carregando}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Gerar
              </button>
            </div>
            {erros.token_agente && (
              <div className="invalid-feedback">
                {erros.token_agente}
              </div>
            )}
            <div className="form-text">
              Token único utilizado pelo agente para se conectar ao sistema
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
                Robô ativo
              </label>
            </div>
            <div className="form-text">
              Robôs inativos não receberão comandos de execução
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

export default RobotForm
