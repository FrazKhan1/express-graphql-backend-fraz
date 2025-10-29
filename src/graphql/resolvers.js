const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const { jwtSecret, jwtExpiresIn } = require('../config');

function toUserDTO(userDoc) {
    if (!userDoc) return null;
    const { _id, email, name, role, createdAt } = userDoc;
    return { id: _id.toString(), email, name, role, createdAt };
}

function toAppointmentDTO(appointmentDoc) {
    if (!appointmentDoc) return null;
    const { _id, title, description, startTime, endTime, status, clientName, clientEmail, location, notes, createdAt, updatedAt } = appointmentDoc;
    return {
        id: _id.toString(),
        title,
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status,
        clientName,
        clientEmail,
        location,
        notes,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
    };
}

module.exports = {
    Query: {
        me: async (_, __, { user }) => {
            return user ? toUserDTO(user) : null;
        },
        appointments: async () => {
            const appointments = await Appointment.find().sort({ startTime: 1 });
            return appointments.map(toAppointmentDTO);
        },
        appointment: async (_, { id }) => {
            const appointment = await Appointment.findById(id);
            if (!appointment) throw new Error('Appointment not found');
            return toAppointmentDTO(appointment);
        }
    },
    Mutation: {
        register: async (_, { email, password, name }) => {
            const existing = await User.findOne({ email });
            if (existing) throw new Error('Email already in use');
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.create({ email, passwordHash, name });
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) throw new Error('Invalid credentials');
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) throw new Error('Invalid credentials');
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        },
        createAppointment: async (_, { input }) => {
            const { startTime, endTime, status = 'scheduled' } = input;
            
            // Validate date formats and end time is after start time
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }
            if (end <= start) {
                throw new Error('End time must be after start time');
            }

            try {
                const appointment = await Appointment.create({
                    ...input,
                    startTime: start,
                    endTime: end,
                    status
                });
                
                // Verify the appointment was saved by querying it back
                const savedAppointment = await Appointment.findById(appointment._id);
                if (!savedAppointment) {
                    throw new Error('Failed to save appointment to database');
                }
                
                return toAppointmentDTO(appointment);
            } catch (error) {
                // Enhanced error handling for database operations
                if (error.name === 'ValidationError') {
                    throw new Error(`Validation error: ${error.message}`);
                }
                throw error;
            }
        },
        updateAppointment: async (_, { id, input }) => {
            const appointment = await Appointment.findById(id);
            if (!appointment) throw new Error('Appointment not found');

            // Handle date updates if provided
            const updateData = { ...input };
            if (input.startTime) {
                updateData.startTime = new Date(input.startTime);
                if (isNaN(updateData.startTime.getTime())) {
                    throw new Error('Invalid startTime format');
                }
            }
            if (input.endTime) {
                updateData.endTime = new Date(input.endTime);
                if (isNaN(updateData.endTime.getTime())) {
                    throw new Error('Invalid endTime format');
                }
            }

            // Validate end time is after start time if both are being updated
            const finalStartTime = updateData.startTime || appointment.startTime;
            const finalEndTime = updateData.endTime || appointment.endTime;
            if (finalEndTime <= finalStartTime) {
                throw new Error('End time must be after start time');
            }

            const updated = await Appointment.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );
            return toAppointmentDTO(updated);
        },
        deleteAppointment: async (_, { id }) => {
            const appointment = await Appointment.findByIdAndDelete(id);
            if (!appointment) throw new Error('Appointment not found');
            return true;
        }
    }
};
