const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedLogistics() {
  try {
    console.log('🚚 Seeding logistics data...')

    // Create Truck Vehicle
    const truck = await prisma.vehicle.create({
      data: {
        registrationNo: 'KCA 123X',
        make: 'Isuzu',
        model: 'FRR',
        year: 2022,
        type: 'TRUCK',
        capacity: 5000, // 5000 kg
        status: 'AVAILABLE',
        mileage: 45000,
        fuelType: 'Diesel',
        engineCapacity: 5.2, // 5.2L engine
        fuelConsumption: 8.5, // 8.5 km/l
        lastService: new Date('2024-09-15'),
        nextService: new Date('2025-03-15')
      }
    })
    console.log('✅ Created Truck:', truck.registrationNo)

    // Create Pickup Vehicle
    const pickup = await prisma.vehicle.create({
      data: {
        registrationNo: 'KBZ 456Y',
        make: 'Toyota',
        model: 'Hilux',
        year: 2023,
        type: 'PICKUP',
        capacity: 1000, // 1000 kg
        status: 'AVAILABLE',
        mileage: 28000,
        fuelType: 'Diesel',
        engineCapacity: 2.8, // 2.8L engine
        fuelConsumption: 10.5, // 10.5 km/l
        lastService: new Date('2024-10-01'),
        nextService: new Date('2025-04-01')
      }
    })
    console.log('✅ Created Pickup:', pickup.registrationNo)

    // Create 20-foot Truck
    const largeTruck = await prisma.vehicle.create({
      data: {
        registrationNo: 'KCB 789Z',
        make: 'Mercedes-Benz',
        model: 'Atego 1218',
        year: 2021,
        type: 'TRUCK',
        capacity: 8000, // 8000 kg (20-foot truck)
        status: 'AVAILABLE',
        mileage: 65000,
        fuelType: 'Diesel',
        engineCapacity: 6.4, // 6.4L engine
        fuelConsumption: 7.2, // 7.2 km/l (lower due to size)
        lastService: new Date('2024-08-20'),
        nextService: new Date('2025-02-20')
      }
    })
    console.log('✅ Created 20-foot Truck:', largeTruck.registrationNo)

    // Create Staff Van
    const van = await prisma.vehicle.create({
      data: {
        registrationNo: 'KCD 321W',
        make: 'Toyota',
        model: 'Hiace',
        year: 2023,
        type: 'VAN',
        capacity: 800, // 800 kg
        status: 'AVAILABLE',
        mileage: 15000,
        fuelType: 'Petrol',
        engineCapacity: 2.7, // 2.7L engine
        fuelConsumption: 9.5, // 9.5 km/l
        lastService: new Date('2024-09-10'),
        nextService: new Date('2025-03-10')
      }
    })
    console.log('✅ Created Staff Van:', van.registrationNo)

    // Create Small Car
    const car = await prisma.vehicle.create({
      data: {
        registrationNo: 'KCE 555V',
        make: 'Nissan',
        model: 'Note',
        year: 2024,
        type: 'OTHER',
        capacity: 200, // 200 kg (small car)
        status: 'AVAILABLE',
        mileage: 8000,
        fuelType: 'Petrol',
        engineCapacity: 1.2, // 1.2L engine
        fuelConsumption: 18.5, // 18.5 km/l (most efficient)
        lastService: new Date('2024-10-15'),
        nextService: new Date('2025-04-15')
      }
    })
    console.log('✅ Created Small Car:', car.registrationNo)

    // Create Truck Driver (Nairobi based)
    const truckDriver = await prisma.driver.create({
      data: {
        name: 'James Mwangi Kamau',
        email: 'j.mwangi@omnishop.co.ke',
        phone: '+254712345678',
        licenseNumber: 'DL001234KE',
        licenseExpiry: new Date('2026-12-31'),
        status: 'AVAILABLE',
        vehicleId: truck.id
      }
    })
    console.log('✅ Created Truck Driver:', truckDriver.name)

    // Create Pickup Driver (Mombasa based)
    const pickupDriver = await prisma.driver.create({
      data: {
        name: 'Sarah Wanjiku Njeri',
        email: 's.wanjiku@omnishop.co.ke',
        phone: '+254723456789',
        licenseNumber: 'DL005678KE',
        licenseExpiry: new Date('2027-06-30'),
        status: 'AVAILABLE',
        vehicleId: pickup.id
      }
    })
    console.log('✅ Created Pickup Driver:', pickupDriver.name)

    // Create additional driver for 20-foot truck (Kisumu based)
    const largeTruckDriver = await prisma.driver.create({
      data: {
        name: 'Peter Odhiambo Otieno',
        email: 'p.odhiambo@omnishop.co.ke',
        phone: '+254734567890',
        licenseNumber: 'DL009876KE',
        licenseExpiry: new Date('2026-08-15'),
        status: 'AVAILABLE',
        vehicleId: largeTruck.id
      }
    })
    console.log('✅ Created Large Truck Driver:', largeTruckDriver.name)

    // Create van driver for staff transport (Nakuru based)
    const vanDriver = await prisma.driver.create({
      data: {
        name: 'Grace Akinyi Okoth',
        email: 'g.akinyi@omnishop.co.ke',
        phone: '+254745678901',
        licenseNumber: 'DL112233KE',
        licenseExpiry: new Date('2027-03-20'),
        status: 'AVAILABLE',
        vehicleId: van.id
      }
    })
    console.log('✅ Created Van Driver:', vanDriver.name)

    // Create small car driver (Eldoret based)
    const carDriver = await prisma.driver.create({
      data: {
        name: 'David Kipchoge Korir',
        email: 'd.kipchoge@omnishop.co.ke',
        phone: '+254756789012',
        licenseNumber: 'DL445566KE',
        licenseExpiry: new Date('2028-01-10'),
        status: 'AVAILABLE',
        vehicleId: car.id
      }
    })
    console.log('✅ Created Small Car Driver:', carDriver.name)

    console.log('\n🎉 Logistics data seeded successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Vehicles: 5 (All Assigned)`)
    console.log(`   - ${truck.registrationNo} (${truck.make} ${truck.model}) → ${truckDriver.name}`)
    console.log(`   - ${pickup.registrationNo} (${pickup.make} ${pickup.model}) → ${pickupDriver.name}`)
    console.log(`   - ${largeTruck.registrationNo} (${largeTruck.make} ${largeTruck.model}) → ${largeTruckDriver.name}`)
    console.log(`   - ${van.registrationNo} (${van.make} ${van.model}) → ${vanDriver.name}`)
    console.log(`   - ${car.registrationNo} (${car.make} ${car.model}) → ${carDriver.name}`)
    console.log(`\n   Drivers: 5 (Covering major Kenyan cities)`)
    console.log(`   - ${truckDriver.name} - Nairobi (${truck.registrationNo})`)
    console.log(`   - ${pickupDriver.name} - Mombasa (${pickup.registrationNo})`)
    console.log(`   - ${largeTruckDriver.name} - Kisumu (${largeTruck.registrationNo})`)
    console.log(`   - ${vanDriver.name} - Nakuru (${van.registrationNo})`)
    console.log(`   - ${carDriver.name} - Eldoret (${car.registrationNo})`)
  } catch (error) {
    console.error('❌ Error seeding logistics data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedLogistics()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
