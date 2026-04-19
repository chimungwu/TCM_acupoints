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

  // 採用子正換日派（日曆日邊界 = 日柱邊界，臺港普遍做法）：
  //   00:00–23:59 皆屬當日日柱；00:00–00:59 為早子時（仍屬今日），
  //   23:00–23:59 為晚子時（仍屬今日）。
  // 時柱依「日上起時」法推算：早子時用當日日干起子時，
  // 晚子時 hour pillar 由當日日干再加 11 格得 甲日→甲子...壬日→甲子 等。
  // 此處只需以日曆日取日柱，不做額外調整。
  const dayDate = twDate;

  // Use UTC to avoid timezone issues
  // Reference anchor: 2026-01-01 為乙亥日（經多本萬年曆驗證）
  const baseDate = new Date(Date.UTC(2026, 0, 1));

  // Normalize dayDate to start of day UTC for diffDays calculation
  const dayDateUTC = Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
  const diffDays = Math.floor((dayDateUTC - baseDate.getTime()) / (24 * 60 * 60 * 1000));

  // 2026-01-01 = 乙亥 → stem=1, branch=11
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
 * Na Jia Fa (納甲法) Data - 徐鳳《針灸大全》《逐日按時定穴歌》
 *
 * 重要說明：
 * 每個「日週期」共 6 次開穴（井→滎→俞→經→合→三焦/心包寄穴），
 * 橫跨約 22 小時，因此 6 次開穴會跨越 2 個日曆日：
 *   - 陽日週期（甲丙戊庚壬）：始於該日「戌時」，結束於次日「申時」。
 *   - 陰日週期（乙丁己辛癸）：始於該日「酉時」，結束於次日「未時」。
 *
 * 例如「甲日週期」：
 *   甲日戌時 甲戌 → 竅陰（膽井）
 *   乙日子時 丙子 → 前谷（小腸滎）        ← 發生在乙日，不是甲日
 *   乙日寅時 戊寅 → 陷谷 + 丘墟（胃俞 + 膽原，返本還原）
 *   乙日辰時 庚辰 → 陽溪（大腸經）
 *   乙日午時 壬午 → 委中（膀胱合）
 *   乙日申時 甲申 → 液門（氣納三焦）
 *
 * 因此此表以「當天日干（日柱天干）」為鍵，列出該天所有開穴時辰，
 * 內容為「前一週期未結束的開穴」+「本日新週期起始的開穴」混合排列。
 *
 * 原則驗證：每表均有 60 穴，分布為 6/7/6/7/6/7/6/7/6/2，總數 60 = 10 × 6。
 */
export const NA_JIA_FA_MAP: Record<string, Record<string, string[]>> = {
  // 甲日：癸週期尾 5 + 甲週期頭 1
  '甲': {
    '丑': ['行間'],           // 乙丑 (癸週期 2)
    '卯': ['神門', '太溪'],    // 丁卯 (癸週期 3)  俞 + 返本還原 (心俞+腎原)
    '巳': ['商丘'],            // 己巳 (癸週期 4)
    '未': ['尺澤'],            // 辛未 (癸週期 5)
    '酉': ['中衝'],            // 癸酉 (癸週期 6) 血歸包絡
    '戌': ['竅陰'],            // 甲戌 (甲週期 1)
  },
  // 乙日：甲週期尾 5 + 乙週期頭 2
  '乙': {
    '子': ['前谷'],             // 丙子
    '寅': ['陷谷', '丘墟'],     // 戊寅 俞 + 返本還原 (胃俞+膽原)
    '辰': ['陽溪'],             // 庚辰
    '午': ['委中'],             // 壬午
    '申': ['液門'],             // 甲申 氣納三焦
    '酉': ['大敦'],             // 乙酉 (乙週期 1)
    '亥': ['少府'],             // 丁亥 (乙週期 2)
  },
  // 丙日：乙週期尾 4 + 丙週期頭 2
  '丙': {
    '丑': ['太白', '太衝'],     // 己丑 俞 + 返本還原 (脾俞+肝原)
    '卯': ['經渠'],             // 辛卯
    '巳': ['陰谷'],             // 癸巳
    '未': ['勞宮'],             // 乙未 血歸包絡
    '申': ['少澤'],             // 丙申 (丙週期 1)
    '戌': ['內庭'],             // 戊戌 (丙週期 2)
  },
  // 丁日：丙週期尾 4 + 丁週期頭 3
  '丁': {
    '子': ['三間', '腕骨'],     // 庚子 俞 + 返本還原 (大腸俞+小腸原)
    '寅': ['崑崙'],             // 壬寅
    '辰': ['陽陵泉'],           // 甲辰
    '午': ['中渚'],             // 丙午 氣納三焦
    '未': ['少衝'],             // 丁未 (丁週期 1)
    '酉': ['大都'],             // 己酉 (丁週期 2)
    '亥': ['太淵', '神門'],     // 辛亥 (丁週期 3) 俞 + 返本還原 (肺俞+心原)
  },
  // 戊日：丁週期尾 3 + 戊週期頭 3
  '戊': {
    '丑': ['復溜'],             // 癸丑
    '卯': ['曲泉'],             // 乙卯
    '巳': ['大陵'],             // 丁巳 血歸包絡
    '午': ['厲兌'],             // 戊午 (戊週期 1)
    '申': ['二間'],             // 庚申 (戊週期 2)
    '戌': ['束骨', '衝陽'],     // 壬戌 (戊週期 3) 俞 + 返本還原 (膀胱俞+胃原)
  },
  // 己日：戊週期尾 3 + 己週期頭 4
  '己': {
    '子': ['陽輔'],             // 甲子
    '寅': ['小海'],             // 丙寅
    '辰': ['支溝'],             // 戊辰 氣納三焦
    '巳': ['隱白'],             // 己巳 (己週期 1)
    '未': ['魚際'],             // 辛未 (己週期 2)
    '酉': ['太溪', '太白'],     // 癸酉 (己週期 3) 俞 + 返本還原 (腎俞+脾原)
    '亥': ['中封'],             // 乙亥 (己週期 4)
  },
  // 庚日：己週期尾 2 + 庚週期頭 4
  '庚': {
    '丑': ['少海'],             // 丁丑
    '卯': ['間使'],             // 己卯 血歸包絡
    '辰': ['商陽'],             // 庚辰 (庚週期 1)
    '午': ['通谷'],             // 壬午 (庚週期 2) 足通谷
    '申': ['足臨泣', '合谷'],   // 甲申 (庚週期 3) 俞 + 返本還原 (膽俞+大腸原)
    '戌': ['陽谷'],             // 丙戌 (庚週期 4)
  },
  // 辛日：庚週期尾 2 + 辛週期頭 5
  '辛': {
    '子': ['足三里'],           // 戊子
    '寅': ['天井'],             // 庚寅 氣納三焦
    '卯': ['少商'],             // 辛卯 (辛週期 1)
    '巳': ['然谷'],             // 癸巳 (辛週期 2)
    '未': ['太衝', '太淵'],     // 乙未 (辛週期 3) 俞 + 返本還原 (肝俞+肺原)
    '酉': ['靈道'],             // 丁酉 (辛週期 4)
    '亥': ['陰陵泉'],           // 己亥 (辛週期 5)
  },
  // 壬日：辛週期尾 1 + 壬週期頭 5
  '壬': {
    '丑': ['曲澤'],             // 辛丑 血歸包絡
    '寅': ['至陰'],             // 壬寅 (壬週期 1)
    '辰': ['俠溪'],             // 甲辰 (壬週期 2)
    '午': ['後溪', '京骨'],     // 丙午 (壬週期 3) 俞 + 返本還原 (小腸俞+膀胱原)
    '申': ['解溪'],             // 戊申 (壬週期 4)
    '戌': ['曲池'],             // 庚戌 (壬週期 5)
  },
  // 癸日：壬週期尾 1 + 癸週期頭 1
  '癸': {
    '子': ['關衝'],             // 壬子 氣納三焦
    '亥': ['湧泉'],             // 癸亥 (癸週期 1)
  },
};

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
