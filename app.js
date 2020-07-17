const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const mongoose = require("mongoose");
const moment = require("moment");
var environment = process.env.NODE_ENV || "development";
if (environment === "development") {
  require("dotenv").config();
}
const DATABASE_URL = process.env.MONGODB_URL;

const User = require("./models/user.js");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    server.listen(PORT, () => {
      console.log(`Server listening on port:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

const botName = "ChatBot";

io.set("transports", ["websocket"]);
io.on("connection", (socket) => {
  //   const user_id = socket.id;
  console.log(`New connection (${socket.id}) is received!`);
  //Sending welcome message to connected user only

  socket.on("keep-alive", (data) => {
    // console.log("Keeping client connection alive..");
  });
  socket.on("user-details", (userData) => {
    socket.join(userData.room);
    //adding user to users array
    // const user = users.addUser({
    //   ...userData,
    //   id: socket.id,
    // });
    const user = new User({ socket_id: socket.id, ...userData });
    user
      .save()
      .then((user) => {
        socket.emit("message", {
          text: `Hello ${user.username}, Welome to Real time chat app!`,
          username: botName,
          time: moment().format("h:mm a"),
        });
        socket.broadcast.to(user.room).emit("message", {
          text: `${user.username} has joined!`,
          username: botName,
          time: moment().format("h:mm a"),
        });
        io.to(user.room).emit("room", user.room);
        User.find({ room: user.room })
          .then((users) => {
            let users_names = users.map((user) => {
              return user.username;
            });
            io.to(user.room).emit("users", users_names);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });

    User.find({ room: userData.room })
      .then((users) => {
        io.to(userData.room).emit("users", users);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  //Receiving client message event
  socket.on("client-message", (msg) => {
    //send message to all users including the sender of message
    // console.log(users.getUser(socket.id));
    // const username = users.getUser(socket.id)[0].username;
    // console.log(username);
    User.findOne({ socket_id: socket.id })
      .then((user) => {
        io.to(user.room).emit("message", {
          text: msg,
          username: user.username,
          time: moment().format("h:mm a"),
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  //disconnecting client
  socket.on("disconnect", () => {
    console.log(`${socket.id} user is disconnected`);
    // console.log(users.getUser(socket.id));
    // const username = users.getUser(socket.id)[0].username;
    // console.log(username);
    User.findOne({ socket_id: socket.id })
      .then((user) => {
        User.find({ room: user.room })
          .then((users) => {
            console.log(users);
            let users_names = users.map((user) => {
              return user.username;
            });
            io.to(user.room).emit("users", users_names);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
    User.findOneAndRemove({ socket_id: socket.id })
      .then((user) => {
        socket.broadcast.to(user.room).emit("disconnectMessage", {
          text: `${user.username} has left the room!`,
          username: "ChatBot",
          time: moment().format("h:mm a"),
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
