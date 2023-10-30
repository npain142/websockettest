const ws = require('ws');
const http = require('http');
const express = require('express')
const app = express();
const uuidv4 = require('uuid').v4;

// noinspection JSUnusedLocalSymbols
const z = require('zod');
const { CommandResponseSchema, CommandRequestSchema } = require('./model.cjs');
const {json} = require("express");

/**
 * @type {WebSocket.Server<typeof WebSocket.WebSocket, IncomingMessage>}
 */
const wss = new ws.WebSocketServer({ noServer: true, path: "/ws" });

const clients = {};
const sessions = [
	{
		id: '1234',
		clients: [],
	},
];

/**
 * @param {RawData} msg
 */
function parseIncomingMessage(msg) {
	const json = JSON.parse(msg.toString());
	return CommandRequestSchema.parse(json);
}

/**
 *
 * @param {WebSocket.WebSocket} connection
 * @param {z.infer<typeof CommandResponseSchema>} message
 */
function sendMessage(connection, message) {
	const json = CommandResponseSchema.parse(message);
	connection.send(JSON.stringify(json));
}

wss.on('connection', (connection) => {
	console.log('new Connection');
	let client_id = uuidv4();
	clients[client_id] = connection;
	console.log(`${client_id} connected`);
	sendMessage(connection, { method: 'client_id', client_id: client_id });
	connection.on('close', () => {
		sessions.forEach((s) => {
			s.clients = s.clients.filter((c) => client_id === c);
		});
	});
	//ON REQUEST
	connection.on('message', (msg) => {
		// request will be parsed which means it is also valid against the schema
		const data = parseIncomingMessage(msg);

		switch (data.method) {
			case 'create': {
				const newSession = {
					id: data.session_id,
					clients: [client_id],
				};
				sessions.push(newSession);
				return console.log(sessions);
			}
			case 'join': {
				sessions.forEach((s) => {
					if (s.id === data.session_id) {
						sendMessage(connection, {
							method: 'session_id',
							session_id: s.id,
						});
						s.clients.push(client_id);
						sendMessage(connection, {
							method: 'symbol',
							symbol: s.clients.length === 1 ? 'X' : 'O',
						});

						if (s.clients.length === 2) {
							startGame(connection);
						}
						console.log(sessions);
					}
				});
				return;
			}
			case 'play': {
				return play(data);
			}
			case 'win': {
				return win(data);
			}
		}
	});
});

function win(data) {
	sessions.forEach((s) => {
		if (s.id === data.session_id) {
			s.clients.forEach((c) => {
				if (c === data.client_id) {
					sendMessage(clients[c], { method: 'end', message: 'Winner' });
				} else {
					sendMessage(clients[c], { method: 'end', message: 'Looser' });
				}
			});
		}
	});
	wss.clients.forEach((c) => {
		c.close();
	});
}

function play(data) {
	let next;
	sessions.forEach((s) => {
		if (s.id === data.session_id) {
			s.clients.forEach((c) => {
				if (c !== data.client_id) {
					next = c;
				}
				sendMessage(clients[c], data);
			});
		}
	});
	sendMessage(clients[next], { method: 'turn' });
}

function startGame(connection) {
	sendMessage(connection, { method: 'turn' });
}

app.use(json());
// todo(REST): set up route to create session with password and return a sessionId
// todo(REST): set up route to get all sessions
// todo(REST): set up route to connect to session and return a clientId
// todo(REST): set up route to delete sessions
// todo(invalidate sessions): implement health checks to close connections after a period of time
app.get("/connect", (req, res) => {
	console.log("connecting")
	res.send("hello world")
})

const server = app.listen(3000, () => {
	console.log('Listening on Port ' + 3000);
});


server.on('upgrade', (request, socket, head) => {
	console.log("upgrade")
	wss.handleUpgrade(request, socket, head, socket => {
		wss.emit('connection', socket, request);
	});
});