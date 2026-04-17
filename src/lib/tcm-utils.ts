/**
 * TCM Utilities for calculating Ganzhi (Stems and Branches) and Time-based Acupoint Methods
 */

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * Get the Shichen (Chinese hour) based on the hour of the day (0-23)
 */
export function getShichenIndex(hour: number): number {
  // 23:00 - 00:59 is Zi (0)
  // 01:00 - 02:59 is Chou (1)
  // ...
  return Math.floor(((hour + 1) % 24) / 2);
}

export function getShichenName(hour: number): string {
  return SHICHEN[getShichenIndex(hour)];
}

/**
 * Get Year Ganzhi (Simplified)
 */
export function getYearGanzhi(year: number): string {
  const stemIdx = (year - 4) % 10;
  const branchIdx = (year - 4) % 12;
  return `${HEAVENLY_STEMS[stemIdx]}${EARTHLY_BRANCHES[branchIdx]}`;
}

/**
 * Get Month Ganzhi (Simplified)
 */
export function getMonthGanzhi(year: number, month: number): string {
  // Simplified: Year stem determines month stem
  const yearStemIdx = (year - 4) % 10;
  // monthIdx: 0:Feb(寅), 1:Mar(卯), 2:Apr(辰)...
  // Date.getMonth() returns 0-11 (Jan-Dec)
  const monthIdx = month - 1; 
  const monthStemIdx = (yearStemIdx % 5 * 2 + monthIdx + 2) % 10;
  const monthBranchIdx = (monthIdx + 12) % 12;
  return `${HEAVENLY_STEMS[monthStemIdx]}${EARTHLY_BRANCHES[monthBranchIdx]}`;
}

/**
 * Basic Ganzhi calculation
 */
export function getGanzhi(date: Date, useEarlyLateZi: boolean = false) {
  const hour = date.getHours();
  
  // Determine the date to use for Day Pillar calculation
  let dayDate = new Date(date);
  
  if (useEarlyLateZi) {
    // 早晚子時 (子正換日): 00:00 才換日柱
    // 23:00-23:59 (晚子時) 屬於當天
    // 00:00-00:59 (早子時) 屬於當天 (月曆上的當天)
    // 不需要調整 dayDate
  } else {
    // 一般計算 (子初換日): 23:00 就換日柱
    if (hour >= 23) {
      dayDate.setDate(dayDate.getDate() + 1);
    }
  }
  
  // Use UTC to avoid timezone issues for day difference
  const baseDate = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01 is 乙亥日 (Stem 1, Branch 11)
  // Wait, let's verify 2026-01-01 Ganzhi. 
  // 2026-01-01 is 乙亥 (Stem index 1, Branch index 11)
  
  const dayDateUTC = Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
  const diffDays = Math.floor((dayDateUTC - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // 2026-01-01 is 乙亥 (1, 11)
  const dayStemIdx = ((diffDays + 1) % 10 + 10) % 10;
  const dayBranchIdx = ((diffDays + 11) % 12 + 12) % 12;
  
  const dayStem = HEAVENLY_STEMS[dayStemIdx];
  const dayBranch = EARTHLY_BRANCHES[dayBranchIdx];
  
  // Hour Branch
  const shichenIdx = getShichenIndex(hour);
  const hourBranch = EARTHLY_BRANCHES[shichenIdx];
  
  // Hour Stem (Ri Gan Qi Shi Fa)
  // 甲己還加甲, 乙庚丙作初, 丙辛從戊起, 丁壬庚子居, 戊癸何方發, 壬子是真途
  const hourStemStartIdx = (dayStemIdx % 5) * 2;
  const hourStemIdx = (hourStemStartIdx + shichenIdx) % 10;
  const hourStem = HEAVENLY_STEMS[hourStemIdx];

  return {
    year: getYearGanzhi(date.getFullYear()),
    month: getMonthGanzhi(date.getFullYear(), date.getMonth()),
    day: `${dayStem}${dayBranch}`,
    hour: `${hourStem}${hourBranch}`,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch
  };
}

/**
 * Zi Wu Liu Zhu (子午流注) - Na Zi Fa (納子法)
 * Simplified logic: Each Shichen corresponds to a meridian
 */
export const ZI_WU_LIU_ZHU_MAP: Record<string, string> = {
  '寅': '手太陰肺經',
  '卯': '手陽明大腸經',
  '辰': '足陽明胃經',
  '巳': '足太陰脾經',
  '午': '手少陰心經',
  '未': '手太陽小腸經',
  '申': '足太陽膀胱經',
  '酉': '足少陰腎經',
  '戌': '手厥陰心包經',
  '亥': '手少陽三焦經',
  '子': '足少陽膽經',
  '丑': '足厥陰肝經',
};

/**
 * Detailed Na Zi Fa Data (納子法詳細資料)
 */
export interface NaZiFaDetail {
  meridian: string;
  motherPoint: string;
  motherMeridian: string;
  motherMeridianPoint: string;
  sonPoint: string;
  shuStreamPoint: string;
  backShu: string;
  frontMu: string;
  yuanPoint: string;
  luoPoint: string;
}

export const NA_ZI_FA_DATA: Record<string, NaZiFaDetail> = {
  '寅': { meridian: '手太陰肺經', motherPoint: '太淵', motherMeridian: '足少陰腎經', motherMeridianPoint: '復溜', sonPoint: '尺澤', shuStreamPoint: '太淵', backShu: '肺俞', frontMu: '中府', yuanPoint: '太淵', luoPoint: '列缺' },
  '卯': { meridian: '手陽明大腸經', motherPoint: '曲池', motherMeridian: '手太陰肺經', motherMeridianPoint: '太淵', sonPoint: '二間', shuStreamPoint: '三間', backShu: '大腸俞', frontMu: '天樞', yuanPoint: '合谷', luoPoint: '偏歷' },
  '辰': { meridian: '足陽明胃經', motherPoint: '解谿', motherMeridian: '足太陰脾經', motherMeridianPoint: '大都', sonPoint: '厲兌', shuStreamPoint: '陷谷', backShu: '胃俞', frontMu: '中脘', yuanPoint: '衝陽', luoPoint: '豐隆' },
  '巳': { meridian: '足太陰脾經', motherPoint: '大都', motherMeridian: '手太陰肺經', motherMeridianPoint: '太淵', sonPoint: '商丘', shuStreamPoint: '太白', backShu: '脾俞', frontMu: '章門', yuanPoint: '太白', luoPoint: '公孫' },
  '午': { meridian: '手少陰心經', motherPoint: '少衝', motherMeridian: '足太陰脾經', motherMeridianPoint: '大都', sonPoint: '神門', shuStreamPoint: '神門', backShu: '心俞', frontMu: '巨闕', yuanPoint: '神門', luoPoint: '通里' },
  '未': { meridian: '手太陽小腸經', motherPoint: '後溪', motherMeridian: '手少陰心經', motherMeridianPoint: '少衝', sonPoint: '小海', shuStreamPoint: '後溪', backShu: '小腸俞', frontMu: '關元', yuanPoint: '腕骨', luoPoint: '支正' },
  '申': { meridian: '足太陽膀胱經', motherPoint: '至陰', motherMeridian: '足少陰腎經', motherMeridianPoint: '復溜', sonPoint: '束骨', shuStreamPoint: '束骨', backShu: '膀胱俞', frontMu: '中極', yuanPoint: '京骨', luoPoint: '飛揚' },
  '酉': { meridian: '足少陰腎經', motherPoint: '復溜', motherMeridian: '足厥陰肝經', motherMeridianPoint: '曲泉', sonPoint: '湧泉', shuStreamPoint: '太溪', backShu: '腎俞', frontMu: '京門', yuanPoint: '太溪', luoPoint: '大鐘' },
  '戌': { meridian: '手厥陰心包經', motherPoint: '中衝', motherMeridian: '足太陰脾經', motherMeridianPoint: '大都', sonPoint: '大陵', shuStreamPoint: '大陵', backShu: '厥陰俞', frontMu: '膻中', yuanPoint: '大陵', luoPoint: '內關' },
  '亥': { meridian: '手少陽三焦經', motherPoint: '中渚', motherMeridian: '手厥陰心包經', motherMeridianPoint: '中衝', sonPoint: '天井', shuStreamPoint: '中渚', backShu: '三焦俞', frontMu: '石門', yuanPoint: '陽池', luoPoint: '外關' },
  '子': { meridian: '足少陽膽經', motherPoint: '俠溪', motherMeridian: '足厥陰肝經', motherMeridianPoint: '曲泉', sonPoint: '陽輔', shuStreamPoint: '足臨泣', backShu: '膽俞', frontMu: '日月', yuanPoint: '丘墟', luoPoint: '光明' },
  '丑': { meridian: '足厥陰肝經', motherPoint: '曲泉', motherMeridian: '手少陰心經', motherMeridianPoint: '少衝', sonPoint: '行間', shuStreamPoint: '太衝', backShu: '肝俞', frontMu: '期門', yuanPoint: '太衝', luoPoint: '蠡溝' },
};

export const FIVE_SHU_INDICATIONS = [
  { type: '井', indication: '病在臟者取之井', nanJing: '井主心下滿 (心下脹滿)' },
  { type: '滎', indication: '病變於色者取之滎', nanJing: '滎主身熱 (身熱、面色異常)' },
  { type: '俞', indication: '病時間時甚者取之俞', nanJing: '俞主體重節痛 (全身沉重、關節疼痛)' },
  { type: '經', indication: '病變於音者取之經', nanJing: '經主喘咳寒熱 (喘息、咳嗽、寒熱交替)' },
  { type: '合', indication: '經滿而血者病在胃，及飲食不節得病者取之於合', nanJing: '合主逆氣而泄 (氣逆、腹瀉)' },
];

/**
 * Xu's Zi Wu Liu Zhu (徐氏子午流注) - Updated SOP Implementation
 */
export interface XuNaJiaResult {
  points: string[];
  method: string;
  hourStem: string;
  source: string;
}

const XU_HIGH_PRIORITY_RULES: Record<string, string> = {
  '壬子': '關衝',
  '甲申': '液門',
  '丙午': '中渚',
  '戊辰': '支溝',
  '庚寅': '天井',
  '癸酉': '中衝',
  '乙未': '勞宮',
  '丁巳': '大陵',
  '己卯': '間使',
  '辛丑': '曲澤',
};

const XU_DAILY_FORMULA: Record<string, Record<string, string[]>> = {
  '甲': { '戌': ['竅陰'], '子': ['前谷'], '寅': ['陷谷'], '辰': ['陽谿'], '午': ['委中'] },
  '乙': { '酉': ['大敦'], '亥': ['少府'], '丑': ['太白'], '卯': ['經渠'], '巳': ['陰谷'] },
  '丙': { '申': ['少澤'], '戌': ['內庭'], '子': ['三間'], '寅': ['崑崙'], '辰': ['陽陵泉'] },
  '丁': { '未': ['少衝'], '酉': ['大都'], '亥': ['太淵'], '丑': ['復溜'], '卯': ['曲泉'] },
  '戊': { '午': ['厲兌'], '申': ['二間'], '戌': ['束骨'], '子': ['陽輔'], '寅': ['小海'] },
  '己': { '巳': ['隱白'], '未': ['魚際'], '酉': ['太溪'], '亥': ['中封'], '丑': ['少海'] },
  '庚': { '辰': ['商陽'], '午': ['通谷'], '申': ['臨泣'], '戌': ['陽谷'], '子': ['三里'] },
  '辛': { '卯': ['少商'], '巳': ['然谷'], '未': ['太衝'], '酉': ['靈道'], '亥': ['陰陵泉'] },
  '壬': { '寅': ['至陰'], '辰': ['俠谿'], '午': ['後谿'], '申': ['解谿'], '戌': ['曲池'] },
  '癸': { '亥': ['湧泉'], '丑': ['行間'], '卯': ['神門'], '巳': ['商丘'], '未': ['尺澤'] },
};

const TRANSFORMATION_PAIRS: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

const NA_ZI_FA_YUAN_POINTS: Record<string, string> = {
  '寅': '太淵', '卯': '合谷', '辰': '衝陽', '巳': '太白',
  '午': '神門', '未': '腕骨', '申': '京骨', '酉': '太谿',
  '戌': '大陵', '亥': '陽池', '子': '丘墟', '丑': '太衝',
};

const DAY_STEM_ROOT_POINTS: Record<string, string> = {
  '甲': '丘墟', '乙': '太衝', '丙': '腕骨', '丁': '神門', '戊': '衝陽',
  '己': '太白', '庚': '合谷', '辛': '太淵', '壬': '京骨', '癸': '太谿',
};

export function calculateXuNaJia(dayStem: string, hourBranch: string): XuNaJiaResult {
  const getHourStem = (dStem: string, hBranch: string) => {
    const dIdx = HEAVENLY_STEMS.indexOf(dStem);
    const hIdx = EARTHLY_BRANCHES.indexOf(hBranch);
    const hStemIdx = (dIdx % 5 * 2 + hIdx) % 10;
    return HEAVENLY_STEMS[hStemIdx];
  };

  const currentHourStem = getHourStem(dayStem, hourBranch);
  const currentFullHour = currentHourStem + hourBranch;
  const rootPoint = DAY_STEM_ROOT_POINTS[dayStem];
  
  // Step 1: Check Daily Formula (Highest Clinical Priority)
  const dailyPoints = XU_DAILY_FORMULA[dayStem]?.[hourBranch];
  if (dailyPoints) {
    const combinedPoints = rootPoint && !dailyPoints.includes(rootPoint) 
      ? [...dailyPoints, rootPoint] 
      : dailyPoints;

    return {
      points: combinedPoints,
      method: '日干按時開穴',
      hourStem: currentHourStem,
      source: `徐鳳《針灸大全》：${dayStem}日${hourBranch}時集氣於${dailyPoints.join('/')}，並配日干原穴${rootPoint}`
    };
  }

  // Step 2: High Priority Rules (Qi Na San Jiao / Xue Gui Bao Luo)
  const priorityPoint = XU_HIGH_PRIORITY_RULES[currentFullHour];
  if (priorityPoint) {
    const isYangHour = ['甲', '丙', '戊', '庚', '壬'].includes(currentHourStem);
    return {
      points: [priorityPoint, rootPoint].filter(Boolean) as string[],
      method: isYangHour ? '氣納三焦 (陽氣之父)' : '血納包絡 (陰血之母)',
      hourStem: currentHourStem,
      source: `優先權開穴，並配日干原穴${rootPoint}`
    };
  }

  // Step 3: Five Gates Ten Transformations (Transformation Pairs)
  const pairedDay = TRANSFORMATION_PAIRS[dayStem];
  const pairedHourStem = getHourStem(pairedDay, hourBranch);
  const pairedFullHour = pairedHourStem + hourBranch;
  
  // Check paired day formula or priority
  const pairedPoints = XU_DAILY_FORMULA[pairedDay]?.[hourBranch];
  if (pairedPoints) {
    return {
      points: pairedPoints,
      method: `五門十變 (合化日：${pairedDay}日)`,
      hourStem: currentHourStem,
      source: '合化開穴 (Transformation)'
    };
  }

  const pairedPriorityPoint = XU_HIGH_PRIORITY_RULES[pairedFullHour];
  if (pairedPriorityPoint) {
    const isYangHour = ['甲', '丙', '戊', '庚', '壬'].includes(pairedHourStem);
    return {
      points: [pairedPriorityPoint],
      method: `五門十變 (${isYangHour ? '氣納三焦' : '血納包絡'})`,
      hourStem: currentHourStem,
      source: '合化優先 (Transformation Priority)'
    };
  }

  // Step 4: Na Zi Fa Fallback
  const fallbackPoint = NA_ZI_FA_YUAN_POINTS[hourBranch];
  return {
    points: [fallbackPoint],
    method: '納甲無穴，回歸納子法',
    hourStem: currentHourStem,
    source: '「午時無穴子時研」，取本經原穴 (時辰原穴)'
  };
}

/**
 * Ling Gui Ba Fa (靈龜八法) - Accurate calculation based on provided base numbers
 */
export function calculateLingGuiNumber(dayStem: string, dayBranch: string, hourStem: string, hourBranch: string): number {
  // 逐日干支基數 (Day Base Numbers)
  const dayStemValues: Record<string, number> = { 
    '甲': 10, '己': 10, 
    '乙': 9, '庚': 9, 
    '丁': 8, '壬': 8, 
    '戊': 7, '癸': 7, 
    '丙': 7, '辛': 7 
  };
  const dayBranchValues: Record<string, number> = { 
    '辰': 10, '戌': 10, '丑': 10, '未': 10, 
    '申': 9, '酉': 9, 
    '寅': 8, '卯': 8, 
    '巳': 7, '午': 7, 
    '亥': 7, '子': 7 
  };

  // 臨時干支基數 (Hour Base Numbers)
  const hourStemValues: Record<string, number> = { 
    '甲': 9, '己': 9, 
    '乙': 8, '庚': 8, 
    '丙': 7, '辛': 7, 
    '丁': 6, '壬': 6, 
    '戊': 5, '癸': 5 
  };
  const hourBranchValues: Record<string, number> = { 
    '子': 9, '午': 9, 
    '丑': 8, '未': 8, 
    '寅': 7, '申': 7, 
    '卯': 6, '酉': 6, 
    '辰': 5, '戌': 5, 
    '巳': 4, '亥': 4 
  };
  
  const total = dayStemValues[dayStem] + dayBranchValues[dayBranch] + hourStemValues[hourStem] + hourBranchValues[hourBranch];
  
  // 陽日除以 9，陰日除以 6
  const isYangDay = ['甲', '丙', '戊', '庚', '壬'].includes(dayStem);
  const divisor = isYangDay ? 9 : 6;
  
  const remainder = total % divisor;
  return remainder === 0 ? divisor : remainder;
}

export const LING_GUI_POINTS: Record<number, { point: string, hexagram: string }> = {
  1: { point: '申脈', hexagram: '坎' },
  2: { point: '照海', hexagram: '坤' },
  5: { point: '照海', hexagram: '坤' },
  3: { point: '外關', hexagram: '震' },
  4: { point: '足臨泣', hexagram: '巽' },
  6: { point: '公孫', hexagram: '乾' },
  7: { point: '後溪', hexagram: '兌' },
  8: { point: '內關', hexagram: '艮' },
  9: { point: '列缺', hexagram: '離' },
};

export const LING_GUI_PAIRS = [
  { pair: ['公孫', '內關'], hexagrams: ['乾', '艮'] },
  { pair: ['外關', '足臨泣'], hexagrams: ['震', '巽'] },
  { pair: ['後溪', '申脈'], hexagrams: ['兌', '坎'] },
  { pair: ['列缺', '照海'], hexagrams: ['離', '坤'] },
];
