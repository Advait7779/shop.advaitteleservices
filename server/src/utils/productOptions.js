const SIM_OPTION_CARDS = [
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

const SIM_OPTIONS = SIM_OPTION_CARDS.map((opt) => opt.id);

const NON_SIM_PRODUCT_PATTERN =
  /fuel[-_\s]?sensor|cctv|solar|cable|relay|bracket|cover|adapter|charger|mount|accessory|bluetooth|rfid/i;
const NO_SIM_CONNECTIVITY_PATTERN =
  /no\s+separate\s+sim|no\s+sim|bluetooth|\bble\b|wi-?fi\s+only/i;
const GPS_CATEGORY_IDS = new Set(['vehicle-gps', 'magnetic-trackers', 'personal-gps', 'dash-cameras']);

/**
 * Returns true strictly for SIM-enabled cellular GPS trackers and 4G GPS dashcams
 * (excludes fuel sensors, solar CCTV cameras, accessories, and no-SIM products).
 */
function isGpsProduct(product) {
  if (!product) return false;
  const descriptor = `${product.slug || ''} ${product.title || ''} ${product.category || ''}`;
  if (NON_SIM_PRODUCT_PATTERN.test(descriptor)) return false;
  const connectivity = typeof product.specs?.connectivity === 'string' ? product.specs.connectivity : '';
  if (NO_SIM_CONNECTIVITY_PATTERN.test(connectivity)) return false;
  if (GPS_CATEGORY_IDS.has(product.category)) return true;
  return /gps|tracker|obd|magnetic|dash[-_\s]?cam/i.test(`${product.slug || ''} ${product.title || ''}`);
}

/**
 * Validates selected plan string against product planOptions and optional SIM choice on GPS items.
 */
function isValidProductPlan(product, rawPlan) {
  if (!product || typeof rawPlan !== 'string' || !Array.isArray(product.planOptions)) return false;
  const trimmed = rawPlan.trim();
  if (!trimmed) return false;
  if (product.planOptions.includes(trimmed)) return true;

  const parts = trimmed.split(' · ');
  if (parts.length !== 2) return false;
  const [basePlan, simOption] = parts;
  return Boolean(
    isGpsProduct(product) &&
    product.planOptions.includes(basePlan) &&
    SIM_OPTIONS.includes(simOption)
  );
}

/**
 * Computes average star rating (1 decimal) and 5..1 histogram from review rows.
 */
function summarizeReviews(reviews = []) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalScore = 0;
  for (const rev of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 0)));
    counts[r] += 1;
    totalScore += r;
  }
  const total = reviews.length;
  const average = total > 0 ? Number((totalScore / total).toFixed(1)) : 5.0;
  return { average, total, counts };
}

module.exports = {
  SIM_OPTIONS,
  SIM_OPTION_CARDS,
  isGpsProduct,
  isValidProductPlan,
  summarizeReviews,
};
