import mongoose from 'mongoose';

const programSchema = mongoose.Schema(
  {
    programCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    programName: {
      type: String,
      required: true,
      trim: true,
    },
    programType: {
      type: String,
      enum: ['UG', 'PG', 'Diploma', 'Certificate'],
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    durationYears: {
      type: Number,
      required: true,
    },
    totalSeats: {
      type: Number,
      default: 0,
    },
    applicationStartDate: Date,
    applicationEndDate: Date,
    programAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    eligibilityCriteria: String,
    feesStructure: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    dateCreated: {
      type: Date,
      default: Date.now,
    },
    dateUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
programSchema.index({ programCode: 1 });
programSchema.index({ programType: 1, isActive: 1 });
programSchema.index({ programType: 1, isActive: 1, displayOrder: 1 });

const Program = mongoose.model('Program', programSchema);

export default Program;