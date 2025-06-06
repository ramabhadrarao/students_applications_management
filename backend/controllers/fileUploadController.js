// File: backend/controllers/fileUploadController.js
// Purpose: Handle file upload operations and management

import asyncHandler from 'express-async-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../models/fileUploadModel.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    req.fileUuid = uniqueId;
    req.generatedFilename = filename;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document and image types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// @desc    Upload a file
// @route   POST /api/files/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  try {
    console.log('📎 Processing file upload...');

    // Use multer middleware
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('❌ File upload error:', err.message);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('📁 File uploaded:', req.file.filename);

      // Save file metadata to database
      const fileUpload = await FileUpload.create({
        uuid: req.fileUuid,
        filename: req.generatedFilename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: req.body.description || '',
        uploadedBy: req.user._id
      });

      console.log(`✅ File metadata saved: ${fileUpload.uuid}`);
      res.status(201).json(fileUpload);
    });
  } catch (error) {
    console.error('❌ Error in uploadFile:', error);
    res.status(500);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
});

// @desc    Get file by UUID
// @route   GET /api/files/:uuid
// @access  Private
const getFileByUuid = asyncHandler(async (req, res) => {
  try {
    console.log(`🔍 Fetching file by UUID: ${req.params.uuid}`);
    
    const fileUpload = await FileUpload.findOne({ uuid: req.params.uuid })
      .populate('uploadedBy', 'email')
      .populate('verifiedBy', 'email');

    if (fileUpload) {
      console.log(`✅ Found file: ${fileUpload.originalName}`);
      res.json(fileUpload);
    } else {
      console.log(`❌ File not found: ${req.params.uuid}`);
      res.status(404);
      throw new Error('File not found');
    }
  } catch (error) {
    console.error('❌ Error in getFileByUuid:', error);
    throw error;
  }
});

// @desc    Download file by UUID
// @route   GET /api/files/:uuid/download
// @access  Private
const downloadFile = asyncHandler(async (req, res) => {
  try {
    console.log(`📥 Downloading file: ${req.params.uuid}`);
    
    const fileUpload = await FileUpload.findOne({ uuid: req.params.uuid });

    if (!fileUpload) {
      console.log(`❌ File not found: ${req.params.uuid}`);
      res.status(404);
      throw new Error('File not found');
    }

    // Check if file exists on disk
    if (!fs.existsSync(fileUpload.filePath)) {
      console.log(`❌ File not found on disk: ${fileUpload.filePath}`);
      res.status(404);
      throw new Error('File not found on server');
    }

    console.log(`✅ Serving file: ${fileUpload.originalName}`);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileUpload.originalName}"`);
    res.setHeader('Content-Type', fileUpload.mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(fileUpload.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Error in downloadFile:', error);
    throw error;
  }
});

// @desc    Get all files uploaded by user
// @route   GET /api/files
// @access  Private
const getUserFiles = asyncHandler(async (req, res) => {
  try {
    console.log('📋 Fetching user files...');
    
    const { page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    // For students, only show their own files
    if (req.user.role === 'student') {
      filter.uploadedBy = req.user._id;
    }
    // For admin/program_admin, show all files or apply additional filters
    
    const files = await FileUpload.find(filter)
      .populate('uploadedBy', 'email')
      .populate('verifiedBy', 'email')
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FileUpload.countDocuments(filter);
    
    console.log(`✅ Found ${files.length} files`);
    
    res.json({
      files,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Error in getUserFiles:', error);
    res.status(500);
    throw new Error(`Failed to fetch files: ${error.message}`);
  }
});

// @desc    Verify a file
// @route   PUT /api/files/:uuid/verify
// @access  Private/Admin
const verifyFile = asyncHandler(async (req, res) => {
  try {
    console.log(`✅ Verifying file: ${req.params.uuid}`);
    
    const fileUpload = await FileUpload.findOne({ uuid: req.params.uuid });

    if (!fileUpload) {
      console.log(`❌ File not found: ${req.params.uuid}`);
      res.status(404);
      throw new Error('File not found');
    }

    fileUpload.isVerified = true;
    fileUpload.verifiedBy = req.user._id;
    fileUpload.verifiedAt = Date.now();

    const updatedFile = await fileUpload.save();
    
    console.log(`✅ File verified: ${updatedFile.originalName}`);
    res.json(updatedFile);
  } catch (error) {
    console.error('❌ Error in verifyFile:', error);
    throw error;
  }
});

// @desc    Delete a file
// @route   DELETE /api/files/:uuid
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting file: ${req.params.uuid}`);
    
    const fileUpload = await FileUpload.findOne({ uuid: req.params.uuid });

    if (!fileUpload) {
      console.log(`❌ File not found: ${req.params.uuid}`);
      res.status(404);
      throw new Error('File not found');
    }

    // Check permissions
    if (req.user.role === 'student' && fileUpload.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this file');
    }

    // Delete file from disk
    if (fs.existsSync(fileUpload.filePath)) {
      fs.unlinkSync(fileUpload.filePath);
      console.log(`🗑️ File deleted from disk: ${fileUpload.filePath}`);
    }

    // Delete from database
    await fileUpload.deleteOne();
    
    console.log(`✅ File deleted: ${fileUpload.originalName}`);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ Error in deleteFile:', error);
    throw error;
  }
});

export {
  uploadFile,
  getFileByUuid,
  downloadFile,
  getUserFiles,
  verifyFile,
  deleteFile
};