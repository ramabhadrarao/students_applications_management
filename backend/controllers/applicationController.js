// File: backend/controllers/applicationController.js
// Purpose: Enhanced application controller with improved filtering, sorting, and search

import asyncHandler from 'express-async-handler';
import Application from '../models/applicationModel.js';
import ApplicationStatusHistory from '../models/applicationStatusHistoryModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// @desc    Fetch all applications with enhanced filtering and search
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
  const { 
    status, 
    programId, 
    academicYear, 
    page = 1, 
    limit = 10, 
    sortField = 'dateCreated', 
    sortOrder = 'desc',
    search = ''
  } = req.query;
  
  console.log('📋 Fetching applications with filters:', {
    status, programId, academicYear, page, limit, sortField, sortOrder, search,
    userRole: req.user.role, userId: req.user._id
  });
  
  // Build filter object
  const filter = {};
  
  // Add filters based on query parameters
  if (status) filter.status = status;
  if (programId) filter.programId = programId;
  if (academicYear) filter.academicYear = academicYear;
  
  // For students, only show their own applications
  if (req.user.role === 'student') {
    filter.userId = req.user._id;
    console.log('👨‍🎓 Student filter applied - only showing applications for user:', req.user._id);
  }
  
  // For program_admin, only show applications for their program
  if (req.user.role === 'program_admin' && req.user.programId) {
    filter.programId = req.user.programId;
    console.log('👑 Program Admin filter applied - only showing applications for program:', req.user.programId);
  }
  
  // Add search functionality
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { applicationNumber: searchRegex },
      { studentName: searchRegex },
      { fatherName: searchRegex },
      { motherName: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex }
    ];
    console.log('🔍 Search filter applied:', search.trim());
  }
  
  // Create sort options
  const sort = {};
  const validSortFields = ['dateCreated', 'dateUpdated', 'status', 'studentName', 'submittedAt', 'applicationNumber'];
  const validSortField = validSortFields.includes(sortField) ? sortField : 'dateCreated';
  sort[validSortField] = sortOrder === 'asc' ? 1 : -1;
  
  console.log('🔧 Final filter object:', JSON.stringify(filter, null, 2));
  console.log('📊 Sort options:', sort);
  
  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    populate: [
      { 
        path: 'programId', 
        select: 'programName programCode department programType' 
      },
      { 
        path: 'userId', 
        select: 'email role' 
      },
      { 
        path: 'reviewedBy', 
        select: 'email' 
      }
    ]
  };
  
  try {
    // Get paginated results
    const applications = await Application.paginate(filter, options);
    
    console.log(`✅ Found ${applications.docs.length} applications (page ${applications.page} of ${applications.totalPages})`);
    
    // Enhanced response with additional metadata
    const response = {
      docs: applications.docs,
      totalDocs: applications.totalDocs,
      limit: applications.limit,
      page: applications.page,
      totalPages: applications.totalPages,
      hasNextPage: applications.hasNextPage,
      hasPrevPage: applications.hasPrevPage,
      nextPage: applications.nextPage,
      prevPage: applications.prevPage,
      // Additional metadata for frontend
      filterApplied: {
        status: status || null,
        programId: programId || null,
        academicYear: academicYear || null,
        search: search || null
      },
      sortApplied: {
        field: validSortField,
        order: sortOrder
      },
      userInfo: {
        role: req.user.role,
        canCreateNew: req.user.role === 'student',
        canBulkEdit: ['admin', 'program_admin'].includes(req.user.role)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500);
    throw new Error('Failed to fetch applications: ' + error.message);
  }
});

// @desc    Fetch single application with enhanced data
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  console.log(`🔍 Fetching application by ID: ${req.params.id} for user: ${req.user._id} (${req.user.role})`);
  
  const application = await Application.findById(req.params.id)
    .populate('programId', 'programName programCode department programType durationYears totalSeats')
    .populate('userId', 'email role dateCreated')
    .populate('reviewedBy', 'email role');

  if (!application) {
    console.log(`❌ Application not found: ${req.params.id}`);
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to view this application
  const hasPermission = 
    req.user.role === 'admin' ||
    (req.user.role === 'program_admin' && 
     application.programId._id.toString() === req.user.programId?.toString()) ||
    (req.user.role === 'student' && 
     application.userId._id.toString() === req.user._id.toString());

  if (!hasPermission) {
    console.log(`🚫 Access denied for user ${req.user._id} to application ${req.params.id}`);
    res.status(403);
    throw new Error('Not authorized to access this application');
  }

  // Add permission flags for frontend
  const enhancedApplication = {
    ...application.toObject(),
    permissions: {
      canEdit: req.user.role === 'student' && 
               application.userId._id.toString() === req.user._id.toString() &&
               ['draft', 'rejected'].includes(application.status),
      canSubmit: req.user.role === 'student' && 
                 application.userId._id.toString() === req.user._id.toString() &&
                 application.status === 'draft',
      canReview: ['admin', 'program_admin'].includes(req.user.role),
      canDelete: req.user.role === 'admin' ||
                (req.user.role === 'student' && 
                 application.userId._id.toString() === req.user._id.toString() &&
                 application.status === 'draft')
    }
  };

  console.log(`✅ Application fetched successfully with permissions:`, enhancedApplication.permissions);
  res.json(enhancedApplication);
});

// @desc    Create a new application with ALL FIELDS support
// @route   POST /api/applications
// @access  Private/Student
const createApplication = asyncHandler(async (req, res) => {
  console.log('📝 Creating new application for user:', req.user._id);
  console.log('📋 Request body received:', JSON.stringify(req.body, null, 2));
  
  const {
    programId,
    academicYear,
    
    // Personal Information - REQUIRED
    studentName,
    fatherName,
    motherName,
    dateOfBirth,
    gender,
    aadharNumber,
    mobileNumber,
    parentMobile,
    guardianMobile,
    email,
    religion,
    caste,
    reservationCategory,
    isPhysicallyHandicapped,
    specialReservation,
    
    // Intermediate Details - ALL FIELDS
    interBoard,
    interHallTicketNumber,
    sscHallTicketNumber,
    interPassYear,
    interPassoutType,
    bridgeCourse,
    interCourseName,
    interMedium,
    interSecondLanguage,
    interMarksSecured,
    interMaximumMarks,
    interLanguagesTotal,
    interLanguagesPercentage,
    interGroupSubjectsPercentage,
    interCollegeName,
    
    // Address Information
    presentAddress,
    permanentAddress,
    
    // Additional Information
    identificationMarks,
    sadaramNumber,
    meesevaDetails,
    rationCardNumber,
    oamdcNumber,
    
    // Study Details
    studyDetails,
  } = req.body;

  // Validate required fields
  const requiredFields = {
    programId: 'Program is required',
    academicYear: 'Academic year is required',
    studentName: 'Student name is required',
    fatherName: 'Father name is required',
    motherName: 'Mother name is required',
    dateOfBirth: 'Date of birth is required',
    gender: 'Gender is required',
    mobileNumber: 'Mobile number is required',
    email: 'Email is required'
  };

  const missingFields = [];
  for (const [field, message] of Object.entries(requiredFields)) {
    if (!req.body[field]) {
      missingFields.push(message);
    }
  }

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Check if user already has an application for this program and academic year
  const existingApplication = await Application.findOne({
    userId: req.user._id,
    programId,
    academicYear
  });

  if (existingApplication) {
    res.status(400);
    throw new Error('You already have an application for this program and academic year');
  }

  // Generate a unique application number
  const applicationCount = await Application.countDocuments();
  const year = new Date().getFullYear().toString().substr(-2);
  const applicationNumber = `APP${year}${(applicationCount + 1).toString().padStart(6, '0')}`;

  console.log('🔢 Generated application number:', applicationNumber);

  try {
    // Prepare the complete application data with ALL fields
    const applicationData = {
      applicationNumber,
      userId: req.user._id,
      programId,
      academicYear,
      status: 'draft',
      
      // Personal Information
      studentName,
      fatherName,
      motherName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      aadharNumber: aadharNumber || '',
      mobileNumber,
      parentMobile: parentMobile || '',
      guardianMobile: guardianMobile || '',
      email,
      religion: religion || '',
      caste: caste || '',
      reservationCategory: reservationCategory || 'OC',
      isPhysicallyHandicapped: Boolean(isPhysicallyHandicapped),
      specialReservation: specialReservation || '',
      
      // Intermediate Details - Handle ALL fields
      interBoard: interBoard || '',
      interHallTicketNumber: interHallTicketNumber || '',
      sscHallTicketNumber: sscHallTicketNumber || '',
      interPassYear: interPassYear ? parseInt(interPassYear) : undefined,
      interPassoutType: interPassoutType || '',
      bridgeCourse: bridgeCourse || '',
      interCourseName: interCourseName || '',
      interMedium: interMedium || '',
      interSecondLanguage: interSecondLanguage || '',
      interMarksSecured: interMarksSecured ? parseInt(interMarksSecured) : undefined,
      interMaximumMarks: interMaximumMarks ? parseInt(interMaximumMarks) : undefined,
      interLanguagesTotal: interLanguagesTotal ? parseInt(interLanguagesTotal) : undefined,
      interLanguagesPercentage: interLanguagesPercentage ? parseFloat(interLanguagesPercentage) : undefined,
      interGroupSubjectsPercentage: interGroupSubjectsPercentage ? parseFloat(interGroupSubjectsPercentage) : undefined,
      interCollegeName: interCollegeName || '',
      
      // Address Information - Ensure proper structure
      presentAddress: {
        doorNo: presentAddress?.doorNo || '',
        street: presentAddress?.street || '',
        village: presentAddress?.village || '',
        mandal: presentAddress?.mandal || '',
        district: presentAddress?.district || '',
        pincode: presentAddress?.pincode || ''
      },
      permanentAddress: {
        doorNo: permanentAddress?.doorNo || '',
        street: permanentAddress?.street || '',
        village: permanentAddress?.village || '',
        mandal: permanentAddress?.mandal || '',
        district: permanentAddress?.district || '',
        pincode: permanentAddress?.pincode || ''
      },
      
      // Additional Information
      identificationMarks: Array.isArray(identificationMarks) 
        ? identificationMarks.filter(mark => mark && mark.trim()) 
        : [],
      sadaramNumber: sadaramNumber || '',
      meesevaDetails: {
        casteCertificate: meesevaDetails?.casteCertificate || '',
        incomeCertificate: meesevaDetails?.incomeCertificate || ''
      },
      rationCardNumber: rationCardNumber || '',
      oamdcNumber: oamdcNumber || '',
      
      // Study Details - Handle array properly
      studyDetails: Array.isArray(studyDetails) 
        ? studyDetails.filter(study => 
            study && (study.className || study.placeOfStudy || study.institutionName)
          ).map(study => ({
            className: study.className || '',
            placeOfStudy: study.placeOfStudy || '',
            institutionName: study.institutionName || ''
          }))
        : []
    };

    console.log('💾 Creating application with data:', JSON.stringify(applicationData, null, 2));

    const application = await Application.create(applicationData);

    // Create status history record
    await ApplicationStatusHistory.create({
      applicationId: application._id,
      toStatus: 'draft',
      changedBy: req.user._id,
      remarks: 'Application created',
    });
    
    // Create notification
    await Notification.create({
      userId: req.user._id,
      title: 'Application Created',
      message: `Your application #${applicationNumber} has been created successfully. Please complete and submit it.`,
      type: 'info',
      actionUrl: `/applications/${application._id}`,
    });
    
    console.log(`✅ Application created successfully: ${applicationNumber}`);
    
    // Populate the response
    const populatedApplication = await Application.findById(application._id)
      .populate('programId', 'programName programCode department')
      .populate('userId', 'email');
    
    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('❌ Error creating application:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      res.status(400);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    res.status(400);
    throw new Error('Failed to create application: ' + error.message);
  }
});

// @desc    Update application with ALL FIELDS support
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res) => {
  console.log(`📝 Updating application: ${req.params.id} by user: ${req.user._id} (${req.user.role})`);
  console.log('📋 Update data received:', JSON.stringify(req.body, null, 2));
  
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  console.log(`📋 Current application status: ${application.status}`);

  // Check if user has permission to update this application
  const canUpdate = 
    req.user.role === 'admin' ||
    (req.user.role === 'program_admin' && 
     application.programId.toString() === req.user.programId?.toString()) ||
    (req.user.role === 'student' && 
     application.userId.toString() === req.user._id.toString() &&
     ['draft', 'rejected'].includes(application.status));

  if (!canUpdate) {
    console.log(`🚫 Update permission denied for user ${req.user._id}`);
    res.status(403);
    throw new Error('Not authorized to update this application');
  }

  try {
    // Handle different update scenarios based on user role
    if (req.user.role === 'student') {
      // Students can only update their applications if they're in draft or rejected status
      if (!['draft', 'rejected'].includes(application.status)) {
        res.status(400);
        throw new Error('Application can only be updated in draft or rejected status');
      }
      
      // Update ALL allowed fields for students
      const allowedFields = [
        // Personal Information
        'studentName', 'fatherName', 'motherName', 'dateOfBirth', 'gender',
        'aadharNumber', 'mobileNumber', 'parentMobile', 'guardianMobile', 'email',
        'religion', 'caste', 'reservationCategory', 'isPhysicallyHandicapped', 'specialReservation',
        
        // Intermediate Details
        'interBoard', 'interHallTicketNumber', 'sscHallTicketNumber', 'interPassYear',
        'interPassoutType', 'bridgeCourse', 'interCourseName', 'interMedium', 'interSecondLanguage',
        'interMarksSecured', 'interMaximumMarks', 'interLanguagesTotal', 'interLanguagesPercentage',
        'interGroupSubjectsPercentage', 'interCollegeName',
        
        // Address and other info
        'presentAddress', 'permanentAddress', 'identificationMarks', 'sadaramNumber',
        'meesevaDetails', 'rationCardNumber', 'oamdcNumber', 'studyDetails'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'dateOfBirth' && req.body[field]) {
            application[field] = new Date(req.body[field]);
          } else if (field === 'isPhysicallyHandicapped') {
            application[field] = Boolean(req.body[field]);
          } else if (field === 'identificationMarks') {
            application[field] = Array.isArray(req.body[field]) 
              ? req.body[field].filter(mark => mark && mark.trim()) 
              : [];
          } else if (field === 'studyDetails') {
            application[field] = Array.isArray(req.body[field]) 
              ? req.body[field].filter(study => 
                  study && (study.className || study.placeOfStudy || study.institutionName)
                ).map(study => ({
                  className: study.className || '',
                  placeOfStudy: study.placeOfStudy || '',
                  institutionName: study.institutionName || ''
                }))
              : [];
          } else if (field === 'presentAddress' || field === 'permanentAddress') {
            application[field] = {
              doorNo: req.body[field]?.doorNo || '',
              street: req.body[field]?.street || '',
              village: req.body[field]?.village || '',
              mandal: req.body[field]?.mandal || '',
              district: req.body[field]?.district || '',
              pincode: req.body[field]?.pincode || ''
            };
          } else if (field === 'meesevaDetails') {
            application[field] = {
              casteCertificate: req.body[field]?.casteCertificate || '',
              incomeCertificate: req.body[field]?.incomeCertificate || ''
            };
          } else if (['interPassYear', 'interMarksSecured', 'interMaximumMarks', 'interLanguagesTotal'].includes(field)) {
            application[field] = req.body[field] ? parseInt(req.body[field]) : undefined;
          } else if (['interLanguagesPercentage', 'interGroupSubjectsPercentage'].includes(field)) {
            application[field] = req.body[field] ? parseFloat(req.body[field]) : undefined;
          } else {
            application[field] = req.body[field];
          }
        }
      });
      
      console.log('👨‍🎓 Student update - all allowed fields processed');
      
    } else {
      // Admins and program admins can update more fields
      Object.keys(req.body).forEach(key => {
        // Prevent changing certain system fields
        if (!['applicationNumber', 'userId', 'dateCreated'].includes(key)) {
          if (key === 'dateOfBirth' && req.body[key]) {
            application[key] = new Date(req.body[key]);
          } else if (key === 'isPhysicallyHandicapped') {
            application[key] = Boolean(req.body[key]);
          } else if (key === 'identificationMarks') {
            application[key] = Array.isArray(req.body[key]) 
              ? req.body[key].filter(mark => mark && mark.trim()) 
              : [];
          } else if (key === 'studyDetails') {
            application[key] = Array.isArray(req.body[key]) 
              ? req.body[key].filter(study => 
                  study && (study.className || study.placeOfStudy || study.institutionName)
                ).map(study => ({
                  className: study.className || '',
                  placeOfStudy: study.placeOfStudy || '',
                  institutionName: study.institutionName || ''
                }))
              : [];
          } else if (key === 'presentAddress' || key === 'permanentAddress') {
            application[key] = {
              doorNo: req.body[key]?.doorNo || '',
              street: req.body[key]?.street || '',
              village: req.body[key]?.village || '',
              mandal: req.body[key]?.mandal || '',
              district: req.body[key]?.district || '',
              pincode: req.body[key]?.pincode || ''
            };
          } else if (key === 'meesevaDetails') {
            application[key] = {
              casteCertificate: req.body[key]?.casteCertificate || '',
              incomeCertificate: req.body[key]?.incomeCertificate || ''
            };
          } else if (['interPassYear', 'interMarksSecured', 'interMaximumMarks', 'interLanguagesTotal'].includes(key)) {
            application[key] = req.body[key] ? parseInt(req.body[key]) : undefined;
          } else if (['interLanguagesPercentage', 'interGroupSubjectsPercentage'].includes(key)) {
            application[key] = req.body[key] ? parseFloat(req.body[key]) : undefined;
          } else {
            application[key] = req.body[key];
          }
        }
      });
      
      // Handle status changes for admin users
      if (req.body.status && req.body.status !== application.status) {
        const oldStatus = application.status;
        application.status = req.body.status;
        
        console.log(`🔄 Status change: ${oldStatus} → ${req.body.status}`);
        
        // Set timestamps for special status changes
        if (req.body.status === 'submitted' && !application.submittedAt) {
          application.submittedAt = Date.now();
        }
        
        if (['approved', 'rejected'].includes(req.body.status) && !application.reviewedAt) {
          application.reviewedBy = req.user._id;
          application.reviewedAt = Date.now();
        }
        
        // Create status history record
        await ApplicationStatusHistory.create({
          applicationId: application._id,
          fromStatus: oldStatus,
          toStatus: req.body.status,
          changedBy: req.user._id,
          remarks: req.body.statusRemarks || `Status changed from ${oldStatus} to ${req.body.status}`,
        });
        
        // Create notification for the student
        await Notification.create({
          userId: application.userId,
          title: 'Application Status Updated',
          message: `Your application #${application.applicationNumber} status has been changed to ${req.body.status.toUpperCase()}.`,
          type: req.body.status === 'approved' ? 'success' : 
                req.body.status === 'rejected' ? 'danger' : 'info',
          actionUrl: `/applications/${application._id}`,
        });
        
        console.log(`📬 Notification created for status change`);
      }
      
      console.log('👑 Admin/Program Admin update - full access');
    }
    
    application.dateUpdated = Date.now();
    
    console.log('💾 Saving application with updated data:', JSON.stringify(application.toObject(), null, 2));
    
    const updatedApplication = await application.save();
    
    // Populate the response
    const populatedApplication = await Application.findById(updatedApplication._id)
      .populate('programId', 'programName programCode department')
      .populate('userId', 'email')
      .populate('reviewedBy', 'email');
    
    console.log(`✅ Application updated successfully`);
    res.json(populatedApplication);
    
  } catch (error) {
    console.error('❌ Error updating application:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      res.status(400);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    res.status(400);
    throw new Error('Failed to update application: ' + error.message);
  }
});

// @desc    Submit application with enhanced validation
// @route   PUT /api/applications/:id/submit
// @access  Private/Student
const submitApplication = asyncHandler(async (req, res) => {
  console.log(`📤 Submitting application: ${req.params.id} by user: ${req.user._id}`);
  
  const application = await Application.findById(req.params.id)
    .populate('programId', 'programName programCode');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to submit this application
  if (application.userId.toString() !== req.user._id.toString()) {
    console.log(`🚫 Submit permission denied - not application owner`);
    res.status(403);
    throw new Error('Not authorized to submit this application');
  }

  if (application.status !== 'draft') {
    res.status(400);
    throw new Error('Only draft applications can be submitted');
  }

  try {
    // Validate application completeness before submission
    const requiredFields = ['studentName', 'fatherName', 'motherName', 'dateOfBirth', 'gender', 'mobileNumber', 'email'];
    const missingFields = requiredFields.filter(field => !application[field]);
    
    if (missingFields.length > 0) {
      res.status(400);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    application.status = 'submitted';
    application.submittedAt = Date.now();
    application.dateUpdated = Date.now();
    
    const updatedApplication = await application.save();
    
    // Create status history record
    await ApplicationStatusHistory.create({
      applicationId: application._id,
      fromStatus: 'draft',
      toStatus: 'submitted',
      changedBy: req.user._id,
      remarks: 'Application submitted by student',
    });
    
    // Create notification for program admin
    if (application.programId) {
      const programAdmins = await User.find({ 
        role: 'program_admin', 
        programId: application.programId._id,
        isActive: true 
      });
      
      for (const admin of programAdmins) {
        await Notification.create({
          userId: admin._id,
          title: 'New Application Submitted',
          message: `A new application #${application.applicationNumber} for ${application.programId.programName} has been submitted and is pending review.`,
          type: 'info',
          actionUrl: `/applications/${application._id}`,
        });
      }
      
      console.log(`📬 Notifications sent to ${programAdmins.length} program admins`);
    }
    
    // Populate the response
    const populatedApplication = await Application.findById(updatedApplication._id)
      .populate('programId', 'programName programCode department')
      .populate('userId', 'email');
    
    console.log(`✅ Application submitted successfully: ${application.applicationNumber}`);
    res.json(populatedApplication);
    
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    throw error;
  }
});

// @desc    Get application status history
// @route   GET /api/applications/:id/history
// @access  Private
const getApplicationHistory = asyncHandler(async (req, res) => {
  console.log(`📊 Fetching history for application: ${req.params.id}`);
  
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to view this application
  const hasPermission = 
    req.user.role === 'admin' ||
    (req.user.role === 'program_admin' && 
     application.programId.toString() === req.user.programId?.toString()) ||
    (req.user.role === 'student' && 
     application.userId.toString() === req.user._id.toString());

  if (!hasPermission) {
    res.status(403);
    throw new Error('Not authorized to access this application');
  }

  const history = await ApplicationStatusHistory.find({ applicationId: req.params.id })
    .sort({ dateCreated: -1 })
    .populate('changedBy', 'email role');
  
  console.log(`✅ Found ${history.length} history records`);
  res.json(history);
});

// @desc    Get application statistics (Enhanced)
// @route   GET /api/applications/statistics
// @access  Private/Admin
const getApplicationStatistics = asyncHandler(async (req, res) => {
  console.log('📊 Generating application statistics...');
  
  const { academicYear, programId } = req.query;
  
  if (!academicYear) {
    res.status(400);
    throw new Error('Academic year is required');
  }
  
  const baseFilter = { academicYear };
  if (programId) baseFilter.programId = programId;
  
  try {
    // Basic statistics
    const totalApplications = await Application.countDocuments(baseFilter);
    
    // Status-wise counts
    const statusCounts = await Application.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Convert to object for easier access
    const statusStats = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Program-wise statistics
    const programStats = await Application.aggregate([
      { $match: baseFilter },
      { 
        $lookup: {
          from: 'programs',
          localField: 'programId',
          foreignField: '_id',
          as: 'program'
        }
      },
      { $unwind: '$program' },
      {
        $group: {
          _id: {
            programId: '$programId',
            programName: '$program.programName',
            department: '$program.department'
          },
          totalApplications: { $sum: 1 },
          draftApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          submittedApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          underReviewApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
          },
          approvedApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          frozenApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'frozen'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          programId: '$_id.programId',
          programName: '$_id.programName',
          department: '$_id.department',
          totalApplications: 1,
          draftApplications: 1,
          submittedApplications: 1,
          underReviewApplications: 1,
          approvedApplications: 1,
          rejectedApplications: 1,
          frozenApplications: 1
        }
      }
    ]);
    
    // Time-based statistics (applications per month)
    const monthlyStats = await Application.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $month: '$dateCreated' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const response = {
      totalApplications,
      statusStats,
      programStats,
      monthlyStats,
      generatedAt: new Date(),
      filters: { academicYear, programId }
    };
    
    console.log(`✅ Statistics generated for ${totalApplications} applications`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating statistics:', error);
    res.status(500);
    throw new Error('Failed to generate statistics: ' + error.message);
  }
});

// @desc    Bulk update applications (NEW)
// @route   PUT /api/applications/bulk
// @access  Private/Admin
const bulkUpdateApplications = asyncHandler(async (req, res) => {
  console.log('🔄 Bulk updating applications...');
  
  const { applicationIds, updates } = req.body;
  
  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(400);
    throw new Error('Application IDs array is required');
  }
  
  if (!updates || typeof updates !== 'object') {
    res.status(400);
    throw new Error('Updates object is required');
  }
  
  // Only allow certain fields to be bulk updated
  const allowedFields = ['status', 'academicYear', 'reviewedBy'];
  const filteredUpdates = {};
  
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  });
  
  if (Object.keys(filteredUpdates).length === 0) {
    res.status(400);
    throw new Error('No valid update fields provided');
  }
  
  try {
    // Add timestamp
    filteredUpdates.dateUpdated = Date.now();
    
    // Perform bulk update
    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: filteredUpdates }
    );
    
    console.log(`✅ Bulk updated ${result.modifiedCount} applications`);
    
    // If status was updated, create history records
    if (filteredUpdates.status) {
      const applications = await Application.find({ _id: { $in: applicationIds } });
      
      const historyRecords = applications.map(app => ({
        applicationId: app._id,
        fromStatus: app.status, // This will be the old status
        toStatus: filteredUpdates.status,
        changedBy: req.user._id,
        remarks: `Bulk status update to ${filteredUpdates.status}`
      }));
      
      await ApplicationStatusHistory.insertMany(historyRecords);
      console.log(`📊 Created ${historyRecords.length} history records`);
    }
    
    res.json({
      message: `Successfully updated ${result.modifiedCount} applications`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
    
  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500);
    throw new Error('Bulk update failed: ' + error.message);
  }
});
// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res) => {
  console.log(`🗑️ Deleting application: ${req.params.id} by user: ${req.user._id} (${req.user.role})`);
  
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  console.log(`📋 Application status: ${application.status}, User: ${application.userId}`);

  // Check if user has permission to delete this application
  const canDelete = 
    req.user.role === 'admin' ||
    (req.user.role === 'student' && 
     application.userId.toString() === req.user._id.toString() &&
     application.status === 'draft'); // Only draft applications can be deleted by students

  if (!canDelete) {
    console.log(`🚫 Delete permission denied for user ${req.user._id}`);
    res.status(403);
    throw new Error('Not authorized to delete this application');
  }

  // Additional validation for student users
  if (req.user.role === 'student' && application.status !== 'draft') {
    res.status(400);
    throw new Error('Only draft applications can be deleted');
  }

  try {
    // Store application info for logging before deletion
    const applicationInfo = {
      applicationNumber: application.applicationNumber,
      studentName: application.studentName,
      status: application.status
    };

    // Delete related documents first (if any)
    // You might want to delete related application documents, history, etc.
    console.log('🗑️ Checking for related documents to delete...');
    
    // Delete application documents if you have that model
    // await ApplicationDocument.deleteMany({ applicationId: req.params.id });
    
    // Delete application status history
    await ApplicationStatusHistory.deleteMany({ applicationId: req.params.id });
    console.log('📊 Deleted application status history records');

    // Delete the main application
    await Application.findByIdAndDelete(req.params.id);
    
    // Create notification for student (if deleted by admin)
    if (req.user.role === 'admin' && application.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: application.userId,
        title: 'Application Deleted',
        message: `Your application #${applicationInfo.applicationNumber} has been deleted by an administrator.`,
        type: 'warning',
      });
      console.log('📬 Notification sent to student about deletion');
    }
    
    console.log(`✅ Application deleted successfully: ${applicationInfo.applicationNumber}`);
    
    res.json({
      message: 'Application deleted successfully',
      deletedApplication: {
        id: req.params.id,
        applicationNumber: applicationInfo.applicationNumber,
        studentName: applicationInfo.studentName,
        status: applicationInfo.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting application:', error);
    res.status(500);
    throw new Error('Failed to delete application: ' + error.message);
  }
});

// @desc    Bulk delete applications (Admin only)
// @route   DELETE /api/applications/bulk
// @access  Private/Admin
const bulkDeleteApplications = asyncHandler(async (req, res) => {
  console.log('🗑️ Bulk deleting applications...');
  
  const { applicationIds, confirmDelete } = req.body;
  
  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(400);
    throw new Error('Application IDs array is required');
  }

  if (!confirmDelete) {
    res.status(400);
    throw new Error('Delete confirmation is required');
  }

  // Only admins can bulk delete
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only administrators can perform bulk delete operations');
  }

  try {
    // Find applications to be deleted
    const applications = await Application.find({ _id: { $in: applicationIds } });
    
    if (applications.length === 0) {
      res.status(404);
      throw new Error('No applications found with the provided IDs');
    }

    // Store info for logging
    const deletedInfo = applications.map(app => ({
      id: app._id,
      applicationNumber: app.applicationNumber,
      studentName: app.studentName,
      status: app.status,
      userId: app.userId
    }));

    // Delete related data first
    await ApplicationStatusHistory.deleteMany({ applicationId: { $in: applicationIds } });
    console.log('📊 Deleted related status history records');

    // You might also want to delete application documents
    // await ApplicationDocument.deleteMany({ applicationId: { $in: applicationIds } });

    // Perform bulk delete
    const result = await Application.deleteMany({ _id: { $in: applicationIds } });
    
    // Create notifications for affected students
    const notifications = applications.map(app => ({
      userId: app.userId,
      title: 'Application Deleted',
      message: `Your application #${app.applicationNumber} has been deleted by an administrator.`,
      type: 'warning',
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`📬 Created ${notifications.length} deletion notifications`);
    }
    
    console.log(`✅ Bulk delete completed: ${result.deletedCount} applications deleted`);
    
    res.json({
      message: `Successfully deleted ${result.deletedCount} applications`,
      deletedCount: result.deletedCount,
      deletedApplications: deletedInfo
    });
    
  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    res.status(500);
    throw new Error('Bulk delete failed: ' + error.message);
  }
});

export {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  submitApplication,
  deleteApplication,           // NEW
  bulkDeleteApplications,      // NEW
  getApplicationHistory,
  getApplicationStatistics,
  bulkUpdateApplications
};