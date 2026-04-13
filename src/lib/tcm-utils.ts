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
 * Basic Ganzhi calculation (Simplified for demonstration)
 */
export function getGanzhi(date: Date) {
  const twDate = getTaiwanTime(date);
  const hour = twDate.getHours();
  
  // Late Zi (23:00-23:59) belongs to next day for Day Pillar calculation?
  // Wait, user said: "Late Zi... is previous day". Let's re-read carefully.
  // "Late Zi... belongs to previous day" - My previous code did this.
  // If the user says "日 已經跨了", maybe it's crossing too early?
  // Let's re-examine the logic.
  // If it's 23:22, it should be the next day's Day Pillar? No, user said "Late Zi belongs to previous day".
  // Maybe the issue is the baseDate calculation.
  
  // 子初換日派: Day Pillar changes at 00:00.
  // 23:00-23:59 belongs to the CURRENT day's Day Pillar.
  // 00:00-00:59 belongs to the NEXT day's Day Pillar.
  const isEarlyZi = hour >= 0 && hour < 1;
  const dayDate = isEarlyZi ? new Date(twDate.getTime() + 24 * 60 * 60 * 1000) : twDate;
  
  // Use UTC to avoid timezone issues
  const baseDate = new Date(Date.UTC(2026, 0, 1));
  
  // Normalize dayDate to start of day UTC for diffDays calculation
  const dayDateUTC = Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
  const diffDays = Math.floor((dayDateUTC - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  
  const dayStemIdx = ((diffDays + 1) % 10 + 10) % 10;
  const dayBranchIdx = ((diffDays + 11) % 12 + 12) % 12;
  
  const dayStem = HEAVENLY_STEMS[dayStemIdx];
  const dayBranch = EARTHLY_BRANCHES[dayBranchIdx];
  
  // Use local hours for shichen calculation as it's based on local solar time
  const shichenIdx = getShichenIndex(hour);
  const hourBranch = EARTHLY_BRANCHES[shichenIdx];
  
  // Hour stem depends on the day stem (Ri Gan Qi Shi Fa)
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
}

export const NA_ZI_FA_DATA: Record<string, NaZiFaDetail> = {
  '寅': { meridian: '手太陰肺經', motherPoint: '太淵', sonPoint: '尺澤', shuStreamPoint: '太淵', backShu: '肺俞', frontMu: '中府' },
  '卯': { meridian: '手陽明大腸經', motherPoint: '曲池', sonPoint: '二間', shuStreamPoint: '三間', backShu: '大腸俞', frontMu: '天樞' },
  '辰': { meridian: '足陽明胃經', motherPoint: '解谿', sonPoint: '厲兌', shuStreamPoint: '陷谷', backShu: '胃俞', frontMu: '中脘' },
  '巳': { meridian: '足太陰脾經', motherPoint: '大都', sonPoint: '商丘', shuStreamPoint: '太白', backShu: '脾俞', frontMu: '章門' },
  '午': { meridian: '手少陰心經', motherPoint: '少衝', sonPoint: '神門', shuStreamPoint: '神門', backShu: '心俞', frontMu: '巨闕' },
  '未': { meridian: '手太陽小腸經', motherPoint: '後溪', sonPoint: '小海', shuStreamPoint: '後溪', backShu: '小腸俞', frontMu: '關元' },
  '申': { meridian: '足太陽膀胱經', motherPoint: '至陰', sonPoint: '束骨', shuStreamPoint: '束骨', backShu: '膀胱俞', frontMu: '中極' },
  '酉': { meridian: '足少陰腎經', motherPoint: '復溜', sonPoint: '湧泉', shuStreamPoint: '太溪', backShu: '腎俞', frontMu: '京門' },
  '戌': { meridian: '手厥陰心包經', motherPoint: '中衝', sonPoint: '大陵', shuStreamPoint: '大陵', backShu: '厥陰俞', frontMu: '膻中' },
  '亥': { meridian: '手少陽三焦經', motherPoint: '中渚', sonPoint: '天井', shuStreamPoint: '中渚', backShu: '三焦俞', frontMu: '石門' },
  '子': { meridian: '足少陽膽經', motherPoint: '俠溪', sonPoint: '陽輔', shuStreamPoint: '足臨泣', backShu: '膽俞', frontMu: '日月' },
  '丑': { meridian: '足厥陰肝經', motherPoint: '曲泉', sonPoint: '行間', shuStreamPoint: '太衝', backShu: '肝俞', frontMu: '期門' },
};

export const FIVE_SHU_INDICATIONS = [
  { type: '井', indication: '病在臟者取之井', nanJing: '井主心下滿 (心下脹滿)' },
  { type: '滎', indication: '病變於色者取之滎', nanJing: '滎主身熱 (身熱、面色異常)' },
  { type: '俞', indication: '病時間時甚者取之俞', nanJing: '俞主體重節痛 (全身沉重、關節疼痛)' },
  { type: '經', indication: '病變於音者取之經', nanJing: '經主喘咳寒熱 (喘息、咳嗽、寒熱交替)' },
  { type: '合', indication: '經滿而血者病在胃，及飲食不節得病者取之於合', nanJing: '合主逆氣而泄 (氣逆、腹瀉)' },
];

/**
 * Na Jia Fa (納甲法) Data - Based on the "Zi Wu Liu Zhu Ding Xue Ge"
 * Structure: DayStem -> HourBranch -> Points[]
 */
export const NA_JIA_FA_MAP: Record<string, Record<string, string[]>> = {
  '甲': {
    '戌': ['竅陰'],
    '子': ['前谷'],
    '寅': ['陷谷', '丘墟'], // 返本還原
    '辰': ['陽溪'],
    '午': ['委中'],
    '申': ['液門'], // 日干重見納三焦
  },
  '乙': {
    '酉': ['大敦'],
    '亥': ['少府'],
    '丑': ['太白', '太衝'],
    '卯': ['經渠'],
    '巳': ['陰谷'],
    '未': ['勞宮'], // 日干重見納心包
  },
  '丙': {
    '申': ['少澤'],
    '戌': ['內庭'],
    '子': ['三間', '腕骨'],
    '寅': ['崑崙'],
    '辰': ['陽陵泉'],
    '午': ['中渚'],
  },
  '丁': {
    '未': ['少衝'],
    '酉': ['大都'],
    '亥': ['太淵', '神門'],
    '丑': ['復溜'],
    '卯': ['曲泉'],
    '巳': ['大陵'],
  },
  '戊': {
    '午': ['厲兌'],
    '申': ['前谷'], // Note: Song says 滎穴二間遷, but usually follows sequence. Using song: 二間
    '戌': ['束骨', '衝陽'],
    '子': ['陽輔'],
    '寅': ['小海'],
    '辰': ['支溝'],
  },
  '己': {
    '巳': ['隱白'],
    '未': ['魚際'],
    '酉': ['太溪', '太白'],
    '亥': ['中封'],
    '丑': ['少海'],
    '卯': ['間使'],
  },
  '庚': {
    '辰': ['商陽'],
    '午': ['通谷'],
    '申': ['足臨泣', '合谷'],
    '戌': ['陽谷'],
    '子': ['足三里'],
    '寅': ['天井'],
  },
  '辛': {
    '卯': ['少商'],
    '巳': ['然谷'],
    '未': ['太衝', '太淵'],
    '酉': ['靈道'],
    '亥': ['陰陵泉'],
    '丑': ['曲澤'],
  },
  '壬': {
    '寅': ['至陰'],
    '辰': ['俠溪'],
    '午': ['後溪', '京骨'],
    '申': ['解溪'],
    '戌': ['曲池'],
    '子': ['關衝'],
  },
  '癸': {
    '亥': ['湧泉'],
    '丑': ['行間'],
    '卯': ['神門', '太溪'],
    '巳': ['商丘'],
    '未': ['尺澤'],
    '酉': ['中衝'],
  }
};

/**
 * Correcting some points in the map based on the song text provided by user
 */
NA_JIA_FA_MAP['戊']['申'] = ['二間'];
NA_JIA_FA_MAP['壬']['午'] = ['後溪', '京骨', '陽池']; // Song mentions 陽池 for Sanjiao寄

export function getNaJiaPoints(dayStem: string, hourBranch: string): string[] {
  return NA_JIA_FA_MAP[dayStem]?.[hourBranch] || [];
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
