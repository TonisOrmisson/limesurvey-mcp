import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import dotenv from 'dotenv';
import limesurveyAPI from './services/limesurvey-api.js';

// Load environment variables
dotenv.config();

// Create an MCP server for LimeSurvey
export const server = new McpServer({
  name: "LimeSurvey MCP",
  description: "MCP server that exposes LimeSurvey API functionality",
  version: "1.0.0"
});

// Determine which transport to use based on environment
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

/**
 * Logs all registered tools in the server
 */
export function logRegisteredTools() {
  console.log('\n===== REGISTERED TOOLS =====');
  
  // Get the tools using the proper approach for the SDK version
  const toolNames = Object.keys((server as any)._registry?.tools || {});
  
  if (toolNames.length === 0) {
    console.log('No tools registered yet.');
  } else {
    console.log(`Total tools: ${toolNames.length}`);
    toolNames.forEach((toolName: string, index: number) => {
      console.log(`${index + 1}. ${toolName}`);
    });
  }
  
  console.log('===========================\n');
}

export async function startServer() {
  // Create Express app for HTTP transport
  const app = express();
  
  // Add SSE endpoint
  app.get("/sse", async (_: Request, res: Response) => {
    console.log("New SSE connection established");
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      console.log(`SSE connection closed: ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });
    await server.connect(transport);
  });
  
  // Add messages endpoint for clients to send messages to the server
  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });
  
  console.log(`Starting LimeSurvey MCP server`);
  
  try {
    // Import tools modules dynamically to avoid circular dependencies
    // This ensures all tools are registered before the server starts
    await Promise.all([
      import('./tools/surveys.js'),
      import('./tools/questions.js'),
      import('./tools/responses.js'),
      import('./tools/participants.js'),
      import('./tools/statistics.js'),
      import('./tools/survey-management.js'),
      import('./tools/group-management.js'),
      import('./tools/response-management.js'),
      import('./tools/file-management.js'),
    ]);
    
    // Log all registered tools after they have been loaded
    logRegisteredTools();
    
    // Setup and connect the stdio transport
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    
    console.log(`LimeSurvey MCP server running in stdio mode`);
    
    // Also start the HTTP server for SSE connections
    app.listen(port, () => {
      console.log(`HTTP server with SSE support available at http://localhost:${port}`);
      console.log(`Connect to /sse for SSE transport`);
      console.log(`Post to /messages?sessionId=<id> to send messages`);
    });
  } catch (error: any) {
    console.error('Failed to start MCP server:', error?.message || error);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server and cleans up resources
 */
export async function shutdownServer() {
  console.log('Shutting down MCP LimeSurvey server...');
  
  try {
    // Release the LimeSurvey API session if active
    await limesurveyAPI.releaseSessionKey();
    console.log('LimeSurvey API session released');
    
    // Close the server
    await server.close();
    console.log('Server closed successfully');
    
    console.log('Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle process termination signals
process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);