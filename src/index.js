#!/usr/bin/env node
/**
 * TESS-MCP Server
 * Servidor MCP para integração com a API TESS
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createMcpAdapter } = require('./adapters');

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa o servidor MCP
 * @param {Object} config - Configuração do servidor
 * @returns {Object} Servidor Express configurado
 */
function createServer(config = {}) {
  // Mesclar configuração fornecida com variáveis de ambiente
  const serverConfig = {
    PORT: process.env.PORT || config.PORT || 3001,
    TESS_API_KEY: process.env.TESS_API_KEY || config.TESS_API_KEY,
    TESS_API_URL: process.env.TESS_API_URL || config.TESS_API_URL || 'https://tess.pareto.io/api',
    MCP_API_KEY: process.env.MCP_API_KEY || config.MCP_API_KEY
  };
  
  // Verificar se a chave API foi fornecida
  if (!serverConfig.TESS_API_KEY) {
    throw new Error('TESS_API_KEY é obrigatória. Defina no arquivo .env ou forneça na configuração.');
  }
  
  // Criar adaptador MCP
  const mcpAdapter = createMcpAdapter(serverConfig);
  
  // Configurar servidor Express
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Middleware para verificar API Key
  const checkApiKey = (req, res, next) => {
    // Endpoints de saúde são públicos
    if (req.path === '/health') {
      return next();
    }
    
    // Se uma API Key foi configurada, verificar autenticação
    if (serverConfig.MCP_API_KEY) {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (apiKey !== serverConfig.MCP_API_KEY) {
        return res.status(401).json({ 
          error: 'API Key inválida ou não fornecida',
          message: 'Forneça uma API Key válida no cabeçalho X-API-Key ou parâmetro api_key'
        });
      }
    }
    
    next();
  };
  
  // Aplicar middleware de autenticação
  app.use(checkApiKey);
  
  // Rota de saúde
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.1',
      message: 'TESS-MCP Server em execução'
    });
  });
  
  // Rota MCP padrão para listar ferramentas
  app.get('/api/mcp/tools', (req, res) => {
    try {
      const tools = mcpAdapter.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));
      
      res.json({ tools });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Rota MCP padrão para chamar ferramentas
  app.post('/api/mcp/execute', async (req, res) => {
    try {
      const { tool, params } = req.body;
      
      if (!tool) {
        return res.status(400).json({
          error: 'O nome da ferramenta é obrigatório'
        });
      }
      
      try {
        const result = await mcpAdapter.execute(tool, params || {});
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    } catch (error) {
      res.status(500).json({
        error: `Erro interno: ${error.message}`
      });
    }
  });
  
  // Rota de compatibilidade para listar ferramentas
  app.post('/tools/list', (req, res) => {
    try {
      res.json({ tools: mcpAdapter.tools });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Rota de compatibilidade para chamar ferramentas
  app.post('/tools/call', async (req, res) => {
    try {
      const { name, arguments: args } = req.body;
      
      if (!name) {
        return res.status(400).json({
          content: [{ type: 'text', text: 'O nome da ferramenta é obrigatório' }],
          isError: true
        });
      }
      
      try {
        const result = await mcpAdapter.execute(name, args || {});
        
        res.json({
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: false
        });
      } catch (error) {
        res.status(500).json({
          content: [{ type: 'text', text: error.message }],
          isError: true
        });
      }
    } catch (error) {
      res.status(500).json({
        content: [{ type: 'text', text: `Erro interno: ${error.message}` }],
        isError: true
      });
    }
  });
  
  return app;
}

/**
 * Função principal para iniciar o servidor
 */
function main() {
  try {
    const app = createServer();
    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
      console.log(`Servidor TESS-MCP rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error(`Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
}

// Iniciar o servidor se este arquivo for executado diretamente
if (require.main === module) {
  main();
}

// Exportar as funções para uso como módulo
module.exports = createServer;