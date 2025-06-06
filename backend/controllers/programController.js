import asyncHandler from 'express-async-handler';
import Program from '../models/programModel.js';

// @desc    Fetch all programs
// @route   GET /api/programs
// @access  Public
const getPrograms = asyncHandler(async (req, res) => {
  const { programType, isActive = true } = req.query;
  
  const filter = {};
  
  if (programType) {
    filter.programType = programType;
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const programs = await Program.find(filter)
    .sort({ displayOrder: 1, programName: 1 })
    .populate('programAdminId', 'email');
  
  res.json(programs);
});

// @desc    Fetch single program
// @route   GET /api/programs/:id
// @access  Public
const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id)
    .populate('programAdminId', 'email');

  if (program) {
    res.json(program);
  } else {
    res.status(404);
    throw new Error('Program not found');
  }
});

// @desc    Create a program
// @route   POST /api/programs
// @access  Private/Admin
const createProgram = asyncHandler(async (req, res) => {
  const {
    programCode,
    programName,
    programType,
    department,
    durationYears,
    totalSeats,
    applicationStartDate,
    applicationEndDate,
    programAdminId,
    eligibilityCriteria,
    feesStructure,
    description,
    isActive,
    displayOrder,
  } = req.body;

  const programExists = await Program.findOne({ programCode });

  if (programExists) {
    res.status(400);
    throw new Error('Program with this code already exists');
  }

  const program = await Program.create({
    programCode,
    programName,
    programType,
    department,
    durationYears,
    totalSeats,
    applicationStartDate,
    applicationEndDate,
    programAdminId,
    eligibilityCriteria,
    feesStructure,
    description,
    isActive: isActive !== undefined ? isActive : true,
    displayOrder: displayOrder || 0,
  });

  if (program) {
    res.status(201).json(program);
  } else {
    res.status(400);
    throw new Error('Invalid program data');
  }
});

// @desc    Update a program
// @route   PUT /api/programs/:id
// @access  Private/Admin
const updateProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (program) {
    program.programCode = req.body.programCode || program.programCode;
    program.programName = req.body.programName || program.programName;
    program.programType = req.body.programType || program.programType;
    program.department = req.body.department || program.department;
    program.durationYears = req.body.durationYears !== undefined ? req.body.durationYears : program.durationYears;
    program.totalSeats = req.body.totalSeats !== undefined ? req.body.totalSeats : program.totalSeats;
    program.applicationStartDate = req.body.applicationStartDate || program.applicationStartDate;
    program.applicationEndDate = req.body.applicationEndDate || program.applicationEndDate;
    program.programAdminId = req.body.programAdminId || program.programAdminId;
    program.eligibilityCriteria = req.body.eligibilityCriteria || program.eligibilityCriteria;
    program.feesStructure = req.body.feesStructure || program.feesStructure;
    program.description = req.body.description || program.description;
    program.isActive = req.body.isActive !== undefined ? req.body.isActive : program.isActive;
    program.displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : program.displayOrder;
    program.dateUpdated = Date.now();

    const updatedProgram = await program.save();
    res.json(updatedProgram);
  } else {
    res.status(404);
    throw new Error('Program not found');
  }
});

// @desc    Delete a program
// @route   DELETE /api/programs/:id
// @access  Private/Admin
const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (program) {
    await program.deleteOne();
    res.json({ message: 'Program removed' });
  } else {
    res.status(404);
    throw new Error('Program not found');
  }
});

// @desc    Get program statistics
// @route   GET /api/programs/statistics
// @access  Private/Admin
const getProgramStatistics = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  
  if (!academicYear) {
    res.status(400);
    throw new Error('Academic year is required');
  }
  
  // This is a complex aggregation pipeline to get statistics similar to the program_statistics_view
  const statistics = await Program.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $lookup: {
        from: 'applications',
        let: { programId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$programId', '$$programId'] },
                  { $eq: ['$academicYear', academicYear] }
                ]
              }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ],
        as: 'applicationStats'
      }
    },
    {
      $addFields: {
        draftApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'draft'] } } }, 0] },
            { count: 0 }
          ]
        },
        submittedApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'submitted'] } } }, 0] },
            { count: 0 }
          ]
        },
        underReviewApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'under_review'] } } }, 0] },
            { count: 0 }
          ]
        },
        approvedApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'approved'] } } }, 0] },
            { count: 0 }
          ]
        },
        rejectedApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'rejected'] } } }, 0] },
            { count: 0 }
          ]
        },
        frozenApplications: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: '$applicationStats', as: 'stat', cond: { $eq: ['$$stat._id', 'frozen'] } } }, 0] },
            { count: 0 }
          ]
        }
      }
    },
    {
      $project: {
        _id: 1,
        programCode: 1,
        programName: 1,
        programType: 1,
        department: 1,
        totalSeats: 1,
        draftApplications: '$draftApplications.count',
        submittedApplications: '$submittedApplications.count',
        underReviewApplications: '$underReviewApplications.count',
        approvedApplications: '$approvedApplications.count',
        rejectedApplications: '$rejectedApplications.count',
        frozenApplications: '$frozenApplications.count',
        totalApplications: {
          $sum: [
            '$draftApplications.count',
            '$submittedApplications.count',
            '$underReviewApplications.count',
            '$approvedApplications.count',
            '$rejectedApplications.count',
            '$frozenApplications.count'
          ]
        },
        seatFillPercentage: {
          $cond: [
            { $eq: ['$totalSeats', 0] },
            0,
            { $multiply: [{ $divide: ['$approvedApplications.count', '$totalSeats'] }, 100] }
          ]
        }
      }
    },
    {
      $sort: { displayOrder: 1, programName: 1 }
    }
  ]);
  
  res.json(statistics);
});

export {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStatistics,
};