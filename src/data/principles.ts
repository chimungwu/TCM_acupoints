/**
 * TCM Principles Data: Detailed mappings for various acupoint combination methods
 */

export interface PrincipleDetail {
  title: string;
  description: string;
  content: string;
  mappings: {
    label: string;
    points: string[];
    description?: string;
  }[];
}

export const PRINCIPLES_DATA: Record<string, PrincipleDetail> = {
  '局部配穴法': {
    title: '局部配穴法',
    description: '對於病變部位比較明確、比較局限的病症，採用局部腧穴以疏調局部經絡之氣。',
    content: '局部配穴法是指在病變局部或鄰近部位選取腧穴的方法。適用於痛症、器質性病變等。',
    mappings: [
      { label: '頭面部', points: ['印堂', '太陽', '頰車'], description: '用於頭痛、面癱。' },
      { label: '胸腹部', points: ['中脘', '天樞', '關元'], description: '用於胃痛、腹脹。' },
      { label: '關節部', points: ['肩髃', '曲池', '陽陵泉'], description: '用於關節痺痛。' },
    ]
  },
  '上下配穴法': {
    title: '上下配穴法',
    description: '上指上肢或腰部以上，下指下肢或腰部以下。臨床應用最廣。',
    content: '將《靈樞·終始》「病在上者下取之，病在下者高取之」與「病在頭者取之足，病在足者取之膕」綜合應用。',
    mappings: [
      { label: '胃病', points: ['內關', '足三里'], description: '經典上下配穴。' },
      { label: '牙痛', points: ['合谷', '內庭'], description: '手足陽明經配合。' },
      { label: '脫肛/子宮脫垂', points: ['百會', '長強'], description: '督脈上下配合。' },
      { label: '八脈交會(1)', points: ['內關', '公孫'], description: '心胸胃病。' },
      { label: '八脈交會(2)', points: ['外關', '臨泣'], description: '目外眥、耳後、頰、頸、肩。' },
      { label: '八脈交會(3)', points: ['後溪', '申脈'], description: '目內眥、頸、項、耳、肩。' },
      { label: '八脈交會(4)', points: ['列缺', '照海'], description: '喉嚨、胸膈、肺。' },
    ]
  },
  '前後配穴法': {
    title: '前後配穴法',
    description: '又稱「腹背陰陽配穴法」或「偶刺」，選取身體前後部位腧穴相互配伍。',
    content: '是以身體前後部位所在腧穴相互配伍的方法。常用於臟腑疾病。',
    mappings: [
      { label: '胃痛', points: ['中脘', '梁門', '胃俞', '胃倉'], description: '前取募穴/局部，後取俞穴。' },
      { label: '哮喘', points: ['天突', '膻中', '肺俞', '定喘'], description: '前後配合宣肺平喘。' },
      { label: '泄瀉', points: ['天樞', '大腸俞'], description: '調理腸胃。' },
    ]
  },
  '左右配穴法': {
    title: '左右配穴法',
    description: '「以右治左，以左治右」，用於補虛瀉實，平衡經絡之氣。',
    content: '基於十二經脈左右對稱的特點。包括「巨刺」與「繆刺」法。',
    mappings: [
      { label: '心病', points: ['雙側心俞', '雙側內關'], description: '對稱取穴。' },
      { label: '胃痛', points: ['雙側胃俞', '雙側足三里'], description: '對稱取穴。' },
      { label: '面癱 (左)', points: ['左側頰車', '左側地倉', '右側合谷'], description: '左右配合。' },
      { label: '偏頭痛 (左)', points: ['左側頭維', '左側曲鬢', '右側陽陵泉', '右側俠溪'], description: '左右不同名腧穴並用。' },
    ]
  },
  '本經配穴法': {
    title: '本經配穴法',
    description: '選取病變經脈上的腧穴。遵循「不盛不虛，以經取之」的原則。',
    content: '當某一臟腑、經脈發生病變而未涉及其他經脈時，選取本經腧穴。',
    mappings: [
      { label: '肺病咳嗽', points: ['中府', '尺澤', '太淵'], description: '取本經募穴與遠端穴位。' },
      { label: '胃痛', points: ['中脘', '足三里', '內庭'], description: '取本經募穴與下肢穴。' },
      { label: '肝陽上亢', points: ['太衝', '行間'], description: '清瀉肝火。' },
    ]
  },
  '表裏經配穴法': {
    title: '表裏經配穴法',
    description: '依據臟腑經脈陰陽表裏關係，從陰引陽，從陽引陰。',
    content: '某一臟腑、經脈有病，除選本經穴外，配以表裏經腧穴。',
    mappings: [
      { label: '肝病', points: ['太衝 (肝)', '陽陵泉 (膽)'], description: '肝膽表裏配合。' },
      { label: '胃痛', points: ['足三里 (胃)', '公孫 (脾)'], description: '脾胃表裏配合。' },
      { label: '肺熱', points: ['尺澤 (肺)', '曲池 (大腸)'], description: '肺與大腸表裏配合。' },
    ]
  },
  '同名經配穴法': {
    title: '同名經配穴法',
    description: '基於「同氣相通」理論，以手足同名經腧穴相配。',
    content: '利用手足同名經脈氣相通的特點，增強療效。',
    mappings: [
      { label: '牙痛', points: ['合谷 (手陽明)', '內庭 (足陽明)'], description: '陽明同名經配合。' },
      { label: '頭痛', points: ['外關 (手少陽)', '陽陵泉 (足少陽)'], description: '少陽同名經配合。' },
      { label: '心悸', points: ['神門 (手少陰)', '太溪 (足少陰)'], description: '少陰同名經配合。' },
    ]
  },
  '子母經配穴法': {
    title: '子母經配穴法',
    description: '根據「虛則補其母，實則瀉其子」的五行原則選穴。',
    content: '參照十二經脈五行屬性，選取母經 or 子經的穴位。',
    mappings: [
      { label: '肺虛 (土生金)', points: ['太白 (脾經-母)', '太淵 (肺經-自)'], description: '虛則補其母。' },
      { label: '肝實 (木生火)', points: ['少府 (心經-子)', '行間 (肝經-自)'], description: '實則瀉其子。' },
    ]
  },
  '交會經配穴法': {
    title: '交會經配穴法',
    description: '按經脈的交叉、交會情況來配穴。',
    content: '某一病變部位有數條經脈交會，或病症與數條交會經脈有關。',
    mappings: [
      { label: '婦科/肝腎病', points: ['三陰交'], description: '足三陰經交會穴。' },
      { label: '迴陽救逆', points: ['關元', '氣海'], description: '任脈與足三陰經交會。' },
      { label: '頭面疾患', points: ['風池'], description: '足少陽、陽維脈交會。' },
    ]
  }
};
