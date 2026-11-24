const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    slug: 'a5-device',
    title: 'A5 DEVICE',
    subtitle: 'GPS TRACKER A5 device GPS Device 1 YEAR REPLACEMENT Warranty',
    originalPrice: 4500.0,
    sellingPrice: 3200.0,
    discountPercent: 29,
    planOptions: ['1 Year', '2 Years', '3 Years'],
    primaryImage: '/products/a5-device.jpg',
    galleryImages: ['/products/a5-device.jpg'],
    description: 'GPS TRACKER A5 device GPS Device with 1 YEAR REPLACEMENT Warranty. Live GPS Tracking with Ride History feature provides accurate location tracking of your car or bike, including motion tracking even when the engine is turned OFF.',
    features: [
      'Anti-theft Protection: Receive real-time anti-theft alerts on your phone triggered by ignition activation, towing, or unauthorized wire tampering.',
      'Live Tracking & History: High precision GPS tracking with smooth ride history playback and instant speed monitoring.',
      'Connectivity & Alerts: Comes equipped with an in-built 4G SIM Card and smart AI alerts directly on your Advait mobile application.',
      'OverSpeed Alerts: Immediate notifications sent to owners or fleet managers via SMS and app push notifications.',
      'Geo-fence Alerts: Set virtual safety boundaries around frequent spots and receive alerts when vehicles enter or exit.',
      'Vehicle Movement Alarm + Overvoltage Protection: Alerts against unauthorized movement and protects device electronics from voltage spikes.',
      '90-Day History Records: Access detailed movement, stops, idling, and mileage logs over the past 90 days.'
    ],
    specs: {
      dimensions: 'L: 15 x B: 16 x H: 17 cm',
      weight: '125g',
      skuCode: '85269190',
      taxCode: '18% GST Included',
      color: 'Black'
    },
    whatsInBox: [
      '1x A5 GPS Tracker Device',
      '1x Wiring Harness with In-line Fuse',
      '1x Pre-configured 4G SIM Card',
      '1x Engine Immobilizer Relay',
      '1x User Manual & 1-Year Warranty Card'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Full Replacement Warranty',
      supportContact: '082829 82829 / sales@advaitteleservices.com'
    },
    rating: 5.0,
    reviewCount: 38
  },
  {
    slug: 'v5-device',
    title: 'V5 DEVICE',
    subtitle: 'High Precision Advanced Vehicle GPS Tracker with Remote Engine Cut-Off',
    originalPrice: 4999.0,
    sellingPrice: 3200.0,
    discountPercent: 36,
    planOptions: ['1 Year', '2 Years', '3 Years'],
    primaryImage: '/products/v5-device.jpg',
    galleryImages: ['/products/v5-device.jpg'],
    description: 'V5 GPS Device comes with 1 Year Replacement Warranty. Advanced vehicle telematics device designed for high durability and continuous monitoring. Supports anti-theft immobilizer and SOS emergency panic button.',
    features: [
      'Remote Engine Cut-Off: Remotely stop vehicle engine in case of unauthorized access or theft via Advait mobile app.',
      'High-Gain GPS Chipset: Instant satellite locking with sub-meter precision.',
      'Ignition Sensor: Instant notification as soon as ignition is turned on or off.',
      'External Battery Backup: Continues transmitting even if main vehicle battery is disconnected.',
      '90-Day Playback: View complete route, stops, idle time, and speeds.'
    ],
    specs: {
      dimensions: 'L: 14 x B: 12 x H: 15 cm',
      weight: '135g',
      skuCode: '85269191',
      taxCode: '18% GST Included',
      color: 'Matte Black'
    },
    whatsInBox: [
      '1x V5 GPS Tracker Unit',
      '1x Engine Cut-off Relay Cable',
      '1x Wiring Harness',
      '1x SOS Panic Button',
      '1x Warranty Documentation'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Replacement Warranty'
    },
    rating: 4.9,
    reviewCount: 29
  },
  {
    slug: 'obd-device',
    title: 'OBD DEVICE / OBD DEVICE WITH VOICE',
    subtitle: 'Plug & Play OBD-II Vehicle Tracker with Audio Monitoring',
    originalPrice: 6999.0,
    sellingPrice: 4999.0,
    discountPercent: 29,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/obd-device.jpg',
    galleryImages: ['/products/obd-device.jpg'],
    description: 'Zero wire-cutting installation! Simply plug into your car OBD-II port below the steering wheel. Includes remote voice monitoring microphone and vehicle diagnostic trouble code (DTC) reading.',
    features: [
      'Plug & Play: Plugs directly into standard vehicle OBD port without cutting a single wire.',
      'Remote Voice Listening: High-sensitivity built-in microphone for interior voice security.',
      'Vehicle Health Diagnostics: Reads battery voltage, engine load, and diagnostic codes.',
      'Instant Unplug Alert: Alerts your phone immediately if the device is removed from the OBD port.'
    ],
    specs: {
      dimensions: 'L: 8 x B: 5 x H: 3 cm',
      weight: '85g',
      skuCode: '85269192',
      taxCode: '18% GST Included',
      color: 'Black & Cyan'
    },
    whatsInBox: [
      '1x OBD-II Voice Tracker Device',
      '1x Quick Start Guide',
      '1x 1-Year Warranty Card'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 4.8,
    reviewCount: 19
  },
  {
    slug: 'id-card-tracker',
    title: 'ID CARD TRACKER',
    subtitle: 'Personal & Employee Smart ID Card GPS Tracker with SOS Button',
    originalPrice: 4999.0,
    sellingPrice: 4199.0,
    discountPercent: 16,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/id-card-tracker.jpg',
    galleryImages: ['/products/id-card-tracker.jpg'],
    description: 'Ultra-slim lanyard badge style GPS tracker designed for students, elderly family members, field executives, and security guards. Features dedicated SOS panic button and 2-way call functionality.',
    features: [
      'Ultra Slim Form Factor: Fits inside standard lanyard badge card holders.',
      'Instant SOS Panic Button: Sends immediate location coordinates and emergency call to preset guardian numbers.',
      'Two-Way Calling: Built-in speaker and mic allow crisp two-way communication.',
      'Geo-Fence Safety Zones: Immediate notification if child leaves school perimeter or designated area.'
    ],
    specs: {
      dimensions: 'L: 8.5 x B: 5.4 x H: 0.6 cm',
      weight: '48g',
      skuCode: '85269193',
      taxCode: '18% GST Included',
      color: 'White & Sky Blue'
    },
    whatsInBox: [
      '1x Smart ID Card GPS Device',
      '1x Magnetic USB Charging Cable',
      '1x Premium Lanyard with Clip',
      '1x User Manual'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 5.0,
    reviewCount: 15
  },
  {
    slug: 'fuel-sensor-ble',
    title: 'FUEL SENSOR(BLE)',
    subtitle: 'Wireless Bluetooth Ultra-Precision Capacitive Fuel Level Sensor',
    originalPrice: 22000.0,
    sellingPrice: 18500.0,
    discountPercent: 16,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/fuel-sensor-ble.jpg',
    galleryImages: ['/products/fuel-sensor-ble.jpg'],
    description: 'State-of-the-art wireless Bluetooth Low Energy (BLE 5.0) capacitive fuel sensor for trucks, buses, tractors, and heavy machinery. Eliminates complex wiring harnesses between fuel tank and tracker.',
    features: [
      'Wireless BLE 5.0: Quick calibration and cable-free data transmission to GPS unit.',
      '99.5% Fuel Measurement Accuracy: Detects rapid fuel drops, pilferage, and exact refill quantities in liters.',
      'Explosion-Proof & IP67: Certified safe for diesel and gasoline storage tanks.',
      'Live Dashboard Integration: Real-time liters graph and consumption reports.'
    ],
    specs: {
      dimensions: 'Rod length: 700mm / 1000mm (customizable)',
      weight: '750g',
      skuCode: '90261010',
      taxCode: '18% GST Included',
      color: 'Silver & Black'
    },
    whatsInBox: [
      '1x BLE Capacitive Fuel Rod Sensor',
      '1x Tank Mounting Flange & Gasket Kit',
      '1x Calibration Cable Unit',
      '1x Seal & Screws Set',
      '1x Installation Guide'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 4.9,
    reviewCount: 22
  },
  {
    slug: 'fuel-sensor-wired',
    title: 'FUEL SENSOR(WIRED)',
    subtitle: 'Industrial High-Grade Wired Capacitive Fuel Level Sensor with RS485/Analog Output',
    originalPrice: 20000.0,
    sellingPrice: 16500.0,
    discountPercent: 18,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/fuel-sensor-wired.jpg',
    galleryImages: ['/products/fuel-sensor-wired.jpg'],
    description: 'Industrial capacitive level transmitter designed for harsh commercial fleet environments. Provides continuous precision fuel volume measurements with RS485 / RS232 digital interface.',
    features: [
      'High Resilience: Shielded wiring harness resistant to engine heat, oil, and vibrations.',
      'Immediate Theft Alert: Detects overnight fuel siphoning and generates loud alarms.',
      'Refill Verification: Reconcile fuel station receipts with precise liters added.'
    ],
    specs: {
      dimensions: 'Rod length: 700mm / 1000mm',
      weight: '850g',
      skuCode: '90261020',
      taxCode: '18% GST Included',
      color: 'Industrial Metallic'
    },
    whatsInBox: [
      '1x Heavy-Duty Wired Fuel Level Sensor',
      '1x 8-Meter Oil-Resistant Shielded Cable',
      '1x Tank Flange with Rubber O-ring',
      '1x Technical Manual'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 4.8,
    reviewCount: 17
  },
  {
    slug: 'cctv-trueview-solar-4g',
    title: 'CCTV TRUEVIEW SOLAR 4G',
    subtitle: '100% Wire-Free 4G SIM Solar Powered PTZ Security Camera',
    originalPrice: 6400.0,
    sellingPrice: 6199.0,
    discountPercent: 3,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/cctv-trueview-solar-4g.jpg',
    galleryImages: ['/products/cctv-trueview-solar-4g.jpg'],
    description: 'Self-sustaining outdoor security camera equipped with high-efficiency monocrystalline solar panel and lithium-ion backup battery. Operates seamlessly on 4G LTE SIM cards without requiring local Wi-Fi or mains power.',
    features: [
      'Solar Powered + Long Life Battery: Never stops recording, completely independent of electric grid.',
      'Pan-Tilt-Zoom (PTZ): 355° horizontal and 90° vertical rotation controlled from smartphone app.',
      'Full Color Night Vision: Dual spotlight LEDs deliver color video surveillance in pitch darkness.',
      'PIR Human Detection: Smart AI recognizes human motion and avoids false alarms from wind or leaves.'
    ],
    specs: {
      dimensions: 'L: 22 x B: 18 x H: 25 cm',
      weight: '1.4kg',
      skuCode: '85258020',
      taxCode: '18% GST Included',
      color: 'Pure White'
    },
    whatsInBox: [
      '1x Trueview 4G Solar PTZ Camera',
      '1x Monocrystalline Solar Panel (8W)',
      '1x Adjustable Wall/Pole Mount Bracket',
      '1x Built-in Rechargeable Battery Pack',
      '1x Installation Screws & Manual'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 4.9,
    reviewCount: 26
  },
  {
    slug: 'magnetic-tracker',
    title: 'MAGNETIC TRACKER',
    subtitle: 'Portable GPS Tracker with Strong Neodymium Magnet & Rechargeable Battery',
    originalPrice: 6299.0,
    sellingPrice: 5499.0,
    discountPercent: 13,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/magnetic-tracker.jpg',
    galleryImages: ['/products/magnetic-tracker.jpg'],
    description: 'Heavy-duty magnetic tracker featuring ultra-powerful neodymium magnets that firmly attach to any metallic chassis, container, or vehicle underbody in 2 seconds. Zero wiring required.',
    features: [
      'Industrial Strength Magnet: Stays firmly anchored even across rough off-road terrain.',
      '6000mAh Battery: Up to 30 days of continuous standby and tracking on a single charge.',
      'Anti-Dismantle Drop Sensor: Optical light sensor triggers instant alert if device is detached.',
      'IP65 Waterproof Housing: Completely sealed against monsoon rains, mud, and road grime.'
    ],
    specs: {
      dimensions: 'L: 10 x B: 7.5 x H: 2.5 cm',
      weight: '240g',
      skuCode: '85269194',
      taxCode: '18% GST Included',
      color: 'Charcoal Black'
    },
    whatsInBox: [
      '1x Industrial Magnetic Tracker',
      '1x Micro USB Charging Cable',
      '1x Anti-tamper Optical Sensor Seal',
      '1x User Manual'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 4.9,
    reviewCount: 31
  },
  {
    slug: 'magnetic-tracker-voice',
    title: 'MAGNETIC TRACKER WITH VOICE',
    subtitle: 'Heavy Magnetic Tracker with Remote Voice Listening & Recording',
    originalPrice: 9000.0,
    sellingPrice: 7499.0,
    discountPercent: 17,
    planOptions: ['1 Year', '2 Years'],
    primaryImage: '/products/magnetic-tracker-voice.jpg',
    galleryImages: ['/products/magnetic-tracker-voice.jpg'],
    description: 'Combines ultra-strong magnetic vehicle mount with built-in high-fidelity microphone for remote audio surveillance, route replay, and covert asset tracking.',
    features: [
      'Remote Voice Listening: Dial into device to hear live surroundings or review recorded audio clips.',
      '10,000mAh Extended Battery: Supports up to 60 days on smart power saving mode.',
      'Multi-GNSS Positioning: GPS + Beidou + GLONASS + LBS cell-tower triangulation.',
      'Instant Movement Alarm: Wakes up and transmits coordinates as soon as asset starts moving.'
    ],
    specs: {
      dimensions: 'L: 11 x B: 8 x H: 3 cm',
      weight: '310g',
      skuCode: '85269195',
      taxCode: '18% GST Included',
      color: 'Stealth Black'
    },
    whatsInBox: [
      '1x Heavy Magnetic Tracker with HD Mic',
      '1x High-speed USB Charging Cable',
      '1x Quick Start Guide',
      '1x Warranty Card'
    ],
    manufacturerInfo: {
      brand: 'Advait Teleservices',
      countryOfOrigin: 'India',
      warranty: '1 Year Warranty'
    },
    rating: 5.0,
    reviewCount: 42
  }
];

const categoryBySlug = {
  'a5-device': 'vehicle-gps',
  'v5-device': 'vehicle-gps',
  'obd-device': 'vehicle-gps',
  'id-card-tracker': 'personal-gps',
  'fuel-sensor-ble': 'fuel-sensors',
  'fuel-sensor-wired': 'fuel-sensors',
  'cctv-trueview-solar-4g': 'solar-cctv',
  'magnetic-tracker': 'magnetic-trackers',
  'magnetic-tracker-voice': 'magnetic-trackers',
};

async function main() {
  console.log('Seeding products to PostgreSQL shop_advait database...');

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, category: categoryBySlug[p.slug] }
    });
    console.log(`✓ Seeded: ${p.title} (₹${p.sellingPrice})`);
  }

  console.log('\nAll 9 products seeded successfully into PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
