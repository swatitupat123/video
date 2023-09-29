const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    // unique: true,
    required: true, // You might want to require the username to be provided
  },
  gender:String,
  Attentative: {
    type: Number,
    require: true,
  },
  Non_Attentative: {
    type: Number,
    require: true,
  },
  facialData: [String],
});

const roomSchema = new Schema({
  roomName: String,
  users: [userSchema], // Embed user documents
});

// Set the username field as the _id field
// userSchema.set('toJSON', {
//   virtuals: true,
//   transform: function (doc, ret) {
//     ret.id = ret.username;
//     delete ret._id;
//     delete ret.username;
//     delete ret.__v;
//   },
// });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;