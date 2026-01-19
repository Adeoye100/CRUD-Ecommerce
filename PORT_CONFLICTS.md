# Resolving EADDRINUSE Error (Port 5000) in MERN Stack Applications

The `EADDRINUSE: address already in use :::5000` error occurs when trying to start a Node.js server on port 5000, which is already occupied by another process. This comprehensive guide covers all solutions for this common issue.

## Quick Fix Commands

### Kill Process on Port 5000 (Immediate Solution)

**Linux/macOS:**
```bash
# Find and kill process on port 5000
lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9

# Alternative using fuser
fuser -k 5000/tcp

# Kill all node processes (use with caution!)
pkill -f node
```

**Windows:**
```cmd
:: Find PID using port 5000
netstat -ano | findstr :5000

:: Kill by PID (replace <PID> with actual PID)
taskkill /PID <PID> /F

:: PowerShell alternative
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

### Kill Port and Restart (One-Liner)

**Linux/macOS:**
```bash
lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null; npm run dev
```

**Windows:**
```cmd
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a & npm run dev
```

**Using npx (cross-platform):**
```bash
npx kill-port 5000 && npm run dev
```

---

## Step-by-Step Process Identification

### 1. Identify What's Using Port 5000

**Linux/macOS:**
```bash
# Detailed process information
lsof -i :5000

# Alternative methods
netstat -tulpn | grep :5000
ss -tulpn | grep :5000

# Find all Node.js processes
ps aux | grep -E "node|nodemon"

# Full process tree
pstree -p $(pgrep -f "node.*server.js")
```

**Windows:**
```powershell
# Get process using port 5000
netstat -ano | findstr :5000

# PowerShell detailed view
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# List all node processes
Get-Process node -ErrorAction SilentlyContinue
```

### 2. Check All Active Network Connections

**Linux/macOS:**
```bash
# All listening ports
netstat -tuln

# Or using ss (preferred)
ss -tuln

# Show PID with connections
ss -tulpn
```

**Windows:**
```powershell
# All listening ports
netstat -ano | findstr LISTENING

# PowerShell alternative
Get-NetTCPConnection -LocalPort 5000 | Format-Table
```

---

## Terminating the Process

### Force Kill Methods

**Linux/macOS:**
```bash
# Kill by port using lsof
lsof -i :5000 -t | xargs kill -9

# Kill by port using fuser
fuser -k 5000/tcp

# Kill all node-related processes
pkill -9 node
pkill -9 nodemon

# Kill using PID from netstat
kill -9 $(lsof -t -i:5000)
```

**Windows:**
```cmd
:: Force kill by PID
taskkill /PID 12345 /F

:: Kill all node processes
taskkill /F /IM node.exe

:: Kill all nodemon processes  
taskkill /F /IM nodemon.exe

:: PowerShell
Get-Process node | Stop-Process -Force
```

### Graceful Shutdown

**Linux/macOS:**
```bash
# Find and send SIGTERM for graceful shutdown
kill $(lsof -t -i:5000)

# If still running after 5 seconds, force kill
sleep 5 && lsof -i :5000 || echo "Process terminated gracefully"
```

---

## Changing the Port Number

### Method 1: Command Line Override

**Linux/macOS:**
```bash
PORT=5001 npm run dev
```

**Windows (Command Prompt):**
```cmd
set PORT=5001 && npm run dev
```

**Windows (PowerShell):**
```powershell
$env:PORT = 5001; npm run dev
```

### Method 2: .env File Configuration

Create or modify `server/.env`:
```env
PORT=5001
```

### Method 3: Permanent Port Change

Edit `server/server.js`:
```javascript
const PORT = parseInt(process.env.PORT, 10) || 5001;  // Changed default to 5001
```

### Method 4: Script-Based Dynamic Port Selection

Create `server/port-helper.js`:
```javascript
const net = require('net');

function findAvailablePort(startPort, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let port = startPort;
        let attempts = 0;

        function tryPort() {
            if (attempts >= maxAttempts) {
                reject(new Error(`No available ports found after ${maxAttempts} attempts`));
                return;
            }

            const server = net.createServer();
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    port++;
                    attempts++;
                    tryPort();
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

        tryPort();
    });
}

module.exports = { findAvailablePort };
```

---

## Using Environment Variables

### Setting Up Different Ports for Environments

**server/.env:**
```env
# Development
NODE_ENV=development
PORT=5000

# Staging
# NODE_ENV=staging
# PORT=5001

# Production
# NODE_ENV=production
# PORT=8080
```

### Using cross-env for Cross-Platform Compatibility

**Installation:**
```bash
npm install --save-dev cross-env
```

**Usage:**
```bash
# Works on Linux, macOS, and Windows
cross-env PORT=5001 NODE_ENV=development npm run dev

# Multiple environment variables
cross-env PORT=5001 NODE_ENV=development DEBUG=true npm run dev
```

---

## Nodemon Configuration

### Method 1: nodemon.json Configuration

Create `server/nodemon.json`:
```json
{
  "verbose": true,
  "ignore": ["node_modules", "*.test.js", "uploads/*"],
  "delay": "2500ms",
  "env": {
    "NODE_ENV": "development",
    "PORT": 5000
  },
  "ext": "js,mjs,json",
  "restartable": "rs"
}
```

### Method 2: Package.json Nodemon Config

**server/package.json:**
```json
{
  "nodemonConfig": {
    "restartable": "rs",
    "ignore": [".git", "node_modules", "uploads"],
    "verbose": true,
    "env": {
      "NODE_ENV": "development"
    }
  }
}
```

### Method 3: Nodemon with Auto-Port Selection

Create `server/nodemon.json`:
```json
{
  "verbose": true,
  "ignore": ["node_modules"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

Then use the smart start script:
```javascript
// server/start-dev.js (see below for full implementation)
```

---

## Cross-Env Setup for Development and Production

### Complete Package.json Scripts

**server/package.json:**
```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node server.js",
    "dev": "cross-env NODE_ENV=development nodemon server.js",
    "dev:5000": "cross-env PORT=5000 NODE_ENV=development nodemon server.js",
    "dev:5001": "cross-env PORT=5001 NODE_ENV=development nodemon server.js",
    "dev:staging": "cross-env PORT=5002 NODE_ENV=staging nodemon server.js",
    "kill:5000": "lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null || echo 'Port 5000 is free'",
    "kill:5001": "lsof -i :5001 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null || echo 'Port 5001 is free'",
    "kill:all": "pkill -f 'node' 2>/dev/null || taskkill /F /IM node.exe 2>nul",
    "smart:dev": "node start-dev.js",
    "status:ports": "echo 'Checking ports...' && lsof -i :5000 2>/dev/null || echo 'Port 5000: Free' && lsof -i :5173 2>/dev/null || echo 'Port 5173: Free'"
  }
}
```

### Smart Start Script

Create `server/start-dev.js`:
```javascript
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

        process.env.NODE_ENV = process.env.NODE_ENV || 'development';
        process.env.PORT = port;

        const nodemonCmd = os.platform() === 'win32' ? 'nodemon.cmd' : 'nodemon';

        const nodemon = spawn(nodemonCmd, ['server.js'], {
            env: { ...process.env, PORT: port },
            stdio: 'inherit',
            shell: os.platform() === 'win32'
        });

        nodemon.on('error', (err) => {
            console.error('❌ Failed to start nodemon:', err.message);
            process.exit(1);
        });

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
```

---

## Best Practices for Avoiding Port Conflicts

### 1. Use Port Ranges for Different Services

**server/config/ports.js:**
```javascript
module.exports = {
    development: 5000,
    staging: 5001,
    test: 5002,
    production: process.env.PORT || 8080
};
```

### 2. Implement Graceful Shutdown

Add to `server/server.js`:
```javascript
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('HTTP server closed.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 3. Use Port Manager Package

```bash
npm install portfinder
```

**Example:**
```javascript
const portfinder = require('portfinder');

portfinder.basePort = 5000;

portfinder.getPort((err, port) => {
    if (err) {
        console.error('Error finding port:', err);
        process.exit(1);
    }
    
    console.log(`Using port ${port}`);
    
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
```

### 4. Document Port Allocation

Create `PORTS.md`:
```markdown
# Port Allocation

| Service          | Port  | Environment  | Protocol |
|------------------|-------|--------------|----------|
| Client (Vite)    | 5173  | Development  | HTTP     |
| Server (Node)    | 5000  | Development  | HTTP     |
| MongoDB          | 27017 | Development  | TCP      |

## Available Ports
- Development: 5000-5010
- Staging: 5100-5110
- Production: 8080
```

### 5. Use Pre-Start Hooks

**package.json:**
```json
{
  "scripts": {
    "predev": "lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null || true",
    "dev": "nodemon server.js"
  }
}
```

### 6. Use Docker for Consistent Environments

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  server:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
```

---

## Commands Summary by Operating System

### Linux (Ubuntu/Debian)
```bash
# Check port
lsof -i :5000

# Kill process
lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9

# Alternative
fuser -k 5000/tcp
```

### macOS
```bash
# Check port
lsof -i :5000

# Kill process
lsof -i :5000 -t | xargs kill -9
```

### Windows (Command Prompt)
```cmd
:: Check port
netstat -ano | findstr :5000

:: Kill process
taskkill /PID <PID> /F
```

### Windows (PowerShell)
```powershell
# Check port
Get-NetTCPConnection -LocalPort 5000

# Kill process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

---

## Troubleshooting Common Issues

### Issue: Port Still in Use After Kill

**Solution:**
```bash
# Wait for socket to release (Linux)
sysctl net.ipv4.tcp_tw_reuse=1

# Check for lingering connections
netstat -ant | grep :5000
```

### Issue: Permission Denied on Linux

**Solution:**
```bash
# Use ports above 1024
PORT=5001 npm run dev

# Or use sudo (not recommended)
sudo npm run dev
```

### Issue: Nodemon Not Restarting

**Solution:**
```bash
# Clear nodemon cache
rm -rf node_modules/.nodemon

# Reinstall nodemon
npm install nodemon@latest --save-dev
```

---

## Recommended Workflow

1. **Before starting dev server:**
   ```bash
   npm run status:ports
   ```

2. **If port is in use, kill it:**
   ```bash
   npm run kill:5000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Or use smart start (auto-port selection):**
   ```bash
   npm run smart:dev
   ```

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/api/net.html)
- [Nodemon Documentation](https://github.com/remy/nodemon)
- [Cross-Env Documentation](https://github.com/kentcdodds/cross-env)
- [Portfinder Documentation](https://www.npmjs.com/package/portfinder)
