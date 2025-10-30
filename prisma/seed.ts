import { PrismaClient, Prisma } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password untuk semua user (password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==================== USERS & ROLES ====================
  console.log('👤 Creating users...');

  // Super Admin
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@travelapp.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      admin: {
        create: {
          name: 'Super Admin',
          phone: '+6281234567890',
          coinBalance: 1000000, // Super admin punya banyak coin
        },
      },
    },
  });

  // Admin Medan
  const adminMedan = await prisma.user.create({
    data: {
      email: 'admin.medan@travelapp.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      admin: {
        create: {
          name: 'Admin Medan',
          phone: '+6281234567891',
          coinBalance: 50000,
        },
      },
    },
  });

  // Admin Palembang
  const adminPalembang = await prisma.user.create({
    data: {
      email: 'admin.palembang@travelapp.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      admin: {
        create: {
          name: 'Admin Palembang',
          phone: '+6281234567892',
          coinBalance: 50000,
        },
      },
    },
  });

  // Drivers
  const driver1 = await prisma.user.create({
    data: {
      email: 'driver1@travelapp.com',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
      driver: {
        create: {
          name: 'Budi Santoso',
          phone: '+6281234567893',
          licenseNumber: 'A1234567890123',
          address: 'Jl. Gatot Subroto No. 45, Medan',
          status: 'AVAILABLE',
        },
      },
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@travelapp.com',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
      driver: {
        create: {
          name: 'Andi Wijaya',
          phone: '+6281234567894',
          licenseNumber: 'A9876543210987',
          address: 'Jl. Ahmad Yani No. 78, Padang',
          status: 'AVAILABLE',
        },
      },
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      email: 'driver3@travelapp.com',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
      driver: {
        create: {
          name: 'Rudi Hartono',
          phone: '+6281234567895',
          licenseNumber: 'A5555666677778',
          address: 'Jl. Sudirman No. 12, Palembang',
          status: 'AVAILABLE',
        },
      },
    },
  });

  // Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@gmail.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      customer: {
        create: {
          name: 'Siti Nurhaliza',
          phone: '+6281234567896',
          address: 'Jl. Merdeka No. 100, Medan',
        },
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@gmail.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      customer: {
        create: {
          name: 'Ahmad Fauzi',
          phone: '+6281234567897',
          address: 'Jl. Pemuda No. 55, Banda Aceh',
        },
      },
    },
  });

  console.log('✅ Users created');

  // ==================== RUTE PERJALANAN SUMATERA ====================
  console.log('🗺️  Creating routes...');

  const routes = await prisma.route.createMany({
    data: [
      // Sumatera Utara
      {
        routeCode: 'MDN-ACH-001',
        origin: 'Medan',
        destination: 'Banda Aceh',
        distance: 420,
        estimatedDuration: 480, // 8 jam
        basePrice: 250000,
        isActive: true,
      },
      {
        routeCode: 'ACH-MDN-001',
        origin: 'Banda Aceh',
        destination: 'Medan',
        distance: 420,
        estimatedDuration: 480,
        basePrice: 250000,
        isActive: true,
      },
      {
        routeCode: 'MDN-PDG-001',
        origin: 'Medan',
        destination: 'Padang',
        distance: 630,
        estimatedDuration: 720, // 12 jam
        basePrice: 350000,
        isActive: true,
      },
      {
        routeCode: 'PDG-MDN-001',
        origin: 'Padang',
        destination: 'Medan',
        distance: 630,
        estimatedDuration: 720,
        basePrice: 350000,
        isActive: true,
      },

      // Sumatera Barat - Sumatera Selatan
      {
        routeCode: 'PDG-PLM-001',
        origin: 'Padang',
        destination: 'Palembang',
        distance: 530,
        estimatedDuration: 600, // 10 jam
        basePrice: 300000,
        isActive: true,
      },
      {
        routeCode: 'PLM-PDG-001',
        origin: 'Palembang',
        destination: 'Padang',
        distance: 530,
        estimatedDuration: 600,
        basePrice: 300000,
        isActive: true,
      },

      // Sumatera Selatan - Lampung
      {
        routeCode: 'PLM-LPG-001',
        origin: 'Palembang',
        destination: 'Bandar Lampung',
        distance: 320,
        estimatedDuration: 360, // 6 jam
        basePrice: 200000,
        isActive: true,
      },
      {
        routeCode: 'LPG-PLM-001',
        origin: 'Bandar Lampung',
        destination: 'Palembang',
        distance: 320,
        estimatedDuration: 360,
        basePrice: 200000,
        isActive: true,
      },

      // Medan - Pekanbaru
      {
        routeCode: 'MDN-PKU-001',
        origin: 'Medan',
        destination: 'Pekanbaru',
        distance: 470,
        estimatedDuration: 540, // 9 jam
        basePrice: 280000,
        isActive: true,
      },
      {
        routeCode: 'PKU-MDN-001',
        origin: 'Pekanbaru',
        destination: 'Medan',
        distance: 470,
        estimatedDuration: 540,
        basePrice: 280000,
        isActive: true,
      },

      // Pekanbaru - Padang
      {
        routeCode: 'PKU-PDG-001',
        origin: 'Pekanbaru',
        destination: 'Padang',
        distance: 350,
        estimatedDuration: 420, // 7 jam
        basePrice: 220000,
        isActive: true,
      },
      {
        routeCode: 'PDG-PKU-001',
        origin: 'Padang',
        destination: 'Pekanbaru',
        distance: 350,
        estimatedDuration: 420,
        basePrice: 220000,
        isActive: true,
      },

      // Jambi Routes
      {
        routeCode: 'PLM-JMB-001',
        origin: 'Palembang',
        destination: 'Jambi',
        distance: 250,
        estimatedDuration: 300, // 5 jam
        basePrice: 180000,
        isActive: true,
      },
      {
        routeCode: 'JMB-PLM-001',
        origin: 'Jambi',
        destination: 'Palembang',
        distance: 250,
        estimatedDuration: 300,
        basePrice: 180000,
        isActive: true,
      },

      // Bengkulu Routes
      {
        routeCode: 'PDG-BKL-001',
        origin: 'Padang',
        destination: 'Bengkulu',
        distance: 280,
        estimatedDuration: 330, // 5.5 jam
        basePrice: 190000,
        isActive: true,
      },
      {
        routeCode: 'BKL-PDG-001',
        origin: 'Bengkulu',
        destination: 'Padang',
        distance: 280,
        estimatedDuration: 330,
        basePrice: 190000,
        isActive: true,
      },
    ],
  });

  console.log('✅ Routes created');

  // ==================== KENDARAAN ====================
  console.log('🚐 Creating vehicles...');

  const vehicles = await prisma.vehicle.createMany({
    data: [
      // Kendaraan Eksekutif (Kapasitas 5)
      {
        vehicleNumber: 'BK 1234 AA',
        type: 'EKSEKUTIF',
        brand: 'Toyota',
        model: 'Hiace Commuter',
        capacity: 5,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BK 5678 AB',
        type: 'EKSEKUTIF',
        brand: 'Isuzu',
        model: 'Elf Microbus',
        capacity: 5,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BA 9012 AC',
        type: 'EKSEKUTIF',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        capacity: 5,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BA 3456 AD',
        type: 'EKSEKUTIF',
        brand: 'Toyota',
        model: 'Hiace Premio',
        capacity: 5,
        status: 'AVAILABLE',
      },

      // Kendaraan Regular (Kapasitas 7)
      {
        vehicleNumber: 'BK 7890 BA',
        type: 'REGULAR',
        brand: 'Isuzu',
        model: 'Elf Long',
        capacity: 7,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BK 2345 BB',
        type: 'REGULAR',
        brand: 'Mitsubishi',
        model: 'Colt Diesel',
        capacity: 7,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BA 6789 BC',
        type: 'REGULAR',
        brand: 'Isuzu',
        model: 'Elf NKR',
        capacity: 7,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BA 1234 BD',
        type: 'REGULAR',
        brand: 'Toyota',
        model: 'Dyna',
        capacity: 7,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BM 5678 BE',
        type: 'REGULAR',
        brand: 'Mitsubishi',
        model: 'Fuso',
        capacity: 7,
        status: 'AVAILABLE',
      },
      {
        vehicleNumber: 'BM 9012 BF',
        type: 'REGULAR',
        brand: 'Hino',
        model: 'Dutro',
        capacity: 7,
        status: 'AVAILABLE',
      },
    ],
  });

  console.log('✅ Vehicles created');

  // ==================== JADWAL PERJALANAN ====================
  console.log('📅 Creating schedules...');

  // Get routes and vehicles for schedule creation
  const allRoutes = await prisma.route.findMany();
  const allVehicles = await prisma.vehicle.findMany();
  const allDrivers = await prisma.driver.findMany();

  // Create schedules untuk minggu depan
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const schedules: Prisma.ScheduleCreateManyInput[] = [];

  // Buat beberapa jadwal untuk berbagai rute
  for (let i = 0; i < 5; i++) {
    const departureDate = new Date(tomorrow);
    departureDate.setDate(departureDate.getDate() + i);

    // Jadwal pagi (08:00)
    schedules.push({
      routeId: allRoutes[0].id, // Medan - Banda Aceh
      vehicleId: allVehicles[0].id,
      driverId: allDrivers[0].id,
      departureTime: new Date(departureDate.setHours(8, 0, 0, 0)),
      price: 300000,
      availableSeats: 5,
      status: 'SCHEDULED' as const,
    });

    // Jadwal siang (14:00)
    schedules.push({
      routeId: allRoutes[2].id, // Medan - Padang
      vehicleId: allVehicles[4].id,
      driverId: allDrivers[1].id,
      departureTime: new Date(departureDate.setHours(14, 0, 0, 0)),
      price: 400000,
      availableSeats: 7,
      status: 'SCHEDULED' as const,
    });

    // Jadwal malam (20:00)
    schedules.push({
      routeId: allRoutes[4].id, // Padang - Palembang
      vehicleId: allVehicles[1].id,
      driverId: allDrivers[2].id,
      departureTime: new Date(departureDate.setHours(20, 0, 0, 0)),
      price: 350000,
      availableSeats: 5,
      status: 'SCHEDULED' as const,
    });
  }

  await prisma.schedule.createMany({
    data: schedules,
  });

  console.log('✅ Schedules created');

  // ==================== SYSTEM CONFIG ====================
  console.log('⚙️  Creating system config...');

  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'COIN_PER_TICKET',
        value: '10000',
        description: 'Biaya coin per penumpang untuk booking tiket',
      },
      {
        key: 'COIN_PER_TRAVEL_DOCUMENT',
        value: '10000',
        description: 'Biaya coin untuk penerbitan surat jalan',
      },
      {
        key: 'MIN_BOOKING_HOURS',
        value: '2',
        description: 'Minimal jam sebelum keberangkatan untuk booking',
      },
      {
        key: 'CANCEL_REFUND_PERCENTAGE',
        value: '80',
        description: 'Persentase refund untuk pembatalan tiket',
      },
      {
        key: 'APP_NAME',
        value: 'Mobile Travel App',
        description: 'Nama aplikasi',
      },
      {
        key: 'SUPPORT_EMAIL',
        value: 'support@travelapp.com',
        description: 'Email support',
      },
      {
        key: 'SUPPORT_PHONE',
        value: '+6281234567890',
        description: 'Nomor telepon support',
      },
    ],
  });

  console.log('✅ System config created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📋 Summary:');
  console.log('   - Super Admin: superadmin@travelapp.com');
  console.log('   - Admin Medan: admin.medan@travelapp.com');
  console.log('   - Admin Palembang: admin.palembang@travelapp.com');
  console.log('   - Drivers: driver1@travelapp.com, driver2@travelapp.com, driver3@travelapp.com');
  console.log('   - Customers: customer1@gmail.com, customer2@gmail.com');
  console.log('   - Password untuk semua user: password123');
  console.log(`   - Routes: ${allRoutes.length} rute di wilayah Sumatera`);
  console.log(`   - Vehicles: ${allVehicles.length} kendaraan (Eksekutif: 5 seat, Regular: 7 seat)`);
  console.log(`   - Schedules: ${schedules.length} jadwal untuk 5 hari ke depan`);
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
