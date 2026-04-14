/**
 * TCM Utilities for calculating Ganzhi (Stems and Branches) and Time-based Acupoint Methods
 */

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * Get Taiwan Time (UTC+8)
 */
export function getTaiwanTime(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000));
}

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
  const twDate = getTaiwanTime(date);
  const hour = twDate.getHours();
  
  // Determine the date to use for Day Pillar calculation
  let dayDate = new Date(twDate);
  
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
    year: getYearGanzhi(twDate.getFullYear()),
    month: getMonthGanzhi(twDate.getFullYear(), twDate.getMonth()),
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
  sonPoint: string;
  shuStreamPoint: string;
  backShu: string;
  frontMu: string;
  yuanPoint: string;
  luoPoint: string;
}

export const NA_ZI_FA_DATA: Record<string, NaZiFaDetail> = {
  '寅': { meridian: '手太陰肺經', motherPoint: '太淵', sonPoint: '尺澤', shuStreamPoint: '太淵', backShu: '肺俞', frontMu: '中府', yuanPoint: '太淵', luoPoint: '列缺' },
  '卯': { meridian: '手陽明大腸經', motherPoint: '曲池', sonPoint: '二間', shuStreamPoint: '三間', backShu: '大腸俞', frontMu: '天樞', yuanPoint: '合谷', luoPoint: '偏歷' },
  '辰': { meridian: '足陽明胃經', motherPoint: '解谿', sonPoint: '厲兌', shuStreamPoint: '陷谷', backShu: '胃俞', frontMu: '中脘', yuanPoint: '衝陽', luoPoint: '豐隆' },
  '巳': { meridian: '足太陰脾經', motherPoint: '大都', sonPoint: '商丘', shuStreamPoint: '太白', backShu: '脾俞', frontMu: '章門', yuanPoint: '太白', luoPoint: '公孫' },
  '午': { meridian: '手少陰心經', motherPoint: '少衝', sonPoint: '神門', shuStreamPoint: '神門', backShu: '心俞', frontMu: '巨闕', yuanPoint: '神門', luoPoint: '通里' },
  '未': { meridian: '手太陽小腸經', motherPoint: '後溪', sonPoint: '小海', shuStreamPoint: '後溪', backShu: '小腸俞', frontMu: '關元', yuanPoint: '腕骨', luoPoint: '支正' },
  '申': { meridian: '足太陽膀胱經', motherPoint: '至陰', sonPoint: '束骨', shuStreamPoint: '束骨', backShu: '膀胱俞', frontMu: '中極', yuanPoint: '京骨', luoPoint: '飛揚' },
  '酉': { meridian: '足少陰腎經', motherPoint: '復溜', sonPoint: '湧泉', shuStreamPoint: '太溪', backShu: '腎俞', frontMu: '京門', yuanPoint: '太溪', luoPoint: '大鐘' },
  '戌': { meridian: '手厥陰心包經', motherPoint: '中衝', sonPoint: '大陵', shuStreamPoint: '大陵', backShu: '厥陰俞', frontMu: '膻中', yuanPoint: '大陵', luoPoint: '內關' },
  '亥': { meridian: '手少陽三焦經', motherPoint: '中渚', sonPoint: '天井', shuStreamPoint: '中渚', backShu: '三焦俞', frontMu: '石門', yuanPoint: '陽池', luoPoint: '外關' },
  '子': { meridian: '足少陽膽經', motherPoint: '俠溪', sonPoint: '陽輔', shuStreamPoint: '足臨泣', backShu: '膽俞', frontMu: '日月', yuanPoint: '丘墟', luoPoint: '光明' },
  '丑': { meridian: '足厥陰肝經', motherPoint: '曲泉', sonPoint: '行間', shuStreamPoint: '太衝', backShu: '肝俞', frontMu: '期門', yuanPoint: '太衝', luoPoint: '蠡溝' },
};

export const FIVE_SHU_INDICATIONS = [
  { type: '井', indication: '病在臟者取之井', nanJing: '井主心下滿 (心下脹滿)' },
  { type: '滎', indication: '病變於色者取之滎', nanJing: '滎主身熱 (身熱、面色異常)' },
  { type: '俞', indication: '病時間時甚者取之俞', nanJing: '俞主體重節痛 (全身沉重、關節疼痛)' },
  { type: '經', indication: '病變於音者取之經', nanJing: '經主喘咳寒熱 (喘息、咳嗽、寒熱交替)' },
  { type: '合', indication: '經滿而血者病在胃，及飲食不節得病者取之於合', nanJing: '合主逆氣而泄 (氣逆、腹瀉)' },
];

/**
 * Na Jia Fa (納甲法) - New SOP Implementation
 */
export interface NaJiaResult {
  primary: string | null;
  alternative: string;
  hourStem: string;
  transformation: string;
}

const STEM_TO_MERIDIAN: Record<string, string> = {
  '甲': '足少陽膽經',
  '乙': '足厥陰肝經',
  '丙': '手太陽小腸經',
  '丁': '手少陰心經',
  '戊': '足陽明胃經',
  '己': '足太陰脾經',
  '庚': '手陽明大腸經',
  '辛': '手太陰肺經',
  '壬': '足太陽膀胱經',
  '癸': '足少陰腎經',
};

const MERIDIAN_FIVE_SHU: Record<string, string[]> = {
  '足少陽膽經': ['足竅陰', '俠溪', '足臨泣', '陽輔', '陽陵泉'],
  '足厥陰肝經': ['大敦', '行間', '太衝', '中封', '曲泉'],
  '手太陽小腸經': ['少澤', '前谷', '後溪', '陽谷', '小海'],
  '手少陰心經': ['少衝', '少府', '神門', '靈道', '少海'],
  '足陽明胃經': ['厲兌', '內庭', '陷谷', '解谿', '足三里'],
  '足太陰脾經': ['隱白', '大都', '太白', '商丘', '陰陵泉'],
  '手陽明大腸經': ['商陽', '二間', '三間', '陽溪', '曲池'],
  '手太陰肺經': ['少商', '魚際', '太淵', '經渠', '尺澤'],
  '足太陽膀胱經': ['至陰', '足通谷', '束骨', '昆崙', '委中'],
  '足少陰腎經': ['湧泉', '然谷', '太溪', '復溜', '陰谷'],
};

const YANG_YUAN_POINTS: Record<string, string> = {
  '足少陽膽經': '丘墟',
  '手太陽小腸經': '腕骨',
  '足陽明胃經': '衝陽',
  '手陽明大腸經': '合谷',
  '足太陽膀胱經': '京骨',
};

const TRANSFORMATION_MAP: Record<string, string> = {
  '甲': '土', '己': '土',
  '乙': '金', '庚': '金',
  '丙': '水', '辛': '水',
  '丁': '木', '壬': '木',
  '戊': '火', '癸': '火',
};

export function calculateNaJia(dayStem: string, hourBranch: string): NaJiaResult {
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayStem);
  const hourBranchIdx = EARTHLY_BRANCHES.indexOf(hourBranch);
  
  // 1. Get Hour Stem (Wu Shu Dun)
  // Formula: (Day_Stem_Idx % 5 * 2 + 2 + Hour_Branch_Idx) % 10
  const hourStemIdx = (dayStemIdx % 5 * 2 + 2 + hourBranchIdx) % 10;
  const hourStem = HEAVENLY_STEMS[hourStemIdx];
  
  // 2. Primary Open Check
  let primary: string | null = null;
  const isYangDay = ['甲', '丙', '戊', '庚', '壬'].includes(dayStem);
  const isYangHour = ['甲', '丙', '戊', '庚', '壬'].includes(hourStem);
  
  // Traditional Na Jia Sequence Logic (Simplified to match SOP "符合序列")
  if (isYangDay && isYangHour) {
    const yangStems = ['甲', '丙', '戊', '庚', '壬'];
    const stemPos = yangStems.indexOf(hourStem);
    const meridian = STEM_TO_MERIDIAN[dayStem];
    const shu = MERIDIAN_FIVE_SHU[meridian];
    const yuan = YANG_YUAN_POINTS[meridian];
    
    // Sequence: 井(0), 滎(1), 輸(2), 原(yuan), 經(3), 合(4)
    const sequence = [shu[0], shu[1], shu[2], yuan, shu[3], shu[4]];
    primary = sequence[stemPos] || null;
  } else if (!isYangDay && !isYangHour) {
    const yinStems = ['乙', '丁', '己', '辛', '癸'];
    const stemPos = yinStems.indexOf(hourStem);
    const meridian = STEM_TO_MERIDIAN[dayStem];
    const shu = MERIDIAN_FIVE_SHU[meridian];
    
    // Sequence: 井(0), 滎(1), 輸(2), 經(3), 合(4)
    primary = shu[stemPos] || null;
  }
  
  // 3. Alternative Gate (Five Gates Ten Transformations)
  const altMeridian = STEM_TO_MERIDIAN[hourStem];
  const pos = (hourBranchIdx % 5) + 1;
  const altPoint = MERIDIAN_FIVE_SHU[altMeridian][pos - 1];
  const transformation = TRANSFORMATION_MAP[hourStem];

  return {
    primary,
    alternative: altPoint,
    hourStem,
    transformation
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
