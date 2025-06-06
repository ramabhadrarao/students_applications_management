// File: backend/models/programCertificateRequirementModel.js
// Purpose: Model for program-specific certificate requirements

import mongoose from 'mongoose';

const programCertificateRequirementSchema = mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    certificateTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateType',
      required: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Create compound unique index to prevent duplicate requirements
programCertificateRequirementSchema.index({ programId: 1, certificateTypeId: 1 }, { unique: true });

// Additional indexes
programCertificateRequirementSchema.index({ programId: 1, isActive: 1 });
programCertificateRequirementSchema.index({ certificateTypeId: 1 });

const ProgramCertificateRequirement = mongoose.model('ProgramCertificateRequirement', programCertificateRequirementSchema);

export default ProgramCertificateRequirement;