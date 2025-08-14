#!/usr/bin/env python3
"""
Script para executar múltiplos robôs de exemplo simultaneamente
"""

import subprocess
import time
import signal
import sys
import argparse
from typing import List

HARD_CODED_SERVER_URL = "http://129.148.32.147:8001"

class MultiRobotRunner:
    """Gerenciador para executar múltiplos robôs"""
    
    def __init__(self, server_url: str = HARD_CODED_SERVER_URL):
        self.server_url = server_url.rstrip('/')
        self.processes: List[subprocess.Popen] = []
        self.robot_names = []
        
        # Configurar handler para sinais
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        """Handler para sinais de interrupção"""
        print(f"\nRecebido sinal {signum}. Parando todos os robôs...")
        self.stop_all_robots()
        sys.exit(0)
    
    def start_robot(self, name: str, verbose: bool = False) -> subprocess.Popen:
        """Iniciar um robô"""
        cmd = ["python3", "example_robot.py", "--name", name, "--server", self.server_url]
        if verbose:
            cmd.append("--verbose")
        
        print(f"Iniciando robô: {name}")
        process = subprocess.Popen(cmd)
        
        self.processes.append(process)
        self.robot_names.append(name)
        
        return process
    
    def start_multiple_robots(self, count: int, prefix: str = "robot", verbose: bool = False):
        """Iniciar múltiplos robôs"""
        print(f"Iniciando {count} robôs com prefixo '{prefix}'...")
        
        for i in range(1, count + 1):
            robot_name = f"{prefix}_{i:02d}"
            self.start_robot(robot_name, verbose)
            
            # Aguardar um pouco entre inicializações para evitar sobrecarga
            time.sleep(2)
        
        print(f"Todos os {count} robôs foram iniciados!")
        print("Pressione Ctrl+C para parar todos os robôs")
    
    def stop_all_robots(self):
        """Parar todos os robôs"""
        print("Parando todos os robôs...")
        
        for i, process in enumerate(self.processes):
            if process.poll() is None:  # Processo ainda está rodando
                print(f"Parando robô: {self.robot_names[i]}")
                process.terminate()
        
        # Aguardar um pouco para terminação graceful
        time.sleep(3)
        
        # Forçar encerramento se necessário
        for i, process in enumerate(self.processes):
            if process.poll() is None:
                print(f"Forçando parada do robô: {self.robot_names[i]}")
                process.kill()
        
        print("Todos os robôs foram parados.")
    
    def wait_for_robots(self):
        """Aguardar todos os robôs terminarem"""
        try:
            while True:
                # Verificar se algum processo terminou
                for i, process in enumerate(self.processes):
                    if process.poll() is not None:
                        print(f"Robô {self.robot_names[i]} terminou com código {process.returncode}")
                
                # Verificar se todos os processos terminaram
                if all(p.poll() is not None for p in self.processes):
                    print("Todos os robôs terminaram.")
                    break
                
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\nInterrompido pelo usuário.")
            self.stop_all_robots()


def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Executar múltiplos robôs de exemplo')
    parser.add_argument('--count', '-c', type=int, default=3, help='Número de robôs para iniciar')
    parser.add_argument('--prefix', '-p', default='robot', help='Prefixo para nomes dos robôs')
    parser.add_argument('--verbose', '-v', action='store_true', help='Modo verboso')
    
    args = parser.parse_args()
    
    if args.count <= 0:
        print("Erro: O número de robôs deve ser maior que zero")
        return
    
    if args.count > 10:
        print("Aviso: Executar muitos robôs pode sobrecarregar o sistema")
        response = input("Continuar? (y/N): ")
        if response.lower() != 'y':
            return
    
    # Forçando o endereço hardcoded
    runner = MultiRobotRunner(HARD_CODED_SERVER_URL)
    
    try:
        runner.start_multiple_robots(args.count, args.prefix, args.verbose)
        runner.wait_for_robots()
    except Exception as e:
        print(f"Erro: {e}")
        runner.stop_all_robots()


if __name__ == "__main__":
    main()
