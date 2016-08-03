
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//on a get request, send index.html
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

//array of users for online status
var users = [];

// on any connection...
io.on('connection', function(socket) {

  users.push({user: null, socket: socket.id});

  //send user connected message to all users
  io.emit('chat message', {user: 'System', msg: 'a user connected...'});

  //when a chat message is received, send to all users (including sender)
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });

  //when a typing state changes for a user: send to everyone but sender
  socket.on('typing state change', function(msg) {
    socket.broadcast.emit('typing state change', msg);
  });

  //on user disconnect, send a message to all users
  socket.on('disconnect', function() {
    io.emit('chat message', {user: 'System', msg: 'a user disconnected...'});

    //search for user by socket.id and remove from users array
    for (var j = 0; j < users.length; j++) {
      if (users[j].socket === socket.id) {
        io.emit('user online', {user: users[j].user, online: false});
        users.splice(j, 1);
        break;
      }
    }

  });

  //emit message for new user coming online
  socket.on('user online', function(msg) {
    if (msg.online) {
      //search for socket id in order to update the user property of the correct object in users
      for (var i = 0; i < users.length; i++) {
        if (users[i].socket === socket.id) {
          users[i].user = msg.user;
          break;
        }
      }
      io.emit('user online', {user: msg.user, online: true});
    }
  });

  //on user connection, send all users currently online
  users.forEach(function(user) {
    if (user.user !== null) {
      socket.emit('user online', {user: user.user, online: true});
    }
  });

});

//listen on port 3001
http.listen(3001, function() {
  console.log('Listening on port 3001...');
});
