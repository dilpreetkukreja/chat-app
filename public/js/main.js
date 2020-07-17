const socket = io({
  transports: ["websocket"],
  upgrade: false,
});
setInterval(function () {
  socket.emit("keep-alive", null);
}, 20 * 1000);
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
socket.emit("user-details", { username: username, room: room });
const chat_messages = document.querySelector(".chat-messages");
const chat_form = document.getElementById("chat-form");
const room_name = document.getElementById("room-name");
const users = document.getElementById("users");
chat_form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = event.target.elements.msg.value;
  //Emitting message to server
  socket.emit("client-message", message);
  event.target.elements.msg.value = "";
  event.target.elements.msg.focus();
});

socket.on("users", (clients) => {
  console.log(clients);
  users.innerHTML = clients
    .map((client) => {
      return `<li>${client}</li>`;
    })
    .join("");
});

socket.on("room", (room) => {
  room_name.innerHTML = room;
});

socket.on("message", (data) => {
  //   console.log(data);

  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${data.username}<span> ${data.time}</span></p>
  <p class="text">
    ${data.text}
  </p>`;
  chat_messages.appendChild(div);
  chat_messages.scrollTop = chat_messages.scrollHeight;
  //   room_name.innerHTML = data.room_name;
});

socket.on("disconnectMessage", (data) => {
  console.log(data);

  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${data.username}<span> ${data.time}</span></p>
    <p class="text">
      ${data.text}
    </p>`;
  chat_messages.appendChild(div);
  chat_messages.scrollTop = chat_messages.scrollHeight;
});
