/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, BookOpen, Plus, Trash2, Info, Wind, Droplets, Flame, Mountain, 
  TreePine, ChevronRight, ChevronLeft, Filter, Clock, Layout, GraduationCap, Calculator,
  Calendar, Zap, Heart, Shield, Activity, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ACUPOINTS, Acupoint } from './data/acupoints';
import { 
  getGanzhi, getShichenName, ZI_WU_LIU_ZHU_MAP, 
  calculateLingGuiNumber, LING_GUI_POINTS, LING_GUI_PAIRS,
  NA_ZI_FA_DATA, FIVE_SHU_INDICATIONS, EARTHLY_BRANCHES,
  calculateXuNaJia
} from './lib/tcm-utils';
import { PRINCIPLES_DATA, PrincipleDetail } from './data/principles';
import { RHYMES_DATA, Rhyme } from './data/rhymes';

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

type ViewType = 'encyclopedia' | 'principles' | 'rhymes' | 'calculation' | 'prescription' | 'author';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('author');
  const [selectedPrinciple, setSelectedPrinciple] = useState<string | null>(null);
  const [selectedRhyme, setSelectedRhyme] = useState<Rhyme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<Acupoint | null>(null);
  const [prescription, setPrescription] = useState<Acupoint[]>([]);
  const [filterMeridian, setFilterMeridian] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isManualTime, setIsManualTime] = useState(false);
  const [useEarlyLateZi, setUseEarlyLateZi] = useState(false);
  const [manualTimeStr, setManualTimeStr] = useState(new Date().toISOString().slice(0, 16));
  const [previousView, setPreviousView] = useState<ViewType | null>(null);

  // Helper to navigate to a point from other views
  const navigateToPoint = (point: Acupoint) => {
    setPreviousView(activeView);
    setSelectedPoint(point);
    setActiveView('encyclopedia');
  };

  // Reset sub-views when active view changes
  useEffect(() => {
    setSelectedPrinciple(null);
    setSelectedRhyme(null);
  }, [activeView]);

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
      const matchesSearch = displaySearchTerm === '' || 
                            p.name.includes(displaySearchTerm) || 
                            p.code.toLowerCase().includes(displaySearchTerm.toLowerCase()) || 
                            p.meridian.toLowerCase().includes(displaySearchTerm.toLowerCase());
      const matchesFilter = filterMeridian === 'all' || p.meridian === filterMeridian;
      // If there's a search term, ignore the meridian filter
      return matchesSearch && (displaySearchTerm !== '' || matchesFilter);
    });
  }, [displaySearchTerm, filterMeridian]);

  const addToPrescription = (point: Acupoint) => {
    if (!prescription.find(p => p.id === point.id)) {
      setPrescription([...prescription, point]);
    }
  };

  const removeFromPrescription = (id: string) => {
    setPrescription(prescription.filter(p => p.id !== id));
  };

  const ganzhi = getGanzhi(effectiveTime, useEarlyLateZi);
  const currentShichen = getShichenName(effectiveTime.getHours());
  const zwlzMeridian = ZI_WU_LIU_ZHU_MAP[currentShichen];
  const currentNaZi = NA_ZI_FA_DATA[currentShichen];
  
  const lingGuiNum = calculateLingGuiNumber(ganzhi.dayStem, ganzhi.dayBranch, ganzhi.hourStem, ganzhi.hourBranch);
  const lingGuiPointName = LING_GUI_POINTS[lingGuiNum].point;

  const xuNaJiaResult = calculateXuNaJia(ganzhi.dayStem, ganzhi.hourBranch);

  const navItems = [
    { id: 'author', label: '關於作者', icon: Info },
    { id: 'principles', label: '配穴原則', icon: GraduationCap },
    { id: 'rhymes', label: '穴位歌訣', icon: Sparkles },
    { id: 'calculation', label: '時辰配穴', icon: Calculator },
    { id: 'encyclopedia', label: '穴位百科', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-tcm-paper text-tcm-ink font-sans selection:bg-tcm-gold/20 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white border-r border-tcm-gold/20 flex flex-col sticky top-0 h-screen z-40">
        <div className="p-6 flex items-center gap-3 border-b border-tcm-gold/5">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-tcm-gold/10 shrink-0 overflow-hidden border border-tcm-gold/10">
            <img 
              src={`${import.meta.env.BASE_URL}Logo.png`} 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden md:block overflow-hidden">
            <h1 className="text-lg font-serif font-bold tracking-tight whitespace-nowrap text-tcm-ink">靈樞流注精要</h1>
            <p className="text-[10px] text-tcm-clay font-bold uppercase tracking-widest">阿銘醫師針灸配穴筆記</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewType);
                setPreviousView(null);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                activeView === item.id 
                  ? 'bg-tcm-paper text-tcm-ink shadow-sm border border-tcm-gold/30' 
                  : 'text-tcm-clay/60 hover:bg-tcm-paper hover:text-tcm-ink'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-tcm-jade' : 'group-hover:text-tcm-jade'} />
              <span className="hidden md:block font-bold text-sm">{item.label}</span>
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
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${isManualTime ? 'bg-tcm-jade text-white' : 'bg-tcm-gold/20 text-tcm-clay'}`}
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
              <div className="text-2xl font-serif font-bold text-tcm-jade flex flex-col items-center gap-1">
                <div>{ganzhi.day} 日</div>
                <div>{ganzhi.hour} 時</div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] text-tcm-clay/40 font-bold uppercase tracking-tighter">換日邏輯</span>
                <span className="text-[9px] text-tcm-jade font-bold">{useEarlyLateZi ? '00:00 換日' : '23:00 換日'}</span>
              </div>
              <button 
                onClick={() => setUseEarlyLateZi(!useEarlyLateZi)}
                className={`w-full text-[10px] font-bold py-2 rounded-xl border transition-all flex items-center justify-center gap-2 shadow-sm ${
                  useEarlyLateZi 
                    ? 'bg-tcm-jade text-white border-tcm-jade shadow-tcm-jade/20' 
                    : 'bg-white border-tcm-gold/20 text-tcm-clay hover:border-tcm-gold/40'
                }`}
              >
                <Zap size={10} className={useEarlyLateZi ? 'text-tcm-gold' : 'text-tcm-gold/40'} />
                {useEarlyLateZi ? '早晚子時 (子正換日)' : '一般計算 (子初換日)'}
              </button>
              <p className="text-[9px] text-tcm-clay/40 text-center leading-tight px-2">
                {useEarlyLateZi 
                  ? '註：23:00-00:00 仍算當日(晚子)' 
                  : '註：23:00 即進入隔天(子初)'}
              </p>
            </div>

            <div className="pt-2 border-t border-tcm-gold/5">
              <div className="text-[10px] text-tcm-clay/60 font-bold space-y-1">
                <div className="text-center">
                  {effectiveTime.getFullYear()}年 {effectiveTime.getMonth() + 1}月 {effectiveTime.getDate()}日 {effectiveTime.getHours()}時 {effectiveTime.getMinutes().toString().padStart(2, '0')}分
                </div>
                <div className="text-center text-tcm-jade font-bold">
                  {currentShichen}時：{zwlzMeridian.replace('手', '').replace('足', '')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 px-2">
            <a 
              href="https://creativecommons.org/licenses/by/4.0/deed.zh_TW" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by.svg" 
                alt="CC BY 4.0" 
                className="h-5"
                referrerPolicy="no-referrer"
              />
              <span className="text-[8px] text-tcm-clay font-bold uppercase tracking-widest">CC BY 4.0</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            {activeView === 'encyclopedia' && (
              <motion.div
                key="encyclopedia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 h-full"
              >
                {/* Top: Search and Filter */}
                <div className="bg-white rounded-3xl border border-tcm-gold/10 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif font-bold text-tcm-ink flex items-center gap-2 shrink-0">
                      <Filter size={16} className="text-tcm-gold" /> 穴位瀏覽
                    </h2>
                    {/* Desktop Search */}
                    <div className="hidden md:flex relative flex-1 flex-col md:flex-row gap-2 w-full">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tcm-gold" size={16} />
                        <input
                          type="text"
                          placeholder="搜尋穴位名稱、代碼..."
                          className="w-full pl-9 pr-4 py-2 bg-tcm-paper border border-tcm-gold/30 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-tcm-jade transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setDisplaySearchTerm(searchTerm);
                              setIsSearchModalOpen(true);
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setDisplaySearchTerm(searchTerm);
                          setIsSearchModalOpen(true);
                        }}
                        className="px-4 py-2 bg-tcm-jade text-white rounded-xl text-xs font-bold hover:bg-tcm-jade/90 transition-colors w-full md:w-auto"
                      >
                        搜尋
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile Search */}
                  <div className="md:hidden relative flex flex-col gap-2 w-full">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tcm-gold" size={16} />
                      <input
                        type="text"
                        placeholder="搜尋穴位名稱、代碼..."
                        className="w-full pl-9 pr-4 py-2 bg-tcm-paper border border-tcm-gold/30 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-tcm-jade transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setDisplaySearchTerm(searchTerm);
                            setIsSearchModalOpen(true);
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setDisplaySearchTerm(searchTerm);
                        setIsSearchModalOpen(true);
                      }}
                      className="px-4 py-2 bg-tcm-jade text-white rounded-xl text-xs font-bold hover:bg-tcm-jade/90 transition-colors w-full"
                    >
                      搜尋
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar md:hidden">
                    <select 
                      className="w-full text-xs bg-tcm-paper border border-tcm-gold/40 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-tcm-jade font-bold"
                      value={filterMeridian}
                      onChange={(e) => setFilterMeridian(e.target.value)}
                    >
                      {meridians.map(m => (
                        <option key={m} value={m}>{m === 'all' ? '全部經絡' : m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden md:flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {meridians.map(m => (
                      <button
                        key={m}
                        onClick={() => setFilterMeridian(m)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterMeridian === m ? 'bg-tcm-jade text-white' : 'bg-tcm-paper text-tcm-clay hover:bg-tcm-gold/10'}`}
                      >
                        {m === 'all' ? '全部' : m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom: List and Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
                  {/* Left: List (Hidden by user request) */}
                  <div className="hidden lg:col-span-4 flex-col gap-4 overflow-hidden">
                    <div className="bg-white rounded-3xl border border-tcm-gold/10 shadow-sm overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-tcm-gold/5">
                          {filteredPoints.length > 0 ? (
                            filteredPoints.map((point) => (
                              <button
                                key={point.id}
                                onClick={() => {
                                  setSelectedPoint(point);
                                  setPreviousView(null);
                                }}
                                className={`w-full text-left p-4 hover:bg-tcm-paper transition-colors flex items-center justify-between group ${selectedPoint?.id === point.id ? 'bg-tcm-paper' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${selectedPoint?.id === point.id ? 'bg-tcm-clay text-white shadow-lg shadow-tcm-clay/20' : 'bg-tcm-gold/10 text-tcm-clay'}`}>
                                    {point.code}
                                  </div>
                                  <div>
                                    <div className="font-bold text-tcm-ink text-sm">{point.name}</div>
                                    <div className="text-[10px] text-tcm-jade font-bold uppercase tracking-tighter">{point.meridian}</div>
                                  </div>
                                </div>
                                <ChevronRight size={14} className={`text-tcm-gold/20 group-hover:text-tcm-gold transition-transform ${selectedPoint?.id === point.id ? 'translate-x-1 text-tcm-gold' : ''}`} />
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center text-tcm-clay/60 text-sm">
                              找不到符合條件的穴位
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className={`lg:col-span-12 ${selectedPoint ? 'block' : 'hidden lg:block'}`}>
                    <AnimatePresence mode="wait">
                      {selectedPoint ? (
                        <motion.div
                          key={selectedPoint.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white rounded-3xl border border-tcm-gold/10 shadow-xl overflow-hidden"
                        >
                          <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* Left: Meridian and Name */}
                            <div className="lg:col-span-4 space-y-6 flex flex-col items-center text-center">
                              <div className="w-full flex justify-between items-center lg:block">
                                <button onClick={() => setSelectedPoint(null)} className="lg:hidden p-2 text-tcm-clay bg-tcm-paper rounded-full">
                                  <ChevronLeft size={20} />
                                </button>
                                
                                {previousView && (
                                  <button 
                                    onClick={() => {
                                      setActiveView(previousView);
                                      setPreviousView(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-tcm-paper text-tcm-jade hover:bg-tcm-jade hover:text-white transition-all font-bold text-xs rounded-xl border border-tcm-jade/20"
                                  >
                                    <ChevronLeft size={14} /> 返回{navItems.find(n => n.id === previousView)?.label}
                                  </button>
                                )}
                              </div>
                              
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-tcm-jade/10 text-tcm-jade text-[10px] font-bold tracking-widest uppercase">
                                {selectedPoint.meridian}
                              </div>
                              <h2 className="text-5xl font-serif font-bold text-tcm-ink">{selectedPoint.name}</h2>
                              <p className="text-tcm-jade font-mono text-xl font-bold">{selectedPoint.code}</p>
                            </div>

                            {/* Right: Characteristics and Location */}
                            <div className="lg:col-span-8 space-y-12">
                              <div className="space-y-4">
                                <h3 className="text-sm font-bold text-tcm-ink flex items-center gap-2 border-b border-tcm-gold/10 pb-2">
                                  <Info size={16} className="text-tcm-gold" /> 穴位特性
                                </h3>
                                <div className="text-base text-tcm-ink leading-relaxed bg-transparent p-2 relative overflow-hidden">
                                  
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedPoint.element && (
                                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold ${ELEMENT_COLORS[selectedPoint.element]}`}>
                                        {(() => {
                                          const Icon = ELEMENT_ICONS[selectedPoint.element];
                                          return Icon ? <Icon size={12} /> : null;
                                        })()}
                                        五行：{selectedPoint.element}
                                      </div>
                                    )}
                                    {selectedPoint.five_shu && (
                                      <div className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-[10px] font-bold border border-slate-300">
                                        五輸穴：{selectedPoint.five_shu}
                                      </div>
                                    )}
                                    {selectedPoint.is_yuan && <div className="px-3 py-1.5 rounded-xl bg-orange-100 text-orange-900 text-[10px] font-bold border border-orange-300">原穴</div>}
                                    {selectedPoint.is_luo && <div className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 text-[10px] font-bold border border-purple-300">絡穴</div>}
                                    {selectedPoint.is_xi && <div className="px-3 py-1.5 rounded-xl bg-red-100 text-red-900 text-[10px] font-bold border border-red-300">郄穴</div>}
                                    {selectedPoint.is_mu && <div className="px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-300">募穴</div>}
                                    {selectedPoint.is_back_shu && <div className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-300">背俞穴</div>}
                                    {selectedPoint.is_eight_confluence && (
                                      <div className="px-3 py-1.5 rounded-xl bg-cyan-100 text-cyan-900 text-[10px] font-bold border border-cyan-300">
                                        八脈交會：{selectedPoint.is_eight_confluence}
                                      </div>
                                    )}
                                    {selectedPoint.is_eight_influential && (
                                      <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                                        八會穴：{selectedPoint.is_eight_influential}
                                      </div>
                                    )}
                                    {selectedPoint.is_crossing && (
                                      <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                                        交會穴：{selectedPoint.is_crossing}
                                      </div>
                                    )}
                                  </div>
                                  <div className="font-medium">
                                    {!(selectedPoint.element || 
                                        selectedPoint.five_shu || 
                                        selectedPoint.is_yuan || 
                                        selectedPoint.is_luo || 
                                        selectedPoint.is_xi || 
                                        selectedPoint.is_mu || 
                                        selectedPoint.is_back_shu || 
                                        selectedPoint.is_eight_confluence || 
                                        selectedPoint.is_eight_influential || 
                                        selectedPoint.is_crossing) ? "暫無資料，待補充。" : null}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-sm font-bold text-tcm-ink flex items-center gap-2 border-b border-tcm-gold/10 pb-2">
                                  <Wind size={16} className="text-tcm-gold" /> 穴道位置
                                </h3>
                                <div className="text-sm text-tcm-ink leading-relaxed bg-transparent p-2 font-medium">
                                  {selectedPoint.location}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-white rounded-3xl border border-tcm-gold/10 border-dashed p-20 flex flex-col items-center justify-center text-center space-y-6">
                          <div className="w-24 h-24 bg-tcm-paper rounded-full flex items-center justify-center text-tcm-clay/20">
                            <BookOpen size={48} />
                          </div>
                          <div className="max-w-xs">
                            <h3 className="text-2xl font-serif font-bold text-tcm-ink mb-2">探索中醫經絡</h3>
                            <p className="text-sm text-tcm-clay/60">使用上方搜尋框或經絡篩選來尋找穴位，深入了解其特性、五行屬性及臨床應用。</p>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Search Results Modal */}
                <AnimatePresence>
                  {isSearchModalOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-tcm-ink/20 backdrop-blur-sm p-4"
                      onClick={() => setIsSearchModalOpen(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6 border-b border-tcm-gold/10 flex justify-between items-center">
                          <h3 className="font-serif font-bold text-xl text-tcm-ink">搜尋結果: "{displaySearchTerm}"</h3>
                          <button onClick={() => setIsSearchModalOpen(false)} className="p-2 hover:bg-tcm-paper rounded-full">
                            <X size={20} className="text-tcm-clay" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredPoints.length > 0 ? (
                            filteredPoints.map(point => (
                              <button
                                key={point.id}
                                onClick={() => {
                                  setSelectedPoint(point);
                                  setIsSearchModalOpen(false);
                                  setPreviousView(null);
                                }}
                                className="p-4 bg-tcm-paper rounded-2xl hover:bg-tcm-gold/10 transition-colors text-left"
                              >
                                <div className="font-bold text-tcm-ink">{point.name}</div>
                                <div className="text-xs text-tcm-jade font-bold">{point.code}</div>
                              </button>
                            ))
                          ) : (
                            <div className="col-span-full p-8 text-center text-tcm-clay/60">找不到符合的穴位</div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Meridian Points Modal */}
                <AnimatePresence>
                  {filterMeridian !== 'all' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-tcm-ink/20 backdrop-blur-sm p-4"
                      onClick={() => setFilterMeridian('all')}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6 border-b border-tcm-gold/10 flex justify-between items-center">
                          <h3 className="font-serif font-bold text-xl text-tcm-ink">{filterMeridian} 穴位列表</h3>
                          <button onClick={() => setFilterMeridian('all')} className="p-2 hover:bg-tcm-paper rounded-full">
                            <X size={20} className="text-tcm-clay" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {ACUPOINTS.filter(p => p.meridian === filterMeridian).map(point => (
                            <button
                              key={point.id}
                              onClick={() => {
                                setSelectedPoint(point);
                                setFilterMeridian('all');
                                setPreviousView(null);
                              }}
                              className="p-4 bg-tcm-paper rounded-2xl hover:bg-tcm-gold/10 transition-colors text-left"
                            >
                              <div className="font-bold text-tcm-ink">{point.name}</div>
                              <div className="text-xs text-tcm-jade font-bold">{point.code}</div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>


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
                        <p className="text-tcm-ink font-medium leading-relaxed">
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
                            <p className="text-sm text-tcm-ink/70 font-medium leading-relaxed line-clamp-2">{p.description}</p>
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
                          <div className="max-w-3xl space-y-6">
                            <h2 className="text-5xl font-serif font-bold text-tcm-ink">{PRINCIPLES_DATA[selectedPrinciple].title}</h2>
                            <div className="markdown-body">
                              <ReactMarkdown>
                                {PRINCIPLES_DATA[selectedPrinciple].content}
                              </ReactMarkdown>
                            </div>
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
                                    <span className="text-xs font-bold text-tcm-jade bg-white px-3 py-1 rounded-full uppercase tracking-wider border border-tcm-jade/10">
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
                                            navigateToPoint(point);
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

            {activeView === 'rhymes' && (
              <motion.div
                key="rhymes"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <AnimatePresence mode="wait">
                  {!selectedRhyme ? (
                    <motion.div
                      key="rhyme-list"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="max-w-3xl">
                        <h2 className="text-4xl font-serif font-bold text-tcm-ink mb-4">經典穴位歌訣</h2>
                        <p className="text-tcm-ink font-medium leading-relaxed">
                          歌訣是中醫傳承智慧的重要載體，將深奧的取穴與配穴規律化為朗朗上口的文字，便於記憶與臨床應用。
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {RHYMES_DATA.map((rhyme, i) => (
                          <motion.button
                            key={rhyme.id}
                            onClick={() => setSelectedRhyme(rhyme)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-3xl border border-tcm-gold/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group flex flex-col h-full"
                          >
                            <div className="w-14 h-14 bg-tcm-paper text-tcm-jade rounded-2xl flex items-center justify-center mb-6 group-hover:bg-tcm-jade group-hover:text-white transition-colors">
                              <Sparkles size={28} />
                            </div>
                            <h3 className="font-serif font-bold text-2xl text-tcm-ink mb-3">{rhyme.title}</h3>
                            <p className="text-sm text-tcm-ink/70 font-medium leading-relaxed line-clamp-3 mb-6 flex-1">{rhyme.description}</p>
                            <div className="flex items-center gap-2 text-tcm-gold font-bold text-xs uppercase tracking-widest">
                              閱讀歌訣 <ChevronRight size={14} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rhyme-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <button 
                        onClick={() => setSelectedRhyme(null)}
                        className="flex items-center gap-2 text-tcm-clay hover:text-tcm-ink transition-colors font-bold text-sm"
                      >
                        <ChevronRight size={16} className="rotate-180" /> 返回歌訣列表
                      </button>

                      <div className="bg-white rounded-[3rem] border border-tcm-gold/20 shadow-2xl overflow-hidden">
                        <div className="p-10 md:p-16 space-y-12">
                          <div className="max-w-3xl space-y-4">
                            <h2 className="text-5xl font-serif font-bold text-tcm-ink">{selectedRhyme.title}</h2>
                            <p className="text-xl text-tcm-jade font-serif font-bold leading-relaxed italic">
                              {selectedRhyme.description}
                            </p>
                          </div>

                          <div className="bg-tcm-paper p-12 rounded-[2.5rem] border border-tcm-gold/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                              <Sparkles size={200} />
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                              {selectedRhyme.content.map((line, idx) => (
                                <p key={idx} className="text-3xl md:text-4xl font-serif font-bold text-tcm-ink tracking-widest">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>

                          {selectedRhyme.source && (
                            <div className="flex justify-end">
                              <div className="px-6 py-3 bg-tcm-paper rounded-2xl text-tcm-clay text-sm font-bold border border-tcm-gold/10">
                                出處：{selectedRhyme.source}
                              </div>
                            </div>
                          )}
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
                <div className="max-w-6xl space-y-6">
                  <h2 className="text-5xl font-serif font-bold text-tcm-ink">時間醫學：按時選穴</h2>
                  
                  {/* Time Settings Card */}
                  <div className="bg-white p-8 rounded-3xl border-2 border-tcm-gold/20 shadow-md space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-tcm-jade/10 text-tcm-jade rounded-xl flex items-center justify-center">
                          <Clock size={24} />
                        </div>
                        <div>
                          <div className="text-sm text-tcm-clay font-bold uppercase tracking-widest">當前計算時間</div>
                          <div className="text-2xl font-serif font-bold text-tcm-ink">
                            {effectiveTime.toLocaleString('zh-TW', { 
                              year: 'numeric', month: 'long', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                              hour12: false 
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsManualTime(!isManualTime)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            !isManualTime 
                              ? 'bg-tcm-jade text-white shadow-lg shadow-tcm-jade/20' 
                              : 'bg-tcm-paper text-tcm-clay hover:bg-tcm-gold/10'
                          }`}
                        >
                          系統時間
                        </button>
                        <button
                          onClick={() => setIsManualTime(!isManualTime)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isManualTime 
                              ? 'bg-tcm-jade text-white shadow-lg shadow-tcm-jade/20' 
                              : 'bg-tcm-paper text-tcm-clay hover:bg-tcm-gold/10'
                          }`}
                        >
                          手動設定
                        </button>
                      </div>
                    </div>

                    {isManualTime && (
                      <div className="pt-4 border-t border-tcm-gold/5 flex flex-wrap items-center gap-4">
                        <input
                          type="datetime-local"
                          value={manualTimeStr}
                          onChange={(e) => setManualTimeStr(e.target.value)}
                          className="bg-tcm-paper border border-tcm-gold/20 rounded-xl px-4 py-2 text-sm font-bold text-tcm-ink focus:outline-none focus:ring-2 focus:ring-tcm-jade/50"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-tcm-gold/5 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-tcm-clay font-bold">換日系統：</span>
                        <div className="flex bg-tcm-paper p-1 rounded-xl border border-tcm-gold/10">
                          <button
                            onClick={() => setUseEarlyLateZi(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              !useEarlyLateZi ? 'bg-white text-tcm-ink shadow-sm' : 'text-tcm-clay/60 hover:text-tcm-ink'
                            }`}
                          >
                            子初換日 (23:00)
                          </button>
                          <button
                            onClick={() => setUseEarlyLateZi(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              useEarlyLateZi ? 'bg-white text-tcm-ink shadow-sm' : 'text-tcm-clay/60 hover:text-tcm-ink'
                            }`}
                          >
                            子正換日 (00:00)
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-tcm-clay/80 italic">
                        當前干支：<span className="text-tcm-ink font-bold">{ganzhi.dayStem}{ganzhi.dayBranch}日 {ganzhi.hourStem}{ganzhi.hourBranch}時</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-tcm-clay/80 leading-relaxed text-xl">
                    中醫認為人體氣血運行與自然界時間節律密切相關。
                    子午流注與靈龜八法是根據時間推算「開穴」的經典方法。
                  </p>
                </div>

                <div className="space-y-12">
                  {/* Zi Wu Liu Zhu - Top Section */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border-2 border-tcm-gold/10 shadow-2xl overflow-hidden">
                      <div className="p-10 space-y-10">
                        <div className="flex items-center gap-4 text-tcm-clay border-b-2 border-tcm-gold/10 pb-6">
                          <Clock size={36} className="text-tcm-jade" />
                          <h3 className="text-4xl font-serif font-bold text-tcm-ink">子午流注</h3>
                        </div>

                        {/* Section: Na Zi Fa */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 bg-tcm-jade rounded-full" />
                          <h4 className="text-2xl font-serif font-bold text-tcm-ink">納子法 (按時循經)</h4>
                        </div>
                        <div className="px-6 py-2 bg-tcm-paper rounded-full text-tcm-ink text-sm font-bold border-2 border-tcm-gold/20">
                          當前：{currentShichen}時 ({zwlzMeridian.replace('手', '').replace('足', '')})
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Method 1: Mother-Son */}
                        <div className="p-6 bg-tcm-paper/50 rounded-2xl border-2 border-tcm-gold/10 space-y-4">
                          <h5 className="text-lg font-bold text-tcm-ink flex items-center gap-2">
                            <Zap size={18} className="text-tcm-cinnabar" /> 補母瀉子法
                          </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-tcm-clay/80 font-bold">實證 (瀉子)</span>
                            <button 
                              onClick={() => {
                                const p = ACUPOINTS.find(ap => ap.name === currentNaZi.sonPoint);
                                if (p) {
                                  navigateToPoint(p);
                                }
                              }}
                              className="text-2xl font-serif font-bold text-tcm-cinnabar hover:scale-110 transition-transform"
                            >
                              {currentNaZi.sonPoint}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-tcm-clay/80 font-bold">虛證 (補母)</span>
                            <button 
                              onClick={() => {
                                const p = ACUPOINTS.find(ap => ap.name === currentNaZi.motherPoint);
                                if (p) {
                                  navigateToPoint(p);
                                }
                              }}
                              className="text-2xl font-serif font-bold text-tcm-jade hover:scale-110 transition-transform"
                            >
                              {currentNaZi.motherPoint}
                            </button>
                          </div>
                        </div>
                        <p className="text-base text-tcm-clay/80 italic leading-relaxed">
                          實則瀉其子，虛則補其母。當令之時，氣血最旺，補母瀉子效果最佳。
                        </p>
                      </div>

                      {/* Method 2: Specific Shu-Stream */}
                      <div className="p-6 bg-tcm-paper/50 rounded-2xl border-2 border-tcm-gold/10 space-y-4">
                        <h5 className="text-lg font-bold text-tcm-ink flex items-center gap-2">
                          <Activity size={18} className="text-tcm-jade" /> 專取俞穴法
                        </h5>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-tcm-clay/80 font-bold">定時發作疾病</span>
                          <button 
                            onClick={() => {
                              const p = ACUPOINTS.find(ap => ap.name === currentNaZi.shuStreamPoint);
                              if (p) {
                                navigateToPoint(p);
                              }
                            }}
                            className="px-5 py-2 bg-tcm-clay text-white text-lg font-bold rounded-xl hover:bg-tcm-ink transition-all shadow-md"
                          >
                            {currentNaZi.shuStreamPoint}
                          </button>
                        </div>
                        <p className="text-base text-tcm-clay/80 italic leading-relaxed">
                          「病時間時甚者取之俞」，取發作時間所屬流注經絡之俞穴.
                        </p>
                      </div>

                          {/* Method 3: Shu-Mu Combination */}
                        <div className="p-6 bg-tcm-paper/50 rounded-2xl border-2 border-tcm-gold/10 space-y-4">
                          <h5 className="text-lg font-bold text-tcm-ink flex items-center gap-2">
                            <Shield size={18} className="text-tcm-gold" /> 配俞募穴法
                          </h5>
                          <div className="flex flex-wrap gap-8">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-tcm-clay/80 font-bold">背俞:</span>
                              <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.backShu); if (p) { navigateToPoint(p); } }} className="text-2xl font-serif font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.backShu}</button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-tcm-clay/80 font-bold">胸募:</span>
                              <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.frontMu); if (p) { navigateToPoint(p); } }} className="text-2xl font-serif font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.frontMu}</button>
                            </div>
                          </div>
                          <p className="text-base text-tcm-clay/80 italic leading-relaxed">
                            在流注時辰取該經之背俞及胸腹募穴。
                          </p>
                        </div>

                        {/* Method 4: Yuan-Luo Combination */}
                        <div className="p-6 bg-tcm-paper/50 rounded-2xl border-2 border-tcm-gold/10 space-y-4">
                          <h5 className="text-lg font-bold text-tcm-ink flex items-center gap-2">
                            <Heart size={18} className="text-tcm-cinnabar" /> 原絡配穴法
                          </h5>
                          <div className="flex flex-wrap gap-8">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-tcm-clay/80 font-bold">本經原:</span>
                              <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.yuanPoint); if (p) { navigateToPoint(p); } }} className="text-2xl font-serif font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.yuanPoint}</button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-tcm-clay/80 font-bold">本經絡:</span>
                              <button onClick={() => { const p = ACUPOINTS.find(ap => ap.name === currentNaZi.luoPoint); if (p) { navigateToPoint(p); } }} className="text-2xl font-serif font-bold text-tcm-ink hover:text-tcm-gold transition-colors">{currentNaZi.luoPoint}</button>
                            </div>
                          </div>
                          <p className="text-base text-tcm-clay/80 italic leading-relaxed">
                            取當令經之原穴為主，配合其絡穴加強療效。
                          </p>
                        </div>
                      </div>

                      {/* Method 4: Five Shu Indications */}
                      <div className="space-y-6">
                        <h5 className="text-xl font-serif font-bold text-tcm-ink flex items-center gap-3 border-b-2 border-tcm-gold/10 pb-4">
                          <GraduationCap size={24} className="text-tcm-gold" /> 取五輸穴法 (靈樞/難經)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {FIVE_SHU_INDICATIONS.map((item) => {
                            const point = ACUPOINTS.find(p => p.meridian === zwlzMeridian && p.five_shu === item.type);
                            return (
                              <div key={item.type} className="flex items-start gap-4 p-5 rounded-2xl bg-tcm-paper/30 border border-tcm-gold/10 hover:bg-tcm-paper hover:border-tcm-gold/30 transition-all group">
                                <div className="w-16 h-16 bg-tcm-clay/10 text-tcm-clay rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 group-hover:bg-tcm-ink group-hover:text-white transition-colors">
                                  {item.type}
                                </div>
                                <div className="space-y-2 w-full">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-bold text-tcm-ink">{item.indication}</span>
                                    {point && (
                                      <button 
                                        onClick={() => { navigateToPoint(point); }}
                                        className="text-2xl font-serif font-bold text-tcm-ink hover:text-tcm-clay transition-colors px-4 py-2 bg-white rounded-xl shadow-sm border border-tcm-gold/10"
                                      >
                                        {point.name}
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-sm text-tcm-clay/70 italic">{item.nanJing}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                      {/* Section: Na Jia Fa */}
                      <div className="p-10 bg-tcm-paper rounded-3xl border-2 border-tcm-gold/20 space-y-8 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles size={28} className="text-tcm-jade" />
                            <h4 className="text-3xl font-serif font-bold text-tcm-ink">納甲法 (徐鳳《針灸大全》)</h4>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold bg-tcm-jade text-white px-4 py-1 rounded uppercase tracking-widest">
                              {xuNaJiaResult.source.split(' ')[0]}
                            </span>
                            <span className="text-xs text-tcm-clay/60 font-bold mt-2">阿銘醫師整理</span>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex items-center justify-between text-lg">
                            <span className="text-tcm-clay/80 font-bold">當前時干：</span>
                            <span className="font-bold text-tcm-ink bg-white px-4 py-1 rounded-lg shadow-sm">{xuNaJiaResult.hourStem}{ganzhi.hourBranch}時</span>
                          </div>

                          <div className="p-8 bg-white rounded-3xl border-2 border-tcm-gold/10 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-tcm-clay font-bold uppercase tracking-widest">開穴結果</span>
                              <span className="text-sm text-tcm-jade font-bold">{xuNaJiaResult.method}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4">
                              {xuNaJiaResult.points.map(pName => (
                                <button
                                  key={pName}
                                  onClick={() => {
                                    const p = ACUPOINTS.find(ap => ap.name === pName);
                                    if (p) navigateToPoint(p);
                                  }}
                                  className="px-8 py-4 bg-tcm-paper border-2 border-tcm-gold/30 rounded-2xl text-2xl font-serif font-bold text-tcm-ink hover:bg-tcm-jade hover:text-white hover:border-tcm-jade transition-all shadow-md flex items-center gap-3 group"
                                >
                                  <span>{pName}</span>
                                  <ChevronRight size={20} className="text-tcm-jade group-hover:text-white" />
                                </button>
                              ))}
                            </div>
                          </div>

                            <div className="space-y-4">
                              <div className="text-sm text-tcm-clay font-bold uppercase tracking-widest">計算流程 (SOP)</div>
                              <div className="text-sm text-tcm-clay/80 space-y-2">
                                <p className={xuNaJiaResult.source.includes('High Priority') ? 'text-tcm-jade font-bold' : ''}>1. 檢查『氣納三焦』或『血歸包絡』</p>
                                <p className={xuNaJiaResult.source.includes('Primary') ? 'text-tcm-jade font-bold' : ''}>2. 檢索『當日日干』特定開穴</p>
                                <p className={xuNaJiaResult.source.includes('Transformation') ? 'text-tcm-jade font-bold' : ''}>3. 執行『五門十變』(合化日) 檢索</p>
                                <p className={xuNaJiaResult.source.includes('Fallback') ? 'text-tcm-jade font-bold' : ''}>4. 執行『納子法』(時辰原穴)</p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-tcm-clay/80 leading-relaxed italic font-medium pt-4 border-t-2 border-tcm-gold/10">
                            「剛柔相配，陰陽相合，氣血循環，時穴開闔也。」——《徐氏子午流注》
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ling Gui Ba Fa - Bottom Section */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border-2 border-tcm-gold/10 shadow-2xl overflow-hidden">
                      <div className="p-10 space-y-10">
                        <div className="flex items-center gap-4 text-tcm-clay border-b-2 border-tcm-gold/10 pb-6">
                          <Zap size={36} className="text-tcm-cinnabar" />
                          <h3 className="text-4xl font-serif font-bold text-tcm-ink">靈龜八法</h3>
                        </div>

                        <div className="bg-tcm-paper rounded-3xl p-10 border-2 border-tcm-gold/20 space-y-8 shadow-inner">
                          <div className="flex items-center justify-between text-sm font-bold text-tcm-clay uppercase tracking-widest">
                            <span>九宮八卦推算</span>
                            <span className="bg-white px-3 py-1 rounded-lg border border-tcm-gold/10">餘數：{lingGuiNum}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-12">
                            <div className="w-32 h-32 bg-tcm-clay text-white rounded-3xl flex flex-col items-center justify-center shadow-2xl shadow-tcm-clay/30 border-4 border-white">
                              <span className="text-5xl font-serif font-bold">{LING_GUI_POINTS[lingGuiNum].hexagram}</span>
                            </div>
                            <div className="space-y-3">
                              <div className="text-lg text-tcm-clay font-bold">當前開穴：</div>
                              <button 
                                onClick={() => {
                                  const p = ACUPOINTS.find(ap => ap.name === lingGuiPointName);
                                  if (p) {
                                    navigateToPoint(p);
                                  }
                                }}
                                className="text-7xl font-serif font-bold text-tcm-ink hover:text-tcm-clay hover:scale-105 transition-all"
                              >
                                {lingGuiPointName}
                              </button>
                            </div>
                          </div>

                          <div className="pt-6 border-t-2 border-tcm-gold/10">
                            <p className="text-lg text-tcm-clay/90 leading-relaxed italic font-medium">
                              「坎一聯申脈，照海坤二五...」根據日、時干支基數計算，餘數對應八脈交會穴。
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-xl font-serif font-bold text-tcm-ink flex items-center gap-3">
                            <Layout size={24} className="text-tcm-gold" /> 八脈交會穴對應
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {LING_GUI_PAIRS.map((pairData, idx) => (
                              <div key={idx} className="grid grid-cols-2 gap-4">
                                {pairData.pair.map((pName, pIdx) => {
                                  const isActive = pName === lingGuiPointName;
                                  return (
                                    <button
                                      key={pName}
                                      onClick={() => {
                                        const p = ACUPOINTS.find(ap => ap.name === pName);
                                        if (p) {
                                          navigateToPoint(p);
                                        }
                                      }}
                                      className={`p-6 rounded-2xl border-2 text-left transition-all ${isActive ? 'bg-tcm-clay border-tcm-clay text-white shadow-xl scale-105 z-10' : 'bg-white border-tcm-gold/10 text-tcm-ink hover:bg-tcm-paper hover:border-tcm-gold/30'}`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold ${isActive ? 'text-white/70' : 'text-tcm-clay/60'}`}>{pairData.hexagrams[pIdx]}</span>
                                      </div>
                                      <div className="text-2xl font-serif font-bold">{pName}</div>
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
                      <p className="text-tcm-jade text-lg font-bold mb-8">臻品中醫 副院長</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 text-tcm-ink/80 leading-relaxed mt-8">
                    <section>
                      <h3 className="text-xl font-bold text-tcm-ink mb-4 flex items-center gap-2">
                        <GraduationCap className="text-tcm-gold" /> 吳啓銘醫師 學經歷
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <li>中國醫藥大學｜中西醫雙主修</li>
                        <li>中國醫藥大學｜針灸碩士</li>
                        <li>中國醫藥大學｜醫學博士</li>
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

                    <section className="pt-8 border-t border-tcm-gold/10 mt-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-tcm-clay/60">
                        <p>© 2026 吳啓銘 中醫博士. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                          <span>本站內容採用</span>
                          <a 
                            href="https://creativecommons.org/licenses/by/4.0/deed.zh_TW" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-tcm-gold hover:underline font-bold"
                          >
                            創用 CC 姓名標示 4.0 國際 授權條款 (CC BY 4.0)
                          </a>
                        </div>
                      </div>
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
