import mongoose from 'mongoose';

const certificateTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    fileTypesAllowed: {
      type: String,
      default: 'pdf,jpg,jpeg,png',
    },
    maxFileSizeMb: {
      type: Number,
      default: 5,
    },
    isRequired: {
      type: Boolean,
      default: true,
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

certificateTypeSchema.index({ isActive: 1 });

const CertificateType = mongoose.model('CertificateType', certificateTypeSchema);

export default CertificateType;