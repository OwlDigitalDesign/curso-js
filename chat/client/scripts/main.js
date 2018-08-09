class Chat {
    constructor(){
        this.welcome = $("#welcome")

        this.container = $("#chat")
        this.header = $("#chat .header")
        this.usersBox = $("#chat .users")
        this.chatBox = $("#chat .chat-box")
        this.messageBox = $("#chat .message-box")

        this.messageTemplate = `<div class="message"><div class="username">%USERNAME%</div><div class="content">%MESSAGE%</div></div>`

        this.users = {
            online : [],
            offline : []
        }
    }
    show(){
        changeSection("chat", () => {
            //
            this.messageBox.find("input").focus()
            this.messageBox.on("submit", e => this.send(e))
            this.messageBox.on("click", ".send", () => this.messageBox.submit())
        })
    }
    release(){
        this.messageBox.off()
    }
    displayMessage(username, message, own = false){
        own = (own) ? 'class="own ' : 'class="'
        this.chatBox.find(".messages").append(this.messageTemplate.replace("%USERNAME%", username).replace("%MESSAGE%", message).replace("class='", own))
        this.chatBox.animate({scrollTop: this.chatBox.find(".messages").height()},1)
    }
    send(e){
        e.preventDefault()
        let message = this.messageBox.find("input").val()
        if(!message) return false
        socket.emit("chat message", message)
        this.displayMessage(username.username, message)
        this.messageBox.find("input").val("")
    }
    showWelcome(username){
        this.welcome.find("h1").text(username)
        changeSection("welcome", () => {
            // 
            this.syncUsers( (users) => this.displayUsers(users) )
            this.show()
        })
    }
    async syncUsers(callback){
        query(false, 'get users', false).then((users) => {
            this.users = users
            callback(users)
        })
    }
    displayUsers(users){
        let online = this.usersBox.find("[group='online'] .elements"),
            offline = this.usersBox.find("[group='offline'] .elements"),
            template = `<div class="user" status=%STATUS%>%USERNAME%</div>`,
            running = true,
            i = 0
        
        online.empty()
        offline.empty()
        do {
            if(typeof users.online[i] != "undefined") online.append(template.replace("%STATUS%", "online").replace("%USERNAME%", users.online[i]))
            if(typeof users.offline[i] != "undefined") offline.append(template.replace("%STATUS%", "online").replace("%USERNAME%", users.offline[i]))
            i++ // Increment

            running = (i < users.online.length || i < users.offline.length)
        } while(running)
    }
}

var socket = io("192.168.15.10:3000"),
    username = new Username(),
    chat = new Chat()

$(window).on('load', init)
$(document).on("click", ".loading", e => {
    e.preventDefault()
    return false
})
socket.on("user list change", users => {
    chat.syncUsers( (users) => chat.displayUsers(users) )
})
socket.on("chat message", message => {
    chat.displayMessage(message.username, message.message)
})


function init(){
    hideSections(false, true)
    username.verify().then(() => {
        // Show welcome message
        chat.showWelcome(username.username)
    }).catch( err => {
        // Init username interface
        username.init()
    })
}
function setLoadingState(){
    $("html").addClass("loading")
}
function removeLoadingState(){
    $("html").removeClass("loading")
}
function changeSection(section, callback){
    hideSections(() => {
        $(`#${section}`).addClass("active")
        setTimeout(() => {
            return (typeof callback == "function") ? callback() : true
        }, 150)
    })
}
function hideSections(callback, force = false){
    if(force) $("main").removeClass("active").removeClass("hide")
    if(!$("main.active").length || force){
        return (typeof callback == "function") ? callback() : true
    }
    $("main.active").addClass("hide")
    setTimeout(() => {
        $("main").removeClass("active").removeClass("hide")
        return (typeof callback == "function") ? callback() : true
    }, 150)
}
function query(data, type, useLoading = true){
    if(useLoading) setLoadingState()
    return new Promise((resolve, reject) => {
        // let timeout = setTimeout(() => { reject("timeout") }, 5000)
        socket.emit(type, data, response => {
            // clearTimeout(timeout)
            if(useLoading) removeLoadingState()
            if(response.status != 200) return reject(response.data)
            return resolve(response.data)
        })
    })
}