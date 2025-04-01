/**
 * Exemplo de integração com MCP TESS usando Node.js
 */

const axios = require('axios');

// Configuração
const MCP_SERVER_URL = 'http://localhost:3001';
const API_KEY = '5b9ab18a-dda1-4ad6-ac79-53a2e79ea736';

// Cliente MCP TESS
class McpTessClient {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: serverUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Verifica status do servidor
  async checkHealth() {
    try {
      const response = await axios.get(`${this.serverUrl}/health`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao verificar status: ${error.message}`);
    }
  }

  // Lista ferramentas disponíveis
  async listTools() {
    try {
      const response = await this.client.post('/tools/list');
      return response.data.tools;
    } catch (error) {
      throw new Error(`Erro ao listar ferramentas: ${error.message}`);
    }
  }

  // Executa uma ferramenta
  async callTool(toolName, toolArgs = {}) {
    try {
      const response = await this.client.post('/tools/call', {
        name: toolName,
        arguments: toolArgs
      });
      
      // Extraindo o texto JSON da resposta
      const contentText = response.data.content[0].text;
      return JSON.parse(contentText);
    } catch (error) {
      throw new Error(`Erro ao executar ferramenta ${toolName}: ${error.message}`);
    }
  }

  // Listar agentes TESS
  async listAgents(page = 1, perPage = 10) {
    return this.callTool('tess.list_agents', { page, per_page: perPage });
  }

  // Obter detalhes de um agente
  async getAgent(agentId) {
    return this.callTool('tess.get_agent', { agent_id: agentId });
  }

  // Executar um agente
  async executeAgent(agentId, inputText, options = {}) {
    const args = {
      agent_id: agentId,
      input_text: inputText,
      ...options
    };
    
    return this.callTool('tess.execute_agent', args);
  }
}

// Exemplo de uso
async function exemploIntegracao() {
  const client = new McpTessClient(MCP_SERVER_URL, API_KEY);
  
  try {
    // Verificar status
    console.log('Verificando status do servidor...');
    const status = await client.checkHealth();
    console.log(`Status: ${JSON.stringify(status)}\n`);
    
    // Listar ferramentas
    console.log('Listando ferramentas disponíveis...');
    const tools = await client.listTools();
    console.log(`Ferramentas disponíveis: ${tools.length}\n`);
    
    // Listar agentes
    console.log('Listando agentes TESS...');
    const agentes = await client.listAgents(1, 3);
    console.log(`Total de agentes: ${agentes.total}`);
    console.log(`Primeiros agentes: ${agentes.data.map(a => a.title).join(', ')}\n`);
    
    // Obter detalhes de um agente específico
    if (agentes.data.length > 0) {
      const primeiroAgente = agentes.data[0];
      console.log(`Obtendo detalhes do agente: ${primeiroAgente.title} (ID: ${primeiroAgente.id})...`);
      const detalhes = await client.getAgent(primeiroAgente.id);
      console.log(`Detalhes do agente: Tipo=${detalhes.type}, Versão=${detalhes.updated_at}\n`);
    }
    
    console.log('Integração concluída com sucesso!');
  } catch (error) {
    console.error(`Erro: ${error.message}`);
  }
}

// Executar exemplo
exemploIntegracao(); 