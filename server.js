const http = require('http');
const express = require('express');            
const socket = require('socket.io')
const app = express();
const server = http.createServer(app)
const io = socket(server)
const axios = require('axios')
const bodyParser = require('body-parser');
app.use(bodyParser.json())

let rooms = [];
let sessionQuestions = []
let numberOfQuestions = 5; // SET NUMBER OF QUESTIONS + 1

app.get('/', (req,res) => {res.send('YDKDS served!');});

io.on('connection', (socket) => {
  console.log('New PLAYER connected!: ', socket.id);
  
  socket.on('disconnect', () => {console.log("A player has left");}) 
 
  // Initialize user in room
  socket.on('userName', (name, clientId, code) => {    
    const newPlayer = { name, score: 0, uuid: clientId }; //new player    
    if (!rooms.some(room => room.code === code)) {      
      const newRoom = { code, players: [newPlayer] }; //new room      
      rooms.push(newRoom);
      socket.join(code);
      io.emit('pBroadcast', newRoom.players);
    } else {
      const target = rooms.find(room => room.code === code);
      if (target.players.length < 4) { target.players.push(newPlayer) } ;
      socket.join(code);
      io.emit('pBroadcast', target.players);
    }
    console.log('rooms', rooms)
  })

  // Listen for advance button
  socket.on('advanceButton', (item, code) => {
    if (item === "goToInstructions") {
      io.emit('advanceToInstructions', item)
      
      axios
        .get(`https://opentdb.com/api.php?amount=${numberOfQuestions}&type=multiple`)
        .then(res => {
          sessionQuestions = res.data.results
        })
        .catch(err => {console.log("Errors: ", err)})
    }
    if (item === "goToQuestionIntro") {io.emit('advanceToQuestionIntro', item)}
    if (item === "goToQuestions") {
      console.log("advancing to questions")
      io.emit('advanceToQuestions', item)}
    
    if (item === "goToWinner") {
      const target = rooms.find(room => room.code === code);
      console.log("target: ", target)
      if (target.players.length === 1) {
        io.emit('advanceToWinner', target.players[0].name, target.players[0].score)

      // 2 player iterations
      } else if (target.players.length === 2 && target.players[0].score > target.players[1].score) {
      io.emit('advanceToWinner', target.players[0].name, target.players[0].score)      
      } else if (target.players.length === 2 && target.players[1].score > target.players[0].score) {
      io.emit('advanceToWinner', target.players[1].name, target.players[1].score)      

      } else if (target.players.length === 2 && target.players[1].score === target.players[0].score) {
      io.emit('advanceToWinner', "It's a tie!", target.players[1].score)      

      // 3 player iterations
      } else if (target.players.length === 3 && target.players[0].score > target.players[1].score && target.players[0].score > target.players[2].score) {
      io.emit('advanceToWinner', target.players[0].name, target.players[0].score)      
      } else if (target.players.length === 3 && target.players[1].score > target.players[0].score && target.players[1].score > target.players[2].score) {
      io.emit('advanceToWinner', target.players[1].name, target.players[1].score)      
      } else if (target.players.length === 3 && target.players[2].score > target.players[0].score && target.players[2].score > target.players[1].score) {
      io.emit('advanceToWinner', target.players[2].name, target.players[2].score)      

      } else if (target.players.length === 3 && target.players[0].score === target.players[1].score && target.players[0].score > target.players[2].score) {
      io.emit('advanceToWinner', "Players 1 and 2 win!", target.players[0].score)      
      } else if (target.players.length === 3 && target.players[0].score > target.players[1].score && target.players[0].score === target.players[2].score) {
      io.emit('advanceToWinner', "Players 1 and 3 win!", target.players[1].score)      

    } else if (target.players.length === 3 && target.players[1].score > target.players[0].score && target.players[1].score === target.players[2].score) {
      io.emit('advanceToWinner', "Players 2 and 3 win!", target.players[1].score)      

      } else if (target.players.length === 3 && target.players[0].score === target.players[1].score && target.players[0].score === target.players[2].score) {
      io.emit('advanceToWinner', "It's a 3-way tie!", target.players[0].score)      

      // 4 player iterations
      } else if (target.players.length === 4 && target.players[0].score > target.players[1].score && target.players[0].score > target.players[2].score && target.players[0].score > target.players[3].score) {
        io.emit('advanceToWinner', target.players[0].name, target.players[0].score)
      } else if (target.players.length === 4 && target.players[1].score > target.players[0].score && target.players[1].score > target.players[2].score && target.players[1].score > target.players[3].score ) {
        io.emit('advanceToWinner', target.players[1].name, target.players[1].score)
      } else if (target.players.length === 4 && target.players[2].score > target.players[0].score && target.players[2].score > target.players[1].score && target.players[2].score > target.players[3].score ) {
        io.emit('advanceToWinner', target.players[2].name, target.players[2].score)
      } else if (target.players.length === 4 && target.players[3].score > target.players[0].score && target.players[3].score > target.players[1].score && target.players[3].score > target.players[2].score ) {
        io.emit('advanceToWinner', target.players[3].name, target.players[3].score)

      } else if (target.players.length === 4 && target.players[0].score === target.players[1].score && target.players[0].score > target.players[2].score && target.players[0].score > target.players[3].score) {
        io.emit('advanceToWinner', "Players 1 and 2 win!", target.players[0].score)
      } else if (target.players.length === 4 && target.players[2].score === target.players[0].score && target.players[2].score > target.players[1].score && target.players[2].score > target.players[3].score ) {
        io.emit('advanceToWinner', "Players 1 and 3 win!", target.players[2].score)
      } else if (target.players.length === 4 && target.players[3].score === target.players[0].score && target.players[3].score > target.players[1].score && target.players[3].score > target.players[2].score ) {
        io.emit('advanceToWinner', "Players 1 and 4 win!", target.players[3].score)

      } else if (target.players.length === 4 && target.players[1].score > target.players[0].score && target.players[1].score === target.players[2].score && target.players[1].score > target.players[3].score ) {
        io.emit('advanceToWinner', "Players 2 and 3 win!", target.players[1].score)
      } else if (target.players.length === 4 && target.players[1].score > target.players[0].score && target.players[1].score > target.players[2].score && target.players[1].score === target.players[3].score ) {
        io.emit('advanceToWinner', "Players 2 and 4 win!", target.players[1].score)

      } else if (target.players.length === 4 && target.players[0].score === target.players[1].score && target.players[0].score === target.players[2].score && target.players[0].score > target.players[3].score) {
        io.emit('advanceToWinner', "Players 1, 2, and 3 win!", target.players[0].score)
      } else if (target.players.length === 4 && target.players[0].score === target.players[1].score && target.players[0].score > target.players[2].score && target.players[0].score === target.players[3].score) {
        io.emit('advanceToWinner', "Players 1, 2, and 4 win!", target.players[0].score)
      } else if (target.players.length === 4 && target.players[0].score > target.players[1].score && target.players[0].score === target.players[2].score && target.players[0].score === target.players[3].score) {
        io.emit('advanceToWinner', "Players 1, 3, and 4 win!", target.players[0].score)
      } else if (target.players.length === 4 && target.players[1].score > target.players[0].score && target.players[1].score === target.players[2].score && target.players[1].score === target.players[3].score ) {
        io.emit('advanceToWinner', "Players 2, 3, and 4 win!", target.players[1].score)

      } else if (target.players.length === 4 && target.players[0].score === target.players[1].score && target.players[0].score === target.players[2].score && target.players[0].score === target.players[3].score) {
        io.emit('advanceToWinner', "It's a 4-way Tie!", target.players[0].score)
      }
    }
  })

  // Listen for time to serve questions
  const filteredQuestions = [];

  // Fisher-Yates shuffle algorithm
  const shuffle = (array) => {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  };

  // listen for request for questions
  let questionsSent = false;

  socket.on('sendQuestions', () => { 
    if (questionsSent === false) {
      console.log('Shuffling questions!')
      questionsSent = true;
      shuffle(sessionQuestions);
      for (let i = 0; i < (numberOfQuestions); i++) {filteredQuestions.push(sessionQuestions[i])}
    }
    console.log("Filtered questions: ", filteredQuestions)
    io.emit('filteredQuestions', filteredQuestions)
  })

  // listen for signal for nextQuestion
  socket.on('nextQuestion', () => {io.emit('nextQuestion')})

    // listen for removeWrongAnswers
    socket.on('removeWrongAnswer', (thisAnswer, room) => {
      io.emit('removeWrongAnswer', thisAnswer, room)})

    // listen for correct answers
    socket.on('100Player', (id, code) => {
      const target = rooms.find(room => room.code === code);

      if (id == target.players[0].uuid) {
        target.players[0].score += 100
        io.emit('100Player1', target.players)}
      else if (id == target.players[1].uuid) {
        target.players[1].score += 100
        io.emit('100Player2', target.players)}
      else if (id == target.players[2].uuid) {
        target.players[2].score += 100
        io.emit('100Player3', target.players)}
      else if (id == target.players[3].uuid) {
        target.players[3].score += 100
        io.emit('100Player4', target.players)}        
    })

    // listen for incorrect answers
    socket.on('minus75Player', (id, code) => {
      const target = rooms.find(room => room.code === code);
      if (id == target.players[0].uuid) {
        target.players[0].score -= 75
        io.emit('minus75Player1', target.players)}
      else if (target.players[0].uuid.length !== 0 && id == target.players[1].uuid) {
        target.players[1].score -= 75
        io.emit('minus75Player2', target.players)}
      else if (target.players[0].uuid.length !== 0 && id == target.players[2].uuid) {
        target.players[2].score -= 75
        io.emit('minus75Player3', target.players)}
      else if (target.players[0].uuid.length !== 0 && id == target.players[3].uuid) {
        target.players[3].score -= 75
        io.emit('minus75Player4', target.players)}
    })
});

const PORT = process.env.PORT || 3009;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));