/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, BookOpen, Plus, Trash2, Info, Wind, Droplets, Flame, Mountain, 
  TreePine, ChevronRight, Filter, Clock, Layout, GraduationCap, Calculator,
  Calendar, Zap, Heart, Shield, Activity, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ACUPOINTS, Acupoint } from './data/acupoints';
import { 
  getGanzhi, getShichenName, ZI_WU_LIU_ZHU_MAP, 
  calculateLingGuiNumber, LING_GUI_POINTS, LING_GUI_PAIRS,
  NA_ZI_FA_DATA, FIVE_SHU_INDICATIONS, EARTHLY_BRANCHES,
  getNaJiaPoints
} from './lib/tcm-utils';
import { PRINCIPLES_DATA, PrincipleDetail } from './data/principles';

const ELEMENT_ICONS: Record<string, any> = {
  '木': TreePine,
  '火': Flame,
  '土': Mountain,
  '金': Wind,
  '水': Droplets,
};

const ELEMENT_COLORS: Record<string, string> = {
  '木': 'text-emerald-600 bg-emerald-50',
  '火': 'text-rose-600 bg-rose-50',
  '土': 'text-amber-700 bg-amber-50',
  '金': 'text-slate-600 bg-slate-50',
  '水': 'text-blue-600 bg-blue-50',
};

type ViewType = 'encyclopedia' | 'principles' | 'calculation' | 'prescription' | 'author';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('encyclopedia');
  const [selectedPrinciple, setSelectedPrinciple] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<Acupoint | null>(null);
  const [prescription, setPrescription] = useState<Acupoint[]>([]);
  const [filterMeridian, setFilterMeridian] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isManualTime, setIsManualTime] = useState(false);
  const [manualTimeStr, setManualTimeStr] = useState(new Date().toISOString().slice(0, 16));

  // Update time every minute
  useEffect(() => {
    if (isManualTime) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isManualTime]);

  const effectiveTime = useMemo(() => {
    return isManualTime ? new Date(manualTimeStr) : currentTime;
  }, [isManualTime, manualTimeStr, currentTime]);

  const meridians = useMemo(() => {
    const set = new Set(ACUPOINTS.map(p => p.meridian));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredPoints = useMemo(() => {
    return ACUPOINTS.filter(p => {
      const matchesSearch = p.name.includes(searchTerm) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterMeridian === 'all' || p.meridian === filterMeridian;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterMeridian]);

  const addToPrescription = (point: Acupoint) => {
    if (!prescription.find(p => p.id === point.id)) {
      setPrescription([...prescription, point]);
    }
  };

  const removeFromPrescription = (id: string) => {
    setPrescription(prescription.filter(p => p.id !== id));
  };

  const ganzhi = getGanzhi(effectiveTime);
  const currentShichen = getShichenName(effectiveTime.getHours());
  const zwlzMeridian = ZI_WU_LIU_ZHU_MAP[currentShichen];
  const currentNaZi = NA_ZI_FA_DATA[currentShichen];
  
  // Get next shichen for tonification (補法)
  const currentShichenIdx = EARTHLY_BRANCHES.indexOf(currentShichen);
  const nextShichen = EARTHLY_BRANCHES[(currentShichenIdx + 1) % 12];
  const nextNaZi = NA_ZI_FA_DATA[nextShichen];

  const lingGuiNum = calculateLingGuiNumber(ganzhi.dayStem, ganzhi.dayBranch, ganzhi.hourStem, ganzhi.hourBranch);
  const lingGuiPointName = LING_GUI_POINTS[lingGuiNum].point;

  const naJiaPoints = getNaJiaPoints(ganzhi.dayStem, ganzhi.hourBranch);

  const navItems = [
    { id: 'encyclopedia', label: '穴位百科', icon: BookOpen },
    { id: 'principles', label: '配穴原則', icon: GraduationCap },
    { id: 'calculation', label: '時辰配穴', icon: Calculator },
    { id: 'prescription', label: '配穴方案', icon: Layout },
    { id: 'author', label: '關於作者', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-tcm-paper text-tcm-ink font-sans selection:bg-tcm-gold/20 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white border-r border-tcm-gold/10 flex flex-col sticky top-0 h-screen z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-tcm-jade rounded-2xl flex items-center justify-center text-white shadow-lg shadow-tcm-jade/20 shrink-0">
            <Activity size={24} />
          </div>
          <div className="hidden md:block overflow-hidden">
            <h1 className="text-lg font-serif font-bold tracking-tight whitespace-nowrap text-tcm-ink">中醫配穴教學</h1>
            <p className="text-[10px] text-tcm-clay font-medium uppercase tracking-widest">TCM Education</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                activeView === item.id 
                  ? 'bg-tcm-paper text-tcm-clay shadow-sm border border-tcm-gold/20' 
                  : 'text-tcm-clay/40 hover:bg-tcm-paper hover:text-tcm-clay'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-tcm-jade' : 'group-hover:text-tcm-jade'} />
              <span className="hidden md:block font-medium text-sm">{item.label}</span>
              {item.id === 'prescription' && prescription.length > 0 && (
                <span className="ml-auto hidden md:flex w-5 h-5 bg-tcm-cinnabar text-white text-[10px] font-bold items-center justify-center rounded-full">
                  {prescription.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-tcm-gold/5 hidden md:block">
          <div className="bg-tcm-paper rounded-2xl p-4 space-y-4 border border-tcm-gold/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-tcm-clay/60 text-[10px] uppercase tracking-widest font-bold">
                <Clock size={12} /> 時間設定
              </div>
              <button 
                onClick={() => setIsManualTime(!isManualTime)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${isManualTime ? 'bg-tcm-jade text-white' : 'bg-tcm-gold/10 text-tcm-clay'}`}
              >
                {isManualTime ? '手動' : '同步'}
              </button>
            </div>

            {isManualTime ? (
              <input 
                type="datetime-local" 
                value={manualTimeStr}
                onChange={(e) => setManualTimeStr(e.target.value || new Date().toISOString().slice(0, 16))}
                className="w-full bg-white border border-tcm-gold/20 rounded-lg p-2 text-xs text-tcm-ink focus:outline-none focus:ring-1 focus:ring-tcm-jade"
              />
            ) : (
              <div className="text-xl font-serif font-bold text-tcm-clay">
                {ganzhi.day}日 {ganzhi.hour}時
              </div>
            )}

            <div className="pt-2 border-t border-tcm-gold/5">
              <div className="text-[10px] text-tcm-clay/40 flex items-center justify-between">
                <span>{effectiveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{currentShichen}時：{zwlzMeridian.replace('手', '').replace('足', '')}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header / Search */}
        <header className="h-20 border-b border-tcm-gold/10 bg-white/80 backdrop-blur-md flex items-center px-8 shrink-0">
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tcm-gold" size={20} />
            <input
              type="text"
              placeholder="搜尋穴位名稱、代碼或經絡..."
              className="w-full pl-12 pr-4 py-3 bg-tcm-paper/50 border border-tcm-gold/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tcm-gold/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-tcm-clay/40 uppercase tracking-widest">系統狀態</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 資料庫已連線
              </span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            {activeView === 'encyclopedia' && (
              <motion.div
                key="encyclopedia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full"
              >
                {/* Left: List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-white rounded-3xl border border-tcm-gold/10 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-tcm-gold/5 bg-tcm-paper flex items-center justify-between">
                      <h2 className="font-serif font-bold text-tcm-ink flex items-center gap-2">
                        <Filter size={16} className="text-tcm-gold" /> 穴位瀏覽
                      </h2>
                      <select 
                        className="text-xs bg-white border border-tcm-gold/20 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tcm-gold"
                        value={filterMeridian}
                        onChange={(e) => setFilterMeridian(e.target.value)}
                      >
                        {meridians.map(m => (
                          <option key={m} value={m}>{m === 'all' ? '全部經絡' : m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-tcm-gold/5">
                        {filteredPoints.map((point) => (
                          <button
                            key={point.id}
                            onClick={() => setSelectedPoint(point)}
                            className={`w-full text-left p-4 hover:bg-tcm-paper transition-colors flex items-center justify-between group ${selectedPoint?.id === point.id ? 'bg-tcm-paper' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${selectedPoint?.id === point.id ? 'bg-tcm-clay text-white shadow-lg shadow-tcm-clay/20' : 'bg-tcm-gold/10 text-tcm-clay'}`}>
                                {point.code}
                              </div>
                              <div>
                                <div className="font-bold text-tcm-ink">{point.name}</div>
                                <div className="text-[10px] text-tcm-clay/60 uppercase tracking-tighter">{point.meridian}</div>
                              </div>
                            </div>
                            <ChevronRight size={14} className={`text-tcm-gold/20 group-hover:text-tcm-gold transition-transform ${selectedPoint?.id === point.id ? 'translate-x-1 text-tcm-gold' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    {selectedPoint ? (
                      <motion.div
                        key={selectedPoint.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-3xl border border-tcm-gold/10 shadow-xl overflow-hidden"
                      >
                        <div className="p-8 space-y-8">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-tcm-jade/10 text-tcm-jade text-[10px] font-bold tracking-widest uppercase mb-4">
                                {selectedPoint.meridian}
                              </div>
                              <h2 className="text-5xl font-serif font-bold text-tcm-ink mb-1">{selectedPoint.name}</h2>
                              <p className="text-tcm-clay font-mono text-xl">{selectedPoint.code}</p>
                            </div>
                            <button 
                              onClick={() => addToPrescription(selectedPoint)}
                              className="p-4 bg-tcm-clay text-white rounded-2xl hover:bg-tcm-ink transition-all shadow-lg shadow-tcm-clay/20 active:scale-95 flex items-center gap-2"
                            >
                              <Plus size={20} /> <span className="font-bold text-sm">加入配穴</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {selectedPoint.element && (
                              <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold ${ELEMENT_COLORS[selectedPoint.element]}`}>
                                {(() => {
                                  const Icon = ELEMENT_ICONS[selectedPoint.element];
                                  return Icon ? <Icon size={14} /> : null;
                                })()}
                                五行：{selectedPoint.element}
                              </div>
                            )}
                            {selectedPoint.five_shu && (
                              <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                                五輸穴：{selectedPoint.five_shu}
                              </div>
                            )}
                            {selectedPoint.is_yuan && <div className="px-4 py-2 rounded-xl bg-orange-100 text-orange-700 text-xs font-bold">原穴</div>}
                            {selectedPoint.is_luo && <div className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold">絡穴</div>}
                            {selectedPoint.is_xi && <div className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-bold">郄穴</div>}
                            {selectedPoint.is_mu && <div className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-xs font-bold">募穴</div>}
                            {selectedPoint.is_back_shu && <div className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold">背俞穴</div>}
                            {selectedPoint.is_eight_confluence && (
                              <div className="px-4 py-2 rounded-xl bg-cyan-100 text-cyan-700 text-xs font-bold">
                                八脈交會：{selectedPoint.is_eight_confluence}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-tcm-ink flex items-center gap-2 border-b border-tcm-gold/10 pb-2">
                                <Info size={16} className="text-tcm-gold" /> 穴位特性
                              </h3>
                              <div className="text-sm text-tcm-clay/70 leading-relaxed bg-tcm-paper p-6 rounded-3xl italic relative overflow-hidden border border-tcm-gold/10">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <BookOpen size={64} />
                                </div>
                                {selectedPoint.characteristics || "暫無資料，待補充。"}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-tcm-ink flex items-center gap-2 border-b border-tcm-gold/10 pb-2">
                                <Wind size={16} className="text-tcm-gold" /> 穴道位置
                              </h3>
                              <div className="text-sm text-tcm-clay/70 leading-relaxed bg-tcm-paper p-6 rounded-3xl border border-tcm-gold/10">
                                {selectedPoint.location || "暫無資料，待補充。"}
                              </div>
                            </div>
                          </div>

                          {selectedPoint.is_four_general && (
                            <div className="bg-tcm-ink text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-tcm-gold/20">
                              <div className="absolute -right-4 -bottom-4 opacity-10">
                                <GraduationCap size={120} />
                              </div>
                              <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2 font-bold text-tcm-gold">四總穴歌訣</div>
                              <div className="font-serif text-2xl italic leading-relaxed">「{selectedPoint.is_four_general}」</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-white rounded-3xl border border-tcm-gold/10 border-dashed p-20 flex flex-col items-center justify-center text-center space-y-6 h-full">
                        <div className="w-24 h-24 bg-tcm-paper rounded-full flex items-center justify-center text-tcm-clay/20">
                          <BookOpen size={48} />
                        </div>
                        <div className="max-w-xs">
                          <h3 className="text-2xl font-serif font-bold text-tcm-ink mb-2">探索中醫經絡</h3>
                          <p className="text-sm text-tcm-clay/60">從左側列表中選擇一個穴位，深入了解其特性、五行屬性及臨床應用。</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeView === 'principles' && (
              <motion.div
                key="principles"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <AnimatePresence mode="wait">
                  {!selectedPrinciple ? (
                    <motion.div
                      key="principle-list"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="max-w-3xl">
                        <h2 className="text-4xl font-serif font-bold text-tcm-ink mb-4">配穴原則教學</h2>
                        <p className="text-tcm-clay leading-relaxed">
                          配穴法是中醫針灸治療的核心，通過不同穴位的組合，可以產生協同作用，增強療效。
                          點擊下方卡片深入學習具體的配穴規律。
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.values(PRINCIPLES_DATA).map((p, i) => (
                          <motion.button
                            key={p.title}
                            onClick={() => setSelectedPrinciple(p.title)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-3xl border border-tcm-gold/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                          >
                            <div className="w-14 h-14 bg-tcm-paper text-tcm-clay rounded-2xl flex items-center justify-center mb-6 group-hover:bg-tcm-clay group-hover:text-white transition-colors">
                              <GraduationCap size={28} />
                            </div>
                            <h3 className="font-serif font-bold text-2xl text-tcm-ink mb-3">{p.title}</h3>
                            <p className="text-sm text-tcm-clay/60 leading-relaxed line-clamp-2">{p.description}</p>
                            <div className="mt-6 flex items-center gap-2 text-tcm-gold font-bold text-xs uppercase tracking-widest">
                              進入教學 <ChevronRight size={14} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="principle-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <button 
                        onClick={() => setSelectedPrinciple(null)}
                        className="flex items-center gap-2 text-tcm-clay font-bold hover:bg-tcm-paper px-4 py-2 rounded-xl transition-all"
                      >
                        <ChevronRight size={18} className="rotate-180" /> 返回原則列表
                      </button>

                      <div className="bg-white rounded-[40px] border border-tcm-gold/10 shadow-2xl overflow-hidden">
                        <div className="p-10 md:p-16 space-y-12">
                          <div className="max-w-3xl space-y-4">
                            <h2 className="text-5xl font-serif font-bold text-tcm-ink">{PRINCIPLES_DATA[selectedPrinciple].title}</h2>
                            <p className="text-xl text-tcm-clay/60 leading-relaxed italic">
                              {PRINCIPLES_DATA[selectedPrinciple].content}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <h3 className="text-sm font-bold text-tcm-ink/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                              <div className="h-px bg-tcm-gold/10 flex-1" /> 完整配穴對應表 <div className="h-px bg-tcm-gold/10 flex-1" />
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {PRINCIPLES_DATA[selectedPrinciple].mappings.map((m, idx) => (
                                <motion.div 
                                  key={m.label}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="bg-tcm-paper/30 rounded-3xl p-6 border border-tcm-gold/10 hover:bg-white hover:shadow-lg transition-all group"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-tcm-clay bg-tcm-paper px-3 py-1 rounded-full uppercase tracking-wider">
                                      {m.label}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-tcm-gold/40 group-hover:text-tcm-gold transition-colors">
                                      <Zap size={14} />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {m.points.map(p => (
                                      <button 
                                        key={p}
                                        onClick={() => {
                                          const point = ACUPOINTS.find(ap => ap.name === p);
                                          if (point) {
                                            setSelectedPoint(point);
                                            setActiveView('encyclopedia');
                                          }
                                        }}
                                        className="px-4 py-2 bg-white border border-tcm-gold/10 rounded-xl text-sm font-bold text-tcm-ink hover:bg-tcm-clay hover:text-white transition-all shadow-sm"
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                  {m.description && (
                                    <p className="text-xs text-tcm-clay/60 leading-relaxed">
                                      {m.description}
                                    </p>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeView === 'calculation' && (
              <motion.div
                key="calculation"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-serif font-bold text-tcm-ink mb-4">時間醫學：按時選穴</h2>
                  <p className="text-tcm-clay/60 leading-relaxed">
                    中醫認為人體氣血運行與自然界時間節律密切相關。
                    子午流注與靈龜八法是根據時間推算「開穴」的經典方法。
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Zi Wu Liu Zhu - Left Column */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-3xl border border-tcm-gold/10 shadow-xl overflow-hidden">
                      <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-tcm-clay">
                            <Clock size={24} className="text-tcm-jade" />
                            <h3 className="text-2xl font-serif font-bold">子午流注 (納子法)</h3>
                          </div>
                          <div className="px-4 py-1.5 bg-tcm-paper rounded-full text-tcm-clay text-xs font-bold border border-tcm-gold/10">
                            當前：{currentShichen}時 ({zwlzMeridian.replace('手', '').replace('足', '')})
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Method 1: Mother-Son */}
                          <div className="p-5 bg-tcm-paper/50 rounded-2xl border border-tcm-gold/10 space-y-3">
                            <h4 className="text-sm font-bold text-tcm-ink flex items-center gap-2">
                              <Zap size={14} className="text-tcm-cinnabar" /> 補母瀉子法
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-tcm-clay/60">實證 (瀉子)</span>
                                <button 
                                  onClick={() => {
                                    const p = ACUPOINTS.find(ap => ap.name === currentNaZi.sonPoint);
                                    if (p) {
                                      setSelectedPoint(p);
                                      setActiveView('encyclopedia');
                                    }
                                  }}
                                  className="font-bold text-tcm-cinnabar hover:underline"
                                >
                                  {currentNaZi.sonPoint} (當前時)
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-tcm-clay/60">虛證 (補母)</span>
                                <button 
                                  onClick={() => {
                                    const p = ACUPOINTS.find(ap => ap.name === nextNaZi.motherPoint);
                                    if (p) {
                                      setSelectedPoint(p);
                                      setActiveView('encyclopedia');
                                    }
                                  }}
                                  className="font-bold text-tcm-jade hover:underline"
                                >
                                  {nextNaZi.motherPoint} ({nextShichen}時)
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-tcm-clay/40 italic leading-tight">
                              實則瀉其子，虛則補其母。虛證需在納支時刻已過的下一個時辰針刺。
                            </p>
                          </div>

                          {/* Method 2: Specific Shu-Stream */}
                          <div className="p-5 bg-tcm-paper/50 rounded-2xl border border-tcm-gold/10 space-y-3">
                            <h4 className="text-sm font-bold text-tcm-ink flex items-center gap-2">
                              <Activity size={14} className="text-tcm-jade" /> 專取俞穴法
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-tcm-clay/60">定時發作疾病</span>
                              <button 
                                onClick={() => {
                                  const p = ACUPOINTS.find(ap => ap.name === currentNaZi.shuStreamPoint);
                                  if (p) {
                                    setSelectedPoint(p);
                                    setActiveView('encyclopedia');
                                  }
                                }}
                                className="px-3 py-1 bg-tcm-clay text-white text-xs font-bold rounded-lg hover:bg-tcm-ink transition-colors"
                              >
                                {currentNaZi.shuStreamPoint}
                              </button>
                            </div>
                            <p className="text-[10px] text-tcm-clay/40 italic leading-tight">
                              「病時間時甚者取之俞」，取發作時間所屬流注經絡之俞穴.
                            </p>
                          </div>

                          {/* Method 3: Shu-Mu Combination */}
                          <div className="p-5 bg-tcm-paper/50 rounded-2xl border border-tcm-gold/10 space-y-3 md:col-span-2">
                            <h4 className="text-sm font-bold text-tcm-ink flex items-center gap-2">
                              <Shield size={14} className="text-tcm-gold" /> 配俞募穴法
                            </h4>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-tcm-clay/60">俞穴:</span>
                                <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.shuStreamPoint); if (p) { setSelectedPoint(p); setActiveView('encyclopedia'); } }} className="text-xs font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.shuStreamPoint}</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-tcm-clay/60">背俞:</span>
                                <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.backShu); if (p) { setSelectedPoint(p); setActiveView('encyclopedia'); } }} className="text-xs font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.backShu}</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-tcm-clay/60">胸募:</span>
                                <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.frontMu); if (p) { setSelectedPoint(p); setActiveView('encyclopedia'); } }} className="text-xs font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.frontMu}</button>
                              </div>
                            </div>
                            <p className="text-[10px] text-tcm-clay/40 italic leading-tight">
                              在流注時辰除取該經之俞穴外，並配合取有關之背俞及胸腹募穴。
                            </p>
                          </div>
                        </div>

                        {/* Method 4: Five Shu Indications */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-tcm-ink flex items-center gap-2 border-b border-tcm-gold/5 pb-2">
                            <GraduationCap size={16} className="text-tcm-gold" /> 取五輸穴法 (靈樞/難經)
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {FIVE_SHU_INDICATIONS.map((item) => {
                              // Try to find the point for the current meridian and type
                              const point = ACUPOINTS.find(p => p.meridian === zwlzMeridian && p.five_shu === item.type);
                              return (
                                <div key={item.type} className="flex items-start gap-3 p-3 rounded-xl hover:bg-tcm-paper transition-colors group">
                                  <div className="w-12 h-12 bg-tcm-clay/10 text-tcm-clay rounded-xl flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-tcm-ink group-hover:text-white transition-colors">
                                    {item.type}
                                  </div>
                                  <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-tcm-ink">{item.indication}</span>
                                      {point && (
                                        <button 
                                          onClick={() => { setSelectedPoint(point); setActiveView('encyclopedia'); }}
                                          className="text-base font-serif font-bold text-tcm-ink hover:text-tcm-clay transition-colors px-2 py-1 bg-tcm-paper rounded-lg"
                                        >
                                          {point.name}
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-tcm-clay/40 italic">{item.nanJing}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Method 5: Na Jia Fa */}
                        <div className="p-6 bg-tcm-ink rounded-3xl text-white space-y-4 shadow-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles size={18} className="text-tcm-gold" />
                              <h4 className="text-lg font-serif font-bold">子午流注 (納甲法)</h4>
                            </div>
                            <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest text-tcm-gold">按時開穴</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="text-xs text-white/60">
                              根據《逐日按時定穴歌》，{ganzhi.dayStem}日 {ganzhi.hourBranch}時 開穴：
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {naJiaPoints.length > 0 ? (
                                naJiaPoints.map(pName => (
                                  <button
                                    key={pName}
                                    onClick={() => {
                                      const p = ACUPOINTS.find(ap => ap.name === pName);
                                      if (p) {
                                        setSelectedPoint(p);
                                        setActiveView('encyclopedia');
                                      }
                                    }}
                                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-tcm-gold hover:text-tcm-ink transition-all"
                                  >
                                    {pName}
                                  </button>
                                ))
                              ) : (
                                <div className="text-xs italic text-white/40 py-2">
                                  當前時辰為閉時，無穴可開。
                                  <br/>
                                  <span className="text-[10px] opacity-50">(陽日陽時開，陰日陰時開)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-white/40 leading-tight italic">
                            納甲法結合十二經流注與五輸穴相生順序。陽日陽時開陽經，陰日陰時開陰經。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ling Gui Ba Fa - Right Column */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl border border-tcm-gold/10 shadow-xl overflow-hidden">
                      <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 text-tcm-clay">
                          <Zap size={24} className="text-tcm-cinnabar" />
                          <h3 className="text-2xl font-serif font-bold">靈龜八法</h3>
                        </div>

                        <div className="bg-tcm-paper rounded-2xl p-6 border border-tcm-gold/10 space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold text-tcm-clay/40 uppercase tracking-widest">
                            <span>九宮八卦推算</span>
                            <span>餘數：{lingGuiNum}</span>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-tcm-clay text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-tcm-clay/20">
                              <span className="text-3xl font-serif font-bold">{LING_GUI_POINTS[lingGuiNum].hexagram}</span>
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Hexagram</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-tcm-clay/60">當前開穴：</div>
                              <button 
                                onClick={() => {
                                  const p = ACUPOINTS.find(ap => ap.name === lingGuiPointName);
                                  if (p) {
                                    setSelectedPoint(p);
                                    setActiveView('encyclopedia');
                                  }
                                }}
                                className="text-4xl font-serif font-bold text-tcm-ink hover:text-tcm-clay transition-colors"
                              >
                                {lingGuiPointName}
                              </button>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-tcm-gold/5">
                            <p className="text-xs text-tcm-clay/60 leading-relaxed italic">
                              「坎一聯申脈，照海坤二五...」根據日、時干支基數計算，餘數對應八脈交會穴。
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-tcm-ink flex items-center gap-2">
                            <Layout size={16} className="text-tcm-gold" /> 八脈交會穴對應
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {LING_GUI_PAIRS.map((pairData, idx) => (
                              <div key={idx} className="grid grid-cols-2 gap-3">
                                {pairData.pair.map((pName, pIdx) => {
                                  const isActive = pName === lingGuiPointName;
                                  return (
                                    <button
                                      key={pName}
                                      onClick={() => {
                                        const p = ACUPOINTS.find(ap => ap.name === pName);
                                        if (p) {
                                          setSelectedPoint(p);
                                          setActiveView('encyclopedia');
                                        }
                                      }}
                                      className={`p-3 rounded-xl border text-left transition-all ${isActive ? 'bg-tcm-clay border-tcm-clay text-white shadow-lg' : 'bg-white border-tcm-gold/10 text-tcm-ink hover:bg-tcm-paper'}`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold opacity-60">{pairData.hexagrams[pIdx]}</span>
                                      </div>
                                      <div className="font-bold">{pName}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'prescription' && (
              <motion.div
                key="prescription"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-tcm-ink mb-2">我的配穴方案</h2>
                    <p className="text-tcm-clay/60">您目前選擇了 {prescription.length} 個穴位進行組合。</p>
                  </div>
                  {prescription.length > 0 && (
                    <button 
                      onClick={() => setPrescription([])}
                      className="flex items-center gap-2 text-tcm-cinnabar font-bold text-sm hover:bg-tcm-cinnabar/5 px-4 py-2 rounded-xl transition-all"
                    >
                      <Trash2 size={16} /> 清空全部
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence initial={false}>
                    {prescription.length > 0 ? (
                      prescription.map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white border border-tcm-gold/10 rounded-3xl p-6 flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-tcm-clay text-white rounded-2xl flex items-center justify-center font-mono font-bold shadow-lg shadow-tcm-clay/20">
                              {p.code}
                            </div>
                            <div>
                              <div className="font-serif font-bold text-xl text-tcm-ink">{p.name}</div>
                              <div className="text-xs text-tcm-clay/60">{p.meridian}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromPrescription(p.id)}
                            className="p-2 text-tcm-clay/20 hover:text-tcm-cinnabar transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 bg-white rounded-3xl border border-tcm-gold/10 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-tcm-paper rounded-full flex items-center justify-center text-tcm-clay/20">
                          <Plus size={40} />
                        </div>
                        <div className="max-w-xs">
                          <h3 className="text-xl font-serif font-bold text-tcm-ink">尚未建立方案</h3>
                          <p className="text-sm text-tcm-clay/60 mb-6">在穴位百科中點擊「+」按鈕，將穴位加入您的臨床配穴方案中。</p>
                          <button 
                            onClick={() => setActiveView('encyclopedia')}
                            className="px-6 py-3 bg-tcm-clay text-white font-bold rounded-2xl hover:bg-tcm-ink transition-all"
                          >
                            前往百科
                          </button>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {prescription.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-tcm-ink rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <GraduationCap size={160} />
                    </div>
                    <div className="relative space-y-6">
                      <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                        <Zap className="text-tcm-gold" /> 配穴方案分析 (AI 輔助)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">主要功效</div>
                          <div className="font-bold">調理氣血，疏肝理氣</div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">五行平衡</div>
                          <div className="font-bold">木火相生，土氣充盈</div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">建議適應症</div>
                          <div className="font-bold">失眠、焦慮、消化不良</div>
                        </div>
                      </div>
                      <button className="w-full py-4 bg-tcm-gold text-tcm-ink font-bold rounded-2xl hover:bg-tcm-gold-light transition-all shadow-xl shadow-tcm-gold/20">
                        生成詳細臨床報告
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeView === 'author' && (
              <motion.div
                key="author"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto space-y-8 pb-20"
              >
                <div className="bg-white rounded-3xl p-8 md:p-12 border border-tcm-gold/10 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-48 h-48 bg-tcm-paper rounded-2xl flex items-center justify-center border-2 border-dashed border-tcm-gold/20 shrink-0 overflow-hidden">
                      <img 
                        src="https://fineherb.com.tw/storage/upload/doctor/image/2019-10-31/3jJ7dL07kkxIV0FubcvBOziR6rlvtHclsX4qzF1v.png" 
                        alt="吳啓銘醫師" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h1 className="text-4xl font-serif font-bold text-tcm-ink mb-2">吳啓銘 中醫博士</h1>
                      <p className="text-tcm-clay text-lg mb-8">臻品中醫 副院長</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 text-tcm-ink/80 leading-relaxed mt-8">
                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4 flex items-center gap-2">
                        <GraduationCap className="text-tcm-gold" /> 吳啓銘醫師 學經歷
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <li>中國醫藥大學｜醫學學士</li>
                        <li>中國醫藥大學｜醫學碩士</li>
                        <li>中國醫藥大學｜醫學博士</li>
                        <li>中國醫藥大學｜講師</li>
                        <li>台中科技大學｜助理教授</li>
                        <li>教育部核定｜助理教授</li>
                        <li>針灸醫學會｜專科醫師</li>
                        <li>肥胖研究學會｜專科醫師</li>
                        <li>臻品中醫診所｜副院長</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4">傳統傳承與數據導引的針灸探索</h3>
                      <p>針灸之道，既是精準的經絡物理學，亦是深邃的人體能量學。</p>
                      <p>我對針灸的嚮往，最早源於兒時武俠小說中「點穴功夫」的俠義想像；然而，真正踏入中醫殿堂後才發覺，指尖下的毫芒之術，其嚴謹與奧妙遠勝於小說。在取得中西醫雙執照後，我有幸在台中東勢跟隨國寶級中醫師——鍾永祥老師，展開了長達十年的跟診歲月。這段歷程讓我明白，經典的傳承不僅在於書本，更在於臨床上對穴位感應的細微體察。</p>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4">臨床與學術的交匯</h3>
                      <p>帶著這份傳承的厚度，我以第一名的成績進入針灸研究所碩士班，隨後攻讀中醫博士，並開始在講台上教授針灸學。在教學過程中，我深切體會到「配穴」是許多後學者的門檻。穴位如星辰，單點易識，但要將其組合成方，理解其間的君臣佐使與相互拮抗，往往需要長年的浸潤與體悟，方能略窺堂奧。</p>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4">為什麼開發這個工具？</h3>
                      <p>近年來，我持續思考如何利用現代科技，將深奧的針灸邏輯具象化。這個針灸配穴網站，便是我在學術研究與教學過程中的產物。</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>系統化梳理：</strong> 將傳統配穴邏輯轉化為可檢索、可對照的結構化資訊，並非要簡化醫學的深度，而是希望提供一個更直覺的學習起點。</li>
                        <li><strong>拋磚引玉：</strong> 我嘗試將臨床經驗與文獻數據進行系統整理，期盼能為研讀針法的同道提供一個輔助工具，讓配穴不再是難以跨越的屏障。</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4">結語：工具為引，經典為宗</h3>
                      <p>醫學的進步，不應是捨棄傳統，而是利用新時代的工具去更深刻地解讀傳統。數據與演算法可以輔助決策，但無法取代醫師指尖下的溫度，更無法取代對經典條文的透徹領悟。</p>
                      <p>這個網站是我個人學習路上的紀錄與分享。願它能成為各位在針灸探索路上的一盞微光，輔助思考、引發討論，讓我們在追求精準醫療的同時，依然能保有一顆對古老智慧敬畏的心。</p>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}
