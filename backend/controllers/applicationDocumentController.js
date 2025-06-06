// File: backend/controllers/applicationDocumentController.js
// Purpose: Handle application document operations and verification

import asyncHandler from 'express-async-handler';
import ApplicationDocument from '../models/applicationDocumentModel.js';
import Application from '../models/applicationModel.js';
import CertificateType from '../models/certificateTypeModel.js';
import FileUpload from '../models/fileUploadModel.js';

// @desc    Get documents for an application
// @route   GET /api/applications/:applicationId/documents
// @access  Private
const getApplicationDocuments = asyncHandler(async (req, res) => {
  try {
    console.log(`📋 Fetching documents for application: ${req.params.applicationId}`);
    
    // Check if user has permission to view this application
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Permission check
    if (
      req.user.role !== 'admin' &&
      (req.user.role === 'program_admin' && 
       application.programId.toString() !== req.user.programId?.toString()) &&
      (req.user.role === 'student' && 
       application.userId.toString() !== req.user._id.toString())
    ) {
      res.status(403);
      throw new Error('Not authorized to access these documents');
    }
    
    const documents = await ApplicationDocument.find({ 
      applicationId: req.params.applicationId 
    })
      .populate('certificateTypeId', 'name description isRequired')
      .populate('fileUploadId', 'uuid filename originalName fileSize mimeType uploadDate')
      .populate('verifiedBy', 'email')
      .sort({ 'certificateTypeId.displayOrder': 1 });
    
    console.log(`✅ Found ${documents.length} documents`);
    res.json(documents);
  } catch (error) {
    console.error('❌ Error in getApplicationDocuments:', error);
    throw error;
  }
});

// @desc    Add document to application
// @route   POST /api/applications/:applicationId/documents
// @access  Private
const addApplicationDocument = asyncHandler(async (req, res) => {
  try {
    console.log(`📎 Adding document to application: ${req.params.applicationId}`);
    
    const { certificateTypeId, fileUploadId, documentName, remarks } = req.body;
    
    // Check if application exists and user has permission
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Students can only add documents to their own applications
    if (req.user.role === 'student' && application.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to add documents to this application');
    }
    
    // Verify certificate type exists
    const certificateType = await CertificateType.findById(certificateTypeId);
    if (!certificateType) {
      res.status(404);
      throw new Error('Certificate type not found');
    }
    
    // Verify file upload exists
    const fileUpload = await FileUpload.findById(fileUploadId);
    if (!fileUpload) {
      res.status(404);
      throw new Error('File upload not found');
    }
    
    // Check if document already exists for this certificate type
    const existingDocument = await ApplicationDocument.findOne({
      applicationId: req.params.applicationId,
      certificateTypeId
    });
    
    if (existingDocument) {
      res.status(400);
      throw new Error('Document for this certificate type already exists');
    }
    
    // Create application document
    const applicationDocument = await ApplicationDocument.create({
      applicationId: req.params.applicationId,
      certificateTypeId,
      fileUploadId,
      documentName: documentName || fileUpload.originalName,
      remarks
    });
    
    // Populate the created document
    const populatedDocument = await ApplicationDocument.findById(applicationDocument._id)
      .populate('certificateTypeId', 'name description isRequired')
      .populate('fileUploadId', 'uuid filename originalName fileSize mimeType uploadDate')
      .populate('verifiedBy', 'email');
    
    console.log(`✅ Document added: ${populatedDocument.documentName}`);
    res.status(201).json(populatedDocument);
  } catch (error) {
    console.error('❌ Error in addApplicationDocument:', error);
    throw error;
  }
});

// @desc    Update application document
// @route   PUT /api/applications/:applicationId/documents/:documentId
// @access  Private
const updateApplicationDocument = asyncHandler(async (req, res) => {
  try {
    console.log(`📝 Updating application document: ${req.params.documentId}`);
    
    const document = await ApplicationDocument.findById(req.params.documentId);
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    
    // Check application permission
    const application = await Application.findById(document.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Permission check
    if (
      req.user.role !== 'admin' &&
      (req.user.role === 'program_admin' && 
       application.programId.toString() !== req.user.programId?.toString()) &&
      (req.user.role === 'student' && 
       application.userId.toString() !== req.user._id.toString())
    ) {
      res.status(403);
      throw new Error('Not authorized to update this document');
    }
    
    // Students can only update basic fields
    if (req.user.role === 'student') {
      document.documentName = req.body.documentName || document.documentName;
      document.remarks = req.body.remarks || document.remarks;
      
      // If they're changing the file
      if (req.body.fileUploadId) {
        const fileUpload = await FileUpload.findById(req.body.fileUploadId);
        if (!fileUpload) {
          res.status(404);
          throw new Error('File upload not found');
        }
        document.fileUploadId = req.body.fileUploadId;
        document.isVerified = false; // Reset verification when file changes
        document.verifiedBy = undefined;
        document.verifiedAt = undefined;
        document.verificationRemarks = undefined;
      }
    } else {
      // Admins can update all fields including verification
      Object.keys(req.body).forEach(key => {
        if (key !== '_id' && key !== 'applicationId' && key !== 'dateCreated') {
          document[key] = req.body[key];
        }
      });
    }
    
    document.dateUpdated = Date.now();
    const updatedDocument = await document.save();
    
    // Populate the updated document
    const populatedDocument = await ApplicationDocument.findById(updatedDocument._id)
      .populate('certificateTypeId', 'name description isRequired')
      .populate('fileUploadId', 'uuid filename originalName fileSize mimeType uploadDate')
      .populate('verifiedBy', 'email');
    
    console.log(`✅ Document updated: ${populatedDocument.documentName}`);
    res.json(populatedDocument);
  } catch (error) {
    console.error('❌ Error in updateApplicationDocument:', error);
    throw error;
  }
});

// @desc    Verify application document
// @route   PUT /api/applications/:applicationId/documents/:documentId/verify
// @access  Private/Admin
const verifyApplicationDocument = asyncHandler(async (req, res) => {
  try {
    console.log(`✅ Verifying application document: ${req.params.documentId}`);
    
    const { isVerified, verificationRemarks } = req.body;
    
    const document = await ApplicationDocument.findById(req.params.documentId);
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    
    // Check application permission
    const application = await Application.findById(document.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Permission check - only admins and program admins can verify
    if (
      req.user.role !== 'admin' &&
      (req.user.role === 'program_admin' && 
       application.programId.toString() !== req.user.programId?.toString())
    ) {
      res.status(403);
      throw new Error('Not authorized to verify this document');
    }
    
    document.isVerified = isVerified;
    document.verifiedBy = req.user._id;
    document.verifiedAt = Date.now();
    document.verificationRemarks = verificationRemarks;
    document.dateUpdated = Date.now();
    
    const updatedDocument = await document.save();
    
    // Populate the updated document
    const populatedDocument = await ApplicationDocument.findById(updatedDocument._id)
      .populate('certificateTypeId', 'name description isRequired')
      .populate('fileUploadId', 'uuid filename originalName fileSize mimeType uploadDate')
      .populate('verifiedBy', 'email');
    
    console.log(`✅ Document verified: ${populatedDocument.documentName}`);
    res.json(populatedDocument);
  } catch (error) {
    console.error('❌ Error in verifyApplicationDocument:', error);
    throw error;
  }
});

// @desc    Delete application document
// @route   DELETE /api/applications/:applicationId/documents/:documentId
// @access  Private
const deleteApplicationDocument = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting application document: ${req.params.documentId}`);
    
    const document = await ApplicationDocument.findById(req.params.documentId);
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    
    // Check application permission
    const application = await Application.findById(document.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Permission check
    if (
      req.user.role !== 'admin' &&
      (req.user.role === 'program_admin' && 
       application.programId.toString() !== req.user.programId?.toString()) &&
      (req.user.role === 'student' && 
       application.userId.toString() !== req.user._id.toString())
    ) {
      res.status(403);
      throw new Error('Not authorized to delete this document');
    }
    
    await document.deleteOne();
    
    console.log(`✅ Document deleted: ${document.documentName}`);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('❌ Error in deleteApplicationDocument:', error);
    throw error;
  }
});

// @desc    Get document verification status for application
// @route   GET /api/applications/:applicationId/documents/verification-status
// @access  Private
const getDocumentVerificationStatus = asyncHandler(async (req, res) => {
  try {
    console.log(`📊 Getting document verification status for application: ${req.params.applicationId}`);
    
    // Check if user has permission to view this application
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    
    // Permission check
    if (
      req.user.role !== 'admin' &&
      (req.user.role === 'program_admin' && 
       application.programId.toString() !== req.user.programId?.toString()) &&
      (req.user.role === 'student' && 
       application.userId.toString() !== req.user._id.toString())
    ) {
      res.status(403);
      throw new Error('Not authorized to access this application');
    }
    
    // Get all required certificate types for the program
    const requiredCertificates = await CertificateType.find({ 
      isRequired: true,
      isActive: true 
    });
    
    // Get submitted documents for this application
    const submittedDocuments = await ApplicationDocument.find({ 
      applicationId: req.params.applicationId 
    }).populate('certificateTypeId');
    
    // Calculate verification status
    const verificationStatus = {
      totalRequired: requiredCertificates.length,
      totalSubmitted: submittedDocuments.length,
      totalVerified: submittedDocuments.filter(doc => doc.isVerified).length,
      missingDocuments: [],
      unverifiedDocuments: [],
      verifiedDocuments: [],
      completionPercentage: 0,
      verificationPercentage: 0
    };
    
    // Check for missing required documents
    requiredCertificates.forEach(cert => {
      const submitted = submittedDocuments.find(doc => 
        doc.certificateTypeId._id.toString() === cert._id.toString()
      );
      
      if (!submitted) {
        verificationStatus.missingDocuments.push({
          certificateTypeId: cert._id,
          name: cert.name,
          description: cert.description
        });
      }
    });
    
    // Categorize submitted documents
    submittedDocuments.forEach(doc => {
      if (doc.isVerified) {
        verificationStatus.verifiedDocuments.push(doc);
      } else {
        verificationStatus.unverifiedDocuments.push(doc);
      }
    });
    
    // Calculate percentages
    if (verificationStatus.totalRequired > 0) {
      verificationStatus.completionPercentage = Math.round(
        (verificationStatus.totalSubmitted / verificationStatus.totalRequired) * 100
      );
    }
    
    if (verificationStatus.totalSubmitted > 0) {
      verificationStatus.verificationPercentage = Math.round(
        (verificationStatus.totalVerified / verificationStatus.totalSubmitted) * 100
      );
    }
    
    console.log(`✅ Verification status calculated: ${verificationStatus.completionPercentage}% complete, ${verificationStatus.verificationPercentage}% verified`);
    res.json(verificationStatus);
  } catch (error) {
    console.error('❌ Error in getDocumentVerificationStatus:', error);
    throw error;
  }
});

export {
  getApplicationDocuments,
  addApplicationDocument,
  updateApplicationDocument,
  verifyApplicationDocument,
  deleteApplicationDocument,
  getDocumentVerificationStatus
};