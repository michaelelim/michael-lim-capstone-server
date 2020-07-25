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
let p1 = {name: "", id: "", score: 0, room: ""}
let p2 = {name: "", id: "", score: 0, room: ""}

const sessionQuestions = []

//== SETTINGS == 
const questions = require('./questions.json'); //JSON
let numberOfQuestions = 5; // SET NUMBER OF QUESTIONS

io.on('connection', (socket) => {
  console.log('New PLAYER connected!: ', socket.id);
  
  socket.on('disconnect', () => {console.log("A player has left");}) 

  // Listen for room
  socket.on('roomName', (room) => {
    io.emit('roomName', room) // Broadcast to everyone
    theRoom = room
    socket.join(room)
  })

  // Listen for name using algorithm
  socket.on('name1', (name, clientId) => {
    if (name !== null && player1 === "" && player1 !== name) {
      player1 = name      

      p1.name = player1
      p1.id = clientId
      p1.score = 0
      p1.room = theRoom
      console.log(p1)

      io.emit('name1Broadcast', player1)
      io.emit('p1Broadcast', p1)
    } 
    else if (name !== null && player2 === "JOIN NOW!" && player1 !== name) {
      player2 = name
      
      p2.name = player2
      p2.id = clientId
      p1.score = 0
      p2.room = theRoom
      console.log(p2)

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

  // Listen for advance button - WIP!!
  socket.on('advanceButton', (item, room) => {
    if (item === "goToInstructions") {
      io.emit('advanceToInstructions', item)
    //   axios
    //   .get('https://opentdb.com/api.php?amount=5&type=multiple')
    //   .then(res => {
    //     const newArr = []
    //     res.data.results.map(item => {
    //       sessionQuestions.push({
    //         ""
    //       })}
    //     )
    //     return(sessionQuestions)
    //   })
    //   .catch(err => {console.log(err)})
    }
    if (item === "goToQuestionIntro") {io.emit('advanceToQuestionIntro', item)}
    if (item === "goToQuestions") {io.emit('advanceToQuestions', item)}
    if (item === "goToWinner") {io.emit('advanceToWinner', item)}
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
      shuffle(questions);
      // shuffle(sessionQuestions);
      // for (let i = 0; i < (numberOfQuestions + 1); i++) {filteredQuestions.push(sessionQuestions[i])}
      for (let i = 0; i < (numberOfQuestions + 1); i++) {filteredQuestions.push(questions[i])}
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
    if (id.clientId == p1.id) {
      p1.score += 100
      io.emit('100Player1', p1.name)}
    else if (id.clientId == p2.id) {
      p2.score += 100
      io.emit('100Player2', p2.name)}
  })

  // listen for incorrect answers
  socket.on('minus75Player', (id) => {
    if (id.clientId == p1.id) {
      p1.score -= 75
      io.emit('minus75Player1', p1.name)}
    else if (id.clientId == p2.id) {
      p2.score -= 75
      io.emit('minus75Player2', p2.name)}
  })
})

const PORT = process.env.PORT || 3009;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))