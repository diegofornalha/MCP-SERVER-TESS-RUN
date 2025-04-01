#!/usr/bin/env python3
"""
Exemplo de integração com MCP TESS usando Python
"""

import requests
import json

# Configuração
MCP_SERVER_URL = 'http://localhost:3001'
API_KEY = '5b9ab18a-dda1-4ad6-ac79-53a2e79ea736'

class McpTessClient:
    """Cliente para integração com MCP TESS"""
    
    def __init__(self, server_url, api_key):
        """Inicializa o cliente MCP TESS"""
        self.server_url = server_url
        self.api_key = api_key
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def check_health(self):
        """Verifica o status do servidor"""
        try:
            response = requests.get(f"{self.server_url}/health")
            return response.json()
        except Exception as e:
            raise Exception(f"Erro ao verificar status: {str(e)}")
    
    def list_tools(self):
        """Lista as ferramentas disponíveis"""
        try:
            response = requests.post(
                f"{self.server_url}/tools/list",
                headers=self.headers
            )
            return response.json()['tools']
        except Exception as e:
            raise Exception(f"Erro ao listar ferramentas: {str(e)}")
    
    def call_tool(self, tool_name, tool_args=None):
        """Executa uma ferramenta específica"""
        if tool_args is None:
            tool_args = {}
            
        try:
            payload = {
                'name': tool_name,
                'arguments': tool_args
            }
            
            response = requests.post(
                f"{self.server_url}/tools/call",
                headers=self.headers,
                json=payload
            )
            
            data = response.json()
            if data.get('isError', False):
                raise Exception(data['content'][0]['text'])
                
            # Extrair o texto JSON da resposta
            content_text = data['content'][0]['text']
            return json.loads(content_text)
        except Exception as e:
            raise Exception(f"Erro ao executar ferramenta {tool_name}: {str(e)}")
    
    def list_agents(self, page=1, per_page=10):
        """Lista os agentes disponíveis no TESS"""
        return self.call_tool('tess.list_agents', {
            'page': page,
            'per_page': per_page
        })
    
    def get_agent(self, agent_id):
        """Obtém detalhes de um agente específico"""
        return self.call_tool('tess.get_agent', {
            'agent_id': agent_id
        })
    
    def execute_agent(self, agent_id, input_text, **options):
        """Executa um agente específico"""
        args = {
            'agent_id': agent_id,
            'input_text': input_text,
            **options
        }
        
        return self.call_tool('tess.execute_agent', args)

def exemplo_integracao():
    """Demonstração de uso do cliente MCP TESS"""
    client = McpTessClient(MCP_SERVER_URL, API_KEY)
    
    try:
        # Verificar status
        print('Verificando status do servidor...')
        status = client.check_health()
        print(f"Status: {status}\n")
        
        # Listar ferramentas
        print('Listando ferramentas disponíveis...')
        tools = client.list_tools()
        print(f"Ferramentas disponíveis: {len(tools)}\n")
        
        # Listar agentes
        print('Listando agentes TESS...')
        agentes = client.list_agents(1, 3)
        print(f"Total de agentes: {agentes['total']}")
        print(f"Primeiros agentes: {', '.join([a['title'] for a in agentes['data']])}\n")
        
        # Obter detalhes de um agente específico
        if agentes['data']:
            primeiro_agente = agentes['data'][0]
            print(f"Obtendo detalhes do agente: {primeiro_agente['title']} (ID: {primeiro_agente['id']})...")
            detalhes = client.get_agent(primeiro_agente['id'])
            print(f"Detalhes do agente: Tipo={detalhes['type']}, Versão={detalhes['updated_at']}\n")
        
        print('Integração concluída com sucesso!')
    except Exception as e:
        print(f"Erro: {str(e)}")

if __name__ == "__main__":
    exemplo_integracao() 