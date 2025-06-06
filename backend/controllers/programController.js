import asyncHandler from 'express-async-handler';
import Program from '../models/programModel.js';

// @desc    Fetch all programs
// @route   GET /api/programs
// @access  Public
const getPrograms = asyncHandler(async (req, res) => {
  try {
    console.log('📚 Fetching programs...');
    
    const { programType, isActive = true } = req.query;
    
    const filter = {};
    
    // Only apply isActive filter if explicitly set to false, otherwise show all active programs
    if (isActive !== undefined) {
      if (isActive === 'false') {
        filter.isActive = false;
      } else if (isActive === 'true') {
        filter.isActive = true;
      }
      // If isActive is not 'true' or 'false', don't filter by isActive
    } else {
      // Default behavior: show only active programs
      filter.isActive = true;
    }
    
    if (programType) {
      filter.programType = programType;
    }
    
    console.log('🔍 Filter applied:', filter);
    
    const programs = await Program.find(filter)
      .sort({ displayOrder: 1, programName: 1 })
      .populate('programAdminId', 'email');
    
    console.log(`✅ Found ${programs.length} programs`);
    
    if (programs.length > 0) {
      console.log(`📋 Sample program: ${programs[0].programName} (${programs[0].programCode})`);
    } else {
      console.log('⚠️ No programs found with current filter');
      
      // Debug: Check total programs in database
      const totalPrograms = await Program.countDocuments();
      const activePrograms = await Program.countDocuments({ isActive: true });
      const inactivePrograms = await Program.countDocuments({ isActive: false });
      
      console.log(`📊 Database stats:`);
      console.log(`   Total programs: ${totalPrograms}`);
      console.log(`   Active programs: ${activePrograms}`);
      console.log(`   Inactive programs: ${inactivePrograms}`);
    }
    
    res.json(programs);
  } catch (error) {
    console.error('❌ Error in getPrograms:', error);
    res.status(500);
    throw new Error(`Failed to fetch programs: ${error.message}`);
  }
});

// @desc    Fetch single program
// @route   GET /api/programs/:id
// @access  Public
const getProgramById = asyncHandler(async (req, res) => {
  try {
    console.log(`🔍 Fetching program by ID: ${req.params.id}`);
    
    const program = await Program.findById(req.params.id)
      .populate('programAdminId', 'email');

    if (program) {
      console.log(`✅ Found program: ${program.programName}`);
      res.json(program);
    } else {
      console.log(`❌ Program not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Program not found');
    }
  } catch (error) {
    console.error('❌ Error in getProgramById:', error);
    if (error.name === 'CastError') {
      res.status(400);
      throw new Error('Invalid program ID format');
    }
    throw error;
  }
});

// @desc    Create a program
// @route   POST /api/programs
// @access  Private/Admin
const createProgram = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating new program...');
    
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

    // Check if program with same code already exists
    const programExists = await Program.findOne({ programCode });

    if (programExists) {
      console.log(`❌ Program code already exists: ${programCode}`);
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
      console.log(`✅ Program created: ${program.programName} (${program.programCode})`);
      res.status(201).json(program);
    } else {
      console.log('❌ Failed to create program');
      res.status(400);
      throw new Error('Invalid program data');
    }
  } catch (error) {
    console.error('❌ Error in createProgram:', error);
    throw error;
  }
});

// @desc    Update a program
// @route   PUT /api/programs/:id
// @access  Private/Admin
const updateProgram = asyncHandler(async (req, res) => {
  try {
    console.log(`📝 Updating program: ${req.params.id}`);
    
    const program = await Program.findById(req.params.id);

    if (program) {
      // Check if programCode is being changed and if it conflicts
      if (req.body.programCode && req.body.programCode !== program.programCode) {
        const existingProgram = await Program.findOne({ 
          programCode: req.body.programCode,
          _id: { $ne: req.params.id }
        });
        
        if (existingProgram) {
          res.status(400);
          throw new Error('Program code already exists');
        }
      }

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
      
      console.log(`✅ Program updated: ${updatedProgram.programName}`);
      res.json(updatedProgram);
    } else {
      console.log(`❌ Program not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Program not found');
    }
  } catch (error) {
    console.error('❌ Error in updateProgram:', error);
    throw error;
  }
});

// @desc    Delete a program
// @route   DELETE /api/programs/:id
// @access  Private/Admin
const deleteProgram = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting program: ${req.params.id}`);
    
    const program = await Program.findById(req.params.id);

    if (program) {
      await program.deleteOne();
      console.log(`✅ Program deleted: ${program.programName}`);
      res.json({ message: 'Program removed' });
    } else {
      console.log(`❌ Program not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Program not found');
    }
  } catch (error) {
    console.error('❌ Error in deleteProgram:', error);
    throw error;
  }
});

// @desc    Get program statistics
// @route   GET /api/programs/statistics
// @access  Private/Admin
const getProgramStatistics = asyncHandler(async (req, res) => {
  try {
    console.log('📊 Fetching program statistics...');
    
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
    
    console.log(`✅ Generated statistics for ${statistics.length} programs`);
    res.json(statistics);
  } catch (error) {
    console.error('❌ Error in getProgramStatistics:', error);
    res.status(500);
    throw new Error(`Failed to generate program statistics: ${error.message}`);
  }
});

// @desc    Debug endpoint to check programs
// @route   GET /api/programs/debug
// @access  Public (remove in production)
const debugPrograms = asyncHandler(async (req, res) => {
  try {
    console.log('🐛 Debug endpoint called...');
    
    const totalPrograms = await Program.countDocuments();
    const activePrograms = await Program.countDocuments({ isActive: true });
    const inactivePrograms = await Program.countDocuments({ isActive: false });
    
    const samplePrograms = await Program.find().limit(3).select('programName programCode isActive');
    
    const debugInfo = {
      totalPrograms,
      activePrograms,
      inactivePrograms,
      samplePrograms,
      databaseConnection: 'Connected',
      modelWorking: true
    };
    
    console.log('🐛 Debug info:', debugInfo);
    res.json(debugInfo);
  } catch (error) {
    console.error('❌ Error in debugPrograms:', error);
    res.status(500).json({
      error: error.message,
      databaseConnection: 'Error',
      modelWorking: false
    });
  }
});

export {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStatistics,
  debugPrograms // Add this for debugging
};