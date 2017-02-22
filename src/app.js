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
  sock.join('room1');

  sock.square = {
    hash: xxh.h32(`${sock.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),
    x: Math.floor(Math.random() * (500 - 50)) + 50,
    y: Math.floor(Math.random() * (500 - 50)) + 50,
    r: 150,
    g: 0,
    b: 0,
    height: 100,
    width: 100,
  };

  sock.emit('joined', sock.square);

  sock.on('update', (data) => {
    sock.square = data;
    sock.square.lastUpdate = new Date().getTime();
	sock.broadcast.to('room1').emit('updatedColor', sock.square);
  });

  sock.on('disconnect', () => {
    io.sockets.in('room1').emit('disconnect', sock.square.hash);

    sock.leave('room1');
  });
});

console.log(`Listening on port: ${port}`);
