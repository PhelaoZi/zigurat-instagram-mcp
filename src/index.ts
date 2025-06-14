#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Importar herramientas
import { profileAnalysisTool } from './tools/profile-analysis.js';
import { competitiveAnalysisTool } from './tools/competitive-analysis.js';
import { hashtagAnalysisTool } from './tools/hashtag-analysis.js';
import { prospectionTool } from './tools/prospection.js';
import { contentGenerationTool } from './tools/content-generation.js';

// Importar configuración
import { CONFIG, validateConfig } from './config/index.js';

// Cargar variables de entorno
dotenv.config();

// Validar configuración al inicio
try {
  validateConfig();
} catch (error) {
  console.error('❌ Error de configuración:', error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
}

// Crear servidor MCP
const server = new Server(
  {
    name: 'zigurat-instagram-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista de herramientas disponibles
const tools = [
  profileAnalysisTool,
  competitiveAnalysisTool,
  hashtagAnalysisTool,
  prospectionTool,
  contentGenerationTool,
];

// Handler para listar herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handler para ejecutar herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Validar que existe la variable de entorno APIFY_API_TOKEN
    if (!process.env.APIFY_API_TOKEN) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'APIFY_API_TOKEN no está configurado. Por favor configura tu token de Apify en las variables de entorno.'
      );
    }

    // Buscar la herramienta solicitada
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Herramienta desconocida: ${name}`
      );
    }

    // Ejecutar la herramienta
    const result = await tool.execute(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error ejecutando ${name}: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
});

// Función principal
async function main() {
  console.error('🍺 Iniciando Zigurat Instagram MCP Server...');
  console.error(`📊 Configuración: ${CONFIG.ZIGURAT_HANDLE} vs ${CONFIG.COMPETITORS.length} competidores`);
  console.error(`🔧 Apify configurado: ${CONFIG.APIFY_API_TOKEN ? '✅' : '❌'}`);
  
  // Crear transport stdio
  const transport = new StdioServerTransport();
  
  // Conectar servidor al transport
  await server.connect(transport);
  
  console.error('✅ Servidor MCP iniciado correctamente');
  console.error('🎯 Herramientas disponibles:');
  tools.forEach(tool => {
    console.error(`   - ${tool.name}: ${tool.description}`);
  });
  console.error('🍺 "Cerveza con Actitud, Data con Propósito" - Zigurat CCA');
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Error no manejado en:', promise, 'razón:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});

// Ejecutar función principal
main().catch((error) => {
  console.error('Error iniciando el servidor:', error);
  process.exit(1);
});
