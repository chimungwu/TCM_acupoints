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
 * 納子法詳細資料 (Detailed Na Zi Fa Data) — 子午流注 按時補瀉
 *
 * 理論依據：
 *   《難經·第六十九難》：「虛則補其母，實則瀉其子。」
 *   《難經·第七十九難》：「迎而奪之者瀉其子也；隨而濟之者補其母也。」
 *   《十二經穴子母補瀉歌》：「肺瀉尺澤補太淵，大腸二間曲池間，胃瀉厲兌解溪補，
 *   脾在商丘大都邊；心先神門後少衝，小腸小海後溪連，膀胱束骨補至陰，腎瀉湧泉復溜焉。
 *   心包瀉大陵補中衝，三焦瀉天井補中渚，膽瀉陽輔補俠溪，肝瀉行間補曲泉。」
 *
 * 子午流注納子法—補母瀉子法兩軌並陳：
 *
 *   主法甲（本經迎隨．《十二經穴子母補瀉歌》+《難經·七十九難》）
 *     ── 瀉本經實於本時（迎奪）、補本經虛於次時（隨濟）
 *       瀉：本經當令本時，取本經「子穴」。
 *       補：本經當令之次一時辰（本經氣方衰），取本經「母穴」。
 *     故「此時辰」同時兼具兩重身份：
 *       (1) 為「當令經」之本時 → 瀉當令經子穴
 *       (2) 為「前一時辰當令經」之次時 → 補前一經母穴
 *     如：申時 = 膀胱當令本時（瀉束骨） = 小腸當令之次時（補後溪）。
 *
 *   主法乙（本時雙軌．徐鳳《針灸大全》）
 *     ── 當令本時同時瀉本經子、補子經母
 *       本經當令之時，本經氣血最盛，其五行即其「子經」之母；
 *       故於本時亦可取子經上之「母穴」（五行屬當令五行者）補子經虛。
 *     例：午時心火當令 → 神門（心土，本經子）瀉心實；大都（脾火，脾土之母）補脾虛。
 *
 *   異經輔法（《針灸大全》他經補瀉）
 *     補本經虛：於「母經當令」時取母經本穴。
 *     瀉本經實：於「子經當令」時取子經本穴。
 *     如：肺虛 → 巳時取太白；肺實 → 酉時取陰谷。
 *
 * 欄位說明：
 *   - meridian / element              : 當令經絡及其五行屬性
 *   - motherElementName / sonElementName  : 本經之母／子五行
 *   - sonPoint / sonPointShichen      : 本經子穴、本時（瀉本經實；主法甲乙共用）
 *   - motherPoint / motherPointShichen: 本經母穴、次時（補本經虛；主法甲）
 *   - prevMeridian / prevMotherPoint  : 前一當令經、前一經之母穴
 *       本時即為前經之次時，故可於本時補前一經虛（主法甲之同時辰應用）
 *   - childMeridian / childMotherPoint: 子經名稱、子經母穴
 *       本時取子經母穴以補子經虛（主法乙 方法2）
 *   - motherMeridian / motherMeridianPoint / motherMeridianShichen
 *       : 本經之母經、母經本穴、母經當令時辰（異經補本經虛之輔法）
 *   - sonMeridian / sonMeridianPoint / sonMeridianShichen
 *       : 本經之子經、子經本穴、子經當令時辰（異經瀉本經實之輔法）
 *   - shuStreamPoint                  : 五輸之「俞」穴（《靈樞·順氣一日分為四時》：
 *                                       「病時間時甚者取之俞」）
 *   - backShu / frontMu               : 背俞／胸募（俞募配穴）
 *   - yuanPoint / luoPoint            : 原穴／絡穴（原絡配穴）
 *
 * 五輸五行配屬：
 *   陰經（肺脾心腎肝心包）井滎俞經合 = 木火土金水
 *   陽經（大腸胃小腸膀胱膽三焦）井滎俞經合 = 金水木火土
 *   「本穴」＝ 該經中五行屬性與本經自身五行相同者。
 *   例：肺金＝經穴經渠；脾土＝俞穴太白；胃土＝合穴足三里；小腸火＝經穴陽谷。
 */
export interface NaZiFaDetail {
  meridian: string;
  element: string;
  motherElementName: string;
  sonElementName: string;
  // 本時瀉本經子穴（主法甲乙共用）
  sonPoint: string;
  sonPointShichen: string;      // = 本時
  // 主法甲：本經母穴（於次時補）
  motherPoint: string;
  motherPointShichen: string;   // 本經之次時（自經補母時辰）
  // 主法甲同時辰應用：本時即前一經之次時，可補前一經母
  prevMeridian: string;
  prevMotherPoint: string;
  // 主法乙（方法2）：本時補子經母穴
  childMeridian: string;
  childMotherPoint: string;
  // 異經補瀉輔法
  motherMeridian: string;
  motherMeridianPoint: string;
  motherMeridianShichen: string;  // 母經當令時辰
  sonMeridian: string;
  sonMeridianPoint: string;
  sonMeridianShichen: string;     // 子經當令時辰
  // 五輸俞穴
  shuStreamPoint: string;
  // 俞募配穴
  backShu: string;
  frontMu: string;
  // 原絡配穴
  yuanPoint: string;
  luoPoint: string;
}

/**
 * 寅→卯→辰→巳→午→未→申→酉→戌→亥→子→丑 十二時辰依序對應十二經流注：
 * 肺→大腸→胃→脾→心→小腸→膀胱→腎→心包→三焦→膽→肝
 *
 * 每個時辰兼具三重身份：
 *   (A) 為當令經之本時 → 瀉當令經子穴（迎奪）
 *   (B) 為前一經之次時 → 補前一經母穴（隨濟；即《十二經穴子母補瀉歌》所本）
 *   (C) 本經子經之母氣亦旺 → 本時補子經母穴（方法2 本時雙軌）
 *
 * 例：申時（膀胱當令） → (A) 瀉束骨、(B) 補後溪〔小腸母〕、(C) 補俠溪〔膽母〕。
 */
export const NA_ZI_FA_DATA: Record<string, NaZiFaDetail> = {
  '寅': {
    meridian: '手太陰肺經', element: '金',
    motherElementName: '土', sonElementName: '水',
    sonPoint: '尺澤',     sonPointShichen: '寅',
    motherPoint: '太淵',  motherPointShichen: '卯',
    prevMeridian: '足厥陰肝經', prevMotherPoint: '曲泉',
    childMeridian: '足少陰腎經', childMotherPoint: '復溜',
    motherMeridian: '足太陰脾經', motherMeridianPoint: '太白',  motherMeridianShichen: '巳',
    sonMeridian: '足少陰腎經',    sonMeridianPoint: '陰谷',      sonMeridianShichen: '酉',
    shuStreamPoint: '太淵',
    backShu: '肺俞', frontMu: '中府',
    yuanPoint: '太淵', luoPoint: '列缺',
  },
  '卯': {
    meridian: '手陽明大腸經', element: '金',
    motherElementName: '土', sonElementName: '水',
    sonPoint: '二間',     sonPointShichen: '卯',
    motherPoint: '曲池',  motherPointShichen: '辰',
    prevMeridian: '手太陰肺經', prevMotherPoint: '太淵',
    childMeridian: '足太陽膀胱經', childMotherPoint: '至陰',
    motherMeridian: '足陽明胃經', motherMeridianPoint: '足三里', motherMeridianShichen: '辰',
    sonMeridian: '足太陽膀胱經',  sonMeridianPoint: '足通谷',    sonMeridianShichen: '申',
    shuStreamPoint: '三間',
    backShu: '大腸俞', frontMu: '天樞',
    yuanPoint: '合谷', luoPoint: '偏歷',
  },
  '辰': {
    meridian: '足陽明胃經', element: '土',
    motherElementName: '火', sonElementName: '金',
    sonPoint: '厲兌',     sonPointShichen: '辰',
    motherPoint: '解溪',  motherPointShichen: '巳',
    prevMeridian: '手陽明大腸經', prevMotherPoint: '曲池',
    childMeridian: '手陽明大腸經', childMotherPoint: '曲池',
    motherMeridian: '手太陽小腸經', motherMeridianPoint: '陽谷', motherMeridianShichen: '未',
    sonMeridian: '手陽明大腸經',    sonMeridianPoint: '商陽',    sonMeridianShichen: '卯',
    shuStreamPoint: '陷谷',
    backShu: '胃俞', frontMu: '中脘',
    yuanPoint: '衝陽', luoPoint: '豐隆',
  },
  '巳': {
    meridian: '足太陰脾經', element: '土',
    motherElementName: '火', sonElementName: '金',
    sonPoint: '商丘',     sonPointShichen: '巳',
    motherPoint: '大都',  motherPointShichen: '午',
    prevMeridian: '足陽明胃經', prevMotherPoint: '解溪',
    childMeridian: '手太陰肺經', childMotherPoint: '太淵',
    motherMeridian: '手少陰心經', motherMeridianPoint: '少府',  motherMeridianShichen: '午',
    sonMeridian: '手太陰肺經',    sonMeridianPoint: '經渠',      sonMeridianShichen: '寅',
    shuStreamPoint: '太白',
    backShu: '脾俞', frontMu: '章門',
    yuanPoint: '太白', luoPoint: '公孫',
  },
  '午': {
    meridian: '手少陰心經', element: '火',
    motherElementName: '木', sonElementName: '土',
    sonPoint: '神門',     sonPointShichen: '午',
    motherPoint: '少衝',  motherPointShichen: '未',
    prevMeridian: '足太陰脾經', prevMotherPoint: '大都',
    childMeridian: '足太陰脾經', childMotherPoint: '大都',
    motherMeridian: '足厥陰肝經', motherMeridianPoint: '大敦',  motherMeridianShichen: '丑',
    sonMeridian: '足太陰脾經',    sonMeridianPoint: '太白',      sonMeridianShichen: '巳',
    shuStreamPoint: '神門',
    backShu: '心俞', frontMu: '巨闕',
    yuanPoint: '神門', luoPoint: '通里',
  },
  '未': {
    meridian: '手太陽小腸經', element: '火',
    motherElementName: '木', sonElementName: '土',
    sonPoint: '小海',     sonPointShichen: '未',
    motherPoint: '後溪',  motherPointShichen: '申',
    prevMeridian: '手少陰心經', prevMotherPoint: '少衝',
    childMeridian: '足陽明胃經', childMotherPoint: '解溪',
    motherMeridian: '足少陽膽經', motherMeridianPoint: '足臨泣', motherMeridianShichen: '子',
    sonMeridian: '足陽明胃經',    sonMeridianPoint: '足三里',    sonMeridianShichen: '辰',
    shuStreamPoint: '後溪',
    backShu: '小腸俞', frontMu: '關元',
    yuanPoint: '腕骨', luoPoint: '支正',
  },
  '申': {
    meridian: '足太陽膀胱經', element: '水',
    motherElementName: '金', sonElementName: '木',
    sonPoint: '束骨',     sonPointShichen: '申',
    motherPoint: '至陰',  motherPointShichen: '酉',
    prevMeridian: '手太陽小腸經', prevMotherPoint: '後溪',
    childMeridian: '足少陽膽經', childMotherPoint: '俠溪',
    motherMeridian: '手陽明大腸經', motherMeridianPoint: '商陽', motherMeridianShichen: '卯',
    sonMeridian: '足少陽膽經',      sonMeridianPoint: '足臨泣',  sonMeridianShichen: '子',
    shuStreamPoint: '束骨',
    backShu: '膀胱俞', frontMu: '中極',
    yuanPoint: '京骨', luoPoint: '飛揚',
  },
  '酉': {
    meridian: '足少陰腎經', element: '水',
    motherElementName: '金', sonElementName: '木',
    sonPoint: '湧泉',     sonPointShichen: '酉',
    motherPoint: '復溜',  motherPointShichen: '戌',
    prevMeridian: '足太陽膀胱經', prevMotherPoint: '至陰',
    childMeridian: '足厥陰肝經', childMotherPoint: '曲泉',
    motherMeridian: '手太陰肺經', motherMeridianPoint: '經渠',  motherMeridianShichen: '寅',
    sonMeridian: '足厥陰肝經',    sonMeridianPoint: '大敦',      sonMeridianShichen: '丑',
    shuStreamPoint: '太溪',
    backShu: '腎俞', frontMu: '京門',
    yuanPoint: '太溪', luoPoint: '大鐘',
  },
  '戌': {
    meridian: '手厥陰心包經', element: '火',
    motherElementName: '木', sonElementName: '土',
    sonPoint: '大陵',     sonPointShichen: '戌',
    motherPoint: '中衝',  motherPointShichen: '亥',
    prevMeridian: '足少陰腎經', prevMotherPoint: '復溜',
    childMeridian: '足太陰脾經', childMotherPoint: '大都',
    motherMeridian: '足厥陰肝經', motherMeridianPoint: '大敦',  motherMeridianShichen: '丑',
    sonMeridian: '足太陰脾經',    sonMeridianPoint: '太白',      sonMeridianShichen: '巳',
    shuStreamPoint: '大陵',
    backShu: '厥陰俞', frontMu: '膻中',
    yuanPoint: '大陵', luoPoint: '內關',
  },
  '亥': {
    meridian: '手少陽三焦經', element: '火',
    motherElementName: '木', sonElementName: '土',
    sonPoint: '天井',     sonPointShichen: '亥',
    motherPoint: '中渚',  motherPointShichen: '子',
    prevMeridian: '手厥陰心包經', prevMotherPoint: '中衝',
    childMeridian: '足陽明胃經', childMotherPoint: '解溪',
    motherMeridian: '足少陽膽經', motherMeridianPoint: '足臨泣', motherMeridianShichen: '子',
    sonMeridian: '足陽明胃經',    sonMeridianPoint: '足三里',    sonMeridianShichen: '辰',
    shuStreamPoint: '中渚',
    backShu: '三焦俞', frontMu: '石門',
    yuanPoint: '陽池', luoPoint: '外關',
  },
  '子': {
    meridian: '足少陽膽經', element: '木',
    motherElementName: '水', sonElementName: '火',
    sonPoint: '陽輔',     sonPointShichen: '子',
    motherPoint: '俠溪',  motherPointShichen: '丑',
    prevMeridian: '手少陽三焦經', prevMotherPoint: '中渚',
    childMeridian: '手太陽小腸經', childMotherPoint: '後溪',
    motherMeridian: '足太陽膀胱經', motherMeridianPoint: '足通谷', motherMeridianShichen: '申',
    sonMeridian: '手太陽小腸經',    sonMeridianPoint: '陽谷',      sonMeridianShichen: '未',
    shuStreamPoint: '足臨泣',
    backShu: '膽俞', frontMu: '日月',
    yuanPoint: '丘墟', luoPoint: '光明',
  },
  '丑': {
    meridian: '足厥陰肝經', element: '木',
    motherElementName: '水', sonElementName: '火',
    sonPoint: '行間',     sonPointShichen: '丑',
    motherPoint: '曲泉',  motherPointShichen: '寅',
    prevMeridian: '足少陽膽經', prevMotherPoint: '俠溪',
    childMeridian: '手少陰心經', childMotherPoint: '少衝',
    motherMeridian: '足少陰腎經', motherMeridianPoint: '陰谷',  motherMeridianShichen: '酉',
    sonMeridian: '手少陰心經',    sonMeridianPoint: '少府',      sonMeridianShichen: '午',
    shuStreamPoint: '太衝',
    backShu: '肝俞', frontMu: '期門',
    yuanPoint: '太衝', luoPoint: '蠡溝',
  },
};

/**
 * 納子法即時計算結果
 *
 * 子午流注納子法依時辰施治。補母瀉子法並陳兩軌：
 *   主法甲（本經迎隨．《十二經穴子母補瀉歌》＋《難經·七十九難》）
 *     — 瀉本經子穴於本時（迎奪）；補本經母穴於次時（隨濟）。
 *       本時同時為「前一當令經」之次時，故亦補前一經母穴。
 *   主法乙（本時雙軌．徐鳳《針灸大全》）
 *     — 本時同時可補子經母穴，蓋本經氣盛則子經母氣亦旺。
 *   異經輔法
 *     — 母經當令時補母經本穴；子經當令時瀉子經本穴。
 */
export interface NaZiCalculationResult {
  shichen: string;              // 當前時辰地支
  detail: NaZiFaDetail;         // 該時辰所對應之納子法完整資料
  currentPeakMeridian: string;  // 正值當令的經絡名稱
  method: string;               // 本時辰的取穴說明摘要
  // 於本時辰可執行的動作（若 null 則表示非其施行時辰）
  currentHourActions: string[]; // 例：['寅時當令 → 瀉肺子穴尺澤（肺實）']
}

/**
 * 依時辰地支取得當令經絡納子法資料
 */
export function getNaZiDetail(hourBranch: string): NaZiFaDetail | undefined {
  return NA_ZI_FA_DATA[hourBranch];
}

/**
 * 納子法計算：依當前時辰回傳完整的補瀉法資料
 *
 * 本時可並陳之補瀉動作：
 *   1. 瀉當令經子穴（主法甲乙共用．迎奪）
 *   2. 補前一經母穴（主法甲．本時即前經之次時．隨濟）
 *   3. 補子經母穴（主法乙．本時雙軌）
 *   4. 異經輔法：若本時恰為他經之母經／子經當令，可行母經本穴補、子經本穴瀉
 */
export function calculateNaZi(hourBranch: string): NaZiCalculationResult | null {
  const detail = NA_ZI_FA_DATA[hourBranch];
  if (!detail) return null;

  const actions: string[] = [];
  // 1. 本時瀉當令經子穴（本經實證）—主法甲乙共用
  actions.push(
    `${hourBranch}時當令「${detail.meridian}」→ 實證瀉本經子穴 ${detail.sonPoint}（迎而奪之）`
  );
  // 2. 主法甲：本時即前一當令經之次時 → 補前一經母穴（本經氣衰之隨濟）
  actions.push(
    `${hourBranch}時為「${detail.prevMeridian}」之次時 → 虛證補 ${detail.prevMotherPoint}（前經母穴，隨而濟之）`
  );
  // 3. 主法乙：本時本經氣盛，子經母氣亦旺 → 補子經母穴
  actions.push(
    `${hourBranch}時本經氣盛 → 虛證補「${detail.childMeridian}」母穴 ${detail.childMotherPoint}（本時雙軌）`
  );
  // 4. 異經輔助補瀉：若本時恰為他經之母經或子經當令
  for (const [shichen, d] of Object.entries(NA_ZI_FA_DATA)) {
    if (shichen === hourBranch) continue;
    if (d.motherMeridianShichen === hourBranch && d.motherMeridian === detail.meridian) {
      actions.push(
        `${hourBranch}時母經當令，可行他經補母：「${d.meridian}」虛證補 ${d.motherMeridianPoint}（${d.motherMeridian}本穴）`
      );
    }
    if (d.sonMeridianShichen === hourBranch && d.sonMeridian === detail.meridian) {
      actions.push(
        `${hourBranch}時子經當令，可行他經瀉子：「${d.meridian}」實證瀉 ${d.sonMeridianPoint}（${d.sonMeridian}本穴）`
      );
    }
  }

  const method =
    `${hourBranch}時當令 ${detail.meridian}（${detail.element}）· ` +
    `瀉本經子穴 ${detail.sonPoint}；` +
    `補前一經（${detail.prevMeridian}）母穴 ${detail.prevMotherPoint}；` +
    `補子經（${detail.childMeridian}）母穴 ${detail.childMotherPoint}`;

  return {
    shichen: hourBranch,
    detail,
    currentPeakMeridian: detail.meridian,
    method,
    currentHourActions: actions,
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
