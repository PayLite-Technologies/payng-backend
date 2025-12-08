import { db } from '@/core/db'
import { users, schools, students, classes, feeSchedules, feeAssignments } from '@/db/schema'
import { hash } from '@node-rs/argon2'
import { config } from '@/core/config'

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create Super Admin
    console.log('👤 Creating super admin user...')
    const superAdminPasswordHash = await hash('SuperAdmin123!', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })

    const [superAdmin] = await db.insert(users).values({
      email: 'admin@payng.ng',
      passwordHash: superAdminPasswordHash,
      role: 'super_admin',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+2348123456789',
      emailVerified: true,
      isActive: true,
    }).returning()

    console.log(`✅ Super admin created: ${superAdmin.email}`)

    // Create sample schools
    console.log('🏫 Creating sample schools...')

    const [school1] = await db.insert(schools).values({
      name: 'Grace Academy',
      code: 'GRA001',
      email: 'info@graceacademy.edu.ng',
      phoneNumber: '+2348012345678',
      address: '123 Education Street, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      currency: 'NGN',
      academicYearFormat: '2024/2025',
      numberOfTerms: 3,
      paymentConfig: {
        arcaEnabled: true,
        flutterwaveEnabled: true,
        allowPartialPayment: true,
        lateFeePercentage: 5.0,
      },
      isActive: true,
      subscriptionStatus: 'active',
    }).returning()

    const [school2] = await db.insert(schools).values({
      name: 'Royal International School',
      code: 'RIS002',
      email: 'contact@royalinternational.edu.ng',
      phoneNumber: '+2348087654321',
      address: '456 Knowledge Avenue, Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      currency: 'NGN',
      academicYearFormat: '2024/2025',
      numberOfTerms: 3,
      paymentConfig: {
        arcaEnabled: true,
        flutterwaveEnabled: true,
        allowPartialPayment: false,
        lateFeePercentage: 10.0,
      },
      isActive: true,
      subscriptionStatus: 'trial',
    }).returning()

    console.log(`✅ Schools created: ${school1.name}, ${school2.name}`)

    // Create school admin for first school
    console.log('👨‍💼 Creating school admin...')
    const schoolAdminPasswordHash = await hash('Admin123!', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })

    const [schoolAdmin] = await db.insert(users).values({
      email: 'admin@graceacademy.edu.ng',
      passwordHash: schoolAdminPasswordHash,
      role: 'school_admin',
      firstName: 'John',
      lastName: 'Adebayo',
      phoneNumber: '+2348098765432',
      emailVerified: true,
      isActive: true,
    }).returning()

    // Link school admin to school
    await db.update(schools)
      .set({ adminUserId: schoolAdmin.id })
      .where({ id: school1.id })

    console.log(`✅ School admin created: ${schoolAdmin.email}`)

    // Create sample classes
    console.log('📚 Creating sample classes...')
    const classes1 = await db.insert(classes).values([
      {
        schoolId: school1.id,
        name: 'JSS 1A',
        level: 'JSS',
        section: 'A',
        academicYear: '2024/2025',
        capacity: 40,
        currentEnrollment: 0,
      },
      {
        schoolId: school1.id,
        name: 'JSS 1B',
        level: 'JSS',
        section: 'B',
        academicYear: '2024/2025',
        capacity: 40,
        currentEnrollment: 0,
      },
      {
        schoolId: school1.id,
        name: 'JSS 2A',
        level: 'JSS',
        section: 'A',
        academicYear: '2024/2025',
        capacity: 35,
        currentEnrollment: 0,
      },
      {
        schoolId: school1.id,
        name: 'SSS 1A',
        level: 'SSS',
        section: 'A',
        academicYear: '2024/2025',
        capacity: 30,
        currentEnrollment: 0,
      },
    ]).returning()

    console.log(`✅ Created ${classes1.length} classes`)

    // Create sample parents
    console.log('👨‍👩‍👧‍👦 Creating sample parents...')
    const parentPasswordHash = await hash('Parent123!', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })

    const [parent1] = await db.insert(users).values({
      email: 'parent1@example.com',
      passwordHash: parentPasswordHash,
      role: 'parent',
      firstName: 'Mary',
      lastName: 'Johnson',
      phoneNumber: '+2348123456790',
      emailVerified: true,
      isActive: true,
    }).returning()

    const [parent2] = await db.insert(users).values({
      email: 'parent2@example.com',
      passwordHash: parentPasswordHash,
      role: 'parent',
      firstName: 'David',
      lastName: 'Okafor',
      phoneNumber: '+2348123456791',
      emailVerified: true,
      isActive: true,
    }).returning()

    console.log(`✅ Created sample parents`)

    // Create sample students
    console.log('👨‍🎓 Creating sample students...')
    const [student1] = await db.insert(students).values({
      studentId: 'GRA/2024/001',
      admissionNumber: 'ADM/001/2024',
      schoolId: school1.id,
      parentUserIds: [parent1.id],
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: '2010-05-15',
      gender: 'female',
      classId: classes1[0].id,
      currentTerm: 'Term 1',
      academicYear: '2024/2025',
      status: 'active',
      enrollmentDate: new Date('2024-09-01'),
    }).returning()

    const [student2] = await db.insert(students).values({
      studentId: 'GRA/2024/002',
      admissionNumber: 'ADM/002/2024',
      schoolId: school1.id,
      parentUserIds: [parent1.id],
      firstName: 'Michael',
      lastName: 'Johnson',
      dateOfBirth: '2008-08-20',
      gender: 'male',
      classId: classes1[2].id,
      currentTerm: 'Term 1',
      academicYear: '2024/2025',
      status: 'active',
      enrollmentDate: new Date('2024-09-01'),
    }).returning()

    const [student3] = await db.insert(students).values({
      studentId: 'GRA/2024/003',
      admissionNumber: 'ADM/003/2024',
      schoolId: school1.id,
      parentUserIds: [parent2.id],
      firstName: 'Grace',
      lastName: 'Okafor',
      dateOfBirth: '2009-12-10',
      gender: 'female',
      classId: classes1[1].id,
      currentTerm: 'Term 1',
      academicYear: '2024/2025',
      status: 'active',
      enrollmentDate: new Date('2024-09-01'),
    }).returning()

    console.log(`✅ Created ${[student1, student2, student3].length} students`)

    // Update class enrollment counts
    await Promise.all([
      db.update(classes).set({ currentEnrollment: 1 }).where({ id: classes1[0].id }),
      db.update(classes).set({ currentEnrollment: 1 }).where({ id: classes1[1].id }),
      db.update(classes).set({ currentEnrollment: 1 }).where({ id: classes1[2].id }),
    ])

    // Create sample fee schedules
    console.log('💰 Creating sample fee schedules...')
    const feeSchedules1 = await db.insert(feeSchedules).values([
      {
        schoolId: school1.id,
        name: 'JSS 1 Tuition Fee - Term 1',
        feeType: 'tuition',
        amount: '150000.00',
        currency: 'NGN',
        academicYear: '2024/2025',
        term: 'Term 1',
        frequency: 'per_term',
        applicableTo: {
          classIds: [classes1[0].id, classes1[1].id],
        },
        dueDate: new Date('2024-10-31'),
        lateFeesApply: true,
        lateFeePercentage: '5.00',
        description: 'First term tuition fee for JSS 1 students',
        isActive: true,
      },
      {
        schoolId: school1.id,
        name: 'JSS 2 Tuition Fee - Term 1',
        feeType: 'tuition',
        amount: '160000.00',
        currency: 'NGN',
        academicYear: '2024/2025',
        term: 'Term 1',
        frequency: 'per_term',
        applicableTo: {
          classIds: [classes1[2].id],
        },
        dueDate: new Date('2024-10-31'),
        lateFeesApply: true,
        lateFeePercentage: '5.00',
        description: 'First term tuition fee for JSS 2 students',
        isActive: true,
      },
      {
        schoolId: school1.id,
        name: 'School Bus Transport Fee',
        feeType: 'transport',
        amount: '25000.00',
        currency: 'NGN',
        academicYear: '2024/2025',
        term: 'Term 1',
        frequency: 'per_term',
        applicableTo: {
          allStudents: true,
        },
        dueDate: new Date('2024-10-15'),
        lateFeesApply: false,
        description: 'School bus transportation fee for Term 1',
        isActive: true,
      },
      {
        schoolId: school1.id,
        name: 'Textbook and Materials Fee',
        feeType: 'textbook',
        amount: '35000.00',
        currency: 'NGN',
        academicYear: '2024/2025',
        term: 'Term 1',
        frequency: 'per_term',
        applicableTo: {
          allStudents: true,
        },
        dueDate: new Date('2024-09-30'),
        lateFeesApply: true,
        lateFeePercentage: '2.50',
        description: 'Textbooks and learning materials for Term 1',
        isActive: true,
      },
    ]).returning()

    console.log(`✅ Created ${feeSchedules1.length} fee schedules`)

    // Create fee assignments for students
    console.log('📋 Creating fee assignments...')
    const assignments = []

    // Assign tuition fees based on class
    const tuitionFee1 = feeSchedules1.find(f => f.name.includes('JSS 1'))!
    const tuitionFee2 = feeSchedules1.find(f => f.name.includes('JSS 2'))!
    const transportFee = feeSchedules1.find(f => f.feeType === 'transport')!
    const textbookFee = feeSchedules1.find(f => f.feeType === 'textbook')!

    // Student 1 (JSS 1A) assignments
    assignments.push(
      {
        schoolId: school1.id,
        studentId: student1.id,
        feeScheduleId: tuitionFee1.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: tuitionFee1.amount,
        finalAmount: tuitionFee1.amount,
        discountAmount: '0.00',
        amountDue: tuitionFee1.amount,
        status: 'pending' as const,
        dueDate: tuitionFee1.dueDate,
      },
      {
        schoolId: school1.id,
        studentId: student1.id,
        feeScheduleId: transportFee.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: transportFee.amount,
        finalAmount: transportFee.amount,
        discountAmount: '0.00',
        amountDue: transportFee.amount,
        status: 'pending' as const,
        dueDate: transportFee.dueDate,
      },
      {
        schoolId: school1.id,
        studentId: student1.id,
        feeScheduleId: textbookFee.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: textbookFee.amount,
        finalAmount: textbookFee.amount,
        discountAmount: '0.00',
        amountDue: textbookFee.amount,
        status: 'pending' as const,
        dueDate: textbookFee.dueDate,
      }
    )

    // Student 2 (JSS 2A) assignments - with sibling discount
    assignments.push(
      {
        schoolId: school1.id,
        studentId: student2.id,
        feeScheduleId: tuitionFee2.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: tuitionFee2.amount,
        finalAmount: '144000.00', // 10% sibling discount
        discountAmount: '16000.00',
        discountReason: 'Sibling discount (10%)',
        amountDue: '144000.00',
        status: 'pending' as const,
        dueDate: tuitionFee2.dueDate,
      },
      {
        schoolId: school1.id,
        studentId: student2.id,
        feeScheduleId: transportFee.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: transportFee.amount,
        finalAmount: transportFee.amount,
        discountAmount: '0.00',
        amountDue: transportFee.amount,
        status: 'pending' as const,
        dueDate: transportFee.dueDate,
      },
      {
        schoolId: school1.id,
        studentId: student2.id,
        feeScheduleId: textbookFee.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: textbookFee.amount,
        finalAmount: textbookFee.amount,
        discountAmount: '0.00',
        amountDue: textbookFee.amount,
        status: 'pending' as const,
        dueDate: textbookFee.dueDate,
      }
    )

    // Student 3 (JSS 1B) assignments
    assignments.push(
      {
        schoolId: school1.id,
        studentId: student3.id,
        feeScheduleId: tuitionFee1.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: tuitionFee1.amount,
        finalAmount: tuitionFee1.amount,
        discountAmount: '0.00',
        amountDue: tuitionFee1.amount,
        status: 'pending' as const,
        dueDate: tuitionFee1.dueDate,
      },
      {
        schoolId: school1.id,
        studentId: student3.id,
        feeScheduleId: transportFee.id,
        academicYear: '2024/2025',
        term: 'Term 1',
        originalAmount: transportFee.amount,
        finalAmount: transportFee.amount,
        discountAmount: '0.00',
        amountDue: transportFee.amount,
        status: 'pending' as const,
        dueDate: transportFee.dueDate,
      }
    )

    await db.insert(feeAssignments).values(assignments)
    console.log(`✅ Created ${assignments.length} fee assignments`)

    // Summary
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary of created data:')
    console.log(`   • 1 Super Admin: admin@payng.ng`)
    console.log(`   • 1 School Admin: admin@graceacademy.edu.ng`)
    console.log(`   • 2 Parents: parent1@example.com, parent2@example.com`)
    console.log(`   • 2 Schools: Grace Academy, Royal International School`)
    console.log(`   • 4 Classes in Grace Academy`)
    console.log(`   • 3 Students enrolled`)
    console.log(`   • 4 Fee schedules created`)
    console.log(`   • ${assignments.length} Fee assignments created`)

    console.log('\n🔑 Test Credentials:')
    console.log('   Super Admin: admin@payng.ng / SuperAdmin123!')
    console.log('   School Admin: admin@graceacademy.edu.ng / Admin123!')
    console.log('   Parent 1: parent1@example.com / Parent123!')
    console.log('   Parent 2: parent2@example.com / Parent123!')

    console.log('\n💡 Next steps:')
    console.log('   1. Test authentication endpoints')
    console.log('   2. Test fee payment flows')
    console.log('   3. Test receipt generation')
    console.log('   4. Configure payment gateways (Arca/Flutterwave)')

  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }
