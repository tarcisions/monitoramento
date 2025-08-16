import React, { useState, useEffect } from 'react'
import { robosAPI } from '../services/api'
import RobotForm from '../components/RobotForm'

function Robots() {
  const [robos, setRobos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [roboEditando, setRoboEditando] = useState(null)

  useEffect(() => {
    carregarRobos()
  }, [])

  const carregarRobos = async () => {
    try {
      setCarregando(true)
      const response = await robosAPI.listar()
      setRobos(response.data.results)
    } catch (error) {
      console.error('Erro ao carregar robôs:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleNovoRobo = () => {
    setRoboEditando(null)
    setMostrarFormulario(true)
  }

  const handleEditarRobo = (robo) => {
    setRoboEditando(robo)
    setMostrarFormulario(true)
  }

  const handleSalvar = async () => {
    setMostrarFormulario(false)
    setRoboEditando(null)
    await carregarRobos()
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setRoboEditando(null)
  }

  const handleExcluir = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir o robô "${nome}"?`)) {
      return
    }

    try {
      await robosAPI.deletar(id)
      await carregarRobos()
    } catch (error) {
      console.error('Erro ao excluir robô:', error)
      alert('Erro ao excluir robô. Verifique se não há execuções associadas.')
    }
  }

  const handlePing = async (id, nome) => {
    try {
      await robosAPI.ping(id)
      alert(`Ping enviado para o robô "${nome}"`)
      await carregarRobos()
    } catch (error) {
      console.error('Erro ao enviar ping:', error)
      alert('Erro ao enviar ping')
    }
  }

  const getStatusConexaoBadge = (status) => {
    const badges = {
      'conectado': 'bg-success',
      'desconectado': 'bg-danger',
      'nunca_conectado': 'bg-secondary'
    }
    return badges[status] || 'bg-secondary'
  }

  const getStatusConexaoText = (status) => {
    const texts = {
      'conectado': 'Conectado',
      'desconectado': 'Desconectado',
      'nunca_conectado': 'Nunca Conectou'
    }
    return texts[status] || status
  }

  if (mostrarFormulario) {
    return (
      <RobotForm
        robo={roboEditando}
        onSave={handleSalvar}
        onCancel={handleCancelar}
      />
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-cpu me-2"></i>
          Robôs
        </h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={carregarRobos}
            disabled={carregando}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Atualizar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNovoRobo}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Novo Robô
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : robos.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-cpu fs-1 text-muted"></i>
            <h5 className="mt-3">Nenhum robô cadastrado</h5>
            <p className="text-muted">Clique em "Novo Robô" para cadastrar seu primeiro robô</p>
            <button
              className="btn btn-primary"
              onClick={handleNovoRobo}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Cadastrar Primeiro Robô
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {robos.map(robo => (
            <div key={robo.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="bi bi-cpu me-2"></i>
                    {robo.nome}
                  </h6>
                  <span className={`badge ${getStatusConexaoBadge(robo.status_conexao)}`}>
                    {getStatusConexaoText(robo.status_conexao)}
                  </span>
                </div>
                <div className="card-body">
                  <dl className="row mb-0">
                    <dt className="col-sm-4">Host:</dt>
                    <dd className="col-sm-8">{robo.host}</dd>
                    
                    <dt className="col-sm-4">Status:</dt>
                    <dd className="col-sm-8">
                      <span className={`badge ${robo.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {robo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </dd>
                    
                    <dt className="col-sm-4">Último Ping:</dt>
                    <dd className="col-sm-8">
                      {robo.ultimo_ping ? 
                        new Date(robo.ultimo_ping).toLocaleString('pt-BR') : 
                        'Nunca'
                      }
                    </dd>
                  </dl>
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleEditarRobo(robo)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handlePing(robo.id, robo.nome)}
                    >
                      <i className="bi bi-wifi me-1"></i>
                      Ping
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleExcluir(robo.id, robo.nome)}
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

export default Robots
