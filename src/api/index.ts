/**
 * API Server Entry Point
 * Main entry point for the API server
 */

import 'dotenv/config';
import APIServer from './server';

// Start the API server
const server = new APIServer();

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.stop();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.stop();
});

// Start the server
server.start().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});