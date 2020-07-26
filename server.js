const http = require('http');
const express = require('express');            
const socket = require('socket.io')
const app = express();
const server = http.createServer(app)
const io = socket(server)
const axios = require('axios')
const bodyParser = require('body-parser');
app.use(bodyParser.json())

let player1 = ""
let player2 = 'JOIN NOW!'

let p1 = []
let p2 = []
// let p1 = {name: "", id: "", score: 0, room: ""}
// let p2 = {name: "", id: "", score: 0, room: ""}

let sessionQuestions = []
let numberOfQuestions = 5; // SET NUMBER OF QUESTIONS

io.on('connection', (socket) => {
  console.log('New PLAYER connected!: ', socket.id);
  
  socket.on('disconnect', () => {console.log("A player has left");}) 

  // // Listen for room
  // socket.on('roomName', (room) => {
  //   io.emit('roomName', room) // Broadcast to everyone
  //   theRoom = room
  //   socket.join(room)
  // })

  // Listen for name using algorithm
  socket.on('userName', (name, clientId, room) => {
  // socket.on('name1', (name, clientId) => {
    if (name !== null && player1 === "" && player1 !== name) {
      const p1Player = { name, clientId, room, score: 0}
      p1.push(p1Player)

      player1 = name      

      // p1.name = name
      // p1.id = clientId
      // p1.room = room
      // p1.score = 0
      console.log(p1)

      socket.join(room)

      io.emit('name1Broadcast', player1)
      io.emit('p1Broadcast', p1)
    } 
    else if (name !== null && player2 === "JOIN NOW!" && player1 !== name) {
      const p2Player = { name, clientId, room, score: 0}
      p2.push(p2Player)
      
      player2 = name
      
      // p2.name = player2
      // p2.id = clientId
      // p1.score = 0
      // p2.room = theRoom
      console.log(p2)

      socket.join(room)

      io.emit('name1Broadcast', player1)
      io.emit('name2Broadcast', player2)
      io.emit('p1Broadcast', p1)
      io.emit('p2Broadcast', p2)
    }
  })

  // listen for reiterate player names
  socket.on('listPlayers', () => {
    console.log("Reiterating player names: ", player1, player2)
    io.emit('name1Broadcast', player1)
    io.emit('name2Broadcast', player2)
    io.emit('p1Broadcast', p1)
    io.emit('p2Broadcast', p2)
  })

  // Listen for advance button
  socket.on('advanceButton', (item, room) => {
    if (item === "goToInstructions") {
      io.emit('advanceToInstructions', item)
      
      axios
        .get(`https://opentdb.com/api.php?amount=${numberOfQuestions}&type=multiple`)
        .then(res => {sessionQuestions = res.data.results})
        .catch(err => {console.log("Errors: ", err)})
    }
    if (item === "goToQuestionIntro") {io.emit('advanceToQuestionIntro', item)}
    if (item === "goToQuestions") {io.emit('advanceToQuestions', item)}
    
    if (item === "goToWinner") {
      if (!p2[0]) {
        io.emit('advanceToWinner', p1[0].name, p1[0].score)
      } else if (p1[0].score > p2[0].score) {
        io.emit('advanceToWinner', p1[0].name, p1[0].score)
      } else if (p1[0].score < p2[0].score) {
        io.emit('advanceToWinner', p2[0].name, p2[0].score)
      } else if (p1[0].score === p2[0].score) {
        io.emit('advanceToWinner', "It's a Tie!", p1[0].score)
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
    io.emit('filteredQuestions', filteredQuestions) //broadcast to all
  })

  // listen for signal for nextQuestion
  socket.on('nextQuestion', () => {io.emit('nextQuestion')})

  // listen for removeWrongAnswers
  socket.on('removeWrongAnswer', (thisAnswer) => {
    io.emit('removeWrongAnswer', thisAnswer)})

  // listen for correct answers
  socket.on('100Player', (id) => {
    // console.log("id: ", id)
    // console.log("id.clientId: ", id.clientId)
    // console.log("p1: ", p1)
    // console.log("p1[0].clientId: ", p1[0].clientId)
    if (id.clientId == p1[0].clientId) {
      p1[0].score += 100
      console.log("p1: ", p1)
      console.log("p2: ", p2)
      console.log("p1.score: ", p1[0].score)
      io.emit('100Player1', p1[0].name, p1[0].score)}
    else if (id.clientId == p2[0].clientId) {
      p2[0].score += 100
      console.log("p1.score: ", p1[0].score)
      io.emit('100Player2', p2[0].name, p2[0].score)}
  })

  // listen for incorrect answers
  socket.on('minus75Player', (id) => {
    if (id.clientId == p1[0].clientId) {
      p1[0].score -= 75
      console.log("p1.score: ", p1[0].score)
      io.emit('minus75Player1', p1[0].name, p1[0].score)}
    else if (p2[0].clientId.length !== 0 && id.clientId == p2[0].clientId) {
      p2[0].score -= 75
      console.log("p1.score: ", p1[0].score)
      io.emit('minus75Player2', p2[0].name, p2[0].score)}
  })

  socket.on('resetRoom', (room) => {
    console.log("p1 currently: ", p1)
    console.log("p2 currently: ", p2)
    console.log("Resetting room: ", room)

    isRoom = (theRoom) => {theRoom.name === room}

    const toRemoveP1 = p1.findIndex(isRoom)
    const toRemoveP2 = p2.findIndex(isRoom)
    
    p1.splice(toRemoveP1, 1)       
    p2.splice(toRemoveP2, 1)
    player1 = ""
    player2 = 'JOIN NOW!'

    console.log("p1 afterwards: ", p1)
    console.log("p2 afterwards: ", p2)
  })
})


const PORT = 3009 || process.env.PORT
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))