// Dashboard JavaScript
class RobotMonitoringDashboard {
    constructor() {
        this.socket = null;
        this.robots = [];
        this.logs = [];
        this.currentRobot = null;
        this.charts = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.loadInitialData();
        this.setupEventListeners();
        this.initCharts();
        
        // Auto-refresh data every 30 seconds
        setInterval(() => this.refreshData(), 30000);
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/monitoring/`;
        
        try {
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.updateConnectionStatus(true);
                this.reconnectAttempts = 0;
            };
            
            this.socket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connectWebSocket(), 3000 * this.reconnectAttempts);
        } else {
            this.showToast('Conexão perdida. Recarregue a página para tentar novamente.', 'error');
        }
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.className = 'connection-status connected';
            statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Conectado</span>';
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Desconectado</span>';
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'robots_update':
                this.updateRobots(data.data);
                break;
            case 'new_log':
                this.addLog(data.data);
                break;
            case 'status_update':
                this.updateRobotStatus(data.data);
                break;
            case 'execution_update':
                this.updateExecution(data.data);
                break;
            case 'pong':
                console.log('Pong received');
                break;
        }
    }
    
    sendWebSocketMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    
    async loadInitialData() {
        try {
            // Load dashboard data
            const dashboardResponse = await fetch('/api/dashboard/');
            const dashboardData = await dashboardResponse.json();
            this.updateDashboardStats(dashboardData);
            
            // Load robots
            const robotsResponse = await fetch('/api/robots/');
            const robotsData = await robotsResponse.json();
            this.updateRobots(robotsData.results || robotsData);
            
            // Load recent logs
            const logsResponse = await fetch('/api/logs/list/?hours=24');
            const logsData = await logsResponse.json();
            this.updateLogs(logsData.results || logsData);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Erro ao carregar dados iniciais', 'error');
        }
    }
    
    updateDashboardStats(data) {
        document.getElementById('totalRobots').textContent = data.robots?.total || 0;
        document.getElementById('activeRobots').textContent = data.robots?.active || 0;
        document.getElementById('completedExecutions').textContent = data.executions?.completed || 0;
        document.getElementById('failedExecutions').textContent = data.executions?.failed || 0;
        
        // Update charts
        this.updateCharts(data);
    }
    
    updateRobots(robots) {
        this.robots = robots;
        this.renderRobots();
        this.updateRobotFilter();
    }
    
    renderRobots() {
        const container = document.getElementById('robotsGrid');
        container.innerHTML = '';
        
        this.robots.forEach(robot => {
            const robotCard = this.createRobotCard(robot);
            container.appendChild(robotCard);
        });
    }
    
    createRobotCard(robot) {
        const card = document.createElement('div');
        card.className = `robot-card status-${robot.status}`;
        
        const lastSeen = new Date(robot.last_seen).toLocaleString('pt-BR');
        
        card.innerHTML = `
            <div class="robot-header">
                <div class="robot-name">${robot.name}</div>
                <div class="robot-status ${robot.status}">${this.getStatusText(robot.status)}</div>
            </div>
            <div class="robot-info">
                <div><strong>IP:</strong> ${robot.ip_address || 'N/A'}</div>
                <div><strong>Última atividade:</strong> ${lastSeen}</div>
                <div><strong>Descrição:</strong> ${robot.description || 'Sem descrição'}</div>
            </div>
            <div class="robot-actions">
                <button class="btn btn-primary" onclick="dashboard.openRobotModal(${robot.id})">
                    <i class="fas fa-cog"></i> Controlar
                </button>
                <button class="btn btn-info" onclick="dashboard.viewRobotLogs('${robot.name}')">
                    <i class="fas fa-file-alt"></i> Logs
                </button>
            </div>
        `;
        
        return card;
    }
    
    getStatusText(status) {
        const statusMap = {
            'IDLE': 'Inativo',
            'RUNNING': 'Executando',
            'STOPPED': 'Parado',
            'ERROR': 'Erro',
            'MAINTENANCE': 'Manutenção'
        };
        return statusMap[status] || status;
    }
    
    updateLogs(logs) {
        this.logs = logs;
        this.renderLogs();
    }
    
    addLog(log) {
        this.logs.unshift(log);
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        this.renderLogs();
    }
    
    renderLogs() {
        const container = document.getElementById('logsContainer');
        const robotFilter = document.getElementById('robotFilter').value;
        const levelFilter = document.getElementById('logLevelFilter').value;
        
        let filteredLogs = this.logs;
        
        if (robotFilter) {
            filteredLogs = filteredLogs.filter(log => log.robot_name === robotFilter);
        }
        
        if (levelFilter) {
            filteredLogs = filteredLogs.filter(log => log.level === levelFilter);
        }
        
        container.innerHTML = '';
        
        filteredLogs.slice(0, 50).forEach(log => {
            const logEntry = this.createLogEntry(log);
            container.appendChild(logEntry);
        });
        
        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
    
    createLogEntry(log) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${log.level}`;
        
        const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
        
        entry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level">[${log.level}]</span>
            <span class="log-robot">${log.robot_name}</span>
            <div class="log-message">${log.message}</div>
        `;
        
        return entry;
    }
    
    updateRobotFilter() {
        const select = document.getElementById('robotFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Todos os robôs</option>';
        
        const uniqueRobots = [...new Set(this.robots.map(robot => robot.name))];
        uniqueRobots.forEach(robotName => {
            const option = document.createElement('option');
            option.value = robotName;
            option.textContent = robotName;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }
    
    setupEventListeners() {
        // Add robot form
        document.getElementById('addRobotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRobot();
        });
        
        // Modal close on outside click
        window.addEventListener('click', (e) => {
            const robotModal = document.getElementById('robotModal');
            const addRobotModal = document.getElementById('addRobotModal');
            
            if (e.target === robotModal) {
                this.closeModal();
            }
            if (e.target === addRobotModal) {
                this.closeAddRobotModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeAddRobotModal();
            }
        });
    }
    
    initCharts() {
        // Robot Status Chart
        const robotStatusCtx = document.getElementById('robotStatusChart').getContext('2d');
        this.charts.robotStatus = new Chart(robotStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Inativos', 'Erro', 'Manutenção'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#27ae60', '#95a5a6', '#e74c3c', '#f39c12']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        // Logs Chart
        const logsCtx = document.getElementById('logsChart').getContext('2d');
        this.charts.logs = new Chart(logsCtx, {
            type: 'bar',
            data: {
                labels: ['Debug', 'Info', 'Warning', 'Error', 'Critical'],
                datasets: [{
                    label: 'Quantidade de Logs',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#6c757d', '#17a2b8', '#ffc107', '#dc3545', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    updateCharts(data) {
        // Update robot status chart
        if (data.robots?.status_distribution) {
            const statusCounts = [0, 0, 0, 0]; // [RUNNING, IDLE, ERROR, MAINTENANCE]
            
            data.robots.status_distribution.forEach(item => {
                switch (item.status) {
                    case 'RUNNING':
                        statusCounts[0] = item.count;
                        break;
                    case 'IDLE':
                        statusCounts[1] = item.count;
                        break;
                    case 'ERROR':
                        statusCounts[2] = item.count;
                        break;
                    case 'MAINTENANCE':
                        statusCounts[3] = item.count;
                        break;
                }
            });
            
            this.charts.robotStatus.data.datasets[0].data = statusCounts;
            this.charts.robotStatus.update();
        }
        
        // Update logs chart
        if (data.logs_by_level) {
            const logCounts = [0, 0, 0, 0, 0]; // [DEBUG, INFO, WARNING, ERROR, CRITICAL]
            
            data.logs_by_level.forEach(item => {
                switch (item.level) {
                    case 'DEBUG':
                        logCounts[0] = item.count;
                        break;
                    case 'INFO':
                        logCounts[1] = item.count;
                        break;
                    case 'WARNING':
                        logCounts[2] = item.count;
                        break;
                    case 'ERROR':
                        logCounts[3] = item.count;
                        break;
                    case 'CRITICAL':
                        logCounts[4] = item.count;
                        break;
                }
            });
            
            this.charts.logs.data.datasets[0].data = logCounts;
            this.charts.logs.update();
        }
    }
    
    async openRobotModal(robotId) {
        const robot = this.robots.find(r => r.id === robotId);
        if (!robot) return;
        
        this.currentRobot = robot;
        
        document.getElementById('modalTitle').textContent = `Controlar ${robot.name}`;
        document.getElementById('robotInfo').innerHTML = `
            <div><strong>Status:</strong> ${this.getStatusText(robot.status)}</div>
            <div><strong>IP:</strong> ${robot.ip_address || 'N/A'}</div>
            <div><strong>Última atividade:</strong> ${new Date(robot.last_seen).toLocaleString('pt-BR')}</div>
            <div><strong>Descrição:</strong> ${robot.description || 'Sem descrição'}</div>
        `;
        
        // Load command history
        await this.loadCommandHistory(robotId);
        
        document.getElementById('robotModal').style.display = 'block';
    }
    
    async loadCommandHistory(robotId) {
        try {
            const response = await fetch(`/api/commands/?robot=${robotId}`);
            const commands = await response.json();
            
            const container = document.querySelector('.commands-list');
            container.innerHTML = '';
            
            (commands.results || commands).slice(0, 10).forEach(command => {
                const commandDiv = document.createElement('div');
                commandDiv.className = 'command-item';
                commandDiv.innerHTML = `
                    <div><strong>${command.command_type}</strong> - ${command.status}</div>
                    <div><small>${new Date(command.created_at).toLocaleString('pt-BR')}</small></div>
                `;
                container.appendChild(commandDiv);
            });
        } catch (error) {
            console.error('Error loading command history:', error);
        }
    }
    
    async sendCommand(commandType) {
        if (!this.currentRobot) return;
        
        try {
            const response = await fetch('/api/control/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    robot_name: this.currentRobot.name,
                    command: commandType
                })
            });
            
            if (response.ok) {
                this.showToast(`Comando ${commandType} enviado para ${this.currentRobot.name}`, 'success');
                await this.loadCommandHistory(this.currentRobot.id);
            } else {
                throw new Error('Falha ao enviar comando');
            }
        } catch (error) {
            console.error('Error sending command:', error);
            this.showToast('Erro ao enviar comando', 'error');
        }
    }
    
    closeModal() {
        document.getElementById('robotModal').style.display = 'none';
        this.currentRobot = null;
    }
    
    async addRobot() {
        const form = document.getElementById('addRobotForm');
        const formData = new FormData(form);
        
        const robotData = {
            name: formData.get('name'),
            description: formData.get('description'),
            ip_address: formData.get('ip_address') || null
        };
        
        try {
            const response = await fetch('/api/robots/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(robotData)
            });
            
            if (response.ok) {
                this.showToast('Robô adicionado com sucesso', 'success');
                this.closeAddRobotModal();
                form.reset();
                await this.refreshData();
            } else {
                throw new Error('Falha ao adicionar robô');
            }
        } catch (error) {
            console.error('Error adding robot:', error);
            this.showToast('Erro ao adicionar robô', 'error');
        }
    }
    
    closeAddRobotModal() {
        document.getElementById('addRobotModal').style.display = 'none';
    }
    
    viewRobotLogs(robotName) {
        document.getElementById('robotFilter').value = robotName;
        this.renderLogs();
        this.showToast(`Filtrando logs para ${robotName}`, 'info');
    }
    
    async refreshData() {
        await this.loadInitialData();
        this.showToast('Dados atualizados', 'success');
    }
    
    filterLogs() {
        this.renderLogs();
    }
    
    clearLogs() {
        this.logs = [];
        this.renderLogs();
        this.showToast('Logs limpos', 'info');
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Global functions for HTML onclick handlers
function refreshData() {
    dashboard.refreshData();
}

function filterLogs() {
    dashboard.filterLogs();
}

function clearLogs() {
    dashboard.clearLogs();
}

function addRobot() {
    document.getElementById('addRobotModal').style.display = 'block';
}

function closeModal() {
    dashboard.closeModal();
}

function closeAddRobotModal() {
    dashboard.closeAddRobotModal();
}

function sendCommand(commandType) {
    dashboard.sendCommand(commandType);
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new RobotMonitoringDashboard();
});

