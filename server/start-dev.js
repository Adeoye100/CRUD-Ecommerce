#!/usr/bin/env node
/**
 * Smart Development Server Starter
 * Automatically finds an available port if the default is in use
 */

const { spawn } = require('child_process');
const net = require('net');
const os = require('os');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT = DEFAULT_PORT + 10;

function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        let currentPort = startPort;

        function tryPort(port) {
            if (port > MAX_PORT) {
                reject(new Error(`No available ports found between ${startPort} and ${MAX_PORT}`));
                return;
            }

            const server = net.createServer();
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
                    tryPort(port + 1);
                } else {
                    server.close();
                    reject(err);
                }
            });

            server.on('listening', () => {
                server.close();
                resolve(port);
            });

            server.listen(port, 'localhost');
        }

        tryPort(currentPort);
    });
}

async function startServer() {
    console.log('🚀 Smart Server Starter');
    console.log('========================\n');

    try {
        const port = await findAvailablePort(DEFAULT_PORT);
        console.log(`✅ Port ${DEFAULT_PORT} is available!`);
        console.log(`🚀 Starting server on port ${port}...\n`);

        // Set environment variables
        process.env.NODE_ENV = process.env.NODE_ENV || 'development';
        process.env.PORT = port;

        // Determine nodemon command based on OS
        const nodemonCmd = os.platform() === 'win32' ? 'nodemon.cmd' : 'nodemon';

        // Start nodemon
        const nodemon = spawn(nodemonCmd, ['server.js'], {
            env: { ...process.env, PORT: port },
            stdio: 'inherit',
            shell: os.platform() === 'win32'
        });

        nodemon.on('error', (err) => {
            console.error('❌ Failed to start nodemon:', err.message);
            process.exit(1);
        });

        nodemon.on('exit', (code, signal) => {
            if (code !== null) {
                console.log(`\n👋 Nodemon exited with code ${code}`);
            }
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Shutting down gracefully...');
            nodemon.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            console.log('\n👋 Shutting down gracefully...');
            nodemon.kill('SIGTERM');
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n💡 Quick fixes:');
        console.log('   1. Kill the process: npm run kill:5000');
        console.log('   2. Use different port: PORT=5001 npm run dev');
        console.log('   3. Kill all node processes: npm run kill:all');
        process.exit(1);
    }
}

startServer();
