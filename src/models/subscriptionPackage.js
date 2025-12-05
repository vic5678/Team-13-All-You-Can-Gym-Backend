import mongoose from 'mongoose';

const subscriptionPackageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    sessionLimit: {
        type: Number,
        required: true
    },
    gymLimit:{
        type: String,
        required: true
    }
}, { timestamps: true });

const SubscriptionPackage = mongoose.model('SubscriptionPackage', subscriptionPackageSchema);

export default SubscriptionPackage;