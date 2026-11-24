export const productCategories = [
  { id: 'vehicle-gps', label: 'Vehicle GPS', items: [
    { label: 'A5 GPS Tracker', search: 'A5 DEVICE' },
    { label: 'V5 GPS Tracker', search: 'V5 DEVICE' },
    { label: 'OBD GPS Tracker', search: 'OBD DEVICE' },
  ] },
  { id: 'magnetic-trackers', label: 'Magnetic Trackers', items: [
    { label: 'Magnetic Tracker', search: 'MAGNETIC TRACKER' },
    { label: 'Tracker with Voice', search: 'MAGNETIC TRACKER WITH VOICE' },
  ] },
  { id: 'fuel-sensors', label: 'Fuel Sensors', items: [
    { label: 'Wired Fuel Sensor', search: 'FUEL SENSOR(WIRED)' },
    { label: 'BLE Fuel Sensor', search: 'FUEL SENSOR(BLE)' },
  ] },
  { id: 'personal-gps', label: 'Personal GPS', items: [
    { label: 'ID Card Tracker', search: 'ID CARD TRACKER' },
  ] },
  { id: 'solar-cctv', label: 'Solar CCTV', items: [
    { label: 'Solar 4G Camera', search: 'CCTV TRUEVIEW SOLAR 4G' },
  ] },
];

export const shopCategoryLink = (category, search) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  const query = params.toString();
  return query ? `/shop?${query}` : '/shop';
};