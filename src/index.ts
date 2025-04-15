import { startServer } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Print application header
console.log(`
╔════════════════════════════════════╗
║ LimeSurvey MCP Server              ║
║ Version: 1.0.0                     ║
║                                    ║
║ MCP server for LimeSurvey API      ║
╚════════════════════════════════════╝
`);

// Start the server
startServer().catch(error => {
  console.error('Error starting MCP server:', error);
  process.exit(1);
});