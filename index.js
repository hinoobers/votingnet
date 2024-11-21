const express = require("express");
const crypto = require("crypto");
const app = express();
const db = require("./database");

app.use(express.static("public/"));
app.use(express.json())

function hash(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function fetchPolls() {
    return db.query("SELECT * FROM polls").then(([rows]) => {
        return rows.map(poll => {
            poll.answers = JSON.parse(poll.answers);
            poll.voters = JSON.parse(poll.voters);
            poll.options = JSON.parse(poll.options);
            return poll;
        });
    });
}

function addVote(pollId, answers, answer, fingerprint) {
    db.query("UPDATE polls SET voters = JSON_ARRAY_APPEND(voters, '$', ?) WHERE id = ?", [fingerprint, pollId]);
    // loop over
    let updated = false;
    for(let i = 0; i < answers.length; i++) {
        if(answers[i].option_id === answer) {
            answers[i].count++;
            updated = true;
            break;
        }
    }

    if(!updated) {
        answers.push({option_id: answer, count: 1});
    }

    console.log(JSON.stringify(answers), pollId);

    db.query("UPDATE polls SET answers = ? WHERE id = ?", [JSON.stringify(answers), pollId]);
}

// const polls = [
//     {id: 0, question: "What is your favourite programming language?", options: ["Python", "JavaScript", "Java", "C++"], answers: [], voters: []},
//     {id: 1, question: "What is your favourite color?", options: ["Red", "Green", "Blue", "Yellow"], answers: [], voters: []},
// ]; // Voters are fingerprints, for some protection, otherwise this can be easily manipulated


app.get("/polls", async (req, res) => {
    const fingerprint = hash(req.ip);

    try {
        const polls = await fetchPolls();

        const pollsCopy = polls.map(poll => {
            const copy = {...poll};
            copy.voted = poll.voters.includes(fingerprint);
            copy.voters = undefined;
            return copy;
        });

        res.json(pollsCopy);


    } catch(err) {
        res.status(500).json({message: "Error fetching polls"});
    }
});

app.post("/castvote", async (req, res) => {
    const {
        id,
        answer
    } = req.body;

    const polls = await fetchPolls();

    const poll = polls.find(poll => poll.id === id);
    if(!poll) {
        return res.status(404).json({message: "Poll not found!"});
    }

    const fingerprint = hash(req.ip);
    console.log(`Hashing (${req.ip}) to ${fingerprint}`);
    if(poll.voters.includes(fingerprint)) {
        return res.status(403).json({message: "You have already voted!"});
    }

    addVote(id, poll.answers, answer, fingerprint);

    res.json({message: "Vote casted!", results: poll.answers});
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})