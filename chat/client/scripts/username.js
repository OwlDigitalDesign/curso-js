class Username {
    constructor(){
        this.container = $("#username")
        this.form = $("#username form")
        this.input = $("#username input")
        this.errorBox = $("#username .error-box")

        this.username = localStorage.username || false
        this.token = localStorage.token || false
    }
    init(){
        changeSection("username", () => {
            this.input.focus()
            this.form.on("submit", e => {
                e.preventDefault()
                return this.send()
            })
            this.form.on("keydown", e => {
                if($(e.target).hasClass("error")) this.hideError()
            })
            // this.input.on("keypress", e => {
            //     if(e.keyCode == 13) this.send()
            // })
            // this.button.on("click", () => this.send())
            // this.button.on("keypress", e => {
            //     console.log(1)
            //     if(e.keyCode == 13 || e.keyCode == 32) this.send()
            // })

        })
    }
    release(){
        this.form.off()
    }
    send(){
        let value = this.input.val().toUpperCase()
        if(!value) return this.showError("El campo no puede estar vacío!")
        this.check(value).then(data => {
            localStorage.setItem("token", data.token)
            localStorage.setItem("username", data.username)
            this.token = data.token
            this.username = data.username
            this.release()
            // Show welcome message
            chat.showWelcome(data.username)
        }).catch(err => {
            this.showError(err)
        })
    }
    hideError(){
        this.input.removeClass("error")
        this.errorBox.text("").removeClass("show")
    }
    showError(error){
        this.input.addClass("error")
        this.errorBox.text(error).addClass("show")
    }
    check(username){
        return query(username, 'request username')
    }
    verify(){
        return new Promise((resolve, reject) => {
            if(!this.username || !this.token) return reject(false)
            query({username : this.username, token : this.token}, 'verify token').then(data => {
                console.log(this.username)
                resolve(data)
            }).catch(err => {
                reject(err)
            })
        })
    }
}