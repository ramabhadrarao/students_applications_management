import asyncHandler from 'express-async-handler';
import Application from '../models/applicationModel.js';
import ApplicationStatusHistory from '../models/applicationStatusHistoryModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Fetch all applications
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
    sortOrder = 'desc' 
  } = req.query;
  
  // Build filter object
  const filter = {};
  
  // Add filters based on query parameters
  if (status) filter.status = status;
  if (programId) filter.programId = programId;
  if (academicYear) filter.academicYear = academicYear;
  
  // For students, only show their own applications
  if (req.user.role === 'student') {
    filter.userId = req.user._id;
  }
  
  // For program_admin, only show applications for their program
  if (req.user.role === 'program_admin' && req.user.programId) {
    filter.programId = req.user.programId;
  }
  
  // Create sort options
  const sort = {};
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;
  
  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    populate: [
      { path: 'programId', select: 'programName programCode department' },
      { path: 'userId', select: 'email' }
    ]
  };
  
  // Get paginated results
  const applications = await Application.paginate(filter, options);
  
  res.json(applications);
});

// @desc    Fetch single application
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('programId', 'programName programCode department')
    .populate('userId', 'email')
    .populate('reviewedBy', 'email');

  if (application) {
    // Check if user has permission to view this application
    if (
      req.user.role === 'admin' ||
      (req.user.role === 'program_admin' && 
       application.programId._id.toString() === req.user.programId?.toString()) ||
      (req.user.role === 'student' && 
       application.userId._id.toString() === req.user._id.toString())
    ) {
      res.json(application);
    } else {
      res.status(403);
      throw new Error('Not authorized to access this application');
    }
  } else {
    res.status(404);
    throw new Error('Application not found');
  }
});

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private/Student
const createApplication = asyncHandler(async (req, res) => {
  const {
    programId,
    academicYear,
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
    presentAddress,
    permanentAddress,
    religion,
    caste,
    reservationCategory,
    isPhysicallyHandicapped,
    sadaramNumber,
    identificationMarks,
    specialReservation,
    meesevaDetails,
    rationCardNumber,
  } = req.body;

  // Generate a unique application number
  const applicationCount = await Application.countDocuments();
  const year = new Date().getFullYear().toString().substr(-2);
  const applicationNumber = `APP${year}${(applicationCount + 1).toString().padStart(6, '0')}`;

  const application = await Application.create({
    applicationNumber,
    userId: req.user._id,
    programId,
    academicYear,
    status: 'draft',
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
    presentAddress,
    permanentAddress,
    religion,
    caste,
    reservationCategory,
    isPhysicallyHandicapped,
    sadaramNumber,
    identificationMarks,
    specialReservation,
    meesevaDetails,
    rationCardNumber,
  });

  if (application) {
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
    
    res.status(201).json(application);
  } else {
    res.status(400);
    throw new Error('Invalid application data');
  }
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to update this application
  if (
    req.user.role === 'admin' ||
    (req.user.role === 'program_admin' && 
     application.programId.toString() === req.user.programId?.toString()) ||
    (req.user.role === 'student' && 
     application.userId.toString() === req.user._id.toString() &&
     ['draft', 'rejected'].includes(application.status))
  ) {
    // Update only allowed fields based on role
    if (req.user.role === 'student') {
      // Students can only update their applications if they're in draft or rejected status
      if (!['draft', 'rejected'].includes(application.status)) {
        res.status(400);
        throw new Error('Application can only be updated in draft or rejected status');
      }
      
      // Update basic fields
      Object.keys(req.body).forEach(key => {
        // Prevent changing critical fields
        if (!['applicationNumber', 'userId', 'status', 'submittedAt', 'reviewedBy', 'reviewedAt'].includes(key)) {
          application[key] = req.body[key];
        }
      });
    } else {
      // Admins and program admins can update more fields
      Object.keys(req.body).forEach(key => {
        application[key] = req.body[key];
      });
      
      // If status is changing, record the change in history
      if (req.body.status && req.body.status !== application.status) {
        const oldStatus = application.status;
        application.status = req.body.status;
        
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
      }
    }
    
    application.dateUpdated = Date.now();
    
    const updatedApplication = await application.save();
    res.json(updatedApplication);
  } else {
    res.status(403);
    throw new Error('Not authorized to update this application');
  }
});

// @desc    Submit application
// @route   PUT /api/applications/:id/submit
// @access  Private/Student
const submitApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to submit this application
  if (
    application.userId.toString() === req.user._id.toString() &&
    application.status === 'draft'
  ) {
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
        programId: application.programId,
        isActive: true 
      });
      
      for (const admin of programAdmins) {
        await Notification.create({
          userId: admin._id,
          title: 'New Application Submitted',
          message: `A new application #${application.applicationNumber} has been submitted and is pending review.`,
          type: 'info',
          actionUrl: `/applications/${application._id}`,
        });
      }
    }
    
    res.json(updatedApplication);
  } else {
    res.status(403);
    throw new Error('Not authorized to submit this application or application is not in draft status');
  }
});

// @desc    Get application status history
// @route   GET /api/applications/:id/history
// @access  Private
const getApplicationHistory = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user has permission to view this application
  if (
    req.user.role === 'admin' ||
    (req.user.role === 'program_admin' && 
     application.programId.toString() === req.user.programId?.toString()) ||
    (req.user.role === 'student' && 
     application.userId.toString() === req.user._id.toString())
  ) {
    const history = await ApplicationStatusHistory.find({ applicationId: req.params.id })
      .sort({ dateCreated: -1 })
      .populate('changedBy', 'email');
    
    res.json(history);
  } else {
    res.status(403);
    throw new Error('Not authorized to access this application');
  }
});

// @desc    Get application statistics
// @route   GET /api/applications/statistics
// @access  Private/Admin
const getApplicationStatistics = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  
  if (!academicYear) {
    res.status(400);
    throw new Error('Academic year is required');
  }
  
  // Basic statistics
  const totalApplications = await Application.countDocuments({ academicYear });
  const statusCounts = await Application.aggregate([
    { $match: { academicYear } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // Convert to object for easier access
  const statusStats = statusCounts.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
  
  // Program-wise statistics
  const programStats = await Application.aggregate([
    { $match: { academicYear } },
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
        submittedApplications: {
          $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
        },
        approvedApplications: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejectedApplications: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
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
        submittedApplications: 1,
        approvedApplications: 1,
        rejectedApplications: 1
      }
    }
  ]);
  
  // Time-based statistics (applications per month)
  const monthlyStats = await Application.aggregate([
    { $match: { academicYear } },
    {
      $group: {
        _id: { $month: '$dateCreated' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.json({
    totalApplications,
    statusStats,
    programStats,
    monthlyStats
  });
});

export {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  submitApplication,
  getApplicationHistory,
  getApplicationStatistics
};