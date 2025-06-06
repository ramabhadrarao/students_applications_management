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
      required: true, // Branch BCA/BBA is selected from Program model
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

    // Student personal details
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    aadharNumber: { type: String, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    parentMobile: { type: String, trim: true },
    guardianMobile: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    religion: String,
    caste: String,
    reservationCategory: {
      type: String,
      enum: ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST', 'EWS', 'PH'],
      default: 'OC',
    },

    // Intermediate details
    interBoard: { type: String, trim: true },
    interHallTicketNumber: { type: String, trim: true },
    sscHallTicketNumber: { type: String, trim: true },
    interPassYear: { type: Number },
    interPassoutType: { type: String, enum: ['Regular', 'Supplementary', 'Improvement', 'Other'] },
    bridgeCourse: { type: String, trim: true },
    interCourseName: { type: String, trim: true },
    interMedium: { type: String, trim: true },
    interSecondLanguage: { type: String, trim: true },
    interMarksSecured: { type: Number },
    interMaximumMarks: { type: Number },
    interLanguagesTotal: { type: Number },
    interLanguagesPercentage: { type: Number },
    interGroupSubjectsPercentage: { type: Number },
    interCollegeName: { type: String, trim: true },

    // Address
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

    // Other Info
    identificationMarks: [String],
    specialReservation: { type: String }, // CAP / SPORTS / NCC / etc.
    isPhysicallyHandicapped: { type: Boolean, default: false },
    sadaramNumber: { type: String },
    meesevaDetails: {
      casteCertificate: String,
      incomeCertificate: String,
    },
    rationCardNumber: { type: String },
    oamdcNumber: { type: String, trim: true },

    // Study history (last 7 years)
    studyDetails: [
      {
        className: { type: String }, // 12th, 11th, etc.
        placeOfStudy: { type: String },
        institutionName: { type: String },
      },
    ],

    // Attachments
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

applicationSchema.plugin(mongoosePaginate);

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
