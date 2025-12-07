import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    isSubscribed: {
        type: Boolean,
        default: false,
    },
    packageID: {
        type: String,
        default: null,
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // 👇 NEW FIELD (used by your booking service)
    bookedSessions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Session',
        },
      ],
      default: [],          // <- crucial: no need to send it on create
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;