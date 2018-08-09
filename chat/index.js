var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    fs = require('fs'),

    views = {
        index : {
            file : "index.html"
        }
    },
    supportedFiles = {
        jpeg : "image/jpeg",
        css : "text/css",
        map : "application/json",
        js : "application/javascript"
    },
    sfregex = Object.keys(supportedFiles).join("|")

app.get('*', (req, res) => {
    let uri = req.originalUrl
    // Check if the request is for a supported file
    if(uri.match(new RegExp(`.*\.(${sfregex})$`))){
        // Look for the supported file in the client folder
        let file = lookForFile(uri)
        if(file) return res.sendFile(file)
    } else {
        // Check if the request is for a valid view
        if(uri == "/") uri = "index"
        let view = views[uri] || false
        if(view){
            let file = lookForFile(view.file)
            if(file) return res.sendFile(file)
        }
        //res.sendFile(__dirname + '/client/index.html')
    }
    res.send("404")
})

var sockets = {},
    usernames = {},
    typing = {}

io.on('connection', socket => {
    sockets[socket.id] = {
        id : socket.id,
        username : false,
        typing : false
    }

    socket.on('request username', (username, callback) => {
        if(typeof usernames[username] != "undefined") return callback({ status : 403, data : "El nombre de usuario ya está en uso"})
        let token = uuid()
        usernames[username] = {
            currentId : socket.id,
            token
        }
        sockets[socket.id].username = username
        // socket[socket.id].userame = username
        console.log(`${username} se ha conectado!`)
        // Emit new list
        io.emit("user list change")
        callback({ status : 200, data : { username, token } })
    })
    socket.on('verify token', (data, callback) => {
        let storedData = usernames[data.username] || false
        if(storedData) {
            if(storedData.token == data.token){
                usernames[data.username].currentId = socket.id
                sockets[socket.id].username = data.username
                console.log(`${data.username} se ha reconectado!`)
                // Emit new list
                io.emit("user list change")
                return callback({ status : 200, data : `Bienvenido de nuevo ${data.username}!`})
            }
            return callback({ status : 403, data : "Los datos no coinciden!" })
        } else {
            usernames[data.username] = {
                currentId : socket.id,
                token : data.token
            }
            sockets[socket.id].username = data.username
            console.log(`${data.username} se ha conectado!`)
            // Emit new list
            io.emit("user list change")
            return callback({ status : 200, data : `Bienvenido ${data.username}!`})
        }

    })
    socket.on('get users', (d, callback) => {
            response = {
                online : [],
                offline : []
            },
            keys = Object.keys(usernames),
            length = keys.length
        for(let i = 0; i < length; i++){
            let status = (usernames[keys[i]].currentId) ? "online" : "offline"
            response[status].push(keys[i])
        }
        callback({ status : 200, data : response})
    })
    socket.on('chat message', message => {
        let username = sockets[socket.id].username
        socket.broadcast.emit("chat message", { username, message })
    })
    socket.on('disconnect', () => {
        let username = sockets[socket.id].username || false
        if(username) {
            usernames[username].currentId = false
            console.log(`${username} se ha desconectado`)
        }
        delete sockets[socket.id]
        // Emit new list
        io.emit("user list change")
    })
})

http.listen(3000, function(){
  console.log('listening on *:3000')
})


/**
 * Look for the existence of a file inside a common folder and returns the full path to it.
 * 
 * @param {string} file    File name with extension an inner path
 * @param {string} path    Default path for file serch
 * 
 * @returns The full path of the file found
 * @returns false, File not found
 */
function lookForFile(file, path = '/client/'){
    let filePath = __dirname + `${path}${file}`
    return (fs.existsSync(filePath)) ? filePath : false
}
/**
 * Generates an valid UUID v4
 */
function uuid() {
    var uuid = "", i, random;
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20) uuid += "-"
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}