export interface Acupoint {
  id: string;
  name: string;
  code: string;
  meridian: string;
  five_shu: '井' | '滎' | '俞' | '經' | '合' | '原' | '絡' | '郄' | null;
  element: '木' | '火' | '土' | '金' | '水' | null;
  is_yuan: boolean;
  is_luo: boolean;
  is_xi: boolean;
  is_mu: boolean;
  is_back_shu: boolean;
  is_lower_he: boolean;
  is_eight_influential: '臟會' | '腑會' | '氣會' | '血會' | '筋會' | '脈會' | '骨會' | '髓會' | string | null;
  is_eight_confluence: '公孫' | '內關' | '後溪' | '申脈' | '足臨泣' | '外關' | '列缺' | '照海' | string | null;
  is_crossing: string | boolean;
  is_four_general: string | boolean;
  is_ma_danyang: boolean;
  is_hui_yang_9: boolean;
  location: string;
}

import { LUNG_POINTS, LARGE_INTESTINE_POINTS } from './points/chunk1_lu_li';
import { STOMACH_POINTS, SPLEEN_POINTS } from './points/chunk1_st_sp';
import { HEART_POINTS, SMALL_INTESTINE_POINTS, BLADDER_POINTS_1 } from './points/chunk2_ht_si_bl1';
import { BLADDER_POINTS_2, KIDNEY_POINTS } from './points/chunk2_bl2_ki';
import { PERICARDIUM_POINTS, TRIPLE_ENERGIZER_POINTS, GALLBLADDER_POINTS_1 } from './points/chunk3_pc_te_gb1';
import { GALLBLADDER_POINTS_2, LIVER_POINTS } from './points/chunk3_gb2_lr';
import { GOVERNOR_VESSEL_POINTS, CONCEPTION_VESSEL_POINTS } from './points/chunk4_gv_cv';

export const ACUPOINTS: Acupoint[] = [
  ...LUNG_POINTS,
  ...LARGE_INTESTINE_POINTS,
  ...STOMACH_POINTS,
  ...SPLEEN_POINTS,
  ...HEART_POINTS,
  ...SMALL_INTESTINE_POINTS,
  ...BLADDER_POINTS_1,
  ...BLADDER_POINTS_2,
  ...KIDNEY_POINTS,
  ...PERICARDIUM_POINTS,
  ...TRIPLE_ENERGIZER_POINTS,
  ...GALLBLADDER_POINTS_1,
  ...GALLBLADDER_POINTS_2,
  ...LIVER_POINTS,
  ...GOVERNOR_VESSEL_POINTS,
  ...CONCEPTION_VESSEL_POINTS
];
