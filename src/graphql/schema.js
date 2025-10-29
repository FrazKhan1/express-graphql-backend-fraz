const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    email: String!
    name: String
    role: String
    createdAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    status: AppointmentStatus!
    clientName: String!
    clientEmail: String!
    location: String
    notes: String
    createdAt: String
    updatedAt: String
  }

  enum AppointmentStatus {
    scheduled
    completed
    cancelled
  }

  input CreateAppointmentInput {
    title: String!
    description: String
    startTime: String!
    endTime: String!
    clientName: String!
    clientEmail: String!
    location: String
    notes: String
    status: AppointmentStatus
  }

  input UpdateAppointmentInput {
    title: String
    description: String
    startTime: String
    endTime: String
    clientName: String
    clientEmail: String
    location: String
    notes: String
    status: AppointmentStatus
  }

  type Query {
    me: User
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
  }

  type Mutation {
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: ID!): Boolean!
  }
`;
