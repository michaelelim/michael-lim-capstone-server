const http = require('http');
const express = require('express');            
const socket = require('socket.io')
const app = express();
const server = http.createServer(app)
const io = socket(server)
const axios = require('axios')
const bodyParser = require('body-parser');
app.use(bodyParser.json())

// let player1 = ""
// let player2 = 'JOIN NOW!'

// let p1 = []
// let p2 = []
let rooms = [];
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

  socket.on('userName', (name, clientId, code) => {
    // name: 'mike'
    // clientId: 'abc12356',
    // room: 'ROOM
    //
    // if room doesn't exist, create new room
    // if room already exists, check the players array within the existing room
      // if the length is 2, do not allow entry
      // if the length is 0 or 1, allow entry

    const newPlayer = { name, score: 0, uuid: clientId };
    if (!rooms.some(room => room.code === code)) {
      const newRoom = { code, players: [newPlayer] };
      rooms.push(newRoom);
      socket.join(code);
      io.emit('p1Broadcast', newPlayer);
    } else {
      const target = rooms.find(room => room.code === code);
      if (target.players.length < 2) { target.players.push(newPlayer) } ;
      socket.join(code);
      io.emit('p2Broadcast', newPlayer);
    }

    console.log('rooms', rooms)
    
    // [
    //   {
    //     code: 'ABC',
    //     players: [
    //       {
    //         name: 'firstplayer',
    //         score: 0,
    //         uuid: 'xyz123'
    //       },
    //       {
    //         name: 'secondplayer',
    //         score: 0,
    //         uuid: 'xyx987'
    //       },
    //     ]
    //   }
    // ]
  })
});

const PORT = 3009 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));