// File: backend/controllers/certificateTypeController.js
// Purpose: Handle CRUD operations for certificate types

import asyncHandler from 'express-async-handler';
import CertificateType from '../models/certificateTypeModel.js';

// @desc    Fetch all certificate types
// @route   GET /api/certificate-types
// @access  Public
const getCertificateTypes = asyncHandler(async (req, res) => {
  try {
    console.log('📋 Fetching certificate types...');
    
    const { isActive = true } = req.query;
    
    const filter = {};
    
    if (isActive !== undefined) {
      if (isActive === 'false') {
        filter.isActive = false;
      } else if (isActive === 'true') {
        filter.isActive = true;
      }
    } else {
      filter.isActive = true;
    }
    
    console.log('🔍 Filter applied:', filter);
    
    const certificateTypes = await CertificateType.find(filter)
      .sort({ displayOrder: 1, name: 1 });
    
    console.log(`✅ Found ${certificateTypes.length} certificate types`);
    
    res.json(certificateTypes);
  } catch (error) {
    console.error('❌ Error in getCertificateTypes:', error);
    res.status(500);
    throw new Error(`Failed to fetch certificate types: ${error.message}`);
  }
});

// @desc    Fetch single certificate type
// @route   GET /api/certificate-types/:id
// @access  Public
const getCertificateTypeById = asyncHandler(async (req, res) => {
  try {
    console.log(`🔍 Fetching certificate type by ID: ${req.params.id}`);
    
    const certificateType = await CertificateType.findById(req.params.id);

    if (certificateType) {
      console.log(`✅ Found certificate type: ${certificateType.name}`);
      res.json(certificateType);
    } else {
      console.log(`❌ Certificate type not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Certificate type not found');
    }
  } catch (error) {
    console.error('❌ Error in getCertificateTypeById:', error);
    if (error.name === 'CastError') {
      res.status(400);
      throw new Error('Invalid certificate type ID format');
    }
    throw error;
  }
});

// @desc    Create a certificate type
// @route   POST /api/certificate-types
// @access  Private/Admin
const createCertificateType = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating new certificate type...');
    
    const {
      name,
      description,
      fileTypesAllowed,
      maxFileSizeMb,
      isRequired,
      displayOrder,
      isActive
    } = req.body;

    // Check if certificate type with same name already exists
    const certificateTypeExists = await CertificateType.findOne({ name });

    if (certificateTypeExists) {
      console.log(`❌ Certificate type name already exists: ${name}`);
      res.status(400);
      throw new Error('Certificate type with this name already exists');
    }

    const certificateType = await CertificateType.create({
      name,
      description,
      fileTypesAllowed: fileTypesAllowed || 'pdf,jpg,jpeg,png',
      maxFileSizeMb: maxFileSizeMb || 5,
      isRequired: isRequired !== undefined ? isRequired : true,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    if (certificateType) {
      console.log(`✅ Certificate type created: ${certificateType.name}`);
      res.status(201).json(certificateType);
    } else {
      console.log('❌ Failed to create certificate type');
      res.status(400);
      throw new Error('Invalid certificate type data');
    }
  } catch (error) {
    console.error('❌ Error in createCertificateType:', error);
    throw error;
  }
});

// @desc    Update a certificate type
// @route   PUT /api/certificate-types/:id
// @access  Private/Admin
const updateCertificateType = asyncHandler(async (req, res) => {
  try {
    console.log(`📝 Updating certificate type: ${req.params.id}`);
    
    const certificateType = await CertificateType.findById(req.params.id);

    if (certificateType) {
      // Check if name is being changed and if it conflicts
      if (req.body.name && req.body.name !== certificateType.name) {
        const existingType = await CertificateType.findOne({ 
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        
        if (existingType) {
          res.status(400);
          throw new Error('Certificate type name already exists');
        }
      }

      certificateType.name = req.body.name || certificateType.name;
      certificateType.description = req.body.description || certificateType.description;
      certificateType.fileTypesAllowed = req.body.fileTypesAllowed || certificateType.fileTypesAllowed;
      certificateType.maxFileSizeMb = req.body.maxFileSizeMb !== undefined ? req.body.maxFileSizeMb : certificateType.maxFileSizeMb;
      certificateType.isRequired = req.body.isRequired !== undefined ? req.body.isRequired : certificateType.isRequired;
      certificateType.displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : certificateType.displayOrder;
      certificateType.isActive = req.body.isActive !== undefined ? req.body.isActive : certificateType.isActive;
      certificateType.dateUpdated = Date.now();

      const updatedCertificateType = await certificateType.save();
      
      console.log(`✅ Certificate type updated: ${updatedCertificateType.name}`);
      res.json(updatedCertificateType);
    } else {
      console.log(`❌ Certificate type not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Certificate type not found');
    }
  } catch (error) {
    console.error('❌ Error in updateCertificateType:', error);
    throw error;
  }
});

// @desc    Delete a certificate type
// @route   DELETE /api/certificate-types/:id
// @access  Private/Admin
const deleteCertificateType = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting certificate type: ${req.params.id}`);
    
    const certificateType = await CertificateType.findById(req.params.id);

    if (certificateType) {
      await certificateType.deleteOne();
      console.log(`✅ Certificate type deleted: ${certificateType.name}`);
      res.json({ message: 'Certificate type removed' });
    } else {
      console.log(`❌ Certificate type not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Certificate type not found');
    }
  } catch (error) {
    console.error('❌ Error in deleteCertificateType:', error);
    throw error;
  }
});

export {
  getCertificateTypes,
  getCertificateTypeById,
  createCertificateType,
  updateCertificateType,
  deleteCertificateType
};