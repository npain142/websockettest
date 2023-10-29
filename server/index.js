const ws = require("ws");
const http = require("http");

const uuidv4 = require("uuid").v4
const express = require("express");
const server = express();
const wss = new ws.WebSocketServer({server});

server.use(express.static(__dirname));


server.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});



const clients = {};
const sessions = [{
    "id": "1234",
    "clients": []
}];


wss.on("connection", (connection) => {
    console.log("new Connection");
    let client_id = uuidv4();
    clients[client_id] = connection;
    console.log(`${client_id} connected`);
    connection.send(JSON.stringify({"method": "client_id", "client_id": client_id}))

    //ON REQUEST
    connection.on("message", (msg) => {
        const data = JSON.parse(msg);
        console.log(data);
        if(isValidRequest(data)) {
            if (data.method === "create") {
                const newSession = {
                    "id": data.session_id,
                    "clients": [client_id]
                };
                sessions.push(newSession);
                console.log(sessions);
            } else if (data.method === "join") {
                sessions.forEach((s) => {
                    if (s.id == data.session_id) {
                        connection.send(JSON.stringify({"method": "session_id", "session_id": s.id}))
                        s.clients.push(client_id);
                        let symbol;
                        if(s.clients.length == 1) {
                            symbol = "X";
                        } else {
                            symbol = "O";
                        }   
                        const tmp = {
                            "method": "symbol",
                            "symbol": symbol
                        }
                        connection.send(JSON.stringify(tmp));
                        
                        if (s.clients.length == 1) {
                            startGame(connection);
                        }
                        console.log(sessions);
                    }
                });
            } else if (data.method === "play") {
                play(data);
            } else if (data.method === "win") {
                win(data);
            }
        }

    });
    connection.on("close", () => {
        
        sessions.forEach(s => {
            s.clients = s.clients.filter((c) => {
                client_id == c;
            })
        })
    })


    
})

function win(data) {
    sessions.forEach(s => {
        if (s.id === data.session_id) {
            s.clients.forEach(c => {
                if (c == data.client_id) {
                    clients[c].send(JSON.stringify({"method":"end", "message": "Winner"}))
                } else {
                    clients[c].send(JSON.stringify({"method":"end", "message": "Looser"}))
                }
                
            })
        }
    })
    wss.clients.forEach(c => {
        c.close();
    })
}

function play(data) {
    let next;
    sessions.forEach(s => {
        if (s.id === data.session_id) {
            s.clients.forEach(c => {
                if (c != data.client_id) {
                    next = c;
                }
                clients[c].send(JSON.stringify(data))
            })
        }
    })
    clients[next].send(JSON.stringify({"method": "turn"}))
}

function startGame(connection) {
    connection.send(JSON.stringify({"method": "turn"}));
}


const isValidRequest = (data) => {
    if (data.method) {
        return true;
    } else return false;
}


server.listen(3000, () => {
    console.log("Listening on Port " + 3000);
})