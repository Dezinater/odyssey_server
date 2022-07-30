import { WebSocketServer } from "ws"
import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import * as database from './Database.js';
import path from 'path';

let settings;
if (!fs.existsSync('./settings.json')) {
    console.log(`${'You do not have a \'settings.json\' file setup.'}`);
    process.exit(0);
} else {
    settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
}

let db = mysql.createPool({
    host: settings.db_host,
    user: settings.db_username,
    password: settings.db_password,
    database: settings.db_name,
    connectionLimit: settings.db_connectionLimit,
    multipleStatements: true
});

await database.initializeDatabase(db, settings);

let wss = new WebSocketServer({ port: 42069 })
wss.on('connection', (ws, req) => {
    ws.remoteIp = ws._socket.remoteAddress;
    ws.on('pong', function () {
        ws.isAlive = true;
    });

    ws.on('close', (data) => {
        closeConnection(ws);
    });

    ws.on('message', (dataString) => {
        incomingMessage(ws, dataString);
    });
});

let heartbeat = setInterval(() => {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            closeConnection(ws);
            return;
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);


function closeConnection(ws) {
    console.log(`Connection closed with ${ws.username ?? ws.remoteIp}`);
    ws.terminate();
}

async function incomingMessage(ws, dataString) {
    console.log("incoming message: " + dataString);
    let data = JSON.parse(dataString);

    sendNetworkMessageTo(ws, { type:"onTestMessage", returnTest: "testValue" });
}

function sendNetworkMessageTo(ws, payload) {
    let packet = { payload };
    ws.send(JSON.stringify(packet));
}