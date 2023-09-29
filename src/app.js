const path = require('path');
const express = require('express');
const http = require('http');
// const socketIO = require('socket.io');
const mongoose=require('mongoose')
const uri = "mongodb+srv://ritiksingh7870:blue@myapp.alswwng.mongodb.net/?retryWrites=true&w=majority";
const app = express();
const axios=require('axios');
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(uri);
const Room = require('./recData');
let stream = require( '../public/ws/stream' );
const storedData=require('./dataStore')
const fse = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { log, error } = require('console');
app.use(cors());
const https=require('https')

app.use(bodyParser.json());
app.use(express.json());
const port = process.env.PORT || 3000;
const basePath = path.join(__dirname, '../public');


app.use(express.static(basePath));
const privateKey = fse.readFileSync('./public/ssl/private.key', 'utf8');
const certificate = fse.readFileSync('./public/ssl/certificate.crt', 'utf8');



const credentials = {
  key: privateKey,
  cert: certificate
};

const server = https.createServer(credentials,app);
let io = require( 'socket.io' )( server );

app.get('/save-json',(req,res)=>{
 
  console.log("jsonData")
})



app.post('/api/saveData', async (req, res) => {
  const roomName = req.body.roomName;
  const username = req.body.username;
  const gender = req.body.genderData;
  const Attentative = req.body.Attentative;
  const Non_Attentative = req.body.Non_Attentative;
  const facialData = req.body.facialData;

  try {
    // Find the room by roomName
    let room = await Room.findOne({ roomName: roomName });

    if (!room) {
      // If the room doesn't exist, create it and add the user
      room = new Room({
        roomName: roomName,
        users: [{ username: username, gender: gender, Attentative: Attentative, Non_Attentative: Non_Attentative, facialData: [facialData] }]
      });

      await room.save();
      console.log('Room created and user data added.');
    } else {
      // Check if the username data already exists in the room
      const existingUser = room.users.find((user) => user.username === username);

      if (!existingUser) {
        // If the username data doesn't exist, add it
        room.users.push({ username: username, gender: gender, Attentative: Attentative, Non_Attentative: Non_Attentative, facialData: [facialData] });
        await room.save();
        console.log('User data added to an existing room.');
      } else {
        // Append data to the existing user
        existingUser.facialData.push(facialData); // Append the new facialData to the existing user's facialData array
        await room.save();
        console.log('Facial data appended to the existing user in the room.');
      }
    }

    res.status(200).json({ message: 'Data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






io.of('/stream').use((socket, next) => {
  // Get roomName from the socket handshake query
  const roomName = socket.handshake.query.roomName;

  // You can now use the 'roomName' variable within this middleware
  socket.roomName = roomName;

  // Continue with the socket connection
  next();
});
io.of( '/stream' ).on( 'connection', stream );
app.get((req,res)=>{
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
})

mongoose.connect(uri)
  .then(()=>{
    server.listen(port, () => {
      console.log('Connected to Database & Server started on port ' + port);
    });
  })
  .catch((error)=>{
    console.log(`Unable connect to database ${error}`);
  })