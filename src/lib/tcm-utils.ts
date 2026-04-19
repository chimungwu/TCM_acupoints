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
 * 納子法詳細資料 (Detailed Na Zi Fa Data)
 *
 * 結構說明：
 *   - meridian / element              : 當令經絡及其五行屬性
 *   - motherPoint / sonPoint          : 本經子母穴（同經補瀉）「實則瀉其子，虛則補其母」
 *   - motherElementName               : 本經之母五行（例：金之母＝土）
 *   - motherMeridian / motherMeridianPoint : 他經補法——母經及母經之本母穴
 *     （母經中與母經自身五行相對應的五輸穴，例：肺虛取脾經土穴太白）
 *   - sonMeridian    / sonMeridianPoint    : 他經瀉法——子經及子經之本子穴
 *   - shuStreamPoint                  : 五輸穴之「俞」穴（"病時間時甚者取之俞"）
 *   - backShu / frontMu               : 背俞／胸募（俞募配穴）
 *   - yuanPoint / luoPoint            : 原穴／絡穴（原絡配穴）
 *
 * 五行生克：木→火→土→金→水→木；陰經井滎俞經合＝木火土金水，陽經井滎俞經合＝金水木火土。
 */
export interface NaZiFaDetail {
  meridian: string;
  element: string;
  motherElementName: string;
  sonElementName: string;
  // 本經子母穴
  motherPoint: string;
  sonPoint: string;
  // 他經補瀉（母經 / 子經）
  motherMeridian: string;
  motherMeridianPoint: string;
  sonMeridian: string;
  sonMeridianPoint: string;
  // 五輸俞穴
  shuStreamPoint: string;
  // 俞募配穴
  backShu: string;
  frontMu: string;
  // 原絡配穴
  yuanPoint: string;
  luoPoint: string;
}

export const NA_ZI_FA_DATA: Record<string, NaZiFaDetail> = {
  '寅': {
    meridian: '手太陰肺經', element: '金',
    motherElementName: '土', sonElementName: '水',
    motherPoint: '太淵', sonPoint: '尺澤',
    motherMeridian: '足太陰脾經', motherMeridianPoint: '太白',
    sonMeridian: '足少陰腎經', sonMeridianPoint: '陰谷',
    shuStreamPoint: '太淵',
    backShu: '肺俞', frontMu: '中府',
    yuanPoint: '太淵', luoPoint: '列缺',
  },
  '卯': {
    meridian: '手陽明大腸經', element: '金',
    motherElementName: '土', sonElementName: '水',
    motherPoint: '曲池', sonPoint: '二間',
    motherMeridian: '足陽明胃經', motherMeridianPoint: '足三里',
    sonMeridian: '足太陽膀胱經', sonMeridianPoint: '足通谷',
    shuStreamPoint: '三間',
    backShu: '大腸俞', frontMu: '天樞',
    yuanPoint: '合谷', luoPoint: '偏歷',
  },
  '辰': {
    meridian: '足陽明胃經', element: '土',
    motherElementName: '火', sonElementName: '金',
    motherPoint: '解溪', sonPoint: '厲兌',
    motherMeridian: '手太陽小腸經', motherMeridianPoint: '陽谷',
    sonMeridian: '手陽明大腸經', sonMeridianPoint: '商陽',
    shuStreamPoint: '陷谷',
    backShu: '胃俞', frontMu: '中脘',
    yuanPoint: '衝陽', luoPoint: '豐隆',
  },
  '巳': {
    meridian: '足太陰脾經', element: '土',
    motherElementName: '火', sonElementName: '金',
    motherPoint: '大都', sonPoint: '商丘',
    motherMeridian: '手少陰心經', motherMeridianPoint: '少府',
    sonMeridian: '手太陰肺經', sonMeridianPoint: '經渠',
    shuStreamPoint: '太白',
    backShu: '脾俞', frontMu: '章門',
    yuanPoint: '太白', luoPoint: '公孫',
  },
  '午': {
    meridian: '手少陰心經', element: '火',
    motherElementName: '木', sonElementName: '土',
    motherPoint: '少衝', sonPoint: '神門',
    motherMeridian: '足厥陰肝經', motherMeridianPoint: '大敦',
    sonMeridian: '足太陰脾經', sonMeridianPoint: '太白',
    shuStreamPoint: '神門',
    backShu: '心俞', frontMu: '巨闕',
    yuanPoint: '神門', luoPoint: '通里',
  },
  '未': {
    meridian: '手太陽小腸經', element: '火',
    motherElementName: '木', sonElementName: '土',
    motherPoint: '後溪', sonPoint: '小海',
    motherMeridian: '足少陽膽經', motherMeridianPoint: '足臨泣',
    sonMeridian: '足陽明胃經', sonMeridianPoint: '足三里',
    shuStreamPoint: '後溪',
    backShu: '小腸俞', frontMu: '關元',
    yuanPoint: '腕骨', luoPoint: '支正',
  },
  '申': {
    meridian: '足太陽膀胱經', element: '水',
    motherElementName: '金', sonElementName: '木',
    motherPoint: '至陰', sonPoint: '束骨',
    motherMeridian: '手陽明大腸經', motherMeridianPoint: '商陽',
    sonMeridian: '足少陽膽經', sonMeridianPoint: '足臨泣',
    shuStreamPoint: '束骨',
    backShu: '膀胱俞', frontMu: '中極',
    yuanPoint: '京骨', luoPoint: '飛揚',
  },
  '酉': {
    meridian: '足少陰腎經', element: '水',
    motherElementName: '金', sonElementName: '木',
    motherPoint: '復溜', sonPoint: '湧泉',
    motherMeridian: '手太陰肺經', motherMeridianPoint: '經渠',
    sonMeridian: '足厥陰肝經', sonMeridianPoint: '大敦',
    shuStreamPoint: '太溪',
    backShu: '腎俞', frontMu: '京門',
    yuanPoint: '太溪', luoPoint: '大鐘',
  },
  '戌': {
    meridian: '手厥陰心包經', element: '火',
    motherElementName: '木', sonElementName: '土',
    motherPoint: '中衝', sonPoint: '大陵',
    motherMeridian: '足厥陰肝經', motherMeridianPoint: '大敦',
    sonMeridian: '足太陰脾經', sonMeridianPoint: '太白',
    shuStreamPoint: '大陵',
    backShu: '厥陰俞', frontMu: '膻中',
    yuanPoint: '大陵', luoPoint: '內關',
  },
  '亥': {
    meridian: '手少陽三焦經', element: '火',
    motherElementName: '木', sonElementName: '土',
    motherPoint: '中渚', sonPoint: '天井',
    motherMeridian: '足少陽膽經', motherMeridianPoint: '足臨泣',
    sonMeridian: '足陽明胃經', sonMeridianPoint: '足三里',
    shuStreamPoint: '中渚',
    backShu: '三焦俞', frontMu: '石門',
    yuanPoint: '陽池', luoPoint: '外關',
  },
  '子': {
    meridian: '足少陽膽經', element: '木',
    motherElementName: '水', sonElementName: '火',
    motherPoint: '俠溪', sonPoint: '陽輔',
    motherMeridian: '足太陽膀胱經', motherMeridianPoint: '足通谷',
    sonMeridian: '手太陽小腸經', sonMeridianPoint: '陽谷',
    shuStreamPoint: '足臨泣',
    backShu: '膽俞', frontMu: '日月',
    yuanPoint: '丘墟', luoPoint: '光明',
  },
  '丑': {
    meridian: '足厥陰肝經', element: '木',
    motherElementName: '水', sonElementName: '火',
    motherPoint: '曲泉', sonPoint: '行間',
    motherMeridian: '足少陰腎經', motherMeridianPoint: '陰谷',
    sonMeridian: '手少陰心經', sonMeridianPoint: '少府',
    shuStreamPoint: '太衝',
    backShu: '肝俞', frontMu: '期門',
    yuanPoint: '太衝', luoPoint: '蠡溝',
  },
};

/**
 * 納子法即時計算結果
 * 於當令時辰（該經氣血最旺時），依病機需求取穴：
 *   - 實證 → 瀉本經子穴（自經瀉法）或瀉子經之子穴（他經瀉法）
 *   - 虛證 → 補本經母穴（自經補法）或補母經之母穴（他經補法）
 */
export interface NaZiCalculationResult {
  shichen: string;              // 當前時辰地支
  detail: NaZiFaDetail;         // 該時辰所對應之納子法完整資料
  method: string;               // 本時辰的取穴說明
  currentPeakMeridian: string;  // 正值當令的經絡名稱
}

/**
 * 依時辰地支取得當令經絡納子法資料
 */
export function getNaZiDetail(hourBranch: string): NaZiFaDetail | undefined {
  return NA_ZI_FA_DATA[hourBranch];
}

/**
 * 納子法計算：依當前時辰回傳完整的補瀉法資料
 */
export function calculateNaZi(hourBranch: string): NaZiCalculationResult | null {
  const detail = NA_ZI_FA_DATA[hourBranch];
  if (!detail) return null;
  const method =
    `${hourBranch}時當令 ${detail.meridian}（${detail.element}）· ` +
    `實則瀉子 ${detail.sonPoint}，虛則補母 ${detail.motherPoint}`;
  return {
    shichen: hourBranch,
    detail,
    method,
    currentPeakMeridian: detail.meridian,
  };
}

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
 * 徐鳳《針灸大全》納甲法 — 十大週期結構
 *
 * 每個週期以「陽日始戌、陰日始酉」為第一開穴（井穴），共 6 次開穴：
 *   井 → 滎 → 俞（+ 返本還原） → 經 → 合 → 氣納三焦（陽日） / 血歸包絡（陰日）
 * 每 6 次開穴橫跨約 22 小時，依時干依序 +2 推進。
 */
export interface XuNaJiaCycleOpening {
  hourStem: string;
  hourBranch: string;
  points: string[];
  meridian: string;
  shuPoint: string;  // 井 / 滎 / 俞 / 經 / 合 / 氣納三焦 / 血歸包絡
  note?: string;     // 返本還原等補充說明
}

export const XU_NA_JIA_CYCLES: Record<string, XuNaJiaCycleOpening[]> = {
  '甲': [
    { hourStem: '甲', hourBranch: '戌', points: ['竅陰'],         meridian: '膽經',     shuPoint: '井' },
    { hourStem: '丙', hourBranch: '子', points: ['前谷'],         meridian: '小腸經',   shuPoint: '滎' },
    { hourStem: '戊', hourBranch: '寅', points: ['陷谷', '丘墟'], meridian: '胃經',     shuPoint: '俞', note: '俞原同開：膽原穴 丘墟' },
    { hourStem: '庚', hourBranch: '辰', points: ['陽溪'],         meridian: '大腸經',   shuPoint: '經' },
    { hourStem: '壬', hourBranch: '午', points: ['委中'],         meridian: '膀胱經',   shuPoint: '合' },
    { hourStem: '甲', hourBranch: '申', points: ['液門'],         meridian: '三焦經',   shuPoint: '氣納三焦' },
  ],
  '乙': [
    { hourStem: '乙', hourBranch: '酉', points: ['大敦'],         meridian: '肝經',     shuPoint: '井' },
    { hourStem: '丁', hourBranch: '亥', points: ['少府'],         meridian: '心經',     shuPoint: '滎' },
    { hourStem: '己', hourBranch: '丑', points: ['太白', '太衝'], meridian: '脾經',     shuPoint: '俞', note: '俞原同開：肝原穴 太衝' },
    { hourStem: '辛', hourBranch: '卯', points: ['經渠'],         meridian: '肺經',     shuPoint: '經' },
    { hourStem: '癸', hourBranch: '巳', points: ['陰谷'],         meridian: '腎經',     shuPoint: '合' },
    { hourStem: '乙', hourBranch: '未', points: ['勞宮'],         meridian: '心包經',   shuPoint: '血歸包絡' },
  ],
  '丙': [
    { hourStem: '丙', hourBranch: '申', points: ['少澤'],         meridian: '小腸經',   shuPoint: '井' },
    { hourStem: '戊', hourBranch: '戌', points: ['內庭'],         meridian: '胃經',     shuPoint: '滎' },
    { hourStem: '庚', hourBranch: '子', points: ['三間', '腕骨'], meridian: '大腸經',   shuPoint: '俞', note: '俞原同開：小腸原穴 腕骨' },
    { hourStem: '壬', hourBranch: '寅', points: ['崑崙'],         meridian: '膀胱經',   shuPoint: '經' },
    { hourStem: '甲', hourBranch: '辰', points: ['陽陵泉'],       meridian: '膽經',     shuPoint: '合' },
    { hourStem: '丙', hourBranch: '午', points: ['中渚'],         meridian: '三焦經',   shuPoint: '氣納三焦' },
  ],
  '丁': [
    { hourStem: '丁', hourBranch: '未', points: ['少衝'],         meridian: '心經',     shuPoint: '井' },
    { hourStem: '己', hourBranch: '酉', points: ['大都'],         meridian: '脾經',     shuPoint: '滎' },
    { hourStem: '辛', hourBranch: '亥', points: ['太淵', '神門'], meridian: '肺經',     shuPoint: '俞', note: '俞原同開：心原穴 神門' },
    { hourStem: '癸', hourBranch: '丑', points: ['復溜'],         meridian: '腎經',     shuPoint: '經' },
    { hourStem: '乙', hourBranch: '卯', points: ['曲泉'],         meridian: '肝經',     shuPoint: '合' },
    { hourStem: '丁', hourBranch: '巳', points: ['大陵'],         meridian: '心包經',   shuPoint: '血歸包絡' },
  ],
  '戊': [
    { hourStem: '戊', hourBranch: '午', points: ['厲兌'],         meridian: '胃經',     shuPoint: '井' },
    { hourStem: '庚', hourBranch: '申', points: ['二間'],         meridian: '大腸經',   shuPoint: '滎' },
    { hourStem: '壬', hourBranch: '戌', points: ['束骨', '衝陽'], meridian: '膀胱經',   shuPoint: '俞', note: '俞原同開：胃原穴 衝陽' },
    { hourStem: '甲', hourBranch: '子', points: ['陽輔'],         meridian: '膽經',     shuPoint: '經' },
    { hourStem: '丙', hourBranch: '寅', points: ['小海'],         meridian: '小腸經',   shuPoint: '合' },
    { hourStem: '戊', hourBranch: '辰', points: ['支溝'],         meridian: '三焦經',   shuPoint: '氣納三焦' },
  ],
  '己': [
    { hourStem: '己', hourBranch: '巳', points: ['隱白'],         meridian: '脾經',     shuPoint: '井' },
    { hourStem: '辛', hourBranch: '未', points: ['魚際'],         meridian: '肺經',     shuPoint: '滎' },
    { hourStem: '癸', hourBranch: '酉', points: ['太溪', '太白'], meridian: '腎經',     shuPoint: '俞', note: '俞原同開：脾原穴 太白' },
    { hourStem: '乙', hourBranch: '亥', points: ['中封'],         meridian: '肝經',     shuPoint: '經' },
    { hourStem: '丁', hourBranch: '丑', points: ['少海'],         meridian: '心經',     shuPoint: '合' },
    { hourStem: '己', hourBranch: '卯', points: ['間使'],         meridian: '心包經',   shuPoint: '血歸包絡' },
  ],
  '庚': [
    { hourStem: '庚', hourBranch: '辰', points: ['商陽'],         meridian: '大腸經',   shuPoint: '井' },
    { hourStem: '壬', hourBranch: '午', points: ['通谷'],         meridian: '膀胱經',   shuPoint: '滎' },
    { hourStem: '甲', hourBranch: '申', points: ['足臨泣', '合谷'], meridian: '膽經',   shuPoint: '俞', note: '俞原同開：大腸原穴 合谷' },
    { hourStem: '丙', hourBranch: '戌', points: ['陽谷'],         meridian: '小腸經',   shuPoint: '經' },
    { hourStem: '戊', hourBranch: '子', points: ['足三里'],       meridian: '胃經',     shuPoint: '合' },
    { hourStem: '庚', hourBranch: '寅', points: ['天井'],         meridian: '三焦經',   shuPoint: '氣納三焦' },
  ],
  '辛': [
    { hourStem: '辛', hourBranch: '卯', points: ['少商'],         meridian: '肺經',     shuPoint: '井' },
    { hourStem: '癸', hourBranch: '巳', points: ['然谷'],         meridian: '腎經',     shuPoint: '滎' },
    { hourStem: '乙', hourBranch: '未', points: ['太衝', '太淵'], meridian: '肝經',     shuPoint: '俞', note: '俞原同開：肺原穴 太淵' },
    { hourStem: '丁', hourBranch: '酉', points: ['靈道'],         meridian: '心經',     shuPoint: '經' },
    { hourStem: '己', hourBranch: '亥', points: ['陰陵泉'],       meridian: '脾經',     shuPoint: '合' },
    { hourStem: '辛', hourBranch: '丑', points: ['曲澤'],         meridian: '心包經',   shuPoint: '血歸包絡' },
  ],
  '壬': [
    { hourStem: '壬', hourBranch: '寅', points: ['至陰'],         meridian: '膀胱經',   shuPoint: '井' },
    { hourStem: '甲', hourBranch: '辰', points: ['俠溪'],         meridian: '膽經',     shuPoint: '滎' },
    { hourStem: '丙', hourBranch: '午', points: ['後溪', '京骨'], meridian: '小腸經',   shuPoint: '俞', note: '俞原同開：膀胱原穴 京骨' },
    { hourStem: '戊', hourBranch: '申', points: ['解溪'],         meridian: '胃經',     shuPoint: '經' },
    { hourStem: '庚', hourBranch: '戌', points: ['曲池'],         meridian: '大腸經',   shuPoint: '合' },
    { hourStem: '壬', hourBranch: '子', points: ['關衝'],         meridian: '三焦經',   shuPoint: '氣納三焦' },
  ],
  '癸': [
    { hourStem: '癸', hourBranch: '亥', points: ['湧泉'],         meridian: '腎經',     shuPoint: '井' },
    { hourStem: '乙', hourBranch: '丑', points: ['行間'],         meridian: '肝經',     shuPoint: '滎' },
    { hourStem: '丁', hourBranch: '卯', points: ['神門', '太溪'], meridian: '心經',     shuPoint: '俞', note: '俞原同開：腎原穴 太溪' },
    { hourStem: '己', hourBranch: '巳', points: ['商丘'],         meridian: '脾經',     shuPoint: '經' },
    { hourStem: '辛', hourBranch: '未', points: ['尺澤'],         meridian: '肺經',     shuPoint: '合' },
    { hourStem: '癸', hourBranch: '酉', points: ['中衝'],         meridian: '心包經',   shuPoint: '血歸包絡' },
  ],
};

export interface XuNaJiaResult {
  source: string;    // 典籍出處
  hourStem: string;  // 以「日上起時」算出的本時辰天干
  method: string;    // 本時辰的開穴說明（週期、井滎俞經合、返本還原等）
  points: string[];  // 開穴名稱，若為閉穴則為空陣列
  cycleStem?: string;  // 所屬週期的起始日干（閉穴時為 undefined）
  position?: number;   // 週期中第幾穴（0~5，閉穴時為 undefined）
  isOpen: boolean;     // 是否為開穴時辰
}

/**
 * 徐鳳《針灸大全》納甲法開穴計算
 *
 * 依「日上起時」推出本時辰之天干（時柱），再查對《逐日按時定穴歌》
 * 六十開穴表，判斷此時辰所屬週期、位次（井滎俞經合/三焦寄穴/心包寄穴），
 * 並回傳對應開穴。
 *
 * @param dayStem   當日日干（日柱天干）
 * @param hourBranch 本時辰地支
 */
export function calculateXuNaJia(dayStem: string, hourBranch: string): XuNaJiaResult {
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayStem);
  const hourBranchIdx = EARTHLY_BRANCHES.indexOf(hourBranch);

  // 日上起時：甲己還加甲、乙庚丙作初、丙辛從戊起、丁壬庚子居、戊癸何方發，壬子是真途
  const hourStemStartIdx = (dayStemIdx % 5) * 2;
  const hourStemIdx = ((hourStemStartIdx + hourBranchIdx) % 10 + 10) % 10;
  const hourStem = HEAVENLY_STEMS[hourStemIdx];

  const points = NA_JIA_FA_MAP[dayStem]?.[hourBranch] ?? [];

  if (points.length === 0) {
    return {
      source: '徐鳳《針灸大全》 納甲法',
      hourStem,
      method: '閉穴（此時辰非《逐日按時定穴歌》開穴時辰）',
      points: [],
      isOpen: false,
    };
  }

  // 由 (hourStem, hourBranch) 在十大週期中查出所屬週期與位次
  let cycleStem: string | undefined;
  let position: number | undefined;
  let opening: XuNaJiaCycleOpening | undefined;
  for (const stem of HEAVENLY_STEMS) {
    const cycle = XU_NA_JIA_CYCLES[stem];
    if (!cycle) continue;
    const idx = cycle.findIndex(o => o.hourStem === hourStem && o.hourBranch === hourBranch);
    if (idx >= 0) {
      cycleStem = stem;
      position = idx;
      opening = cycle[idx];
      break;
    }
  }

  let method = '開穴';
  if (opening && cycleStem !== undefined && position !== undefined) {
    const posLabel = ['第一穴（井）', '第二穴（滎）', '第三穴（俞）', '第四穴（經）', '第五穴（合）', '第六穴'][position] || '';
    if (opening.shuPoint === '氣納三焦') {
      method = `${cycleStem}日週期 · ${posLabel} · 氣納三焦（陽日第六穴，寄於三焦經）`;
    } else if (opening.shuPoint === '血歸包絡') {
      method = `${cycleStem}日週期 · ${posLabel} · 血歸包絡（陰日第六穴，寄於心包經）`;
    } else {
      method = `${cycleStem}日週期 · ${posLabel} · ${opening.meridian}${opening.shuPoint}穴`;
    }
    if (opening.note) {
      method += ` · ${opening.note}`;
    }
  }

  return {
    source: '徐鳳《針灸大全》 納甲法',
    hourStem,
    method,
    points,
    cycleStem,
    position,
    isOpen: true,
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
