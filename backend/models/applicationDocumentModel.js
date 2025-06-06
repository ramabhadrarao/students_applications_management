import mongoose from 'mongoose';

const applicationDocumentSchema = mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    certificateTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateType',
      required: true,
    },
    fileUploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FileUpload',
      required: true,
    },
    documentName: String,
    remarks: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    verificationRemarks: String,
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

// Create compound unique index
applicationDocumentSchema.index({ applicationId: 1, certificateTypeId: 1 }, { unique: true });

// Create additional indexes
applicationDocumentSchema.index({ applicationId: 1 });
applicationDocumentSchema.index({ isVerified: 1 });
applicationDocumentSchema.index({ applicationId: 1, isVerified: 1 });

const ApplicationDocument = mongoose.model('ApplicationDocument', applicationDocumentSchema);

export default ApplicationDocument;