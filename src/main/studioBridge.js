import http from 'http';
import fs from 'fs';
import path from 'path';
import {ipcMain} from 'electron';
import log from '../common/log.js';

let activeWindow = null;
let currentServer = null;
let pendingRequests = new Map();
let requestIdCounter = 1;

// Load GEMINI_API_KEY from .env if present
const loadLocalEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const [key, ...vals] = trimmed.split('=');
                    const val = vals.join('=').trim();
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = val;
                    }
                }
            }
        }
    } catch (e) {
        log.error('Failed to load local .env:', e);
    }
};

loadLocalEnv();

const sendJsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
};

const readRequestBody = req => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 50 * 1024 * 1024) { // 50MB limit
            reject(new Error('Payload too large'));
        }
    });
    req.on('end', () => {
        try {
            resolve(body ? JSON.parse(body) : {});
        } catch (e) {
            reject(e);
        }
    });
    req.on('error', reject);
});

// Setup IPC listener from renderer for request-response pairing
ipcMain.on('studio:projectResponse', (event, {reqId, project}) => {
    const handler = pendingRequests.get(reqId);
    if (handler) {
        pendingRequests.delete(reqId);
        handler(null, project);
    }
});

ipcMain.on('studio:stateResponse', (event, {reqId, targets}) => {
    const handler = pendingRequests.get(reqId);
    if (handler) {
        pendingRequests.delete(reqId);
        handler(null, targets);
    }
});

export const initStudioBridge = (browserWindow, port = 8765) => {
    activeWindow = browserWindow;

    if (currentServer) {
        try {
            currentServer.close();
        } catch (_) {}
    }

    const server = http.createServer(async (req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            return res.end();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        try {
            // Health check
            if (pathname === '/health' && req.method === 'GET') {
                return sendJsonResponse(res, 200, {
                    status: 'online',
                    app: 'Scratch AI Studio',
                    author: 'Pheromone',
                    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
                });
            }

            // Get live scene state
            if (pathname === '/api/state' && req.method === 'GET') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const reqId = ++requestIdCounter;
                const timeout = setTimeout(() => {
                    if (pendingRequests.has(reqId)) {
                        pendingRequests.delete(reqId);
                        sendJsonResponse(res, 504, {error: 'Renderer state timeout'});
                    }
                }, 3000);

                pendingRequests.set(reqId, (err, targets) => {
                    clearTimeout(timeout);
                    if (err) return sendJsonResponse(res, 500, {error: err.message});
                    sendJsonResponse(res, 200, {status: 'ok', targets});
                });

                activeWindow.webContents.send('studio:getState', reqId);
                return;
            }

            // Get live project JSON
            if (pathname === '/api/project' && req.method === 'GET') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const reqId = ++requestIdCounter;
                const timeout = setTimeout(() => {
                    if (pendingRequests.has(reqId)) {
                        pendingRequests.delete(reqId);
                        sendJsonResponse(res, 504, {error: 'Renderer project timeout'});
                    }
                }, 4000);

                pendingRequests.set(reqId, (err, project) => {
                    clearTimeout(timeout);
                    if (err) return sendJsonResponse(res, 500, {error: err.message});
                    sendJsonResponse(res, 200, {status: 'ok', project});
                });

                activeWindow.webContents.send('studio:getProject', reqId);
                return;
            }

            // Capture live screenshot of the window
            if (pathname === '/api/screenshot' && req.method === 'GET') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const image = await activeWindow.webContents.capturePage();
                const pngBuffer = image.toPNG();
                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Access-Control-Allow-Origin': '*'
                });
                return res.end(pngBuffer);
            }

            // Load project into live VM
            if (pathname === '/api/load-project' && req.method === 'POST') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const body = await readRequestBody(req);
                if (body.filePath) {
                    try {
                        const fileBuf = fs.readFileSync(body.filePath);
                        activeWindow.webContents.send('studio:loadProjectBuffer', fileBuf);
                        return sendJsonResponse(res, 200, {
                            status: 'success',
                            message: `Project file ${body.filePath} dispatched to live runtime`
                        });
                    } catch (readErr) {
                        return sendJsonResponse(res, 400, {error: `Failed to read file: ${readErr.message}`});
                    }
                }
                const projectData = body.project || body;
                activeWindow.webContents.send('studio:loadProject', projectData);
                return sendJsonResponse(res, 200, {
                    status: 'success',
                    message: 'Project load dispatched to live runtime'
                });
            }

            // Add sprite to live VM
            if (pathname === '/api/add-sprite' && req.method === 'POST') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const body = await readRequestBody(req);
                const spriteData = body.sprite || body;
                activeWindow.webContents.send('studio:addSprite', spriteData);
                return sendJsonResponse(res, 200, {
                    status: 'success',
                    message: 'Sprite addition dispatched to live runtime'
                });
            }

            // Reload renderer window
            if (pathname === '/api/reload' && req.method === 'POST') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                activeWindow.webContents.reload();
                return sendJsonResponse(res, 200, {status: 'ok', message: 'Window reloaded'});
            }

            // Execute JS in renderer
            if (pathname === '/api/eval' && req.method === 'POST') {
                if (!activeWindow || activeWindow.isDestroyed()) {
                    return sendJsonResponse(res, 503, {error: 'Active window not ready'});
                }
                const body = await readRequestBody(req);
                const code = body.code || '';
                try {
                    const evalResult = await activeWindow.webContents.executeJavaScript(code);
                    return sendJsonResponse(res, 200, {status: 'ok', result: evalResult});
                } catch (evalErr) {
                    return sendJsonResponse(res, 500, {error: evalErr.message});
                }
            }

            // 404 fallback
            return sendJsonResponse(res, 404, {error: 'Route not found'});
        } catch (e) {
            log.error('Bridge error handling request:', e);
            return sendJsonResponse(res, 500, {error: e.message});
        }
    });

    server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
            log.warn(`[Scratch AI Studio] Live Bridge port ${port} is already in use. Secondary instance running smoothly without duplicate bridge server.`);
            try {
                server.close();
            } catch (_) {}
        } else {
            log.error('[Scratch AI Studio] Live Bridge server error:', err);
        }
    });

    try {
        server.listen(port, '127.0.0.1', () => {
            log.info(`[Scratch AI Studio] Live Bridge running on http://127.0.0.1:${port}`);
        });
    } catch (err) {
        log.warn('[Scratch AI Studio] Bridge listen attempt threw:', err);
    }

    currentServer = server;
    return server;
};

export const closeStudioBridge = () => {
    if (currentServer) {
        try {
            currentServer.close();
        } catch (_) {}
        currentServer = null;
    }
};
