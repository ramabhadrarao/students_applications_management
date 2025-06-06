// File: backend/controllers/programCertificateRequirementController.js
// Purpose: Handle program certificate requirement operations (FIXED)

import asyncHandler from 'express-async-handler';
import ProgramCertificateRequirement from '../models/programCertificateRequirementModel.js';
import Program from '../models/programModel.js';
import CertificateType from '../models/certificateTypeModel.js';

// @desc    Get certificate requirements for a program
// @route   GET /api/programs/:programId/certificates
// @access  Private
const getProgramCertificateRequirements = asyncHandler(async (req, res) => {
  try {
    console.log(`📋 Fetching certificate requirements for program: ${req.params.programId}`);
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    // ✅ FIXED: Additional validation for ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      res.status(404);
      throw new Error('Program not found');
    }
    
    const requirements = await ProgramCertificateRequirement.find({ 
      programId: programId,
      isActive: true 
    })
      .populate('certificateTypeId', 'name description fileTypesAllowed maxFileSizeMb isRequired displayOrder isActive')
      .sort({ displayOrder: 1, 'certificateTypeId.displayOrder': 1 });
    
    console.log(`✅ Found ${requirements.length} certificate requirements`);
    res.json(requirements);
  } catch (error) {
    console.error('❌ Error in getProgramCertificateRequirements:', error);
    throw error;
  }
});

// @desc    Add certificate requirement to program
// @route   POST /api/programs/:programId/certificates
// @access  Private/Admin
const addProgramCertificateRequirement = asyncHandler(async (req, res) => {
  try {
    console.log(`📎 Adding certificate requirement to program: ${req.params.programId}`);
    
    const { certificateTypeId, isRequired, specialInstructions, displayOrder } = req.body;
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      res.status(404);
      throw new Error('Program not found');
    }
    
    // Check if certificate type exists
    const certificateType = await CertificateType.findById(certificateTypeId);
    if (!certificateType) {
      res.status(404);
      throw new Error('Certificate type not found');
    }
    
    // Check if requirement already exists
    const existingRequirement = await ProgramCertificateRequirement.findOne({
      programId: programId,
      certificateTypeId
    });
    
    if (existingRequirement) {
      res.status(400);
      throw new Error('Certificate requirement already exists for this program');
    }
    
    // Create requirement
    const requirement = await ProgramCertificateRequirement.create({
      programId: programId,
      certificateTypeId,
      isRequired: isRequired !== undefined ? isRequired : true,
      specialInstructions,
      displayOrder: displayOrder || 0
    });
    
    // Populate the created requirement
    const populatedRequirement = await ProgramCertificateRequirement.findById(requirement._id)
      .populate('certificateTypeId', 'name description fileTypesAllowed maxFileSizeMb isRequired displayOrder isActive');
    
    console.log(`✅ Certificate requirement added: ${certificateType.name}`);
    res.status(201).json(populatedRequirement);
  } catch (error) {
    console.error('❌ Error in addProgramCertificateRequirement:', error);
    throw error;
  }
});

// @desc    Update program certificate requirement
// @route   PUT /api/programs/:programId/certificates/:requirementId
// @access  Private/Admin
const updateProgramCertificateRequirement = asyncHandler(async (req, res) => {
  try {
    console.log(`📝 Updating certificate requirement: ${req.params.requirementId}`);
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    const requirement = await ProgramCertificateRequirement.findById(req.params.requirementId);
    if (!requirement) {
      res.status(404);
      throw new Error('Certificate requirement not found');
    }
    
    // Check if requirement belongs to the specified program
    if (requirement.programId.toString() !== programId) {
      res.status(400);
      throw new Error('Certificate requirement does not belong to this program');
    }
    
    // Update fields
    requirement.isRequired = req.body.isRequired !== undefined ? req.body.isRequired : requirement.isRequired;
    requirement.specialInstructions = req.body.specialInstructions !== undefined ? req.body.specialInstructions : requirement.specialInstructions;
    requirement.displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : requirement.displayOrder;
    requirement.dateUpdated = Date.now();
    
    const updatedRequirement = await requirement.save();
    
    // Populate the updated requirement
    const populatedRequirement = await ProgramCertificateRequirement.findById(updatedRequirement._id)
      .populate('certificateTypeId', 'name description fileTypesAllowed maxFileSizeMb isRequired displayOrder isActive');
    
    console.log(`✅ Certificate requirement updated`);
    res.json(populatedRequirement);
  } catch (error) {
    console.error('❌ Error in updateProgramCertificateRequirement:', error);
    throw error;
  }
});

// @desc    Delete program certificate requirement
// @route   DELETE /api/programs/:programId/certificates/:requirementId
// @access  Private/Admin
const deleteProgramCertificateRequirement = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting certificate requirement: ${req.params.requirementId}`);
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    const requirement = await ProgramCertificateRequirement.findById(req.params.requirementId);
    if (!requirement) {
      res.status(404);
      throw new Error('Certificate requirement not found');
    }
    
    // Check if requirement belongs to the specified program
    if (requirement.programId.toString() !== programId) {
      res.status(400);
      throw new Error('Certificate requirement does not belong to this program');
    }
    
    await requirement.deleteOne();
    
    console.log(`✅ Certificate requirement deleted`);
    res.json({ message: 'Certificate requirement removed successfully' });
  } catch (error) {
    console.error('❌ Error in deleteProgramCertificateRequirement:', error);
    throw error;
  }
});

// @desc    Get available certificate types for a program (not already added)
// @route   GET /api/programs/:programId/certificates/available
// @access  Private/Admin
const getAvailableCertificateTypes = asyncHandler(async (req, res) => {
  try {
    console.log(`📋 Fetching available certificate types for program: ${req.params.programId}`);
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    // Get existing requirements for this program
    const existingRequirements = await ProgramCertificateRequirement.find({ 
      programId: programId,
      isActive: true 
    });
    
    const usedCertificateTypeIds = existingRequirements.map(req => req.certificateTypeId.toString());
    
    // Get available certificate types
    const availableCertificateTypes = await CertificateType.find({
      _id: { $nin: usedCertificateTypeIds },
      isActive: true
    }).sort({ displayOrder: 1, name: 1 });
    
    console.log(`✅ Found ${availableCertificateTypes.length} available certificate types`);
    res.json(availableCertificateTypes);
  } catch (error) {
    console.error('❌ Error in getAvailableCertificateTypes:', error);
    throw error;
  }
});

// @desc    Bulk update display order for program certificate requirements
// @route   PUT /api/programs/:programId/certificates/reorder
// @access  Private/Admin
const reorderProgramCertificateRequirements = asyncHandler(async (req, res) => {
  try {
    console.log(`🔄 Reordering certificate requirements for program: ${req.params.programId}`);
    
    const { requirements } = req.body; // Array of { id, displayOrder }
    
    // ✅ FIXED: Validate programId format
    const programId = req.params.programId;
    if (!programId || programId === '[object Object]' || programId === 'undefined') {
      res.status(400);
      throw new Error('Invalid program ID provided');
    }
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(programId)) {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    
    if (!requirements || !Array.isArray(requirements)) {
      res.status(400);
      throw new Error('Requirements array is required');
    }
    
    // Update display order for each requirement
    const updatePromises = requirements.map(async (req) => {
      const requirement = await ProgramCertificateRequirement.findById(req.id);
      if (requirement && requirement.programId.toString() === programId) {
        requirement.displayOrder = req.displayOrder;
        requirement.dateUpdated = Date.now();
        return requirement.save();
      }
    });
    
    await Promise.all(updatePromises);
    
    // Return updated requirements
    const updatedRequirements = await ProgramCertificateRequirement.find({ 
      programId: programId,
      isActive: true 
    })
      .populate('certificateTypeId', 'name description fileTypesAllowed maxFileSizeMb isRequired displayOrder isActive')
      .sort({ displayOrder: 1 });
    
    console.log(`✅ Certificate requirements reordered`);
    res.json(updatedRequirements);
  } catch (error) {
    console.error('❌ Error in reorderProgramCertificateRequirements:', error);
    throw error;
  }
});

export {
  getProgramCertificateRequirements,
  addProgramCertificateRequirement,
  updateProgramCertificateRequirement,
  deleteProgramCertificateRequirement,
  getAvailableCertificateTypes,
  reorderProgramCertificateRequirements
};