document.addEventListener("DOMContentLoaded", function() {
    if(sessionStorage.getItem("notice") == null) {
        alert("To prevent spamming/manipulation, this poll system prevents duplicate votes by using a SHA-256 hash of your IP. If you're not comfortable with that, don't click any voting button or use a VPN.")
        sessionStorage.setItem("notice", "true")
    }

    function updateVoteResults(buttons, results) {
        let totalVotes = results.reduce((acc, cur) => acc + cur.count, 0)
        console.log("total", totalVotes)
        buttons.forEach((button, index) => {
            let count = 0

            for(let i = 0; i < results.length; i++) {
                if(results[i].option_id === index) {
                    count += results[i].count
                    break
                }
            }
            

            let percent = Math.round(count / totalVotes * 100)
            button.button.textContent = `${button.button.textContent.split(":")[0]}: ${percent}%`
        })
    }

    function createVoteButton(option, index, id, buttons) {
        const button = document.createElement("button")
        button.textContent = option
        button.addEventListener("click", function() {
            castVote(id, index, buttons)
        })

        return button
    }

    async function castVote(pollId, index, buttons) {
        try {
            const response = await fetch("/castvote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: pollId,
                    answer: index
                })
            })
            const data = await response.json()
            if(!data.results) {
                alert(data.message)
            } else {
                updateVoteResults(buttons, data.results)
            }
        } catch(err) {
            console.error(err)
        }
    }

    function createVoteHeader(data) {
        const poll = document.createElement("div")
        poll.classList.add("poll")
        poll.id = data.id

        const question = document.createElement("h2")
        question.textContent = data.question

        const options = document.createElement("div")
        options.classList.add("options")

        console.log(data)
        const buttons = [];
        data.options.map((option, index) => {
            const button = createVoteButton(option, index, data.id, buttons);
            options.appendChild(button);
            buttons.push({ button, index, option});
        });

        poll.appendChild(question)
        poll.appendChild(options)

        // Check if they already voted (this is after they refreshed maybe)
        if(data.voted) {
            updateVoteResults(buttons, data.answers)
        }

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