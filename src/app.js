const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const xxh = require('xxhashjs');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (request, response) => {
  fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
    if (err) {
      throw err;
    }
    response.writeHead(200);
    response.end(data);
  });
};

const app = http.createServer(handler);

const io = socketio(app);

app.listen(port);

io.on('connection', (socket) => {
  const sock = socket;
  socket.join('room1');

  sock.square = {
    hash: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),
    x: Math.floor(Math.random() * (500 - 50)) + 50,
    y: Math.floor(Math.random() * (500 - 50)) + 50,
    r: 150,
    g: 0,
    b: 0,
    height: 100,
    width: 100,
  };

  socket.emit('joined', socket.square);

  socket.on('colorUpdate', (data) => {
    sock.square = data;
    sock.square.lastUpdate = new Date().getTime();
    socket.broadcast.to('room1').emit('updatedColor', socket.square);
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', sock.square.hash);

    socket.leave('room1');
  });
});

console.log(`Listening on port: ${port}`);
