import mongoose from 'mongoose';

const gymAdminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gyms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gym' }],
}, { timestamps: true });

const GymAdmin = mongoose.model('GymAdmin', gymAdminSchema);

export default GymAdmin;
