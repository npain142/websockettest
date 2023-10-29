
let ws;
const fields = document.getElementsByClassName("field-container");
let symbol = "undefined";
const marked = [];
let turn = false;
let currentSession = null;
let client_id;

let sess_id = document.getElementById("session_id");
let username = document.getElementById("username");

function buildupCon() {
    ws = new WebSocket("ws://localhost:3000", ["json"]);
    ws.onopen = () => {
        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log(data);
            if (data.method === "play") {
                document.getElementById(data.id).innerHTML += data.symbol;
            } else if (data.method === "turn") {
                turn = true;
            } else if (data.method === "symbol") {
                symbol = data.symbol;
            } else if (data.method === "test") {
                alert("TEST")
            } else if (data.method == "client_id") {
                client_id = data.client_id;
            } else if (data.method == "session_id") {
                currentSession = data.session_id;
            } else if (data.method === "end") {
                alert(data.message);
                location.reload();
            }
        
        }
        const tmp = {
            "method": "join",
            "session_id": sess_id.value,
            "username": username.value,
            "client_id": client_id,
        }
        ws.send(JSON.stringify(tmp))
        updateScreen();
    }
    
}




for (let i = 0; i < fields.length; i++) {
    fields[i].onclick = () => {
        if (turn) {
            const tmp = {
                "method": "play",
                "symbol": symbol,
                "id": i,
                "client_id": client_id,
                "session_id": currentSession
            }
            ws.send(JSON.stringify(tmp));
            marked.push(fields[i].id);
            checkWin()
            turn = false;
        } else {
            alert("It's not your turn!");
        }
    }
}


function checkWin() {
    const win = {
        "method": "win",
        "client_id": client_id,
        "session_id": currentSession
    }
    for (let i = 0; i < fields.length; i++) {
        
        
        if (i % 3 == 0 && marked.includes(`${i}`) && marked.includes(`${i + 1}`) && marked.includes(`${i + 2}`)) {
            ws.send(JSON.stringify(win));
        }

        if (i < 3 && marked.includes(`${i}`) && marked.includes(`${i + 3}`) && marked.includes(`${i + 6}`)) {
            ws.send(JSON.stringify(win));
        }

        if ((i == 0) && marked.includes(`${0}`) && marked.includes(`${4}`) && marked.includes(`${8}`)) {
            ws.send(JSON.stringify(win));
        }

        if ((i == 2) && marked.includes(`${2}`) && marked.includes(`${4}`) && marked.includes(`${6}`)) {
            ws.send(JSON.stringify(win));
        }
    }
}


function updateScreen() {
    
    document.getElementById("login-container").style.display = "none";
    document.getElementById("wrapper").style.display = "flex";
    
}

