const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.static("public/"));
app.use(express.json())

function hash(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

const polls = [
    {id: 0, question: "What is your favourite programming language?", options: ["Python", "JavaScript", "Java", "C++"], answers: [], voters: []},
    {id: 1, question: "What is your favourite color?", options: ["Red", "Green", "Blue", "Yellow"], answers: [], voters: []},
]; // Voters are fingerprints, for some protection, otherwise this can be easily manipulated
app.get("/polls", (req, res) => {
    const fingerprint = hash(req.ip + req.headers["user-agent"]);

    const pollsCopy = polls.map(poll => {
        const pollCopy = {...poll};
        if(poll.voters.includes(fingerprint)) {
            pollCopy.voted = true;
        }
        pollCopy.voters = undefined;
        return pollCopy;
    });
    res.json(pollsCopy);
});

app.post("/castvote", (req, res) => {
    const {
        id,
        answer
    } = req.body;
    console.log(req.body);

    const poll = polls.find(poll => poll.id === id);
    if(!poll) {
        return res.status(404).json({message: "Poll not found!"});
    }

    const fingerprint = hash(req.ip + req.headers["user-agent"]);
    if(poll.voters.includes(fingerprint)) {
        return res.status(403).json({message: "You have already voted!"});
    }

    if(!poll.answers[answer]) {
        poll.answers[answer] = 0;
    }

    poll.answers[answer]++;
    poll.voters.push(fingerprint);

    res.json({message: "Vote casted!", results: poll.answers});
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})