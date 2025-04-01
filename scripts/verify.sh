#!/bin/bash
# Script de verificação para o TESS-MCP Server

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo -e "╔════════════════════════════════════════════╗"
echo -e "║       TESS-MCP SERVER VERIFICAÇÃO          ║"
echo -e "║                                            ║"
echo -e "║  Verificação do servidor de integração     ║"
echo -e "║      entre TESS e protocolo MCP            ║"
echo -e "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar arquivo .env
echo -e "${YELLOW}Verificando arquivo .env...${NC}"
if [ -f .env ]; then
  echo -e "✅ Arquivo .env encontrado."
  
  # Verificar chave TESS_API_KEY
  if grep -q "TESS_API_KEY=sua_chave_api_aqui" .env; then
    echo -e "${RED}⚠️  Chave TESS_API_KEY não configurada. Edite o arquivo .env!${NC}"
  elif grep -q "TESS_API_KEY=" .env; then
    echo -e "✅ TESS_API_KEY configurada."
  else
    echo -e "${RED}⚠️  TESS_API_KEY não encontrada no arquivo .env!${NC}"
  fi
else
  echo -e "${RED}❌ Arquivo .env não encontrado. Execute 'npm run setup' para criá-lo.${NC}"
fi

# Verificar estrutura do projeto
echo -e "${YELLOW}Verificando estrutura do projeto...${NC}"
ESTRUTURA_OK=true

# Verificar arquivos essenciais
for arquivo in src/index.js src/adapters.js src/tess_tools.js smithery.yaml package.json
do
  if [ ! -f $arquivo ]; then
    echo -e "${RED}❌ Arquivo $arquivo não encontrado!${NC}"
    ESTRUTURA_OK=false
  fi
done

if $ESTRUTURA_OK; then
  echo -e "✅ Estrutura básica do projeto OK."
fi

# Verificar configuração Smithery
echo -e "${YELLOW}Verificando configuração Smithery...${NC}"
if [ -f smithery.yaml ]; then
  if grep -q "startCommand:" smithery.yaml; then
    echo -e "✅ Configuração Smithery parece correta."
  else
    echo -e "${RED}⚠️  Arquivo smithery.yaml não contém 'startCommand'. Verifique o formato!${NC}"
  fi
else
  echo -e "${RED}❌ Arquivo smithery.yaml não encontrado!${NC}"
fi

# Verificar instalação das dependências
echo -e "${YELLOW}Verificando dependências instaladas...${NC}"
if [ -d node_modules ]; then
  echo -e "✅ Dependências instaladas."
  
  # Verificar dependência MCP SDK
  if [ -d node_modules/@modelcontextprotocol ]; then
    echo -e "✅ MCP SDK instalado."
  else
    echo -e "${RED}⚠️  MCP SDK não encontrado. Execute 'npm install' novamente.${NC}"
  fi
else
  echo -e "${RED}❌ Dependências não instaladas. Execute 'npm install'.${NC}"
fi

# Resumo
echo -e "\n${BLUE}=== RESUMO DA VERIFICAÇÃO ===${NC}"
if $ESTRUTURA_OK && [ -f .env ] && [ -d node_modules ]; then
  echo -e "${GREEN}✅ O servidor TESS-MCP parece estar configurado corretamente.${NC}"
  echo -e "${GREEN}   Você pode iniciar o servidor com 'npm start' ou 'npm run dev'.${NC}"
else
  echo -e "${RED}⚠️  Há problemas na configuração que precisam ser corrigidos.${NC}"
  echo -e "${YELLOW}   Execute 'npm run setup' para reconfigurar o ambiente.${NC}"
fi

# Dicas adicionais
echo -e "\n${BLUE}=== PRÓXIMOS PASSOS ===${NC}"
echo -e "${YELLOW}1. Certifique-se de que o arquivo .env contém sua chave TESS_API_KEY válida.${NC}"
echo -e "${YELLOW}2. Inicie o servidor com 'npm start' ou 'npm run dev' para desenvolvimento.${NC}"
echo -e "${YELLOW}3. Para publicar no Smithery, execute 'npm run smithery:publish'.${NC}"
echo -e "${YELLOW}4. Para testar a API, visite http://localhost:3001/health no navegador.${NC}"