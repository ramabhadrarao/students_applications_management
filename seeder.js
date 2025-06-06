import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Program from './backend/models/programModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    // Set mongoose options to avoid warnings and improve connection
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Provide helpful connection troubleshooting
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Connection Troubleshooting:');
      console.log('1. Check if MongoDB is running on your system');
      console.log('2. Verify MONGO_URI in your .env file');
      console.log('3. For local MongoDB, try: mongodb://localhost:27017/student_application_db');
      console.log('4. For MongoDB Atlas, ensure your IP is whitelisted');
      console.log('5. Check your internet connection for cloud databases');
    }
    
    process.exit(1);
  }
};

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📍 Connecting to: ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@') : 'No MONGO_URI found'}`);
    
    const conn = await connectDB();
    
    // Test with a simple query
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database connection test successful');
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw error;
  }
};

// Default programs data (same as before, truncated for brevity)
const programsData = [
  // UG Courses - B.Tech (4 Years)
  {
    programCode: 'BTECH_CSE',
    programName: 'B.Tech Computer Science and Engineering',
    programType: 'UG',
    department: 'Computer Science and Engineering',
    durationYears: 4,
    totalSeats: 600,
    applicationStartDate: new Date('2025-03-01'),
    applicationEndDate: new Date('2025-06-30'),
    eligibilityCriteria: 'Minimum 60% in 12th with Physics, Chemistry, Mathematics. Valid JEE Main score required.',
    feesStructure: 'Annual fee: ₹1,50,000. Additional charges: ₹25,000 (hostel), ₹15,000 (mess)',
    description: 'Comprehensive 4-year undergraduate program in Computer Science and Engineering covering software development, algorithms, data structures, and emerging technologies.',
    isActive: true,
    displayOrder: 1
  },
  {
    programCode: 'BTECH_CSE_DS',
    programName: 'B.Tech Computer Science and Engineering (Data Science)',
    programType: 'UG',
    department: 'Computer Science and Engineering',
    durationYears: 4,
    totalSeats: 120,
    applicationStartDate: new Date('2025-03-01'),
    applicationEndDate: new Date('2025-06-30'),
    eligibilityCriteria: 'Minimum 60% in 12th with Physics, Chemistry, Mathematics. Valid JEE Main score required.',
    feesStructure: 'Annual fee: ₹1,60,000. Additional charges: ₹25,000 (hostel), ₹15,000 (mess)',
    description: 'Specialized program focusing on data science, machine learning, big data analytics, and statistical computing.',
    isActive: true,
    displayOrder: 2
  },
  {
    programCode: 'BTECH_AI_ML',
    programName: 'B.Tech Artificial Intelligence and Machine Learning',
    programType: 'UG',
    department: 'Computer Science and Engineering',
    durationYears: 4,
    totalSeats: 180,
    applicationStartDate: new Date('2025-03-01'),
    applicationEndDate: new Date('2025-06-30'),
    eligibilityCriteria: 'Minimum 60% in 12th with Physics, Chemistry, Mathematics. Valid JEE Main score required.',
    feesStructure: 'Annual fee: ₹1,70,000. Additional charges: ₹25,000 (hostel), ₹15,000 (mess)',
    description: 'Cutting-edge program in artificial intelligence, machine learning, deep learning, and neural networks.',
    isActive: true,
    displayOrder: 3
  },
  {
    programCode: 'BCA',
    programName: 'Bachelor of Computer Application (BCA)',
    programType: 'UG',
    department: 'Computer Applications',
    durationYears: 3,
    totalSeats: 180,
    applicationStartDate: new Date('2025-03-01'),
    applicationEndDate: new Date('2025-06-30'),
    eligibilityCriteria: 'Minimum 50% in 12th with Mathematics as one of the subjects.',
    feesStructure: 'Annual fee: ₹80,000. Additional charges: ₹20,000 (hostel), ₹12,000 (mess)',
    description: '3-year undergraduate program in computer applications covering programming, web development, and software engineering.',
    isActive: true,
    displayOrder: 4
  },
  {
    programCode: 'BBA',
    programName: 'Bachelor of Business Administration (BBA)',
    programType: 'UG',
    department: 'Management Studies',
    durationYears: 3,
    totalSeats: 180,
    applicationStartDate: new Date('2025-03-01'),
    applicationEndDate: new Date('2025-06-30'),
    eligibilityCriteria: 'Minimum 50% in 12th from any stream.',
    feesStructure: 'Annual fee: ₹75,000. Additional charges: ₹20,000 (hostel), ₹12,000 (mess)',
    description: '3-year undergraduate program in business administration covering management principles, finance, and marketing.',
    isActive: true,
    displayOrder: 5
  }
  // Add more programs as needed...
];

// Function to seed programs
const seedPrograms = async () => {
  try {
    console.log('🌱 Starting program seeding...');
    
    // Clear existing programs
    console.log('🗑️  Clearing existing programs...');
    const deleteResult = await Program.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing programs`);
    
    // Insert new programs
    console.log('📝 Inserting new programs...');
    const insertedPrograms = await Program.insertMany(programsData);
    
    console.log(`✅ Successfully inserted ${insertedPrograms.length} programs`);
    
    // Display summary
    const summary = programsData.reduce((acc, program) => {
      acc[program.programType] = (acc[program.programType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Programs Summary:');
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} programs`);
    });
    
    const totalSeats = programsData.reduce((sum, program) => sum + program.totalSeats, 0);
    console.log(`\n🎓 Total Seats Available: ${totalSeats}`);
    
    return insertedPrograms;
  } catch (error) {
    console.error('❌ Error seeding programs:', error);
    throw error;
  }
};

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    console.log('👤 Creating default admin user...');
    
    // Dynamic import to avoid circular dependency issues
    const { default: User } = await import('./backend/models/userModel.js');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@college.edu', 
      role: 'admin' 
    }).maxTimeMS(20000); // 20 second timeout
    
    if (existingAdmin) {
      console.log('ℹ️  Default admin user already exists');
      console.log('   Email: admin@college.edu');
      console.log('   Role: admin');
      return existingAdmin;
    }
    
    // Create default admin
    const adminUser = await User.create({
      email: 'admin@college.edu',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    
    console.log('✅ Default admin user created successfully!');
    console.log('   📧 Email: admin@college.edu');
    console.log('   🔑 Password: admin123');
    console.log('   👑 Role: admin');
    console.log('\n⚠️  Please change the default password after first login!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    
    if (error.message.includes('buffering timed out')) {
      console.log('\n🔧 Database Timeout Troubleshooting:');
      console.log('1. Check if MongoDB service is running');
      console.log('2. Verify database connection string');
      console.log('3. Check network connectivity');
      console.log('4. Try increasing timeout in connection options');
    }
    
    throw error;
  }
};

// Function to check environment setup
const checkEnvironment = () => {
  console.log('🔍 Checking environment setup...');
  
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\n📝 Please create a .env file with the required variables:');
    console.log('   MONGO_URI=mongodb://localhost:27017/student_application_db');
    console.log('   JWT_SECRET=your_super_secret_jwt_key_here');
    process.exit(1);
  }
  
  console.log('✅ Environment variables check passed');
};

// Function to seed everything
const seedAll = async () => {
  try {
    console.log('🚀 Starting Student Application Management System setup...\n');
    
    // Check environment
    checkEnvironment();
    
    // Test database connection
    await testConnection();
    
    // Seed programs
    await seedPrograms();
    
    // Create default admin
    await createDefaultAdmin();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the application: npm run dev:all');
    console.log('   2. Open browser: http://localhost:5173');
    console.log('   3. Login with admin@college.edu / admin123');
    console.log('   4. Change the default admin password');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    // Ensure we close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Function to run admin-only seeding
const seedAdminOnly = async () => {
  try {
    console.log('👤 Creating admin user only...\n');
    
    // Check environment
    checkEnvironment();
    
    // Test database connection
    await testConnection();
    
    // Create default admin
    await createDefaultAdmin();
    
    console.log('\n✅ Admin user creation completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Admin creation failed:', error.message);
    process.exit(1);
  } finally {
    // Ensure we close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Function to run programs-only seeding
const seedProgramsOnly = async () => {
  try {
    console.log('📚 Seeding programs only...\n');
    
    // Check environment
    checkEnvironment();
    
    // Test database connection
    await testConnection();
    
    // Seed programs
    await seedPrograms();
    
    console.log('\n✅ Program seeding completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Program seeding failed:', error.message);
    process.exit(1);
  } finally {
    // Ensure we close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Main execution logic
const args = process.argv.slice(2);

if (args.includes('--admin-only')) {
  seedAdminOnly();
} else if (args.includes('--programs-only')) {
  seedProgramsOnly();
} else if (args.includes('--test-connection')) {
  testConnection().then(() => {
    console.log('✅ Connection test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  });
} else {
  seedAll();
}

export { seedPrograms, createDefaultAdmin, testConnection };