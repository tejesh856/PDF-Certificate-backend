const mongoose = require("mongoose");
const { Schema } = mongoose;
const studentschema = new Schema({
  name: {
    type: String,
    required: true,
  },
  certificates: {
    type: [
      {
        course: {
          type: String,
          required: true,
        },
        certificatedate: {
          type: String,
          required: true,
        },
        certificatelink: {
          type: String,
          default: null,
        },
      },
    ],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});
module.exports = mongoose.model("student", studentschema);
