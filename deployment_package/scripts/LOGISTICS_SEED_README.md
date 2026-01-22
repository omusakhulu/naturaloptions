# Logistics Seed Data - Kenyan Fleet 🇰🇪

This script adds realistic Kenyan logistics data for testing the fleet management system.

## What Gets Created

### 🚛 Vehicles (5)

1. **Isuzu FRR Truck** (Nairobi)
   - Registration: `KCA 123X`
   - Type: TRUCK
   - Capacity: 5,000 kg
   - Year: 2022
   - Fuel: Diesel
   - Mileage: 45,000 km
   - Driver: James Mwangi Kamau

2. **Toyota Hilux Pickup** (Mombasa)
   - Registration: `KBZ 456Y`
   - Type: PICKUP
   - Capacity: 1,000 kg
   - Year: 2023
   - Fuel: Diesel
   - Mileage: 28,000 km
   - Driver: Sarah Wanjiku Njeri

3. **Mercedes-Benz Atego 1218 (20-foot Truck)** (Kisumu)
   - Registration: `KCB 789Z`
   - Type: TRUCK
   - Capacity: 8,000 kg
   - Year: 2021
   - Fuel: Diesel
   - Mileage: 65,000 km
   - Driver: Peter Odhiambo Otieno

4. **Toyota Hiace Van (Staff Transport)** (Nakuru)
   - Registration: `KCD 321W`
   - Type: VAN
   - Capacity: 800 kg
   - Year: 2023
   - Fuel: Petrol
   - Mileage: 15,000 km
   - Driver: Grace Akinyi Okoth

5. **Nissan Note (Small Car)** (Eldoret)
   - Registration: `KCE 555V`
   - Type: OTHER
   - Capacity: 200 kg
   - Year: 2024
   - Fuel: Petrol
   - Mileage: 8,000 km
   - Driver: David Kipchoge Korir

### 👨‍💼 Drivers (5) - Covering Major Kenyan Cities

1. **James Mwangi Kamau** (Nairobi - Truck Driver)
   - Email: j.mwangi@omnishop.co.ke
   - Phone: +254712345678
   - License: DL001234KE
   - License Expiry: Dec 31, 2026
   - Assigned Vehicle: Isuzu Truck (KCA 123X)
   - Status: AVAILABLE
   - Base: Nairobi

2. **Sarah Wanjiku Njeri** (Mombasa - Pickup Driver)
   - Email: s.wanjiku@omnishop.co.ke
   - Phone: +254723456789
   - License: DL005678KE
   - License Expiry: Jun 30, 2027
   - Assigned Vehicle: Toyota Hilux (KBZ 456Y)
   - Status: AVAILABLE
   - Base: Mombasa

3. **Peter Odhiambo Otieno** (Kisumu - Large Truck Driver)
   - Email: p.odhiambo@omnishop.co.ke
   - Phone: +254734567890
   - License: DL009876KE
   - License Expiry: Aug 15, 2026
   - Assigned Vehicle: Mercedes-Benz Atego (KCB 789Z)
   - Status: AVAILABLE
   - Base: Kisumu

4. **Grace Akinyi Okoth** (Nakuru - Van Driver)
   - Email: g.akinyi@omnishop.co.ke
   - Phone: +254745678901
   - License: DL112233KE
   - License Expiry: Mar 20, 2027
   - Assigned Vehicle: Toyota Hiace (KCD 321W)
   - Status: AVAILABLE
   - Base: Nakuru

5. **David Kipchoge Korir** (Eldoret - Small Car Driver)
   - Email: d.kipchoge@omnishop.co.ke
   - Phone: +254756789012
   - License: DL445566KE
   - License Expiry: Jan 10, 2028
   - Assigned Vehicle: Nissan Note (KCE 555V)
   - Status: AVAILABLE
   - Base: Eldoret

## How to Run

### Prerequisites
Make sure you've run the database migration first:
```bash
npx prisma db push
npx prisma generate
```

### Run the Seed Script
```bash
npm run seed:logistics
```

## Verification

After running the script, you can verify the data by:

1. **Via Dashboard**
   - Navigate to `/en/apps/logistics/dashboard`
   - You should see 5 drivers and 5 vehicles in the statistics
   - Available drivers: 5
   - Available vehicles: 5 (all assigned)
   - Fleet utilization: 100%

2. **Via Fleet Management**
   - Navigate to `/en/apps/logistics/fleet`
   - Check the "Drivers" tab - should show 5 drivers (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret)
   - Check the "Vehicles" tab - should show 5 vehicles (all assigned)
   - All vehicles should show "1 delivery" or "0 deliveries" today

3. **Via Database**
   ```bash
   npx prisma studio
   ```
   - Open Driver model - should see 5 entries with .co.ke emails
   - Open Vehicle model - should see 5 entries with Kenyan registrations (KCA, KBZ, KCB, KCD, KCE)

## Kenyan Context Features

### Authentic Kenyan Details:
- ✅ **Kenyan Names**: Mix of Kikuyu, Luo, Luhya, and Kalenjin names
- ✅ **Registration Plates**: Proper Kenyan format (KCA, KBZ, KCB, KCD, KCE)
- ✅ **Phone Numbers**: All use +254 country code with valid Kenyan mobile formats
- ✅ **Email Domains**: Using .co.ke domain for local business authenticity
- ✅ **License Numbers**: Format includes 'KE' suffix for Kenya
- ✅ **City Coverage**: Major Kenyan cities (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret)
- ✅ **Popular Vehicles**: Common Kenyan commercial vehicles (Isuzu, Toyota, Mercedes-Benz, Nissan)

### Fleet Details:
- **Total**: 5 vehicles, 5 drivers (all vehicles assigned)
- **Drivers**: All have valid Kenyan licenses expiring 2026-2028
- **Status**: All set to AVAILABLE and ready for delivery assignments
- **Vehicle Types**: TRUCK (2), PICKUP (1), VAN (1), OTHER (1)
- **Capacity Range**: 200 kg (small car) to 8,000 kg (20-foot truck)
- **Geographic Coverage**: Fleet distributed across 5 major Kenyan cities

### Technical Notes:
- Script is safe to run multiple times (creates new entries each time)
- Use Prisma Studio to view/clear data if needed
- All vehicles and drivers have realistic service dates and mileage
- Phone numbers follow Safaricom/Airtel number formats

## Next Steps

After seeding:
1. Test creating delivery assignments
2. Test the calendar view with scheduled deliveries
3. Test editing drivers and vehicles
4. Test changing statuses
