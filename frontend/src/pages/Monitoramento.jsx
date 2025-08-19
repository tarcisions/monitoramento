import React from 'react'

function Monitoramento() {
  const getGrafanaUrl = (dashboard) => {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'http://129.148.32.147:3000'
    
    const dashboardUrls = {
      overview: '/d/rpa-overview/rpa-overview',
      logs: '/d/rpa-logs/rpa-logs'
    }
    
    return `${baseUrl}${dashboardUrls[dashboard] || ''}`
  }

  const openGrafana = (dashboard) => {
    window.open(getGrafanaUrl(dashboard), '_blank')
  }

  return (
    <div>
      <h1>Monitoramento e Observabilidade</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3>📊 Dashboard Principal</h3>
          <p>Visão geral dos robôs, execuções e métricas de performance do sistema RPA.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => openGrafana('overview')}
            style={{ marginTop: '1rem' }}
          >
            Abrir Dashboard Overview
          </button>
        </div>

        <div className="card">
          <h3>📋 Logs do Sistema</h3>
          <p>Visualização e análise de logs estruturados dos robôs e execuções.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => openGrafana('logs')}
            style={{ marginTop: '1rem' }}
          >
            Abrir Dashboard de Logs
          </button>
        </div>

        <div className="card">
          <h3>🔧 Prometheus</h3>
          <p>Acesso direto ao Prometheus para consultas avançadas de métricas.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.open('http://129.148.32.147:9090', '_blank')}
            style={{ marginTop: '1rem' }}
          >
            Abrir Prometheus
          </button>
        </div>

        <div className="card">
          <h3>📝 Loki</h3>
          <p>Interface do Loki para consultas diretas de logs.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.open('http://129.148.32.147:3100', '_blank')}
            style={{ marginTop: '1rem' }}
          >
            Abrir Loki
          </button>
        </div>
      </div>

      <div className="card">
        <h3>📈 Métricas Principais</h3>
        <p>O sistema coleta as seguintes métricas automaticamente:</p>
        
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Descrição</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>rpa_estado_robo</code></td>
              <td>Estado atual do robô (0=idle, 1=running, 2=paused)</td>
              <td>Gauge</td>
            </tr>
            <tr>
              <td><code>rpa_execucao_duracao_segundos</code></td>
              <td>Duração das execuções em segundos</td>
              <td>Histogram</td>
            </tr>
            <tr>
              <td><code>rpa_jobs_executados_total</code></td>
              <td>Total de jobs executados por status</td>
              <td>Counter</td>
            </tr>
            <tr>
              <td><code>rpa_execucoes_falhas_total</code></td>
              <td>Total de execuções com falha</td>
              <td>Counter</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>🔍 Como Usar</h3>
        <div style={{ marginTop: '1rem' }}>
          <h4>Dashboard Overview</h4>
          <p>
            Contém gráficos de status dos robôs, execuções recentes, métricas de sucesso/falha 
            e heatmap de falhas. Ideal para monitoramento em tempo real.
          </p>
          
          <h4>Dashboard de Logs</h4>
          <p>
            Permite filtrar logs por robô, execução e nível de log. Útil para debugging 
            e análise de problemas específicos.
          </p>
          
          <h4>Prometheus</h4>
          <p>
            Interface para consultas PromQL avançadas. Use para criar alertas personalizados 
            ou análises específicas de métricas.
          </p>
          
          <h4>Loki</h4>
          <p>
            Interface para consultas LogQL. Permite buscas complexas nos logs estruturados 
            do sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Monitoramento

