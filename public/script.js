document.addEventListener("DOMContentLoaded", function() {
    function createVoteHeader(data) {
        const poll = document.createElement("div")
        poll.classList.add("poll")
        poll.id = data.id

        const question = document.createElement("h2")
        question.textContent = data.question
        poll.appendChild(question)

        const options = document.createElement("div")
        options.classList.add("options")
        poll.appendChild(options)

        console.log(data)
        const buttons = []
        data.options.forEach((option, index) => {
            const button = document.createElement("button")
            button.textContent = option
            buttons.push({button, index, option})

            button.addEventListener("click", function() {
                fetch("/castvote", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: data.id,
                        answer: index
                    })
                }).then(response => {
                    return response.json()
                }).then(data => {
                    if(!data.results) {
                        alert(data.message)
                    } else {
                        if(data.message) {
                            // now change button texts to show the results
                            console.log(data.results)
    
                            const totalVotes = data.results.reduce((a, b) => a + b, 0)
                            buttons.forEach((button, index) => {
                                const count = data.results[index] || 0
                                const percent = totalVotes === 0 ? 0 : Math.round(count / totalVotes * 100)
                                button.button.textContent = `${button.option}: ${percent}%`
                            })
                        }
                    }
                })
            })

            options.appendChild(button)
        })

        // Check if they already voted (this is after they refreshed maybe)
        if(data.voted) {
            const totalVotes = data.answers.reduce((a, b) => a + b, 0)
            buttons.forEach(button => {
                const count = data.answers[button.index] || 0
                const percent = totalVotes === 0 ? 0 : Math.round(count / totalVotes * 100)
                button.button.textContent = `${button.option}: ${percent}%`
            });
        }

        console.log(poll)
        document.querySelector("main").appendChild(poll)
    }

    fetch("/polls").then(data => {
        return data.json()
    }).then(response => {
        for(let i = 0; i < response.length; i++) {
            createVoteHeader(response[i])
        }
    })
})