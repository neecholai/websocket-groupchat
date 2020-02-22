/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require('./Room');

// Get Dad Joke helper function
const getJoke = require('./helpers/getJoke');

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** make chat: store connection-device, rooom */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** send msgs to this client using underlying connection-send-function */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** handle joining: add to room members, announce join */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} joined "${this.room.name}".`
    });
  }

  /** handle a chat: broadcast to room. */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: 'chat',
      text: text
    });
  }

  /** handle command to display a joke to user. */

  async handleJoke() {
    const joke = await getJoke();
    const data = {
      type: 'note',
      text: joke
    };
    this.send(JSON.stringify(data));
  }

  /** handle command to list all members in chat room. */


  handleListMembers() {
    const memberList = [...this.room.members]
      .map(member => member.name)
      .join('<br>');
    const data = {
      type: 'note',
      text: `<b>Members in this room:</b> <br> ${memberList}`
    }
    this.send(JSON.stringify(data));
  }

  /** handle command to send a private message. */

  handlePrivateMessage(text) {
    const [_, toUser, ...msgWords] = text.split(' ');
    const msg = msgWords.join(' ');
    const data = {
      name: this.name,
      type: 'chat',
      text: `<i>private message:</i> ${msg}`
    }
    let members = this.room.members;
    let userInRoom = [...members].find(member => member.name === toUser)
    if (userInRoom) {
      this.send(JSON.stringify(data));
      userInRoom.send(JSON.stringify(data));
    }
  }

  /** handle command to send a private message. */

  handleNameChange(text) {
    const name = text.split(' ')[1];
    const data = {
      type: 'note',
      text: `${this.name} changed their username to ${name}`
    }
    this.room.broadcast(data);
    this.name = name;
  }

  /** Handle messages from client:
   *
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   */

  handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);

    if (msg.type === 'join') this.handleJoin(msg.name);
    else if (msg.type === 'chat') this.handleChat(msg.text);
    else if (msg.type === 'joke') this.handleJoke();
    else if (msg.type === 'members') this.handleListMembers();
    else if (msg.type === 'privateMessage') this.handlePrivateMessage(msg.text);
    else if (msg.type === 'newName') this.handleNameChange(msg.text);
    else throw new Error(`bad message: ${msg.type}`);
  }

  /** Connection was closed: leave room, announce exit to others */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} left ${this.room.name}.`
    });
  }
}

module.exports = ChatUser;