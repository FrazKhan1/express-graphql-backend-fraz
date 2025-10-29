const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'cancelled'], 
        default: 'scheduled' 
    },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

AppointmentSchema.pre('save', function(next) {
    if (this.endTime <= this.startTime) {
        return next(new Error('End time must be after start time'));
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

