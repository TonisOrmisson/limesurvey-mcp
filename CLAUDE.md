# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Watch mode with auto-rebuild using nodemon
npm run build           # Compile TypeScript to dist/
npm start               # Run compiled JavaScript from dist/index.js

# Docker (use without dash per user instructions)
docker compose up       # Start containerized version with volume mounts
docker compose down     # Stop containers
```

## Project Architecture

This is an **MCP (Model Context Protocol) server** that exposes LimeSurvey Remote API as MCP tools. Built with TypeScript and @modelcontextprotocol/sdk.

### Core Components

- **src/index.ts**: Entry point - loads environment and starts server
- **src/server.ts**: Main MCP server with dual transport support (stdio/SSE) and read-only mode
- **src/services/limesurvey-api.ts**: Axios-based LimeSurvey Remote API client with session management
- **src/utils/logger.ts**: Winston logger (outputs to logs/ directory)

### Tool Organization

Tools are organized by functionality in src/tools/:
- **surveys.ts**: Survey discovery and properties (read-only)
- **questions.ts**: Question and question group management (read-only)
- **statistics.ts**: Survey statistics export (read-only)
- **participants.ts**: Participant management (write operations)
- **responses.ts**: Response management (write operations)
- **survey-management.ts**: Survey lifecycle management (write operations)

### Key Features

- **Dual Transport**: Both stdio (CLI clients) and SSE (web clients) support
- **Read-Only Mode**: Configurable via READONLY_MODE environment variable
- **Session Management**: Automatic LimeSurvey session handling with cleanup
- **Comprehensive API Coverage**: All major LimeSurvey Remote API endpoints

## Configuration

Required environment variables in `.env`:
```env
LIMESURVEY_API_URL=https://your-limesurvey-instance.com/admin/remotecontrol
LIMESURVEY_USERNAME=your_username
LIMESURVEY_PASSWORD=your_password
PORT=3000
READONLY_MODE=false     # Optional: enables read-only mode
```

## Development Guidelines

From .github/copilot-instructions.md:
- Use TypeScript only (.ts files, no .js)
- All source code in /src folder
- Use dotenv for environment variables
- Ask confirmation before installing new dependencies
- Stay focused on requested tasks only - no unsolicited refactoring
- Code and document ALL LimeSurvey API endpoints (not just wrapper functions)

## Build System

- **TypeScript**: ES2020 target, NodeNext modules, strict type checking
- **Output**: Compiled to dist/ directory
- **Dependencies**: @modelcontextprotocol/sdk, axios, express, winston, dotenv
- **Development**: nodemon for auto-rebuild in dev mode