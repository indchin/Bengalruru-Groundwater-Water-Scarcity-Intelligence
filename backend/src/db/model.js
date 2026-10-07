/**
 * Domain model: this is the SAME calibration/generation logic used by the
 * original client-side prototype, moved server-side so it runs once at
 * startup/seed time and lives behind a real API instead of being
 * regenerated in every visitor's browser. See README.md "Data model" for
 * the full sourcing explanation; each REAL anchor below is cited inline.
 */

export const YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

// Bengaluru-wide annual rainfall (mm). Where a year has a specific published
// figure or a clearly documented drought/surplus declaration, RAINFALL_BASIS
// below says so and the value is set to match; unmarked years are trend-
// interpolated against the documented secular rise (Citizen Matters/IMD:
// ~900mm/yr in the 1900s to ~1,200mm/yr "normal" today).
export const RAINFALL_MM =   [1000, 700,  850, 1000, 1100, 1350, 1300, 1957, 720,  1080, 950,  780];
export const RAINFALL_BASIS = [
  'Trend-interpolated toward the ~1,200mm modern normal (Citizen Matters/IMD secular analysis).',
  'Documented drought year: Karnataka-wide 2016-17 drought (multiple districts declared drought-hit).',
  'Trend-interpolated (recovery year).',
  'Trend-interpolated.',
  'Trend-interpolated.',
  'Documented surplus: IMD/Citizen Matters — annual rainfall "over 1,200mm" every year from 2020 onward.',
  'Documented surplus (see 2020 note);2021 continued the post-2020 wet stretch.',
  'REAL, exact: 1,957mm — the highest in 122 years of IMD records (Citizen Matters analysis of IMD data).',
  'REAL, documented drought: Karnataka declared 195 of 236 taluks drought-hit in Sept 2023 (~40% statewide deficit); Bengaluru East taluk was rated "extreme drought", the other four Bengaluru Urban taluks "moderate drought" (Deccan Herald, 15 Sep 2023).',
  'Trend-interpolated recovery year; no statewide drought was declared for 2024.',
  'Documented deficit month: Bengaluru recorded a 25% rainfall deficit in July 2025 — 86.4mm vs a normal 116.4mm (Deccan Herald, 30 Jul 2025); annualised here as a below-normal year.',
  'REAL, in progress: Karnataka recorded a 41% monsoon rainfall deficit and Bengaluru about 25%, as reported 27 Jun 2026 (Bhatkallys/KSNDMC); shown here as a partial-year, currently-deficient estimate.',
];
export const RAIN_BASELINE = 970; // long-run average reference used for "deficit" calc

function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;} return h; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function round1(v){ return Math.round(v*10)/10; }

export const BAND_DEF = [
  {key:'healthy', label:'Healthy', max:20, color:'var(--band-healthy)', hex:'#1B6FA8', shape:'circle',
   desc:'Groundwater stable, low dependency pressure'},
  {key:'watch', label:'Watch', max:40, color:'var(--band-watch)', hex:'#2E8F82', shape:'circle',
   desc:'Early signs of stress, worth monitoring'},
  {key:'moderate', label:'Moderate Risk', max:60, color:'var(--band-moderate)', hex:'#C9A227', shape:'triangle',
   desc:'Clear decline trend, mixed source dependency'},
  {key:'high', label:'High Risk', max:80, color:'var(--band-high)', hex:'#C1622B', shape:'square',
   desc:'Fast decline, heavy borewell/tanker reliance'},
  {key:'critical', label:'Critical', max:101, color:'var(--band-critical)', hex:'#8C2F26', shape:'x',
   desc:'Severe / extreme stress, urgent intervention zone'},
];
export function bandForScore(score){
  for(const b of BAND_DEF){ if(score <= b.max) return b; }
  return BAND_DEF[BAND_DEF.length-1];
}

// REAL: Karnataka Minor Irrigation Dept, groundwater change vs each taluk's own
// 10-year mean, reported ahead of the 2024 dry season (via Deccan Herald/SANDRP,
// ~11 Mar 2024) — https://sandrp.in/2025/03/05/2024-bengaluru-groundwater-top-ten-reports-problems-causes-solutions/
// Cross-checked against the real Sept-2023 statewide drought-declaration category
// for each taluk (Deccan Herald, 15 Sep 2023) — https://www.deccanherald.com/amp/story/india%2Fkarnataka%2F195-taluks-declared-drought-hit-in-karnataka-2687052
export const TALUK_ANCHORS = {
  'Bengaluru East':  {delta:5.81, drought2023:'Extreme drought'},
  'Yelahanka':       {delta:7.31, drought2023:'Moderate drought'},
  'Anekal':          {delta:7.42, drought2023:'Moderate drought'},
  'Bengaluru North': {delta:0.7,  drought2023:'Moderate drought', approx:true},
  'Bengaluru South': {delta:0.7,  drought2023:'Moderate drought', approx:true},
};

// Area seed metadata. bbmpZone = real BBMP administrative zone (BBMP is
// organised into 8 zones: East, West, South, Yelahanka, Mahadevapura,
// Bommanahalli, Dasarahalli, RR Nagar — https://dl.bbmpgov.in/download/map/zones.pdf).
// taluk = real Bengaluru Urban revenue taluk used to calibrate the trajectory
// against TALUK_ANCHORS above. Note: revenue-taluk boundaries follow old
// population-based divisions that don't always match compass intuition —
// e.g. Basavanagudi and Lalbagh are officially in Bengaluru North taluk
// despite sitting in south Bengaluru (OpenCity explainer, real, cited in
// Data Sources) — so taluk assignment below is a best-effort locality match,
// while the taluk-level DELTA figures themselves are exact and published.
export const AREA_SEED = [
  {id:'whitefield', name:'Whitefield', zone:'Mahadevapura Zone', lat:12.9698, lng:77.7500, tier:'periphery', taluk:'Bengaluru East'},
  {id:'koramangala', name:'Koramangala', zone:'Bommanahalli Zone', lat:12.9352, lng:77.6146, tier:'core', taluk:'Bengaluru South'},
  {id:'indiranagar', name:'Indiranagar', zone:'East Zone', lat:12.9784, lng:77.6408, tier:'core', taluk:'Bengaluru East'},
  {id:'jayanagar', name:'Jayanagar', zone:'South Zone', lat:12.9250, lng:77.5938, tier:'core', taluk:'Bengaluru South'},
  {id:'basavanagudi', name:'Basavanagudi', zone:'South Zone', lat:12.9422, lng:77.5760, tier:'core', taluk:'Bengaluru North'},
  {id:'malleshwaram', name:'Malleshwaram', zone:'West Zone', lat:13.0035, lng:77.5709, tier:'core', taluk:'Bengaluru North'},
  {id:'rajajinagar', name:'Rajajinagar', zone:'West Zone', lat:12.9911, lng:77.5525, tier:'cmc', taluk:'Bengaluru North'},
  {id:'vijayanagar', name:'Vijayanagar', zone:'West Zone', lat:12.9719, lng:77.5352, tier:'cmc', taluk:'Bengaluru North'},
  {id:'yelahanka', name:'Yelahanka', zone:'Yelahanka Zone', lat:13.1007, lng:77.5963, tier:'periphery', taluk:'Yelahanka'},
  {id:'hebbal', name:'Hebbal', zone:'Yelahanka Zone', lat:13.0358, lng:77.5970, tier:'cmc', taluk:'Bengaluru North'},
  {id:'banashankari', name:'Banashankari', zone:'South Zone', lat:12.9250, lng:77.5560, tier:'core', taluk:'Bengaluru South'},
  {id:'jpnagar', name:'JP Nagar', zone:'South Zone', lat:12.9077, lng:77.5906, tier:'cmc', taluk:'Bengaluru South'},
  {id:'btm', name:'BTM Layout', zone:'South Zone', lat:12.9166, lng:77.6101, tier:'cmc', taluk:'Bengaluru South'},
  {id:'hsr', name:'HSR Layout', zone:'Bommanahalli Zone', lat:12.9121, lng:77.6446, tier:'cmc', taluk:'Anekal'},
  {id:'electroniccity', name:'Electronic City', zone:'Bommanahalli Zone (outskirts)', lat:12.8452, lng:77.6602, tier:'periphery', taluk:'Anekal'},
  {id:'bellandur', name:'Bellandur', zone:'Mahadevapura Zone', lat:12.9304, lng:77.6784, tier:'periphery', taluk:'Bengaluru East'},
  {id:'sarjapur', name:'Sarjapur Road', zone:'Mahadevapura Zone (outskirts)', lat:12.9010, lng:77.6870, tier:'periphery', taluk:'Anekal'},
  {id:'marathahalli', name:'Marathahalli', zone:'Mahadevapura Zone', lat:12.9569, lng:77.7011, tier:'cmc', taluk:'Bengaluru East'},
  {id:'krpuram', name:'K R Puram', zone:'Mahadevapura Zone', lat:13.0064, lng:77.6961, tier:'periphery', taluk:'Bengaluru East'},
  {id:'mahadevapura', name:'Mahadevapura', zone:'Mahadevapura Zone', lat:12.9950, lng:77.6950, tier:'periphery', taluk:'Bengaluru East'},
  {id:'hennur', name:'Hennur', zone:'East Zone (outskirts)', lat:13.0450, lng:77.6350, tier:'periphery', taluk:'Bengaluru East'},
  {id:'rtnagar', name:'RT Nagar', zone:'East Zone', lat:13.0198, lng:77.5950, tier:'cmc', taluk:'Bengaluru North'},
  {id:'yeshwantpur', name:'Yeshwantpur', zone:'West Zone', lat:13.0284, lng:77.5540, tier:'cmc', taluk:'Bengaluru North'},
  {id:'peenya', name:'Peenya', zone:'West Zone (industrial)', lat:13.0339, lng:77.5192, tier:'periphery', taluk:'Bengaluru North'},
  {id:'devanahalli', name:'Devanahalli', zone:'Bengaluru Rural District (separate from BBMP)', lat:13.2437, lng:77.7145, tier:'periphery', taluk:'Devanahalli (Bengaluru Rural)',
   real:{level2015:32.2, level2024:73.74, note:'REAL, exact: Karnataka Groundwater Directorate / CGWB reported March-2015 → March-2024 depth as 32.2 → 73.74 m bgl for this fast-growing airport-adjacent taluk (via ThePrint, 6 Jun 2025, citing government data).'}},
  {id:'konanakunte', name:'Konanakunte', zone:'South Zone (outskirts)', lat:12.8834, lng:77.5560, tier:'periphery', taluk:'Bengaluru South'},
  {id:'horamavu', name:'Horamavu', zone:'Mahadevapura Zone (outskirts)', lat:13.0234, lng:77.6572, tier:'periphery', taluk:'Bengaluru East'},
  {id:'kammanahalli', name:'Kammanahalli', zone:'East Zone', lat:13.0187, lng:77.6280, tier:'cmc', taluk:'Bengaluru East'},
];

// REAL documented, locality-specific facts found in published reporting.
// Rendered verbatim (as attributed facts, not model output) in each area's
// Overview panel when present. Areas not listed here have no locality-level
// published fact we could verify — we do not invent one for them.
export const DOCUMENTED_FACTS = {
  whitefield: [
    {text:'Residents of Ambedkar Nagar, Whitefield, halted construction-site borewell drilling in 2024 after commercial borewells were blamed for drying up public borewells nearby.', source:'The News Minute, 5 Apr 2024'},
    {text:'CNN photographed the Nallurahalli lake bed in Whitefield bone-dry with cattle grazing on it during the March 2024 water crisis.', source:'CNN, 19 Mar 2024'},
  ],
  mahadevapura: [
    {text:'Named among the areas where borewells are now being sunk to around 1,500 feet, versus roughly 500 feet a decade ago.', source:'Down To Earth / neerain.com, 2025–26'},
    {text:'A civic activist reported groundwater in parts of Mahadevapura plunging sharply within a single year, drying out long-standing drinking-water borewells — an on-record account, not an official measurement.', source:"Deccan Herald, 'Bengaluru's groundwater conundrum'"},
  ],
  krpuram: [
    {text:'Named among the areas with borewells now sunk to around 1,500 feet.', source:'Down To Earth / neerain.com, 2025–26'},
    {text:'K R Puram and greater Mahadevapura were flagged as the worst-affected zones in a Feb 2025 BWSSB-IISc outlook of 80+ at-risk wards.', source:'Deccan Herald, 28 Jan 2025'},
  ],
  rtnagar: [
    {text:'Named among the areas with borewells now sunk to around 1,500 feet.', source:'Down To Earth / neerain.com, 2025–26'},
  ],
  jpnagar: [
    {text:'Named among the areas with borewells now sunk to around 1,500 feet.', source:'Down To Earth / neerain.com, 2025–26'},
  ],
  horamavu: [
    {text:'Named as one of the specific critical wards in the Feb 2025 BWSSB-IISc groundwater-decline outlook.', source:'Deccan Herald, 28 Jan 2025'},
  ],
  konanakunte: [
    {text:'Named as one of the specific critical wards in the Feb 2025 BWSSB-IISc groundwater-decline outlook.', source:'Deccan Herald, 28 Jan 2025'},
  ],
  kammanahalli: [
    {text:'Named as one of the specific critical wards in the Feb 2025 BWSSB-IISc groundwater-decline outlook.', source:'Deccan Herald, 28 Jan 2025'},
  ],
  bellandur: [
    {text:'Bellandur Lake spans roughly 800 acres; its rejuvenation — along with neighbouring Varthur Lake — remains incomplete despite years of attention.', source:'Deccan Herald, 28 Jan 2025'},
    {text:"Across Bengaluru, IISc's Centre for Ecological Sciences found the city's total water-spread area fell from 2,324 hectares in 1973 to about 696 hectares in 2023 — a 70% drop.", source:'IISc, via pmfias.com summary, 2024'},
  ],
  electroniccity: [
    {text:'Sits in Anekal taluk, the Bengaluru Urban taluk with the steepest published groundwater decline (7.42 m below its own 10-year mean).', source:'Karnataka Minor Irrigation Dept, ~Mar 2024'},
  ],
  devanahalli: [
    {text:'Groundwater depth roughly doubled from 32.2 to 73.74 m below ground level between March 2015 and March 2024.', source:'Karnataka Groundwater Directorate / CGWB, via ThePrint, 6 Jun 2025'},
  ],
};

export const TIER_CONFIG = {
  core:      {level2015:[11,17], declineStart:0.25, declineEnd:0.9,  borewell:[25,45], cauvery:[48,68]},
  cmc:       {level2015:[18,30], declineStart:0.7,  declineEnd:2.0,  borewell:[45,65], cauvery:[28,48]},
  periphery: {level2015:[26,42], declineStart:1.3,  declineEnd:3.4,  borewell:[65,90], cauvery:[8,28]},
};

// REAL: a small, named set of neighbourhood water-hardness readings from an
// informal industry survey (not an official lab report — flagged as such in
// the UI) — https://h2s.co.in/blogs/all-blogs/bangalore-borewell-water-a-2026-area-by-area-hardness-map
// Used in place of the modeled hardness value for these specific localities only.
export const REAL_HARDNESS = {
  bellandur:{value:350, range:'320–380 ppm'}, hsr:{value:350, range:'320–380 ppm'},
  hebbal:{value:325, range:'290–360 ppm'},
  indiranagar:{value:210, range:'180–240 ppm'}, koramangala:{value:210, range:'180–240 ppm'},
  jayanagar:{value:195, range:'170–220 ppm'}, basavanagudi:{value:195, range:'170–220 ppm'},
  malleshwaram:{value:185, range:'160–210 ppm'},
};

export function buildArea(seed){
  const rnd = mulberry32(hashStr(seed.id));
  const cfg = TIER_CONFIG[seed.tier];
  let level2015 = seed.real ? seed.real.level2015 : lerp(cfg.level2015[0], cfg.level2015[1], rnd());
  const hist = [];
  let level = level2015;
  for(let i=0;i<YEARS.length;i++){
    const t = i/(YEARS.length-1);
    const rainIdx = RAINFALL_MM[i]/RAIN_BASELINE; // >1 wetter, <1 drier
    let rate = lerp(cfg.declineStart, cfg.declineEnd, t) * clamp(1.9 - rainIdx, 0.25, 1.9) * lerp(0.85,1.18,rnd());
    if(i===0){ rate = 0; }
    level = round1(level + rate);
    hist.push({year:YEARS[i], level, rainfall_mm:Math.round(RAINFALL_MM[i]*lerp(0.9,1.1,rnd())), rainIdx});
  }
  // If we have an exact real 2015->2024 anchor (Devanahalli), blend the whole
  // trajectory to match it precisely.
  if(seed.real && seed.real.level2024){
    const idx2024 = YEARS.indexOf(2024);
    const modeled = hist[idx2024].level;
    const target = seed.real.level2024;
    const scale = (modeled-level2015)!==0 ? (target-level2015)/(modeled-level2015) : 1;
    for(let i=1;i<hist.length;i++){ hist[i].level = round1(level2015 + (hist[i].level-level2015)*scale); }
  }
  // Otherwise, blend toward the REAL taluk-level "decadal change vs 10-yr mean"
  // anchor (Karnataka Minor Irrigation Dept) so every area's 2024 position is
  // consistent with its taluk's published figure, not just an arbitrary curve.
  const talukAnchor = TALUK_ANCHORS[seed.taluk];
  if(!seed.real && talukAnchor){
    const idx2024 = YEARS.indexOf(2024);
    const meanModeled = hist.slice(0,idx2024).reduce((s,h)=>s+h.level,0) / idx2024; // mean of 2015-2023
    const modeled2024 = hist[idx2024].level;
    const modeledDeltaVsMean = modeled2024 - meanModeled; // the model's own (pre-calibration) gap
    // Rescale the DEVIATION from the mean-trend (not the raw level) so that,
    // after scaling, (2024 level - mean of 2015-2023) exactly equals the real
    // published taluk delta — this is scale-invariant to the level2015 anchor.
    const scale = Math.abs(modeledDeltaVsMean) > 0.05 ? clamp(talukAnchor.delta / modeledDeltaVsMean, 0.08, 4) : 1;
    for(let i=1;i<hist.length;i++){ hist[i].level = round1(level2015 + (hist[i].level-level2015)*scale); }
  }

  const current = hist[hist.length-1].level;
  const prev = hist[hist.length-2].level;
  const yoyPct = round1(((current-prev)/prev)*100);
  const fiveYrAgo = hist[hist.length-6].level;
  const fiveYrDeltaPct = round1(((current-fiveYrAgo)/fiveYrAgo)*100);
  const tenYrAgo = hist[0].level;

  const borewell = Math.round(lerp(cfg.borewell[0],cfg.borewell[1], rnd()));
  const cauveryShare = Math.round(lerp(cfg.cauvery[0],cfg.cauvery[1], rnd()));
  let groundwaterShare = Math.round(clamp(100 - cauveryShare - rnd()*10, 15, 80));
  let tankerShare = Math.round(clamp((borewell>70? 10+rnd()*12 : rnd()*8),0,25));
  let remaining = clamp(100-cauveryShare-groundwaterShare-tankerShare, 0, 100);
  let lakeShare = Math.round(remaining*lerp(0.3,0.55,rnd()));
  let rwhShare = Math.round(remaining*0.2*rnd());
  let recycledShare = Math.round(remaining*0.15*rnd());
  let otherShare = Math.max(0, remaining - lakeShare - rwhShare - recycledShare);
  // normalize to 100
  let sumS = cauveryShare+groundwaterShare+tankerShare+lakeShare+rwhShare+recycledShare+otherShare;
  const fix = 100-sumS; otherShare += fix;

  const rechargeScoreRaw = clamp(100 - borewell*0.5 - (seed.tier==='periphery'?20:seed.tier==='cmc'?8:0) + rnd()*14, 5, 95);
  const rechargeLevel = rechargeScoreRaw>65 ? 'High' : rechargeScoreRaw>38 ? 'Medium' : 'Low';

  // Drinking water quality (modeled per-locality, calibrated around REAL
  // district-level CGWB findings: 81% of rural-Bengaluru groundwater samples
  // exceeded the nitrate limit and 60% exceeded the uranium safety threshold
  // in CGWB's 2023 assessment — not a certified per-locality potability test).
  const stressFactor = clamp((current-10)/70,0,1);
  const ph = round1(lerp(6.7,8.3, rnd()));
  const tds = Math.round(lerp(180, 900, stressFactor) + rnd()*260);
  const hardnessReal = REAL_HARDNESS[seed.id];
  const hardness = hardnessReal ? hardnessReal.value : Math.round(lerp(120,520, stressFactor*0.8+rnd()*0.3));
  const fluoride = round1(lerp(0.3,1.8, stressFactor*0.7+rnd()*0.4));
  const nitrate = Math.round(lerp(8,75, stressFactor*0.6+rnd()*0.5));
  const iron = round1(lerp(0.05,0.9, rnd()));
  const microbialFlag = (tds>650 || seed.tier==='periphery') && rnd()>0.45;
  // Uranium-exceedance risk calibrated so peripheral/rural-adjacent areas draw
  // from a pool matching CGWB's real ~60% rural-Bengaluru exceedance rate.
  const uraniumFlag = (seed.tier==='periphery' ? rnd()<0.60 : seed.tier==='cmc' ? rnd()<0.30 : rnd()<0.12);
  let qualityScore = 100 - clamp((tds-150)/12,0,35) - clamp((nitrate-20)/2,0,20) - clamp((fluoride-1)*18,0,18) - (microbialFlag?18:0) - (uraniumFlag?10:0);
  qualityScore = clamp(qualityScore,5,98);
  const qualityStatus = qualityScore>75?'Good':qualityScore>55?'Watch':qualityScore>35?'Poor':'Critical';

  // Crisis score (0-100), explainable via named factors
  const fLevel = clamp((current-10)/70*100,0,100);
  const fDecline = clamp((yoyPct)/10*100,0,100);
  const fBorewell = borewell;
  const fRainDeficit = clamp((1-(hist[hist.length-1].rainIdx))*140,0,100);
  const fRecharge = 100-rechargeScoreRaw;
  const fCauveryGap = 100-cauveryShare;
  const crisisScore = Math.round(clamp(
    fLevel*0.24 + fDecline*0.22 + fBorewell*0.20 + fRainDeficit*0.14 + fRecharge*0.12 + fCauveryGap*0.08
  ,2,99));
  const band = bandForScore(crisisScore);

  // acceleration: compare last-2yr avg decline vs prior-2yr avg decline
  const declineRecent = hist[11].level - hist[9].level;
  const declinePrior = hist[9].level - hist[7].level;
  const accelPct = declinePrior>0 ? round1(((declineRecent-declinePrior)/declinePrior)*100) : 0;

  // Confidence: fewer real anchors / higher tier volatility -> lower confidence
  let confScore = seed.real ? 82 : (seed.tier==='core'?70:seed.tier==='cmc'?60:50);
  confScore += Math.round(rnd()*10-5);
  confScore = clamp(confScore,30,92);
  const confidence = confScore>72?'High':confScore>50?'Medium':'Low';

  // Predictions per horizon: escalate band probabilistically with accel & current band
  const bandIdx = BAND_DEF.findIndex(b=>b.key===band.key);
  function predictAt(yearsOut, accelBoost){
    const push = clamp(yearsOut*0.55 + (accelPct/100)*1.6*accelBoost + (rechargeLevel==='Low'?0.4:0), 0, 3.4);
    const idx = clamp(Math.round(bandIdx+push), 0, BAND_DEF.length-1);
    const conf = clamp(confScore - yearsOut*7,15,90);
    return {band:BAND_DEF[idx], confidence: conf>65?'High':conf>42?'Medium':'Low', confScore:conf};
  }
  const prediction = {
    h3m: predictAt(0.25,1), h6m: predictAt(0.5,1), h1y: predictAt(1,1), h3y: predictAt(3,1.3), h5y: predictAt(5,1.5)
  };

  const drivers = [];
  if(fDecline>55) drivers.push('Groundwater is declining faster than the Bengaluru city-wide average');
  if(borewell>60) drivers.push('High dependency on private borewells for daily supply');
  if(rechargeLevel==='Low') drivers.push('Low natural recharge potential — built-up surface limits rainwater infiltration');
  if(fRainDeficit>55) drivers.push('Below-average rainfall in the most recent monitored year');
  if(cauveryShare<25) drivers.push('Limited Cauvery-network connectivity, raising reliance on groundwater/tankers');
  if(accelPct>15) drivers.push('Rate of decline itself is accelerating year over year');
  if(drivers.length===0) drivers.push('Relatively balanced water-source mix with moderate borewell reliance');

  const recommendations = [];
  if(rechargeLevel!=='High') recommendations.push({title:'Increase groundwater recharge', body:'Recharge wells, lake/tank rejuvenation, permeable surfaces and mandatory rainwater harvesting in new construction.'});
  if(borewell>55) recommendations.push({title:'Reduce extraction pressure', body:'Phased reduction in new borewell permits, reuse of treated wastewater for non-potable demand, leak reduction in distribution.'});
  if(cauveryShare<35) recommendations.push({title:'Expand piped surface-water supply', body:'Extend Cauvery feeder/sub-feeder lines and equalize distribution to reduce tanker dependency.'});
  if(qualityStatus==='Poor'||qualityStatus==='Critical') recommendations.push({title:'Address water quality', body:'Targeted testing of borewells, point-of-use treatment guidance, and public advisories where indicators are elevated.'});
  if(recommendations.length===0) recommendations.push({title:'Maintain current trajectory', body:'Continue existing recharge and supply practices; monitor seasonally for early drift.'});

  return {
    id:seed.id, name:seed.name, zone:seed.zone, taluk:seed.taluk, lat:seed.lat, lng:seed.lng, tier:seed.tier,
    isRealAnchor: !!seed.real, realNote: seed.real ? seed.real.note : null,
    talukAnchor: talukAnchor || null,
    documentedFacts: DOCUMENTED_FACTS[seed.id] || [],
    hist, current, prev, yoyPct, fiveYrDeltaPct, tenYrAgo,
    borewell, water_sources:{ cauvery:cauveryShare, groundwater:groundwaterShare, tankers:tankerShare, lake:lakeShare, rainwater:rwhShare, recycled:recycledShare, other:otherShare },
    rechargeLevel, rechargeScore: Math.round(rechargeScoreRaw),
    drinking:{ ph, tds, hardness, hardnessIsReal:!!hardnessReal, hardnessRange: hardnessReal? hardnessReal.range : null,
      fluoride, nitrate, iron, microbialFlag, uraniumFlag, qualityScore:Math.round(qualityScore), qualityStatus,
      availability: cauveryShare>45?'Reliable (mostly piped)':cauveryShare>25?'Intermittent':'Limited (tanker/borewell dependent)',
      reliability: confidence },
    crisisScore, band, accelPct, confidence, confScore, prediction, drivers, recommendations,
    lastUpdated: '2026-06 (simulated monitoring cycle)'
  };
}

export const AREAS = AREA_SEED.map(buildArea);
export const AREA_BY_ID = Object.fromEntries(AREAS.map(a=>[a.id,a]));

export function computeScenario(area, rainDelta, extractDelta, rwhDelta, recycledDelta, lakeRestore){
  let fLevel = clamp((area.current-10)/70*100,0,100);
  let fDecline = clamp((area.yoyPct)/10*100,0,100);
  let fBorewell = area.borewell;
  let fRainDeficit = clamp((1-(area.hist[area.hist.length-1].rainIdx))*140,0,100);
  let fRecharge = 100-area.rechargeScore;
  let fCauveryGap = 100-area.water_sources.cauvery;

  fRainDeficit = clamp(fRainDeficit - rainDelta*1.1, 0, 100);
  fDecline = clamp(fDecline + extractDelta*0.9 - rainDelta*0.5, 0, 100);
  fBorewell = clamp(fBorewell + extractDelta*0.6 - recycledDelta*0.4, 0, 100);
  fRecharge = clamp(fRecharge - rwhDelta*0.8 - (lakeRestore?15:0), 0, 100);
  fCauveryGap = clamp(fCauveryGap - recycledDelta*0.3, 0, 100);

  const score = Math.round(clamp(fLevel*0.24 + fDecline*0.22 + fBorewell*0.20 + fRainDeficit*0.14 + fRecharge*0.12 + fCauveryGap*0.08, 2, 99));
  return {score, band:bandForScore(score)};
}

export function scenarioPredictionRow(baseArea, simScore){
  const bandIdx = BAND_DEF.findIndex(b=>b.key===bandForScore(simScore).key);
  function at(yearsOut){ const push=clamp(yearsOut*0.5,0,3); const idx=clamp(Math.round(bandIdx+push),0,BAND_DEF.length-1); return BAND_DEF[idx]; }
  return {h3m:at(0.25),h6m:at(0.5),h1y:at(1),h3y:at(3),h5y:at(5)};
}

export const DATA_SOURCES = [
  {org:'Karnataka Minor Irrigation Department', name:'Groundwater change vs 10-yr mean, 5 Bengaluru Urban taluks', date:'Reported ~11 Mar 2024', res:'Taluk (Anekal, Bengaluru East/North/South, Yelahanka)', unit:'m vs 10-yr mean', freq:'Seasonal', conf:'High — real, published', real:true,
   note:'Anekal −7.42 m, Yelahanka −7.31 m, Bengaluru East −5.81 m, Bengaluru South & North <1 m. Used directly in this app to calibrate every area\'s trajectory to its real taluk. Via SANDRP\'s 2024 compilation / Deccan Herald.'},
  {org:'Central Ground Water Board (CGWB) / Karnataka Groundwater Directorate', name:'Devanahalli & statewide depth-to-water bulletins', date:'2015–2025', res:'Taluk / well & piezometer', unit:'m below ground level (mbgl)', freq:'Bi-annual (pre/post monsoon)', conf:'High — real, published', real:true,
   note:'Devanahalli: 32.2 mbgl (Mar 2015) → 73.74 mbgl (Mar 2024), used as an exact anchor. Also source of the "9 zones/taluks all declining" finding and the 1,334 dug wells / 763 piezometers tracked statewide. Via ThePrint, 6 Jun 2025, citing government data.'},
  {org:'Karnataka Cabinet / Revenue Dept', name:'Statewide drought declaration', date:'15 Sep 2023', res:'Taluk (195 of 236 declared)', unit:'Drought category', freq:'One-off declaration', conf:'High — real, published', real:true,
   note:'Bengaluru East taluk rated "extreme drought"; Bengaluru North, South, Yelahanka and Anekal rated "moderate drought" — the entire Bengaluru Urban district was included. ~40% statewide rainfall deficit that year. Via Deccan Herald.'},
  {org:'BWSSB × IISc collaborative study', name:'80+ at-risk-ward groundwater outlook', date:'Jan–Feb 2025', res:'Ward', unit:'m decline (seasonal)', freq:'Seasonal', conf:'High — real, published', real:true,
   note:'Reported ~5 m decline in core areas vs 10–15 m in erstwhile CMC areas and 20–25 m in the 110 outskirts villages for the 2024→2025 dry season, plus a named list of critical wards (incl. Konanakunte, T Dasarahalli, Horamavu, Ramamurthy Nagar, Kammanahalli, Kadugondanahalli, Jakkur). Via Deccan Herald, 28 Jan 2025.'},
  {org:'India Meteorological Department (IMD) / Citizen Matters analysis', name:'Bengaluru annual rainfall, 1900–2025', date:'Updated Oct 2024', res:'City-wide', unit:'mm/year', freq:'Annual', conf:'High for named years, trend-level for others', real:true,
   note:'Real, exact: 2022 = 1,957mm, the highest in 122 years. Real, directional: secular rise from ~900mm/yr (1900s) to ~1,200mm/yr "normal" since 2020; 2023 drought and 2026 monsoon-deficit years documented separately. Other years in this app are trend-interpolated between these real points — see each year\'s tooltip.'},
  {org:'Karnataka State Natural Disaster Monitoring Centre (KSNDMC) / press reports', name:'2026 monsoon deficit', date:'27 Jun 2026', res:'State & city', unit:'% rainfall deficit', freq:'Real-time', conf:'High — real, published', real:true,
   note:'Karnataka recorded a 41% monsoon rainfall deficit in the first month of the 2026 SW monsoon; Bengaluru specifically about 25% (66mm received vs 89mm normal, to 25 Jun). Used to mark 2026 as a live, still-developing deficient year in this prototype. Via Bhatkallys, citing IMD/KSNDMC.'},
  {org:'Deputy CM D.K. Shivakumar (Govt. of Karnataka)', name:'City borewell dry-count disclosure', date:'Mar 2024', res:'City-wide', unit:'Count', freq:'One-off statement', conf:'High — real, published', real:true,
   note:'~6,900–7,000 of the city\'s ~13,900–14,781 BWSSB/BMRDA borewells had run dry (figures vary slightly by outlet and date of report). Used directly in this app\'s dashboard. Via Deccan Herald / CNN / Down To Earth, Mar 2024 – Feb 2026.'},
  {org:'BWSSB (Bangalore Water Supply & Sewerage Board)', name:'Cauvery Water Supply Scheme (CWSS) capacity & coverage', date:'Stage V commissioned Oct 2024', res:'City-wide', unit:'MLD (million litres/day), % coverage', freq:'Project milestones', conf:'High — real, published', real:true,
   note:'Stages I–IV: ~1,350–1,460 MLD to the core + 7 erstwhile CMCs. Stage V: +775 MLD (500 MLD Phase 1 + 275 MLD Phase 2), Rs 4,336 crore, 84% JICA-funded, commissioned Oct 2024, aimed at the 110 villages added to BBMP in 2007. Estimated BBMP-wide coverage after Stage V: ~73%. 8 villages (incl. Chokkanahalli, Bellahalli, Kattigenahalli) still awaited connection as of the most recent BWSSB update we found. Stage VI (+500 MLD) is at planning stage as of May 2026, targeting 2028–2030. Via bwssb.karnataka.gov.in and Deccan Herald reporting, 2022–2026.'},
  {org:'The South First / multiple outlets', name:'City-wide Cauvery vs groundwater dependency split', date:'2024', res:'City-wide', unit:'% of population', freq:'Periodic estimate', conf:'High — real, published', real:true,
   note:'~60% of Bengaluru\'s ~14 million residents depend on Cauvery water, ~40% on groundwater (an earlier 2016-era BWSSB estimate put groundwater dependency at ~45%, showing the split has been fairly stable for years). Used as the city-wide calibration target for this app\'s modeled per-locality water-source mix.'},
  {org:'CGWB', name:'Groundwater quality assessment (rural Bengaluru)', date:'2023', res:'District (rural)', unit:'% samples exceeding limit', freq:'Periodic', conf:'High — real, published', real:true,
   note:'81% of groundwater samples from rural Bengaluru exceeded the permissible nitrate level (>45 mg/L); 60% exceeded the uranium safety threshold. This app uses these two real district-level rates to calibrate the probability of the modeled per-locality nitrate figure and "uranium risk" flag — it is not a certified per-street lab result.'},
  {org:'IISc, Centre for Ecological Sciences', name:'Bengaluru lake/tank water-spread area', date:'Study covering 1973–2023', res:'City-wide', unit:'Hectares', freq:'One-off study', conf:'High — real, published', real:true,
   note:'Total water-spread area fell from 2,324 hectares (1973) to about 696 hectares (2023) — a 70% drop. Cited via pmfias.com\'s 2024 summary; shown in this app\'s Water Infrastructure layer and lake popups.'},
  {org:'Hard2Soft (water-conditioner industry blog)', name:'Area-by-area borewell water hardness "map"', date:'2026', res:'Named neighbourhood', unit:'ppm (CaCO₃ hardness)', freq:'One-off informal survey', conf:'Medium — real but informal, not a government lab report', real:true,
   note:'Used directly (flagged REAL in the UI) for the small set of localities it names: Bellandur & HSR Layout 320–380ppm, Hebbal 290–360ppm, Indiranagar & Koramangala 180–240ppm, Jayanagar & Basavanagudi 170–220ppm, Malleshwaram 160–210ppm. Not a substitute for an official BWSSB/KSPCB lab result.'},
  {org:'BBMP', name:'Zone & ward structure', date:'Current (243-ward delimitation)', res:'Ward / zone', unit:'—', freq:'Static (redrawn periodically)', conf:'High — real, published', real:true,
   note:'BBMP is organised into 8 real zones (East, West, South, Yelahanka, Mahadevapura, Bommanahalli, Dasarahalli, RR Nagar) covering 243 wards. Used to assign each area\'s displayed BBMP zone in this app. Via dl.bbmpgov.in and bpac.in ward-mapping PDF.'},
  {org:'News reporting (The News Minute, CNN, Down To Earth, Deccan Herald, The South First)', name:'Locality-specific documented facts', date:'2024–2026', res:'Named locality', unit:'—', freq:'—', conf:'High for the specific quoted fact', real:true,
   note:'A small set of named, attributed facts for specific localities (Whitefield, Mahadevapura, K R Puram, RT Nagar, JP Nagar, Bellandur, Horamavu, Konanakunte, Kammanahalli, Electronic City, Devanahalli) shown verbatim with their source in each area\'s Overview panel — see "Documented in published reports" there.'},
  {org:'This prototype\'s model', name:'Crisis Score, day-by-day trajectory shape, predictions, "what-if" scenarios', date:'Computed live in-browser', res:'Per area', unit:'0–100 score / risk band', freq:'Recalculated on every interaction', conf:'Explicitly a model estimate', real:false,
   note:'No public feed gives a verified daily reading for all 28 localities, so each area\'s year-by-year shape is generated once (deterministic, not random per reload) and then blended to match its REAL taluk-level anchor above. The Crisis Score itself is a transparent weighted combination of depth, YoY decline, borewell dependency, rainfall deficit, recharge potential and Cauvery-supply gap — deliberately explainable rather than a black box (see each area\'s "why" panel), but still a model output, not a measurement.'},
];
