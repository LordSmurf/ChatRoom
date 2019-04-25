const path = require('path') // Imports path module
const http = require('http') // Imports http module
const express = require('express') // Imports Express Server
const socketio = require('socket.io') // Imports Socket.io
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express() // Defines app as Express Server
const server = http.createServer(app) // Defines server as http func
const io = socketio(server) // Defines io as http server

const port = process.env.PORT || 3000 // Sets port to env.PORT or 3000 default
const publicDirectoryPath = path.join(__dirname, '../Public') // Sets public directory

app.use(express.static(publicDirectoryPath)) // Sets the public directory on server

io.on('connection', (socket) => {
    console.log('New WebSocket connection!') // Logs new socket connection

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} Has joined the room!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


        callback()
    })

    socket.on('notifyTyping', data => {
        typing.innerText = data.user + '' + data.message;
        console.log(data.user + data.message)
    })

    socket.on('notifyStopTyping', () => {
        typing.innerText = ''
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback('')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the room!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })



})

server.listen(port, () => console.log(`Chatroom listening on port: ${port}!`)) // Listens to the server for traffic