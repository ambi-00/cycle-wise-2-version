import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { localDateStr } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { loadCycleSettings } from '@/lib/demoDataLoaders';
import { saveTrade, updateTrade, uploadTradeImage, type TradeInsert } from '@/lib/supabaseHelpers';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import TradeReviewModal, { type TradeExecutionReview } from '@/components/TradeReviewModal';

const DEFAULT_STRATEGIES = [
  { name: 'ICT Silver Bullet', minConfirmations: 3 },
  { name: 'SMC Sweep', minConfirmations: 2 },
  { name: 'Momentum Breakout', minConfirmations: 1 },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Compress image to reduce localStorage usage
function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function NewTrade({ dateProp }: { dateProp?: string } = {}) {
  const { getTradeLimit, subscription, hasFeature, getScreenshotLimit } = useSubscription();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');
  const idParam = searchParams.get('id');
  const initialDate = dateProp || dateParam || localDateStr();
  
  console.log('NewTrade mounted with dateParam:', dateParam, 'idParam:', idParam);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState(initialDate); // Editable trade date

  const [instrument, setInstrument] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [slPrice, setSlPrice] = useState<number | ''>('');
  const [tpPrice, setTpPrice] = useState<number | ''>('');
  const [strategy, setStrategy] = useState('');
  const [quick, setQuick] = useState(false);

  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [strategyExitOptions, setStrategyExitOptions] = useState<string[]>([]); // Exit options from strategy
  const [strategyEntryTrigger, setStrategyEntryTrigger] = useState<string>(""); // Entry trigger from strategy

  const [preNote, setPreNote] = useState('');
  const [postNote, setPostNote] = useState('');
  const [emotionBefore, setEmotionBefore] = useState(5);
  const [emotionAfter, setEmotionAfter] = useState(5);
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven' | ''>('');
  const [lossReason, setLossReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [customExitReason, setCustomExitReason] = useState('');
  const [customWinReasons, setCustomWinReasons] = useState<string[]>([]);
  const [customLossReasons, setCustomLossReasons] = useState<string[]>([]);
  const [newWinReason, setNewWinReason] = useState('');
  const [newLossReason, setNewLossReason] = useState('');
  const [defaultWinReasons, setDefaultWinReasons] = useState<string[]>([]);
  const [defaultLossReasons, setDefaultLossReasons] = useState<string[]>([]);
  const [rrr, setRrr] = useState<number | ''>('');
  const [riskPct, setRiskPct] = useState<number | ''>('');
  const [closedPnl, setClosedPnl] = useState<number | ''>('');
  const [closedRrr, setClosedRrr] = useState<number | ''>('');
  const [maxRReached, setMaxRReached] = useState<number | ''>(''); // Maximum R achieved before reversal
  const [idealSlSize, setIdealSlSize] = useState<number | ''>(''); // Ideal SL size that would have worked
  const [plannedSlSize, setPlannedSlSize] = useState<number | ''>(''); // Planned SL size before trade
  const [learnings, setLearnings] = useState('');
  const [tradeRating, setTradeRating] = useState<number>(0);

  const [tfSmall, setTfSmall] = useState('5m');
  const [tfLarge, setTfLarge] = useState('1h');
  
  // AI Insights Data Collection
  const [sessionTime, setSessionTime] = useState<'london' | 'newyork' | 'asia' | 'other'>('london'); // Session Timing Success
  const [emotionalStateTrading, setEmotionalStateTrading] = useState<'anxious' | 'calm' | 'neutral'>('calm'); // Emotional State Impact
  const [sessionStartTime, setSessionStartTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })); // For winning streak tracking

  // Mid-Trade Tracking (Overtrading & Performance Analysis)
  const [tradeDurationType, setTradeDurationType] = useState<'scalp' | 'shortterm' | 'swing' | ''>(''); // Scalp (<5min), Short-term (5-30min), Swing (>30min)
  const [midTradeNotes, setMidTradeNotes] = useState(''); // Thoughts, emotions during trade
  const [midTradeScreenshot, setMidTradeScreenshot] = useState<string | null>(null); // Screenshot mid-trade
  
  // Setup Changes Tracking (Revenge Trading detection)
  const [setupChangedDurningTrade, setSetupChangedDuringTrade] = useState(false); // Did I change the setup?
  const [setupChangeDetails, setSetupChangeDetails] = useState(''); // What changed (e.g., "SL moved from 1.0940 to 1.0930", "TP adjusted")
  const [slChanged, setSlChanged] = useState(false); // Specific tracking: SL modified
  const [slChangedValue, setSlChangedValue] = useState<number | ''>(''); // New SL value
  const [tpChanged, setTpChanged] = useState(false); // Specific tracking: TP modified
  const [tpChangedValue, setTpChangedValue] = useState<number | ''>(''); // New TP value
  
  // Performance Tracking (Overtrading & Concentration)
  const [tradesCount, setTradesCount] = useState<number>(0); // Total trades in current session
  const [sessionQuality, setSessionQuality] = useState<'sharp' | 'focused' | 'declining' | 'exhausted' | ''>(''); // Mental state during session
  const [concentrationLevel, setConcentrationLevel] = useState<number>(5); // 1-10 scale

  const [imageBeforeSmall, setImageBeforeSmall] = useState<string | null>(null);
  const [imageBeforeLarge, setImageBeforeLarge] = useState<string | null>(null);
  const [imageAfterSmall, setImageAfterSmall] = useState<string | null>(null);
  const [imageAfterLarge, setImageAfterLarge] = useState<string | null>(null);

  // Trade Review Modal State (NEW)
  const [showTradeReview, setShowTradeReview] = useState(false);
  const [pendingTradeData, setPendingTradeData] = useState<TradeInsert | null>(null);
  const [pendingTradeId, setPendingTradeId] = useState<string | null>(null);
  const [pendingIsEdit, setPendingIsEdit] = useState(false);

  const [viewMode, setViewMode] = useState<'before' | 'during' | 'after'>('before');
  const [preSmallUrl, setPreSmallUrl] = useState('');
  const [preLargeUrl, setPreLargeUrl] = useState('');
  const [postSmallUrl, setPostSmallUrl] = useState('');
  const [postLargeUrl, setPostLargeUrl] = useState('');
  const [midTradeUrl, setMidTradeUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; message: string; onConfirm: () => void } | null>(null);
  const [customStrategies, setCustomStrategies] = useState<any[]>([]);

  // Load custom strategies from localStorage
  useEffect(() => {
    const loadStrategies = () => {
      try {
        const userStrategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
        setCustomStrategies(userStrategies);
      } catch (e) {
        console.error('Failed to load custom strategies:', e);
      }
    };
    
    // Load initially
    loadStrategies();
    
    // Listen for storage changes (when strategies are added/edited in another tab or component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cw_strategies') {
        loadStrategies();
      }
    };
    
    // Also listen for custom event (for same-tab updates)
    const handleCustomEvent = () => loadStrategies();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('strategies-updated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('strategies-updated', handleCustomEvent);
    };
  }, []);

  const strategies = useMemo(() => {
    // Combine default strategies with custom user strategies
    const defaultNames = DEFAULT_STRATEGIES.map((s) => s.name);
    const customNames = customStrategies.map((s: any) => s.name).filter((name: string) => name);
    return [...defaultNames, ...customNames];
  }, [customStrategies]);

  const strategyRequirements = useMemo(() => {
    const requirements = Object.fromEntries(DEFAULT_STRATEGIES.map((s) => [s.name, s.minConfirmations]));
    // Add custom strategies with their confirmations
    customStrategies.forEach((s: any) => {
      const confs = s.setupConfirmations || s.confirmations;
      if (s.name && confs) {
        requirements[s.name] = confs.length || 0;
      }
    });
    return requirements;
  }, [customStrategies]);
  
  const minRequired = strategyRequirements[strategy] || 0;

  // Load custom reasons from localStorage
  useEffect(() => {
    try {
      const winReasons = localStorage.getItem('cw_custom_win_reasons');
      const lossReasons = localStorage.getItem('cw_custom_loss_reasons');
      if (winReasons) setCustomWinReasons(JSON.parse(winReasons));
      if (lossReasons) setCustomLossReasons(JSON.parse(lossReasons));
      
      const defaultWins = localStorage.getItem('cw_default_win_reasons');
      const defaultLosses = localStorage.getItem('cw_default_loss_reasons');
      setDefaultWinReasons(defaultWins ? JSON.parse(defaultWins) : [
        'TP Hit', 'Manual Close', 'Trailing SL', 'Partial Close', 
        'Target Reached', 'Risk Management', 'Time-based Exit'
      ]);
      setDefaultLossReasons(defaultLosses ? JSON.parse(defaultLosses) : [
        'Against Bias', 'Entry Too Early', 'Entry Too Late', 'SL Too Tight',
        'Wrong Setup', 'Emotional Trade', 'FOMO Entry', 'News Event',
        'Missing Confirmation', 'Overtrading'
      ]);
    } catch (e) {
      // ignore
    }
  }, []);

  const addCustomWinReason = () => {
    if (!newWinReason.trim()) return;
    const reason = newWinReason.trim();
    const updated = [...customWinReasons, reason];
    setCustomWinReasons(updated);
    localStorage.setItem('cw_custom_win_reasons', JSON.stringify(updated));
    setExitReason(reason);
    setNewWinReason('');
  };

  const removeCustomWinReason = (reason: string) => {
    setConfirmDialog({
      show: true,
      message: `Delete "${reason}"?`,
      onConfirm: () => {
        const updated = customWinReasons.filter(r => r !== reason);
        setCustomWinReasons(updated);
        localStorage.setItem('cw_custom_win_reasons', JSON.stringify(updated));
        setConfirmDialog(null);
      }
    });
  };

  const addCustomLossReason = () => {
    if (!newLossReason.trim()) return;
    const reason = newLossReason.trim();
    const updated = [...customLossReasons, reason];
    setCustomLossReasons(updated);
    localStorage.setItem('cw_custom_loss_reasons', JSON.stringify(updated));
    setExitReason(reason);
    setNewLossReason('');
  };

  const removeCustomLossReason = (reason: string) => {
    setConfirmDialog({
      show: true,
      message: `Delete "${reason}"?`,
      onConfirm: () => {
        const updated = customLossReasons.filter(r => r !== reason);
        setCustomLossReasons(updated);
        localStorage.setItem('cw_custom_loss_reasons', JSON.stringify(updated));
        setConfirmDialog(null);
      }
    });
  };

  const removeDefaultWinReason = (reason: string) => {
    setConfirmDialog({
      show: true,
      message: `Delete default reason "${reason}"?`,
      onConfirm: () => {
        const updated = defaultWinReasons.filter(r => r !== reason);
        setDefaultWinReasons(updated);
        localStorage.setItem('cw_default_win_reasons', JSON.stringify(updated));
        setConfirmDialog(null);
      }
    });
  };

  const removeDefaultLossReason = (reason: string) => {
    setConfirmDialog({
      show: true,
      message: `Delete default reason "${reason}"?`,
      onConfirm: () => {
        const updated = defaultLossReasons.filter(r => r !== reason);
        setDefaultLossReasons(updated);
        localStorage.setItem('cw_default_loss_reasons', JSON.stringify(updated));
        setConfirmDialog(null);
      }
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const initialLoadDone = React.useRef(false);

  // Load existing trade data
  useEffect(() => {
    console.log('Load effect running, idParam:', idParam, 'tradeDate:', tradeDate);
    if (!idParam || initialLoadDone.current) {
      console.log('Skipping load - no idParam or already loaded');
      return;
    }
    
    try {
      const key = `cw_journal_${tradeDate}`;
      console.log('Looking for trade in:', key);
      const raw = localStorage.getItem(key);
      console.log('Raw data found:', !!raw);
      if (!raw) {
        console.log('No data in localStorage for this date');
        return;
      }
      const data = JSON.parse(raw);
      console.log('Trades in storage:', data.trades?.length);
      const found = (data.trades || []).find((t: any) => t.id === idParam);
      console.log('Found trade:', found ? 'YES' : 'NO', found?.checklist?.length, 'checklist items');
      if (!found) {
        console.log('Trade not found with id:', idParam);
        return;
      }
      
      initialLoadDone.current = true;
      setIsEditing(true);
      setEditingId(found.id);
      setTradeDate(found.date || tradeDate); // Set trade date from found trade
      setInstrument(found.instrument || '');
      setDirection(found.direction || 'long');
      // Support both snake_case (new) and legacy camelCase/short field names
      setEntryPrice(found.entry_price ?? found.entry ?? found.entryPrice ?? '');
      setSlPrice(found.sl_price ?? found.sl ?? found.slPrice ?? '');
      setTpPrice(found.tp_price ?? found.tp ?? found.tpPrice ?? '');
      setStrategy(found.strategy || '');
      
      // Load checklist - this is the key part
      if (found.checklist && found.checklist.length > 0) {
        setChecklist(found.checklist.map((c: any, i: number) => ({ 
          id: `${found.id}-c-${i}`, 
          text: c.text || c, 
          done: !!c.done 
        })));
      } else if (found.strategy) {
        // Only create default checklist if no checklist was saved but strategy exists
        const defs = [
          'Price action aligns with bias',
          'Higher timeframe support/resistance',
          'Volatility profile acceptable',
          'Risk defined (SL/TP)',
        ];
        setChecklist(defs.map((t, i) => ({ id: `${found.id}-c-${i}`, text: t, done: false })));
      }
      
      setPreNote(found.pre_trade_note ?? found.preNote ?? '');
      setPostNote(found.post_trade_note ?? found.postNote ?? '');
      setEmotionBefore(found.emotion_before ?? 5);
      setEmotionAfter(found.emotion_after ?? 5);
      setTfSmall(found.timeframe_small ?? found.timeframe ?? found.tfSmall ?? '5m');
      setTfLarge(found.timeframe_large ?? found.higher_timeframe ?? found.tfLarge ?? '1h');
      setResult(found.result || '');
      setLossReason(found.loss_reason || '');
      setExitReason(found.exit_reason || '');
      setCustomExitReason(found.custom_exit_reason || '');
      setImageBeforeSmall(found.image_before_small_tf || null);
      setImageBeforeLarge(found.image_before_large_tf || null);
      setImageAfterSmall(found.image_after_small_tf || null);
      setImageAfterLarge(found.image_after_large_tf || null);
      setMidTradeScreenshot(found.mid_trade_screenshot || null);
      setTradeRating(found.rating || 0);
      setRrr(found.planned_rrr ?? found.rrr ?? found.rMultiple ?? '');
      setRiskPct(found.risk_percent ?? found.riskPct ?? '');
      setClosedPnl(found.pnl ?? '');
      setClosedRrr(found.closed_rrr ?? found.closedRrr ?? '');
      setMaxRReached(found.max_r_reached ?? found.maxRReached ?? '');
      setIdealSlSize(found.ideal_sl_size ?? found.idealSlSize ?? '');
      setPlannedSlSize(found.planned_sl_size ?? found.plannedSlSize ?? '');
      setLearnings(found.learnings || '');
      
      // Load new Mid-Trade & Advanced fields
      setTradeDurationType(found.trade_duration_type || '');
      setMidTradeNotes(found.mid_trade_notes || '');
      setSetupChangedDuringTrade(found.setup_changed_during_trade || false);
      setSetupChangeDetails(found.setup_change_details || '');
      setSlChanged(found.sl_changed || false);
      setSlChangedValue(found.sl_changed_value ?? '');
      setTpChanged(found.tp_changed || false);
      setTpChangedValue(found.tp_changed_value ?? '');
      setTradesCount(found.trades_count ?? 0);
      setSessionQuality(found.session_quality || '');
      setConcentrationLevel(found.concentration_level ?? 5);
    } catch (e) {
      console.error('Error loading trade:', e);
    }
  }, [idParam, tradeDate]);

  // Handle strategy change - only for NEW trades, not when editing
  useEffect(() => {
    // Skip if we're editing an existing trade
    if (isEditing || idParam) return;
    
    if (!strategy) {
      setChecklist([]);
      setStrategyExitOptions([]);
      setStrategyEntryTrigger("");
      return;
    }
    
    // Load strategy from localStorage
    try {
      const strategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
      const selectedStrategy = strategies.find((s: any) => s.name === strategy);
      
      if (selectedStrategy) {
        // Load setup confirmations as checklist (support both new setupConfirmations and legacy confirmations)
        const confirmationSource = selectedStrategy.setupConfirmations || selectedStrategy.confirmations;
        if (confirmationSource && confirmationSource.length > 0) {
          const items = confirmationSource.map((text: string, i: number) => ({
            id: `${Date.now()}-${i}`,
            text,
            done: false
          }));
          setChecklist(items);
        }
        
        // Load exit options for dropdown
        if (selectedStrategy.exitOptions && selectedStrategy.exitOptions.length > 0) {
          setStrategyExitOptions(selectedStrategy.exitOptions);
        } else {
          setStrategyExitOptions([]);
        }
        
        // Load entry trigger
        if (selectedStrategy.entryTrigger) {
          setStrategyEntryTrigger(selectedStrategy.entryTrigger);
        } else {
          setStrategyEntryTrigger("");
        }
      } else {
        // Fallback to default checklist if strategy not found
        const defs = [
          'Price action aligns with bias',
          'Higher timeframe support/resistance',
          'Volatility profile acceptable',
          'Risk defined (SL/TP)',
        ];
        const items = defs.map((t, i) => ({ id: `${Date.now()}-${i}`, text: t, done: false }));
        setChecklist(items);
        setStrategyExitOptions([]);
        setStrategyEntryTrigger("");
      }
    } catch (e) {
      console.error('Error loading strategy:', e);
      // Fallback to defaults
      const defs = [
        'Price action aligns with bias',
        'Higher timeframe support/resistance',
        'Volatility profile acceptable',
        'Risk defined (SL/TP)',
      ];
      const items = defs.map((t, i) => ({ id: `${Date.now()}-${i}`, text: t, done: false }));
      setChecklist(items);
      setStrategyExitOptions([]);
      setStrategyEntryTrigger("");
    }
  }, [strategy, isEditing, idParam]);

  const handleFile = async (file?: File, target?: 'preSmall' | 'preLarge' | 'postSmall' | 'postLarge') => {
    if (!file || !target) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressImage(dataUrl);
      if (target === 'preSmall') setImageBeforeSmall(compressed);
      if (target === 'preLarge') setImageBeforeLarge(compressed);
      if (target === 'postSmall') setImageAfterSmall(compressed);
      if (target === 'postLarge') setImageAfterLarge(compressed);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>, target: 'preSmall' | 'preLarge' | 'postSmall' | 'postLarge') => {
    try {
      const items = e.clipboardData?.items;
      if (items) {
        for (const it of Array.from(items)) {
          if (it.type.includes('image')) {
            const f = it.getAsFile();
            if (f) {
              await handleFile(f, target);
              return;
            }
          }
          if (it.type === 'text/html') {
            const html = e.clipboardData.getData('text/html');
            const m = html.match(/src=['"]([^'"]+)['"]/);
            if (m) {
              const u = m[1];
              if (target === 'preSmall') setImageBeforeSmall(u);
              if (target === 'preLarge') setImageBeforeLarge(u);
              if (target === 'postSmall') setImageAfterSmall(u);
              if (target === 'postLarge') setImageAfterLarge(u);
              return;
            }
          }
        }
      }
      const txt = e.clipboardData?.getData('text');
      if (txt && (txt.startsWith('http') || txt.startsWith('data:'))) {
        if (target === 'preSmall') setImageBeforeSmall(txt);
        if (target === 'preLarge') setImageBeforeLarge(txt);
        if (target === 'postSmall') setImageAfterSmall(txt);
        if (target === 'postLarge') setImageAfterLarge(txt);
      }
    } catch (err) {
      // ignore
    }
  };

  const save = async (close = false) => {
    try {
      // Check trade limit for new trades (not edits)
      if (!editingId) {
        const tradeLimit = getTradeLimit();
        if (tradeLimit !== Infinity) {
          // Count trades this month
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          let monthTradeCount = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || '';
            if (key.startsWith('cw_journal_')) {
              const dateStr = key.replace('cw_journal_', '');
              const tradeDate = new Date(dateStr);
              if (tradeDate >= monthStart && tradeDate <= monthEnd) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const data = JSON.parse(raw);
                  monthTradeCount += (data.trades || []).length;
                }
              }
            }
          }
          
          if (monthTradeCount >= tradeLimit) {
            alert(`You've reached your monthly limit of ${tradeLimit} trades. Upgrade to Premium for unlimited trades!`);
            return;
          }
        }
      }
      
      const confirmations = checklist.filter((c) => c.done).length;
      if (minRequired > 0 && confirmations < minRequired) {
        alert(`Please confirm at least ${minRequired} items for strategy "${strategy}" before saving.`);
        return;
      }
      if (close && !result) {
        alert('Please select a result before closing the trade.');
        return;
      }

      // derive cycle info for this tradeDate from stored cycle settings
      let cycleDay: number | null = null;
      let cyclePhase: string | null = null;
      try {
        const msPerDay = 1000 * 60 * 60 * 24;
        const cycleSettings = loadCycleSettings();
        const last = cycleSettings.lastPeriodStart;
        const avg = cycleSettings.avgCycleLength;
        const per = cycleSettings.periodLength;
        if (last) {
          const d = new Date(tradeDate);
          const l = new Date(last);
          const diff = Math.floor((d.getTime() - l.getTime()) / msPerDay);
          const cd = (((diff % avg) + avg) % avg) + 1;
          cycleDay = cd;
          const follicularEnd = Math.min(per + 7, avg);
          const ovulationEnd = Math.min(per + 11, avg);
          cyclePhase = cd <= per ? 'menstruation' : cd <= follicularEnd ? 'follicular' : cd <= ovulationEnd ? 'ovulation' : 'luteal';
        }
      } catch (e) {
        // ignore
      }

      // Upload images to Supabase Storage if they exist
      let imageBeforeSmallUrl = imageBeforeSmall;
      let imageBeforeLargeUrl = imageBeforeLarge;
      let imageAfterSmallUrl = imageAfterSmall;
      const imageAfterLargeUrl = imageAfterLarge;

      // Helper to convert dataURL to File
      const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
        if (!dataUrl || !dataUrl.startsWith('data:')) return null;
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          return new File([blob], filename, { type: blob.type });
        } catch {
          return null;
        }
      };

      // Upload each image if it's a data URL (not already uploaded)
      if (imageBeforeSmall && imageBeforeSmall.startsWith('data:')) {
        const file = await dataUrlToFile(imageBeforeSmall, `before-small-${Date.now()}.jpg`);
        if (file) {
          const url = await uploadTradeImage(file, 'before' as const);
          if (url) imageBeforeSmallUrl = url;
        }
      }
      if (imageBeforeLarge && imageBeforeLarge.startsWith('data:')) {
        const file = await dataUrlToFile(imageBeforeLarge, `before-large-${Date.now()}.jpg`);
        if (file) {
          const url = await uploadTradeImage(file, 'before' as const);
          if (url) imageBeforeLargeUrl = url;
        }
      }
      if (imageAfterSmall && imageAfterSmall.startsWith('data:')) {
        const file = await dataUrlToFile(imageAfterSmall, `after-small-${Date.now()}.jpg`);
        if (file) {
          const url = await uploadTradeImage(file, 'after' as const);
          if (url) imageAfterSmallUrl = url;
        }
      }
      // Upload mid-trade image if it exists
      let midTradeImageUrl = midTradeScreenshot;
      if (midTradeScreenshot && midTradeScreenshot.startsWith('data:')) {
        const file = await dataUrlToFile(midTradeScreenshot, `mid-trade-${Date.now()}.jpg`);
        if (file) {
          const url = await uploadTradeImage(file, 'before' as const);
          if (url) midTradeImageUrl = url;
        }
      }

      const tradeData: TradeInsert = {
        date: tradeDate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        instrument: instrument || 'Unknown',
        direction,
        entry_price: entryPrice === '' ? null : Number(entryPrice),
        sl_price: slPrice === '' ? null : Number(slPrice),
        tp_price: tpPrice === '' ? null : Number(tpPrice),
        strategy: quick ? null : strategy || null,
        checklist: checklist.map((c) => ({ text: c.text, done: c.done })),
        pre_trade_note: preNote,
        post_trade_note: postNote,
        image_before_small_tf: imageBeforeSmallUrl || null,
        image_before_large_tf: imageBeforeLargeUrl || null,
        image_after_small_tf: imageAfterSmallUrl || null,
        image_after_large_tf: imageAfterLargeUrl || null,
        emotion_before: emotionBefore,
        emotion_after: emotionAfter,
        timeframe_small: tfSmall,
        timeframe_large: tfLarge,
        result: result || (close ? 'breakeven' : ''), // Default to breakeven for closed trades without result
        loss_reason: result === 'loss' ? lossReason : null,
        exit_reason: exitReason || null,
        custom_exit_reason: exitReason === 'other' ? customExitReason : null,
        pnl: closedPnl === '' ? null : Number(closedPnl),
        planned_rrr: rrr === '' ? null : Number(rrr),
        risk_percent: riskPct === '' ? null : Number(riskPct),
        closed_rrr: closedRrr === '' ? null : Number(closedRrr),
        max_r_reached: maxRReached === '' ? null : Number(maxRReached),
        ideal_sl_size: idealSlSize === '' ? null : Number(idealSlSize),
        planned_sl_size: plannedSlSize === '' ? null : Number(plannedSlSize),
        // Note: r_multiple is for localStorage only, Supabase uses closed_rrr
        learnings: learnings || null,
        rating: tradeRating || null,
        status: (close ? 'closed' : result ? 'closed' : 'open') as 'open' | 'closed',
        cycle_day: cycleDay,
        cycle_phase: cyclePhase,
      };

      // Check if trade is being closed - if so, show review modal
      const isClosing = tradeData.status === 'closed';
      
      if (isClosing) {
        // Store trade data and show review modal
        setPendingTradeData(tradeData);
        setPendingTradeId(editingId);
        setPendingIsEdit(!!editingId);
        setShowTradeReview(true);
        return; // Don't save yet - wait for review completion
      }

      // If not closing, save immediately (open trade)
      if (editingId) {
        await updateTrade(editingId, tradeData);
      } else {
        await saveTrade(tradeData);
      }

      // Note: localStorage caching is handled automatically by saveTrade() via syncManager
      // This ensures offline-first functionality without redundant writes
      
      navigate('/journal');
    } catch (e: any) {
      console.error('Save error:', e);
      alert(`Failed to save trade: ${e.message || 'Unknown error'}`);
    }
  };

  // Handle trade review completion (NEW)
  const handleTradeReviewComplete = async (reviewData: TradeExecutionReview) => {
    if (!pendingTradeData) return;

    try {
      // Merge review data with trade data
      const finalTradeData: TradeInsert = {
        ...pendingTradeData,
        ...reviewData,
      };

      // Save the trade with execution quality data
      if (pendingIsEdit && pendingTradeId) {
        await updateTrade(pendingTradeId, finalTradeData);
      } else {
        await saveTrade(finalTradeData);
      }

      // Reset pending state
      setPendingTradeData(null);
      setPendingTradeId(null);
      setPendingIsEdit(false);

      navigate('/journal');
    } catch (e: any) {
      console.error('Save error after review:', e);
      alert(`Failed to save trade: ${e.message || 'Unknown error'}`);
    }
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
            <div className="space-y-1">
              <div className="flex items-baseline gap-5">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
                  {idParam ? 'Edit Trade' : 'New Trade'}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {idParam ? 'Update your trade details, notes and results' : 'Document your trade preparation and results'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={() => save(false)} className="rounded-full px-4 py-2 text-sm bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-soft">
                {idParam ? 'Update Trade' : 'Save Trade'}
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full px-3 py-2 text-sm">Cancel</Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Date Selector - Prominent placement */}
            <div className="mb-6 p-4 rounded-2xl border bg-muted/20 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <span className="text-xl">📅</span>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block">Trade Date</label>
                    <p className="text-xs text-muted-foreground">Wähle das Datum für diesen Trade</p>
                  </div>
                </div>
                <Input
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  max={localDateStr()}
                  className="w-auto text-base font-medium"
                />
              </div>
            </div>

            <div className="my-5 flex gap-3 justify-center flex-wrap">
              <button type="button" className={`rounded-full px-4 py-2 text-sm font-medium shadow-soft ${viewMode === 'before' ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground' : 'bg-muted/10 text-muted-foreground'}`} onClick={() => setViewMode('before')}>Before Trade</button>
              <button type="button" className={`rounded-full px-4 py-2 text-sm font-medium shadow-soft ${viewMode === 'during' ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground' : 'bg-muted/10 text-muted-foreground'}`} onClick={() => setViewMode('during')}>During Trade</button>
              <button type="button" className={`rounded-full px-4 py-2 text-sm font-medium shadow-soft ${viewMode === 'after' ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground' : 'bg-muted/10 text-muted-foreground'}`} onClick={() => setViewMode('after')}>After Trade</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                {viewMode === 'before' ? (
                  <>
                    <section className="rounded-2xl border p-4 bg-card shadow-soft">
                      <h4 className="font-serif text-xl font-semibold text-foreground">Strategy</h4>

                      <div className="mt-3 grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setDirection('long')} className={`flex-1 rounded-full py-2 text-sm font-medium ${direction === 'long' ? 'bg-accent/30 text-accent-foreground' : 'bg-muted/10 text-muted-foreground'}`}>
                              Long
                            </button>
                            <button type="button" onClick={() => setDirection('short')} className={`flex-1 rounded-full py-2 text-sm font-medium ${direction === 'short' ? 'bg-destructive/10 text-destructive' : 'bg-muted/10 text-muted-foreground'}`}>
                              Short
                            </button>
                          </div>
                          <Input value={instrument} onChange={(e) => setInstrument(e.target.value)} placeholder="Instrument (e.g. EUR/USD)" />
                        </div>

                        <Select onValueChange={(v) => setStrategy(v === '__none' ? '' : v)} disabled={!hasFeature('unlimited_strategies')}>
                          <SelectTrigger>
                            <SelectValue placeholder={strategy || 'Choose strategy'} />
                            {!hasFeature('unlimited_strategies') && <Badge className="ml-2" variant="secondary">Premium</Badge>}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Quick Trade (no strategy)</SelectItem>
                            {strategies.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!hasFeature('unlimited_strategies') && (
                          <p className="text-xs text-muted-foreground">
                            Upgrade to Premium to use strategy tracking. <button type="button" className="underline" onClick={() => navigate('/#pricing')}>Learn more</button>
                          </p>
                        )}

                        {strategy && <div className="text-sm text-muted-foreground">Min confirmations required: <strong>{minRequired}</strong></div>}

                        {/* Session Timing - For AI Insights */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Trading Session</label>
                          <Select onValueChange={(v) => setSessionTime(v as any)}>
                            <SelectTrigger>
                              <SelectValue placeholder={sessionTime} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="london">🇬🇧 London (08:00-17:00 UTC)</SelectItem>
                              <SelectItem value="newyork">🇺🇸 New York (13:00-22:00 UTC)</SelectItem>
                              <SelectItem value="asia">🌏 Asia (23:00-08:00 UTC)</SelectItem>
                              <SelectItem value="other">🔄 Other/Overlap</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">Helps AI track session timing patterns</p>
                        </div>

                        {/* Emotional State - For AI Insights */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Your Emotional State</label>
                          <Select onValueChange={(v) => setEmotionalStateTrading(v as any)}>
                            <SelectTrigger>
                              <SelectValue placeholder={emotionalStateTrading} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="anxious">😰 Anxious - High stress, fear-based</SelectItem>
                              <SelectItem value="calm">😌 Calm - Focused, confident</SelectItem>
                              <SelectItem value="neutral">😐 Neutral - Detached, mechanical</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">AI tracks emotional impact on trades</p>
                        </div>
                      </div>
                    </section>

                    {strategy && (
                      <section className="rounded-2xl border p-4 bg-card shadow-soft">
                        <h4 className="font-serif text-xl font-semibold text-foreground">Confirmations</h4>
                        <div className="mt-3 text-xs text-muted-foreground mb-2">Mark the confirmations you observed before entering.</div>
                        
                        {/* Entry Trigger Reminder */}
                        {strategyEntryTrigger && (
                          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-start gap-2">
                              <span className="text-base">💡</span>
                              <div>
                                <p className="text-xs font-semibold text-primary mb-0.5">Entry Trigger:</p>
                                <p className="text-sm text-foreground">{strategyEntryTrigger}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {checklist.map((c, idx) => (
                            <label key={c.id} className="flex items-start gap-3">
                              <Checkbox checked={c.done} onCheckedChange={(v) => {
                                const copy = [...checklist];
                                copy[idx] = { ...copy[idx], done: Boolean(v) };
                                setChecklist(copy);
                              }} />
                              <span className="text-sm text-muted-foreground">{c.text}</span>
                            </label>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border p-4 bg-card shadow-soft flex-1 flex flex-col">
                      <h4 className="font-serif text-xl font-semibold text-foreground">Risk</h4>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            Plan SL
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">PLAN</span>
                          </label>
                          <Input 
                            type="number" 
                            step="0.1"
                            value={plannedSlSize as any} 
                            onChange={(e) => setPlannedSlSize(e.target.value === '' ? '' : Number(e.target.value))} 
                            placeholder="e.g., 15" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Risk %</label>
                          <div className="relative">
                            <Input type="number" value={riskPct as any} onChange={(e) => setRiskPct(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter Risk" />
                            {riskPct !== '' && <span className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            Target RRR 
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">PLAN</span>
                          </label>
                          <Input 
                            type="number" 
                            step="0.1"
                            value={rrr as any} 
                            onChange={(e) => setRrr(e.target.value === '' ? '' : Number(e.target.value))} 
                            placeholder="2.0" 
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-sm">Notes</label>
                        <Textarea value={preNote} onChange={(e) => setPreNote(e.target.value)} className="min-h-[100px]" />
                      </div>
                    </section>
                  </>
                ) : viewMode === 'during' ? (
                  <>
                    <section className="rounded-2xl border p-4 bg-card shadow-soft">
                      <h4 className="font-serif text-xl font-semibold text-foreground">Mid-Trade Tracking</h4>
                      <p className="text-sm text-muted-foreground mt-1">Document what happens while the trade is active</p>

                      <div className="mt-4 grid gap-4">
                        {/* Mental State & Focus */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Session Quality 🧠</label>
                            <Select onValueChange={(v) => setSessionQuality(v as any)} value={sessionQuality}>
                              <SelectTrigger>
                                <SelectValue placeholder="How's your focus?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sharp">🔥 Sharp - Best focus</SelectItem>
                                <SelectItem value="focused">Focused - Good</SelectItem>
                                <SelectItem value="declining">⚠️ Declining - Getting tired</SelectItem>
                                <SelectItem value="exhausted">😴 Exhausted - Shutting down</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Concentration Level (1-10)</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={concentrationLevel}
                                onChange={(e) => setConcentrationLevel(Number(e.target.value))}
                                className="flex-1"
                              />
                              <span className="text-sm font-semibold min-w-[2rem]">{concentrationLevel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Overtrading Detection */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Total Trades This Session</label>
                          <Input 
                            type="number" 
                            min="0"
                            value={tradesCount}
                            onChange={(e) => setTradesCount(Number(e.target.value) || 0)}
                            placeholder="How many trades have you done today?"
                          />
                          <p className="text-xs text-muted-foreground mt-1">⚠️ Alert: 5+ trades/day may indicate overtrading</p>
                        </div>

                        {/* Trade Duration */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Trade Duration Type ⏱️</label>
                          <Select onValueChange={(v) => setTradeDurationType(v as any)} value={tradeDurationType}>
                            <SelectTrigger>
                              <SelectValue placeholder="How long is this trade?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scalp">🏃 Scalp (Less than 5 min)</SelectItem>
                              <SelectItem value="shortterm">⚡ Short-term (5-30 min)</SelectItem>
                              <SelectItem value="swing">Swing (More than 30 min)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Setup Changes - Revenge Trading Detection */}
                        <div className="border-t pt-3">
                          <label className="text-xs text-muted-foreground mb-2 block">🔄 Setup Changes During Trade</label>
                          <div className="flex items-center gap-2 mb-3">
                            <Checkbox 
                              checked={setupChangedDurningTrade}
                              onCheckedChange={(checked) => setSetupChangedDuringTrade(!!checked)}
                              id="setup-changed"
                            />
                            <label htmlFor="setup-changed" className="text-sm">Did you modify your original setup?</label>
                          </div>

                          {setupChangedDurningTrade && (
                            <Textarea 
                              value={setupChangeDetails}
                              onChange={(e) => setSetupChangeDetails(e.target.value)}
                              placeholder="E.g., 'Moved SL from 1.0940 to 1.0935', 'Extended TP by 50 pips', 'Exited early due to news'"
                              className="text-sm mb-3"
                            />
                          )}

                          {/* Specific SL/TP Changes */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={slChanged}
                                onCheckedChange={(checked) => setSlChanged(!!checked)}
                                id="sl-changed"
                              />
                              <label htmlFor="sl-changed" className="text-sm">SL Modified</label>
                            </div>
                            {slChanged && (
                              <Input 
                                type="number"
                                step="0.0001"
                                value={slChangedValue}
                                onChange={(e) => setSlChangedValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="New SL value"
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={tpChanged}
                                onCheckedChange={(checked) => setTpChanged(!!checked)}
                                id="tp-changed"
                              />
                              <label htmlFor="tp-changed" className="text-sm">TP Modified</label>
                            </div>
                            {tpChanged && (
                              <Input 
                                type="number"
                                step="0.0001"
                                value={tpChangedValue}
                                onChange={(e) => setTpChangedValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="New TP value"
                              />
                            )}
                          </div>
                        </div>

                        {/* Mid-Trade Notes & Screenshot */}
                        <div className="border-t pt-3">
                          <label className="text-xs text-muted-foreground mb-1.5 block">Thoughts & Emotions</label>
                          <Textarea 
                            value={midTradeNotes}
                            onChange={(e) => setMidTradeNotes(e.target.value)}
                            placeholder="What are you feeling? Anxious? Confident? Any doubts about the trade?"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Screenshot During Trade 📸</label>
                          <div className="rounded-lg border-2 border-dashed p-4 text-center bg-muted/20 cursor-pointer hover:bg-muted/30">
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file, 'postSmall');
                              }}
                              className="hidden"
                              id="mid-file"
                            />
                            <label htmlFor="mid-file" className="cursor-pointer block">
                              {midTradeScreenshot ? 'Screenshot added' : 'Click or paste screenshot'}
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="rounded-2xl border p-4 bg-card shadow-soft flex-1 flex flex-col">
                      <h4 className="font-serif text-xl font-semibold text-foreground">Execution</h4>
                      <div className="mt-3 grid gap-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setResult('win')} className={`flex-1 rounded-md py-2 text-sm font-medium ${result === 'win' ? 'bg-accent/30 text-accent-foreground' : 'bg-muted/10 text-muted-foreground'}`}>Win</button>
                          <button type="button" onClick={() => setResult('breakeven')} className={`flex-1 rounded-md py-2 text-sm font-medium ${result === 'breakeven' ? 'bg-muted/30 text-muted-foreground' : 'bg-muted/10 text-muted-foreground'}`}>Breakeven</button>
                          <button type="button" onClick={() => setResult('loss')} className={`flex-1 rounded-md py-2 text-sm font-medium ${result === 'loss' ? 'bg-destructive/10 text-destructive' : 'bg-muted/10 text-muted-foreground'}`}>Loss</button>
                        </div>

                        {result === 'win' && (
                          <>
                            <div className="mt-3">
                              <label className="text-xs text-muted-foreground mb-1.5 block">Exit Reason</label>
                              <Select onValueChange={(v) => setExitReason(v)} value={exitReason}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select exit reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Show strategy exit options first if available */}
                                  {strategyExitOptions.length > 0 && (
                                    <>
                                      {strategyExitOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="_separator_" disabled className="text-xs text-muted-foreground">
                                        ──────────────
                                      </SelectItem>
                                    </>
                                  )}
                                  {/* Then show default reasons */}
                                  {defaultWinReasons.map((reason) => (
                                    <SelectItem key={reason} value={reason} className="relative">
                                      <span className="block truncate pr-10">{reason}</span>
                                      <button
                                        type="button"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeDefaultWinReason(reason);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive text-lg"
                                        title="Delete"
                                      >
                                        ×
                                      </button>
                                    </SelectItem>
                                  ))}
                                  {customWinReasons.map((reason) => (
                                    <SelectItem key={reason} value={reason} className="relative">
                                      <span className="block truncate pr-10">{reason}</span>
                                      <button
                                        type="button"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeCustomWinReason(reason);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive text-lg"
                                        title="Delete"
                                      >
                                        ×
                                      </button>
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Custom)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {exitReason === 'other' && (
                              <div className="mt-3">
                                <label className="text-xs text-muted-foreground mb-1.5 block">Add Custom Win Reason</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newWinReason}
                                    onChange={(e) => setNewWinReason(e.target.value)}
                                    placeholder="Enter new reason"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomWinReason()}
                                  />
                                  <Button onClick={addCustomWinReason} type="button" className="px-3 whitespace-nowrap">
                                    Add
                                  </Button>
                                </div>
                              </div>
                            )}

                            {exitReason === 'other' && (
                              <div className="mt-3">
                                <Input 
                                  value={customExitReason} 
                                  onChange={(e) => setCustomExitReason(e.target.value)} 
                                  placeholder="Specify custom exit reason" 
                                />
                              </div>
                            )}
                          </>
                        )}

                        {result === 'loss' && (
                          <>
                            <div className="mt-3">
                              <label className="text-xs text-muted-foreground mb-1.5 block">SL Reason</label>
                              <Select onValueChange={(v) => setExitReason(v)} value={exitReason}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select SL reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Show strategy exit options first if available */}
                                  {strategyExitOptions.length > 0 && (
                                    <>
                                      {strategyExitOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="_separator_" disabled className="text-xs text-muted-foreground">
                                        ──────────────
                                      </SelectItem>
                                    </>
                                  )}
                                  {/* Then show default loss reasons */}
                                  {defaultLossReasons.map((reason) => (
                                    <SelectItem key={reason} value={reason} className="relative">
                                      <span className="block truncate pr-10">{reason}</span>
                                      <button
                                        type="button"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeDefaultLossReason(reason);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive text-lg"
                                        title="Delete"
                                      >
                                        ×
                                      </button>
                                    </SelectItem>
                                  ))}
                                  {customLossReasons.map((reason) => (
                                    <SelectItem key={reason} value={reason} className="relative">
                                      <span className="block truncate pr-10">{reason}</span>
                                      <button
                                        type="button"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeCustomLossReason(reason);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive text-lg"
                                        title="Delete"
                                      >
                                        ×
                                      </button>
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Custom)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {exitReason === 'other' && (
                              <div className="mt-3">
                                <label className="text-xs text-muted-foreground mb-1.5 block">Add Custom Loss Reason</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newLossReason}
                                    onChange={(e) => setNewLossReason(e.target.value)}
                                    placeholder="Enter new reason"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomLossReason()}
                                  />
                                  <Button onClick={addCustomLossReason} type="button" className="px-3 whitespace-nowrap">
                                    Add
                                  </Button>
                                </div>
                              </div>
                            )}

                            {exitReason === 'other' && (
                              <div className="mt-3">
                                <Input 
                                  value={customExitReason} 
                                  onChange={(e) => setCustomExitReason(e.target.value)} 
                                  placeholder="Specify custom SL reason" 
                                />
                              </div>
                            )}

                            {/* Ideal SL Size input when SL was too tight */}
                            {(exitReason === 'SL Too Tight' || exitReason?.toLowerCase().includes('sl') && exitReason?.toLowerCase().includes('klein')) && (
                              <div className="mt-3">
                                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                                  Ideal SL Size (pips/points)
                                  <div className="group relative">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    <div className="invisible group-hover:visible absolute left-0 top-5 z-50 w-72 rounded-lg bg-popover p-3 text-xs text-popover-foreground shadow-lg border border-border">
                                      <p className="font-semibold mb-1">Find Your Perfect SL Size</p>
                                      <p className="text-muted-foreground leading-relaxed">
                                        What SL size would have worked for this trade? This data helps you discover your optimal stop loss distance over time.
                                      </p>
                                      <p className="text-muted-foreground mt-2">
                                        <span className="font-medium">Example:</span> Your SL was 10 pips but needed 15 pips → enter 15
                                      </p>
                                    </div>
                                  </div>
                                </label>
                                <Input 
                                  type="number"
                                  step="0.1"
                                  value={idealSlSize as any} 
                                  onChange={(e) => setIdealSlSize(e.target.value === '' ? '' : Number(e.target.value))} 
                                  placeholder="e.g., 15 - Enter the SL size that would have worked" 
                                />
                                <p className="text-[10px] text-muted-foreground mt-1.5">
                                  💡 Track this to find your personal optimal SL size in Statistics → SL Analysis
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">PnL (closed)</label>
                            <Input type="number" value={closedPnl as any} onChange={(e) => setClosedPnl(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter PnL" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">RR (closed)</label>
                            <Input type="number" value={closedRrr as any} onChange={(e) => setClosedRrr(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter RR" />
                          </div>
                        </div>

                        {/* Max Possible RRR - for RRR Optimization */}
                        <div className="mt-3">
                          <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                            Max Possible RRR
                            <span className="text-[10px] bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full font-semibold">ACTUAL MAX</span>
                            <div className="group relative">
                              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                              <div className="invisible group-hover:visible absolute left-0 top-5 z-50 w-72 rounded-lg bg-popover p-3 text-xs text-popover-foreground shadow-lg border border-border">
                                <p className="font-semibold mb-1">Track Maximum Profit Potential</p>
                                <p className="text-muted-foreground leading-relaxed">
                                  How far could this trade have gone? Enter the highest RRR this trade reached before reversing or closing. 
                                  This helps you understand if you're exiting too early (conservative) or setting targets too high (aggressive).
                                </p>
                                <p className="text-muted-foreground mt-2">
                                  <span className="font-medium">Example:</span> Target was 2R, but price went to 3.5R before reversing → enter 3.5
                                </p>
                              </div>
                            </div>
                          </label>
                          <Input 
                            type="number" 
                            step="0.1"
                            value={maxRReached as any} 
                            onChange={(e) => setMaxRReached(e.target.value === '' ? '' : Number(e.target.value))} 
                            placeholder="e.g., 3.5 - Track the maximum RRR this trade could've reached" 
                          />
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            💡 Compare this to your <span className="font-semibold">Target RRR</span> above to optimize your exits in Statistics → RRR Analysis
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="text-sm">Learnings / Improvements</label>
                          <Textarea value={learnings} onChange={(e) => setLearnings(e.target.value)} className="min-h-[120px]" placeholder="What would you do differently next time?" />
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border p-4 bg-card shadow-soft">
                      <h4 className="font-serif text-xl font-semibold text-foreground">Trade Rating</h4>
                      <div className="mt-3 text-xs text-muted-foreground mb-3">How would you rate this trade overall?</div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTradeRating(star)}
                            className="text-3xl transition-all hover:scale-110 focus:outline-none"
                            style={{ color: star <= tradeRating ? '#fbbf24' : '#d1d5db' }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {tradeRating > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Rating: {tradeRating} / 5
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                {viewMode === 'before' ? (
                  <>
                      <div className="rounded-2xl border p-6 bg-card shadow-soft flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <label className="text-sm font-medium text-foreground">{getScreenshotLimit() > 2 ? 'Before Screenshot — Small TF (Entry)' : 'Before Screenshot'}</label>
                          <div className="w-32">
                            <Select onValueChange={(v) => setTfSmall(v)}>
                              <SelectTrigger>
                                <SelectValue placeholder={tfSmall} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1m">1m</SelectItem>
                                <SelectItem value="5m">5m</SelectItem>
                                <SelectItem value="15m">15m</SelectItem>
                                <SelectItem value="1h">1h</SelectItem>
                                <SelectItem value="4h">4h</SelectItem>
                                <SelectItem value="1D">1D</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {!imageBeforeSmall ? (
                          <div className="rounded-lg border-dashed border-2 border-border/30 p-8 text-center text-sm text-muted-foreground bg-muted/5 min-h-[160px] flex items-center justify-center">Click to upload or paste<br/>PNG, JPG up to 10MB</div>
                        ) : (
                          <div className="relative">
                            <img 
                              src={imageBeforeSmall} 
                              alt="pre-small" 
                              className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => setPreviewImage(imageBeforeSmall)}
                            />
                            <button type="button" aria-label="Remove" onClick={() => setImageBeforeSmall(null)} className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow">×</button>
                          </div>
                        )}
                        {!imageBeforeSmall && (
                          <div className="mt-2 grid gap-2">
                            <div className="flex gap-2">
                              <Input className="flex-1 min-w-0" placeholder="Paste chart image URL" value={preSmallUrl} onChange={(e) => setPreSmallUrl(e.target.value)} />
                              <Button onClick={() => { if (preSmallUrl) setImageBeforeSmall(preSmallUrl); }} className="px-3 whitespace-nowrap">Use</Button>
                            </div>
                            <div>
                              <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted/50 transition-colors">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], 'preSmall')} />
                                Choose File
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {getScreenshotLimit() > 2 && (
                      <div className="rounded-2xl border p-6 bg-card shadow-soft flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <label className="text-sm font-medium text-foreground">Before Screenshot — Large TF (Context)</label>
                        <div className="w-32">
                          <Select onValueChange={(v) => setTfLarge(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={tfLarge} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1m">1m</SelectItem>
                              <SelectItem value="5m">5m</SelectItem>
                              <SelectItem value="15m">15m</SelectItem>
                              <SelectItem value="1h">1h</SelectItem>
                              <SelectItem value="4h">4h</SelectItem>
                              <SelectItem value="1D">1D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!imageBeforeLarge ? (
                        <div className="rounded-lg border-dashed border-2 border-border/30 p-8 text-center text-sm text-muted-foreground bg-muted/5 min-h-[160px] flex items-center justify-center">Click to upload or paste<br/>PNG, JPG up to 10MB</div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={imageBeforeLarge} 
                            alt="pre-large" 
                            className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setPreviewImage(imageBeforeLarge)}
                          />
                          <button type="button" aria-label="Remove" onClick={() => setImageBeforeLarge(null)} className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow">×</button>
                        </div>
                      )}
                      {!imageBeforeLarge && (
                        <div className="mt-2 grid gap-2">
                          <div className="flex gap-2">
                            <Input className="flex-1 min-w-0" placeholder="Paste chart image URL" value={preLargeUrl} onChange={(e) => setPreLargeUrl(e.target.value)} />
                            <Button onClick={() => { if (preLargeUrl) setImageBeforeLarge(preLargeUrl); }} className="px-3 whitespace-nowrap">Use</Button>
                          </div>
                          <div>
                            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted/50 transition-colors">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], 'preLarge')} />
                              Choose File
                            </label>
                          </div>
                        </div>
                      )}
                      </div>
                      )}
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border p-6 bg-card shadow-soft flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <label className="text-sm font-medium text-foreground">{getScreenshotLimit() > 2 ? 'After Screenshot — Small TF (Result)' : 'After Screenshot'}</label>
                        <div className="w-32">
                          <Select onValueChange={(v) => setTfSmall(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={tfSmall} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1m">1m</SelectItem>
                              <SelectItem value="5m">5m</SelectItem>
                              <SelectItem value="15m">15m</SelectItem>
                              <SelectItem value="1h">1h</SelectItem>
                              <SelectItem value="4h">4h</SelectItem>
                              <SelectItem value="1D">1D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!imageAfterSmall ? (
                        <div className="rounded-lg border-dashed border-2 border-border/30 p-8 text-center text-sm text-muted-foreground bg-muted/5 min-h-[160px] flex items-center justify-center">Click to upload or paste<br/>PNG, JPG up to 10MB</div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={imageAfterSmall} 
                            alt="after-small" 
                            className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setPreviewImage(imageAfterSmall)}
                          />
                          <button type="button" aria-label="Remove" onClick={() => setImageAfterSmall(null)} className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow">×</button>
                        </div>
                      )}
                      {!imageAfterSmall && (
                        <div className="mt-2 grid gap-2">
                          <div className="flex gap-2">
                            <Input className="flex-1 min-w-0" placeholder="Paste chart image URL" value={postSmallUrl} onChange={(e) => setPostSmallUrl(e.target.value)} />
                            <Button onClick={() => { if (postSmallUrl) setImageAfterSmall(postSmallUrl); }} className="px-3 whitespace-nowrap">Use</Button>
                          </div>
                          <div>
                            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted/50 transition-colors">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], 'postSmall')} />
                              Choose File
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {getScreenshotLimit() > 2 && (
                    <div className="rounded-2xl border p-6 bg-card shadow-soft flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <label className="text-sm font-medium text-foreground">After Screenshot — Large TF (Context)</label>
                        <div className="w-32">
                          <Select onValueChange={(v) => setTfLarge(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={tfLarge} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1m">1m</SelectItem>
                              <SelectItem value="5m">5m</SelectItem>
                              <SelectItem value="15m">15m</SelectItem>
                              <SelectItem value="1h">1h</SelectItem>
                              <SelectItem value="4h">4h</SelectItem>
                              <SelectItem value="1D">1D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!imageAfterLarge ? (
                        <div className="rounded-lg border-dashed border-2 border-border/30 p-8 text-center text-sm text-muted-foreground bg-muted/5 min-h-[160px] flex items-center justify-center">Click to upload or paste<br/>PNG, JPG up to 10MB</div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={imageAfterLarge} 
                            alt="after-large" 
                            className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setPreviewImage(imageAfterLarge)}
                          />
                          <button type="button" aria-label="Remove" onClick={() => setImageAfterLarge(null)} className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold shadow">×</button>
                        </div>
                      )}
                      {!imageAfterLarge && (
                        <div className="mt-2 grid gap-2">
                          <div className="flex gap-2">
                            <Input className="flex-1 min-w-0" placeholder="Paste chart image URL" value={postLargeUrl} onChange={(e) => setPostLargeUrl(e.target.value)} />
                            <Button onClick={() => { if (postLargeUrl) setImageAfterLarge(postLargeUrl); }} className="px-3 whitespace-nowrap">Use</Button>
                          </div>
                          <div>
                            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted/50 transition-colors">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], 'postLarge')} />
                              Choose File
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </>
                )}
              </div>
            </div>
            </CardContent>
        </Card>
      </div>

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              type="button" 
              onClick={() => setPreviewImage(null)} 
              className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg font-bold shadow-lg hover:bg-white transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {confirmDialog?.show && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
          onClick={() => setConfirmDialog(null)}
        >
          <div 
            className="bg-card rounded-2xl shadow-2xl border max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif font-semibold text-foreground mb-3">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setConfirmDialog(null)}
                className="rounded-full px-4"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDialog.onConfirm}
                className="rounded-full px-4 bg-gradient-to-r from-destructive to-destructive/70 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/60"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Review Modal - NEW */}
      {pendingTradeData && (
        <TradeReviewModal
          open={showTradeReview}
          onOpenChange={setShowTradeReview}
          onComplete={handleTradeReviewComplete}
          tradeData={{
            id: pendingTradeId || 'new',
            symbol: pendingTradeData.instrument,
            result: pendingTradeData.result as 'win' | 'loss' | 'breakeven',
            profitLoss: pendingTradeData.pnl || 0,
            strategy: pendingTradeData.strategy || undefined,
          }}
          strategyExitCriteria={
            pendingTradeData.strategy 
              ? (() => {
                  try {
                    const strategies = JSON.parse(localStorage.getItem('cw_strategies') || '[]');
                    const strategy = strategies.find((s: any) => s.name === pendingTradeData.strategy);
                    return strategy?.exitCriteria || [];
                  } catch {
                    return [];
                  }
                })()
              : []
          }
        />
      )}
    </main>
  );
}
