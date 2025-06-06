// User types
export type UserRole = 'admin' | 'program_admin' | 'student';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  programId?: string;
  lastLogin?: Date;
  dateCreated: Date;
}

export interface UserProfile {
  userId: string;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  photo?: string;
}

// Program types
export interface Program {
  _id: string;
  programCode: string;
  programName: string;
  programType: 'UG' | 'PG' | 'Diploma' | 'Certificate';
  department: string;
  durationYears: number;
  totalSeats: number;
  applicationStartDate?: Date;
  applicationEndDate?: Date;
  programAdminId?: string;
  eligibilityCriteria?: string;
  feesStructure?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  dateCreated: Date;
  dateUpdated: Date;
}

// Certificate types
export interface CertificateType {
  _id: string;
  name: string;
  description?: string;
  fileTypesAllowed: string;
  maxFileSizeMb: number;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}

// Program certificate requirements
export interface ProgramCertificateRequirement {
  _id: string;
  programId: string;
  certificateTypeId: string;
  isRequired: boolean;
  specialInstructions?: string;
  displayOrder: number;
}

// Application types
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'frozen';

export interface Application {
  _id: string;
  applicationNumber: string;
  userId: string;
  programId: string;
  academicYear: string;
  status: ApplicationStatus;
  submittedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvalComments?: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  aadharNumber?: string;
  mobileNumber: string;
  parentMobile?: string;
  guardianMobile?: string;
  email: string;
  presentAddress?: {
    doorNo?: string;
    street?: string;
    village?: string;
    mandal?: string;
    district?: string;
    pincode?: string;
  };
  permanentAddress?: {
    doorNo?: string;
    street?: string;
    village?: string;
    mandal?: string;
    district?: string;
    pincode?: string;
  };
  religion?: string;
  caste?: string;
  reservationCategory?: string;
  isPhysicallyHandicapped: boolean;
  sadaramNumber?: string;
  identificationMarks?: string[];
  specialReservation?: string;
  meesevaDetails?: {
    casteCertificate?: string;
    incomeCertificate?: string;
  };
  rationCardNumber?: string;
  photoAttachmentId?: string;
  signatureAttachmentId?: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface ApplicationDocument {
  _id: string;
  applicationId: string;
  certificateTypeId: string;
  fileUploadId: string;
  documentName?: string;
  remarks?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationRemarks?: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface ApplicationEducationDetail {
  _id: string;
  applicationId: string;
  educationLevelId: string;
  hallTicketNumber?: string;
  institutionName: string;
  boardUniversityName?: string;
  courseName?: string;
  specialization?: string;
  mediumOfInstruction?: string;
  passYear: string;
  passoutType?: 'Regular' | 'Supplementary' | 'Betterment' | 'Compartment';
  marksObtained?: number;
  maximumMarks?: number;
  percentage?: number;
  cgpa?: number;
  grade?: string;
  subjectMarks?: Record<string, number>;
  languagesStudied?: string;
  secondLanguage?: string;
  bridgeCourse?: string;
  gapYearReason?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationRemarks?: string;
  displayOrder: number;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface EducationLevel {
  _id: string;
  levelCode: string;
  levelName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ApplicationReview {
  _id: string;
  applicationId: string;
  reviewerId: string;
  reviewStage: 'initial' | 'committee' | 'final';
  academicScore?: number;
  extracurricularScore?: number;
  interviewScore?: number;
  overallScore?: number;
  recommendation: 'approve' | 'reject' | 'waitlist' | 'requires_discussion';
  comments?: string;
  reviewDate: Date;
  isFinal: boolean;
}

export interface ApplicationStatusHistory {
  _id: string;
  applicationId: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedBy?: string;
  remarks?: string;
  dateCreated: Date;
}

export interface FileUpload {
  _id: string;
  uuid: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  description?: string;
  uploadedBy?: string;
  uploadDate: Date;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  dateCreated: Date;
}

export interface AcademicYear {
  _id: string;
  yearCode: string;
  yearName: string;
  startDate: Date;
  endDate: Date;
  applicationStartDate?: Date;
  applicationEndDate?: Date;
  isCurrent: boolean;
  isActive: boolean;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface SystemSettings {
  _id: string;
  applicationEnabled: boolean;
  maintenanceMode: boolean;
  maxFileSizeMb: number;
  allowedFileTypes: string;
  applicationInstructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  academicYearCurrent?: string;
  currentAcademicYearId?: string;
  autoApproveApplications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  siteName: string;
  siteLogo?: string;
  applicationStartDate?: Date;
  applicationEndDate?: Date;
  enableOnlinePayments: boolean;
  paymentGateway?: string;
  applicationFeeAmount?: number;
  lateFeeAmount?: number;
  enableEmailNotifications: boolean;
  emailFromAddress?: string;
  emailFromName?: string;
  dateCreated: Date;
  dateUpdated: Date;
}