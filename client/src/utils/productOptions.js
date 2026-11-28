export const SIM_OPTIONS = [
  {
    id: 'Without SIM',
    label: 'Without SIM',
    caption: 'Use your own active M2M / 4G SIM',
    carrier: 'none',
  },
  {
    id: 'Vodafone SIM',
    label: 'Vodafone SIM',
    caption: 'Pre-installed Vi 4G M2M IoT SIM',
    carrier: 'vi',
  },
  {
    id: 'Airtel SIM',
    label: 'Airtel SIM',
    caption: 'Pre-installed Airtel 4G IoT SIM',
    carrier: 'airtel',
  },
];

const NON_SIM_PRODUCT_PATTERN =
  /fuel[-_\s]?sensor|cctv|solar|cable|relay|bracket|cover|adapter|charger|mount|accessory|bluetooth|rfid/i;
const NO_SIM_CONNECTIVITY_PATTERN =
  /no\s+separate\s+sim|no\s+sim|bluetooth|\bble\b|wi-?fi\s+only/i;
const GPS_CATEGORY_IDS = new Set(['vehicle-gps', 'magnetic-trackers', 'personal-gps', 'dash-cameras']);

/**
 * Returns true strictly for SIM-enabled cellular GPS trackers and 4G GPS dashcams
 * (excludes fuel sensors, solar CCTV cameras, accessories, and no-SIM products).
 */
export function isGpsProduct(product) {
  if (!product) return false;
  const descriptor = `${product.slug || ''} ${product.title || ''} ${product.category || ''}`;
  if (NON_SIM_PRODUCT_PATTERN.test(descriptor)) return false;
  const connectivity = typeof product.specs?.connectivity === 'string' ? product.specs.connectivity : '';
  if (NO_SIM_CONNECTIVITY_PATTERN.test(connectivity)) return false;
  if (GPS_CATEGORY_IDS.has(product.category)) return true;
  return /gps|tracker|obd|magnetic|dash[-_\s]?cam/i.test(`${product.slug || ''} ${product.title || ''}`);
}

export function formatPlanSelection(plan, sim) {
  if (!plan) return '';
  if (!sim) return plan;
  return `${plan} · ${sim}`;
}

export function splitPlanSelection(planDuration = '') {
  if (typeof planDuration !== 'string') return { plan: '1 Year', sim: '' };
  const [plan, sim] = planDuration.split(' · ');
  return { plan: plan || planDuration, sim: sim || '' };
}

const SPEC_LABELS = {
  color: 'Finish / Color',
  weight: 'Unit Weight',
  dimensions: 'Dimensions',
  battery: 'Battery & Backup',
  powerSupply: 'Power Input',
  connectivity: 'Network & SIM',
  gnss: 'Positioning System',
  compatibility: 'Compatible With',
  waterproof: 'Weather Protection',
  operatingTemp: 'Operating Temp',
  warranty: 'Warranty Coverage',
  skuCode: 'HSN / SKU Code',
  taxCode: 'Tax & Billing',
};

export function isValidClientPlan(product, rawPlan) {
  if (!product || typeof rawPlan !== 'string') return false;
  const options = Array.isArray(product.planOptions) ? product.planOptions : ['1 Year'];
  const trimmed = rawPlan.trim();
  if (!trimmed) return false;
  if (options.includes(trimmed)) return true;
  const parts = trimmed.split(' · ');
  if (parts.length !== 2) return false;
  const [plan, sim] = parts;
  return Boolean(
    isGpsProduct(product) &&
    options.includes(plan) &&
    SIM_OPTIONS.some((opt) => opt.id === sim)
  );
}

export function formatSpecLabel(key = '') {
  if (SPEC_LABELS[key]) return SPEC_LABELS[key];
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
