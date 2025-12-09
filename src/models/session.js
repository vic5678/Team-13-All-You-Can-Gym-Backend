import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true,
    },
    dateTime: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    trainerName: {
        type: String,
        required: true,
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],          // <- this makes it optional & empty by default
    },
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

export default Session;