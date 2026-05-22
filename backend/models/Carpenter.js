import mongoose from 'mongoose';

const CarpenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Carpenter name is required'],
    trim: true,
    minlength: [1, 'Name cannot be empty']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+91)?[6-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid Indian phone number!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Carpenter', CarpenterSchema);
