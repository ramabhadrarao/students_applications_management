import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const applicationSchema = mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'frozen'],
      default: 'draft',
    },
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    approvalComments: String,
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    aadharNumber: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    parentMobile: {
      type: String,
      trim: true,
    },
    guardianMobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    presentAddress: {
      doorNo: String,
      street: String,
      village: String,
      mandal: String,
      district: String,
      pincode: String,
    },
    permanentAddress: {
      doorNo: String,
      street: String,
      village: String,
      mandal: String,
      district: String,
      pincode: String,
    },
    religion: String,
    caste: String,
    reservationCategory: {
      type: String,
      enum: ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST', 'EWS', 'PH'],
      default: 'OC',
    },
    isPhysicallyHandicapped: {
      type: Boolean,
      default: false,
    },
    sadaramNumber: String,
    identificationMarks: [String],
    specialReservation: String,
    meesevaDetails: {
      casteCertificate: String,
      incomeCertificate: String,
    },
    rationCardNumber: String,
    photoAttachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FileUpload',
    },
    signatureAttachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FileUpload',
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

// Add pagination plugin
applicationSchema.plugin(mongoosePaginate);

// Create indexes
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ userId: 1, programId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ academicYear: 1 });
applicationSchema.index({ programId: 1, status: 1 });
applicationSchema.index({ status: 1, programId: 1 });
applicationSchema.index({ academicYear: 1, status: 1 });
applicationSchema.index({ programId: 1, academicYear: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;