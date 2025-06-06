import mongoose from 'mongoose';

const applicationStatusHistorySchema = mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    fromStatus: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'frozen'],
    },
    toStatus: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'frozen'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
    dateCreated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Create indexes
applicationStatusHistorySchema.index({ applicationId: 1 });
applicationStatusHistorySchema.index({ fromStatus: 1, toStatus: 1 });

const ApplicationStatusHistory = mongoose.model('ApplicationStatusHistory', applicationStatusHistorySchema);

export default ApplicationStatusHistory;