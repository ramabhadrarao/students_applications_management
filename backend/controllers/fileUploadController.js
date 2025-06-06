// File: backend/controllers/fileUploadController.js
// Purpose: Handle file upload operations and management - FIXED for user-specific files

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
      console.log('👤 Uploaded by user:', req.user._id);

      // Save file metadata to database
      const fileUpload = await FileUpload.create({
        uuid: req.fileUuid,
        filename: req.generatedFilename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: req.body.description || '',
        uploadedBy: req.user._id // ✅ FIXED: Properly set uploadedBy
      });

      console.log(`✅ File metadata saved: ${fileUpload.uuid} for user ${req.user._id}`);
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
      // ✅ FIXED: Check if user has permission to view this file
      if (req.user.role !== 'admin' && 
          req.user.role !== 'program_admin' && 
          fileUpload.uploadedBy._id.toString() !== req.user._id.toString()) {
        console.log(`❌ User ${req.user._id} denied access to file ${req.params.uuid}`);
        res.status(403);
        throw new Error('Not authorized to access this file');
      }

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

    // ✅ FIXED: Check if user has permission to download this file
    if (req.user.role !== 'admin' && 
        req.user.role !== 'program_admin' && 
        fileUpload.uploadedBy.toString() !== req.user._id.toString()) {
      console.log(`❌ User ${req.user._id} denied download access to file ${req.params.uuid}`);
      res.status(403);
      throw new Error('Not authorized to download this file');
    }

    // Check if file exists on disk
    if (!fs.existsSync(fileUpload.filePath)) {
      console.log(`❌ File not found on disk: ${fileUpload.filePath}`);
      res.status(404);
      throw new Error('File not found on server');
    }

    console.log(`✅ Serving file: ${fileUpload.originalName} to user ${req.user._id}`);
    
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

// @desc    Get all files uploaded by user (FIXED for proper user filtering)
// @route   GET /api/files
// @access  Private
const getUserFiles = asyncHandler(async (req, res) => {
  try {
    console.log('📋 Fetching user files...');
    console.log('👤 Current user:', req.user._id, req.user.role);
    
    const { page = 1, limit = 50, search } = req.query;
    
    // ✅ FIXED: Build proper filter object
    const filter = {};
    
    // ✅ FIXED: For students, ALWAYS filter by their own files
    if (req.user.role === 'student') {
      filter.uploadedBy = req.user._id;
      console.log('🔒 Student filter applied - only showing files uploaded by:', req.user._id);
    }
    // For admin/program_admin, show all files or apply additional filters
    else if (req.user.role === 'admin' || req.user.role === 'program_admin') {
      console.log('👑 Admin/Program Admin - showing all files');
      // Optionally, program admins could be filtered to only see files from their program users
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      filter.$or = [
        { originalName: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
      console.log('🔍 Search filter applied:', search.trim());
    }
    
    console.log('🎯 Final filter object:', JSON.stringify(filter, null, 2));
    
    // ✅ FIXED: Get files with proper filtering and pagination
    const files = await FileUpload.find(filter)
      .populate('uploadedBy', 'email role')
      .populate('verifiedBy', 'email')
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await FileUpload.countDocuments(filter);
    
    console.log(`✅ Found ${files.length} files for user ${req.user._id} (role: ${req.user.role})`);
    console.log(`📊 Total matching files: ${total}`);
    
    // ✅ FIXED: Return consistent format
    res.json({
      files,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      debug: {
        userId: req.user._id,
        userRole: req.user.role,
        filterApplied: filter,
        totalFound: files.length
      }
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

    // ✅ FIXED: Check permissions - students can only delete their own files
    if (req.user.role === 'student' && fileUpload.uploadedBy.toString() !== req.user._id.toString()) {
      console.log(`❌ User ${req.user._id} denied delete access to file ${req.params.uuid}`);
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
    
    console.log(`✅ File deleted: ${fileUpload.originalName} by user ${req.user._id}`);
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