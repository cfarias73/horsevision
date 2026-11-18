import React, { useCallback, useEffect, useState } from 'react';
import NativeShell from './components/NativeShell';
import UploadView from './components/UploadView';
import AnalysisView from './components/AnalysisView';
import ReportView from './components/ReportView';
import HorsesView from './components/HorsesView';
import HorseModal from './components/HorseModal';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import SplashScreen from './components/SplashScreen';
import CameraRecorderModal from './components/CameraRecorderModal';
import OnboardingFlow from './components/OnboardingFlow';
import PWAInstallModal from './components/PWAInstallModal';
import AuthModal from './components/AuthModal';
import AuthScreen from './components/AuthScreen';
import VetAdvisorView from './components/VetAdvisorView';
import { supabase } from './lib/supabaseClient';
import { Video, Activity } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-[22px] card-3d flex flex-col items-center gap-3 text-center my-4 shadow-lg">
          <p className="font-mono text-[13px] font-bold text-red-600 dark:text-red-400">
            Aviso de renderizado en la vista
          </p>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="card-3d-racing-green py-2.5 px-4 rounded-xl text-white font-mono text-[12px] font-bold shadow-md active:scale-95 transition"
          >
            Volver a Home / Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PIPELINE_STEPS = [
  '1/4 · RHDA Quality Gate (YOLOv8 + Vista Lateral 90°)...',
  '2/4 · DeepLabCut SuperAnimal-Quadruped + Savitzky-Golay...',
  '3/4 · Cinemática DLC_Horse (Ángulos, Stance/Swing ms, Zancada)...',
  '4/4 · Motor ElectrifAi (Head Nod, Pelvic Hike/Drop, Índice SI %)...',
];

const PLAN_LIMITS = {
  '1-horse': 1,
  '3-horses': 5,
  '5-horses': 5,
  '50-horses': 50,
};

const DEFAULT_HORSES = [];

const SESSIONS_DATA = {
  'SES-9481': {
    horseName: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '17 Nov 2024 · 10:30',
    globalScore: 88,
    status: 'optimal',
    badgeLabel: 'Simétrico',
    badgeColor: '#10B981',
    affectedLimb: '',
    anteriorSiPct: 98,
    posteriorSiPct: 94,
    strideNormalized: 1.42,
    strideM: 2.38,
    cadenceSpm: 84,
    backRomDeg: 4.4,
    foreImpactAsymMm: 2.1,
    forePushoffAsymMm: 1.9,
    hindImpactAsymMm: 3.2,
    hindPushoffAsymMm: 2.8,
    findingsTitle: 'Simetría Óptima',
    findingsDesc: 'Simetría bilateral dentro de rangos normales (<6mm). Apoyo equilibrado.',
    preset: 'symmetric',
  },
  'SES-8820': {
    horseName: 'Tornado',
    breed: 'Warmblood Holandés (KWPN)',
    discipline: 'Doma Clásica',
    date: '02 Nov 2024 · 16:15',
    globalScore: 74,
    status: 'mild',
    badgeLabel: 'Asimetría Leve',
    badgeColor: '#F59E0B',
    affectedLimb: 'Posterior Izquierdo (LH)',
    anteriorSiPct: 92,
    posteriorSiPct: 74,
    strideNormalized: 1.35,
    strideM: 2.15,
    cadenceSpm: 80,
    backRomDeg: 3.6,
    foreImpactAsymMm: 3.8,
    forePushoffAsymMm: 2.4,
    hindImpactAsymMm: 12.4,
    hindPushoffAsymMm: 9.8,
    findingsTitle: 'Asimetría de Despegue (LH)',
    findingsDesc: 'Asimetría moderada de empuje en miembro posterior izquierdo (LH). Hiperextensión compensatoria en corvejón derecho.',
    preset: 'asymmetry',
  },
  'SES-7612': {
    horseName: 'Eclipse',
    breed: 'Pura Sangre (PSI)',
    discipline: 'Carrera',
    date: '18 Oct 2024 · 09:40',
    globalScore: 92,
    status: 'optimal',
    badgeLabel: 'Excelente',
    badgeColor: '#10B981',
    affectedLimb: '',
    anteriorSiPct: 99,
    posteriorSiPct: 98,
    strideNormalized: 1.58,
    strideM: 2.55,
    cadenceSpm: 90,
    backRomDeg: 4.8,
    foreImpactAsymMm: 1.2,
    forePushoffAsymMm: 1.1,
    hindImpactAsymMm: 1.8,
    hindPushoffAsymMm: 1.5,
    findingsTitle: 'Alta Eficiencia Cinemática',
    findingsDesc: 'Cinemática óptima con balance simétrico de propulsión y excelente rango de flexión lumbosacra.',
    preset: 'symmetric',
  },
  'SES-6940': {
    horseName: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '28 Sep 2024 · 11:00',
    globalScore: 82,
    status: 'optimal',
    badgeLabel: 'Simétrico',
    badgeColor: '#10B981',
    affectedLimb: 'Mano Derecha (RF)',
    anteriorSiPct: 94,
    posteriorSiPct: 92,
    strideNormalized: 1.38,
    strideM: 2.28,
    cadenceSpm: 82,
    backRomDeg: 4.1,
    foreImpactAsymMm: 5.1,
    forePushoffAsymMm: 3.2,
    hindImpactAsymMm: 4.0,
    hindPushoffAsymMm: 3.4,
    findingsTitle: 'Leve Compensación Anterior',
    findingsDesc: 'Ligera compensación en miembro anterior derecho con recuperación progresiva.',
    preset: 'symmetric',
  },
};

const INITIAL_SESSIONS = [
  {
    id: 'SES-9481',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '17 Nov 2024 · 10:30',
    score: 88,
    status: 'optimal',
    statusLabel: 'Simétrico',
    stride: '1.42×',
    asymmetryMm: '3.2 mm',
    affectedLimb: 'Ninguno',
  },
  {
    id: 'SES-9120',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '24 Oct 2024 · 16:00',
    score: 85,
    status: 'optimal',
    statusLabel: 'Óptimo',
    stride: '1.40×',
    asymmetryMm: '4.0 mm',
    affectedLimb: 'Ninguno',
  },
  {
    id: 'SES-8820',
    horse: 'Tornado',
    breed: 'Warmblood Holandés (KWPN)',
    discipline: 'Doma Clásica',
    date: '02 Nov 2024 · 16:15',
    score: 74,
    status: 'mild',
    statusLabel: 'Asimetría Leve',
    stride: '1.35×',
    asymmetryMm: '12.4 mm',
    affectedLimb: 'Posterior Izq (LH)',
  },
  {
    id: 'SES-8410',
    horse: 'Tornado',
    breed: 'Warmblood Holandés (KWPN)',
    discipline: 'Doma Clásica',
    date: '08 Oct 2024 · 15:30',
    score: 68,
    status: 'mild',
    statusLabel: 'Asimetría',
    stride: '1.30×',
    asymmetryMm: '15.0 mm',
    affectedLimb: 'Posterior Izq (LH)',
  },
  {
    id: 'SES-7612',
    horse: 'Eclipse',
    breed: 'Pura Sangre (PSI)',
    discipline: 'Carrera',
    date: '18 Oct 2024 · 09:40',
    score: 92,
    status: 'optimal',
    statusLabel: 'Excelente',
    stride: '1.58×',
    asymmetryMm: '1.8 mm',
    affectedLimb: 'Ninguno',
  },
  {
    id: 'SES-7200',
    horse: 'Eclipse',
    breed: 'Pura Sangre (PSI)',
    discipline: 'Carrera',
    date: '25 Ago 2024 · 08:30',
    score: 89,
    status: 'optimal',
    statusLabel: 'Excelente',
    stride: '1.54×',
    asymmetryMm: '2.8 mm',
    affectedLimb: 'Ninguno',
  },
  {
    id: 'SES-6940',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '28 Sep 2024 · 11:00',
    score: 82,
    status: 'optimal',
    statusLabel: 'Simétrico',
    stride: '1.38×',
    asymmetryMm: '5.1 mm',
    affectedLimb: 'Mano Der (RF)',
  },
  {
    id: 'SES-6410',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '05 Sep 2024 · 10:15',
    score: 76,
    status: 'mild',
    statusLabel: 'En Progreso',
    stride: '1.32×',
    asymmetryMm: '8.9 mm',
    affectedLimb: 'Mano Der (RF)',
  },
  {
    id: 'SES-6100',
    horse: 'Dakota',
    breed: 'Silla Francés',
    discipline: 'Salto Clásico',
    date: '15 Ago 2024 · 09:00',
    score: 70,
    status: 'mild',
    statusLabel: 'Pre-Rehabilitación',
    stride: '1.28×',
    asymmetryMm: '14.2 mm',
    affectedLimb: 'Mano Der (RF)',
  },
];

export default function App({ onBackToLanding, initialAuthMode = 'signup', skipSplash = false }) {
  const [showSplash, setShowSplash] = useState(() => {
    if (skipSplash) return false;
    try {
      const hasSession = Object.keys(localStorage).some(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
      );
      return hasSession;
    } catch {
      return false;
    }
  });
  const [activeNav, setActiveNav] = useState('home'); // 'home' | 'analisis' | 'cuadra' | 'historial' | 'perfil'
  const [subTab, setSubTab] = useState('report'); // 'report' (Resultados) | 'visor' (Visor de Video)
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [healthState, setHealthState] = useState({
    status: 'checking',
    banner: 'Verificando Motor...',
  });
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Supabase Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'recovery'

  useEffect(() => {
    // 1. Fetch current session if any
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    // 2. Listen to realtime Auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Auto-check PWA mobile prompt
  useEffect(() => {
    try {
      localStorage.removeItem('hv_selected_plan_intent');

      // Check PWA mobile prompt
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      const isDismissed = localStorage.getItem('hv_pwa_dismissed') === 'true';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      if (isMobile && !isStandalone && !isDismissed) {
        const timer = setTimeout(() => {
          setIsInstallModalOpen(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCloseInstallModal = () => {
    setIsInstallModalOpen(false);
    try {
      localStorage.setItem('hv_pwa_dismissed', 'true');
    } catch (e) {}
  };
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sessions History State (persisted in localStorage)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SESSIONS;
  });

  const saveSessionsToStorage = (updated) => {
    setSessions(updated);
    try {
      localStorage.setItem('hv_sessions', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Active SaaS Plan & Quota Business Rules (1, 5, 50 horses)
  const [activePlanId, setActivePlanId] = useState(() => {
    try {
      return localStorage.getItem('hv_active_plan') || '1-horse';
    } catch {
      return '1-horse';
    }
  });
  const maxHorses = PLAN_LIMITS[activePlanId] || 1;

  // Horses Stable State (persisted in localStorage, filtering old demo fixtures & deduplicating by name)
  const [horses, setHorses] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_horses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenNames = new Set();
          return parsed.filter((h) => {
            if (!h || ['horse_1', 'horse_2', 'horse_3'].includes(h.id)) return false;
            const normName = String(h.name || '').trim().toLowerCase();
            if (!normName || seenNames.has(normName)) return false;
            seenNames.add(normName);
            return true;
          });
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_HORSES;
  });

  const [selectedHorse, setSelectedHorse] = useState(horses[0] || null);
  const [isHorseModalOpen, setIsHorseModalOpen] = useState(false);
  const [horseToEdit, setHorseToEdit] = useState(null);

  const saveHorsesToStorage = (updated) => {
    setHorses(updated);
    try {
      localStorage.setItem('hv_horses', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSaveHorse = (horseData) => {
    let updated;
    const normalizedNewName = String(horseData.name || '').trim().toLowerCase();
    const existsById = horses.some((h) => h.id === horseData.id);
    const existingByName = normalizedNewName
      ? horses.find((h) => String(h.name || '').trim().toLowerCase() === normalizedNewName)
      : null;
    const exists = existsById || Boolean(existingByName);

    if (!exists && horses.length >= maxHorses) {
      setIsHorseModalOpen(false);
      setIsPricingOpen(true);
      return;
    }

    let resolvedHorse = horseData;
    if (existsById) {
      updated = horses.map((h) => (h.id === horseData.id ? horseData : h));
    } else if (existingByName) {
      resolvedHorse = { ...horseData, id: existingByName.id };
      updated = horses.map((h) => (h.id === existingByName.id ? resolvedHorse : h));
    } else {
      updated = [horseData, ...horses];
    }

    saveHorsesToStorage(updated);
    if (selectedHorse?.id === resolvedHorse.id || !selectedHorse) {
      setSelectedHorse(resolvedHorse);
    }
  };

  const handleDeleteHorse = (horseId) => {
    const updated = horses.filter((h) => h.id !== horseId);
    saveHorsesToStorage(updated);
    if (selectedHorse?.id === horseId) {
      setSelectedHorse(updated[0] || null);
    }
  };

  const handleOpenNewHorseOrUpgrade = () => {
    if (horses.length >= maxHorses) {
      setIsPricingOpen(true);
    } else {
      setHorseToEdit(null);
      setIsHorseModalOpen(true);
    }
  };

  const handleSelectHorseForEvaluation = (horse) => {
    setSelectedHorse(horse);
    setActiveNav('home');
    setIsCameraOpen(true);
  };

  const checkHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, status: 'checking' }));
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthState({
        status: 'ready',
        banner: data.banner || 'Ready',
      });
    } catch {
      setHealthState({
        status: 'offline',
        banner: 'Backend Offline',
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (!isAnalyzing) {
      setStepIdx(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % PIPELINE_STEPS.length);
    }, 950);
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  const executeAnalyzeRequest = async (formData) => {
    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `Error HTTP ${response.status}`);
      }

      // Append new session to longitudinal history
      const now = new Date();
      const dateShort = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const dateFull = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const newScore = Math.round(data?.symmetry_report?.global_score ?? 85);
      const asymMm = (data?.symmetry_report?.hind_impact_asym_mm ?? 3.5).toFixed(1) + ' mm';
      const newSessionId = `SES-${Date.now().toString().slice(-4)}`;

      data.metadata = {
        ...(data.metadata || {}),
        horse_name: selectedHorse?.name || 'Equino',
        discipline: selectedHorse?.discipline || 'Deporte Ecuestre',
      };

      const newSession = {
        id: newSessionId,
        horse: selectedHorse?.name || 'Dakota',
        breed: selectedHorse?.breed || 'Silla Francés',
        discipline: selectedHorse?.discipline || 'Salto Clásico',
        date: dateFull,
        score: newScore,
        status: newScore >= 80 ? 'optimal' : 'mild',
        statusLabel: newScore >= 80 ? 'Simétrico' : 'Asimetría Leve',
        stride: `${data?.kinematics_summary?.stride_length_normalized || 1.42}×`,
        asymmetryMm: asymMm,
        affectedLimb: data?.symmetry_report?.affected_limb || 'Ninguno',
        symmetry_report: data.symmetry_report,
        kinematics_summary: data.kinematics_summary,
      };

      saveSessionsToStorage([newSession, ...sessions]);

      // Update horse in Cuadra
      if (selectedHorse) {
        const updatedHorses = horses.map((h) =>
          h.name.toLowerCase() === selectedHorse.name.toLowerCase()
            ? { ...h, lastScore: newScore, lastEvaluated: dateShort }
            : h
        );
        saveHorsesToStorage(updatedHorses);
      }

      setAnalysisData(data);
      setActiveNav('analisis');
      setSubTab('report');
    } catch (err) {
      setErrorMsg(
        err?.message || 'No se pudo conectar con el servidor de biomecánica.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeSelectedFile = () => {
    if (!selectedFile) {
      setErrorMsg('Selecciona o graba un video lateral del trote.');
      return;
    }
    const fd = new FormData();
    fd.append('video', selectedFile);
    executeAnalyzeRequest(fd);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisData(null);
    setErrorMsg('');
    setActiveNav('home');
    setSubTab('report');
  };

  const handleSelectHistorySession = async (session) => {
    setIsAnalyzing(true);
    const sessionDetail = SESSIONS_DATA[session.id] || {
      horseName: session.horse,
      discipline: session.discipline,
      date: session.date,
      globalScore: session.score,
      status: session.status,
      badgeLabel: session.statusLabel,
      badgeColor: session.status === 'optimal' ? '#10B981' : '#F59E0B',
      affectedLimb: session.affectedLimb === 'Ninguno' ? '' : session.affectedLimb,
      strideNormalized: parseFloat(session.stride) || 1.4,
      preset: session.status === 'optimal' ? 'symmetric' : 'asymmetry',
    };

    // Find horse in Cuadra
    const matchingHorse = horses.find((h) => h.name.toLowerCase() === session.horse.toLowerCase()) || {
      name: session.horse,
      breed: session.breed,
      discipline: session.discipline,
      photoUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80',
    };
    setSelectedHorse(matchingHorse);

    try {
      const fd = new FormData();
      fd.append('demo_preset', sessionDetail.preset || 'symmetric');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: fd,
      });
      const data = await response.json();

      // Inject session-specific parameters into analysisData
      data.metadata = {
        horse_name: sessionDetail.horseName,
        discipline: sessionDetail.discipline,
        date: sessionDetail.date,
        evaluation_timestamp: sessionDetail.date,
        global_score: sessionDetail.globalScore,
      };
      data.symmetry_report = {
        ...data.symmetry_report,
        global_score: sessionDetail.globalScore,
        status: sessionDetail.status,
        badge_label: sessionDetail.badgeLabel,
        badge_color: sessionDetail.badgeColor,
        affected_limb: sessionDetail.affectedLimb,
        anterior_si_pct: sessionDetail.anteriorSiPct || 95,
        posterior_si_pct: sessionDetail.posteriorSiPct || 90,
        fore_impact_asym_mm: sessionDetail.foreImpactAsymMm || 3.0,
        fore_pushoff_asym_mm: sessionDetail.forePushoffAsymMm || 2.5,
        hind_impact_asym_mm: sessionDetail.hindImpactAsymMm || 5.0,
        hind_pushoff_asym_mm: sessionDetail.hindPushoffAsymMm || 4.0,
        findings: [
          {
            id: 'finding_1',
            title: sessionDetail.findingsTitle || 'Evaluación de Simetría',
            description: sessionDetail.findingsDesc || 'Análisis completado.',
            badge_color: sessionDetail.badgeColor,
            asymmetry_pct: sessionDetail.globalScore >= 80 ? 3.2 : 12.4,
            region: sessionDetail.affectedLimb || 'Bilateral',
            metric_name: 'Diferencia ΔY',
            metric_value_mm: sessionDetail.hindImpactAsymMm || 3.2,
          },
        ],
      };
      data.kinematics_summary = {
        ...data.kinematics_summary,
        stride_length_normalized: sessionDetail.strideNormalized || 1.42,
        cadence_spm: sessionDetail.cadenceSpm || 84,
        stride_length_m: sessionDetail.strideM || 2.38,
        back_rom_deg: sessionDetail.backRomDeg || 4.4,
      };

      setAnalysisData(data);
      setActiveNav('analisis');
      setSubTab('report');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <NativeShell
      activeNav={activeNav}
      onSelectNav={(nav) => setActiveNav(nav)}
      subTab={subTab}
      onSelectSubTab={(tab) => setSubTab(tab)}
      hasAnalysis={Boolean(analysisData)}
      healthState={healthState}
      onReset={handleReset}
      splash={showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : null}
      isPricingOpen={isPricingOpen}
      onOpenPricing={() => setIsPricingOpen(true)}
      onClosePricing={() => setIsPricingOpen(false)}
      onPlanActivated={(planId) => setActivePlanId(planId)}
      hideBottomNav={!currentUser}
    >
      {!currentUser ? (
        <AuthScreen
          initialMode={initialAuthMode}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
          onBackToLanding={onBackToLanding}
        />
      ) : (
        <ErrorBoundary onReset={handleReset}>
        <div key={`${activeNav}_${subTab}`} className="view-enter">
          {/* 1. HOME TAB */}
          {activeNav === 'home' && (
            <UploadView
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onAnalyzeFile={handleAnalyzeSelectedFile}
              horses={horses}
              selectedHorse={selectedHorse}
              onSelectHorse={setSelectedHorse}
              maxHorses={maxHorses}
              sessions={sessions}
              onSelectNav={setActiveNav}
              onSelectSession={handleSelectHistorySession}
              onOpenNewHorseModal={handleOpenNewHorseOrUpgrade}
              onOpenPricing={() => setIsPricingOpen(true)}
              onOpenCamera={() => setIsCameraOpen(true)}
              isAnalyzing={isAnalyzing}
              analysisStepLabel={PIPELINE_STEPS[stepIdx]}
              errorMsg={errorMsg}
              onClearError={() => setErrorMsg('')}
            />
          )}

          {/* 2. ANÁLISIS TAB */}
          {activeNav === 'analisis' && (
            analysisData ? (
              subTab === 'visor' ? (
                <AnalysisView
                  analysisData={analysisData}
                  horse={selectedHorse}
                  onViewReport={() => setSubTab('report')}
                />
              ) : (
                <ReportView
                  analysisData={analysisData}
                  horse={selectedHorse}
                  sessions={sessions}
                  onSelectSession={handleSelectHistorySession}
                  onBackToVisor={() => setSubTab('visor')}
                />
              )
            ) : (
              <div className="rounded-[24px] card-3d p-6 flex flex-col items-center text-center gap-3 shadow-md mt-4">
                <div className="w-14 h-14 rounded-full card-3d-subtle flex items-center justify-center text-[#0D3F2E] dark:text-[#10B981] shadow-sm">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="font-mono text-[16px] font-bold text-slate-900 dark:text-white">
                  Sin Análisis Activo
                </h3>
                <p className="text-[12px] text-slate-600 dark:text-zinc-400 max-w-[280px]">
                  Graba o sube un video de trote desde Home para ver la cinemática articular y las barras de asimetría.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveNav('home')}
                  className="mt-2 min-h-[46px] px-5 rounded-[14px] card-3d-racing-green text-white font-mono text-[13px] font-bold shadow-md active:scale-95 transition"
                >
                  Ir a Capturar Video
                </button>
              </div>
            )
          )}

          {/* 3. CUADRA TAB (Caballos registrados) */}
          {activeNav === 'cuadra' && (
            <HorsesView
              horses={horses}
              sessions={sessions}
              maxHorses={maxHorses}
              onOpenPricing={() => setIsPricingOpen(true)}
              onSelectSession={handleSelectHistorySession}
              onOpenNewHorseModal={handleOpenNewHorseOrUpgrade}
              onOpenEditHorseModal={(horse) => {
                setHorseToEdit(horse);
                setIsHorseModalOpen(true);
              }}
              onSelectHorseForEvaluation={handleSelectHorseForEvaluation}
            />
          )}

          {/* 4. AGENTE IA ESPECIALISTA TAB */}
          {activeNav === 'ia' && (
            <VetAdvisorView
              horses={horses}
              selectedHorse={selectedHorse}
              onSelectHorse={setSelectedHorse}
              analysisData={analysisData}
              sessions={sessions}
            />
          )}

          {/* 5. HISTORIAL TAB */}
          {activeNav === 'historial' && (
            <HistoryView
              sessions={sessions}
              onSelectSession={handleSelectHistorySession}
            />
          )}

          {/* 6. PERFIL TAB */}
          {activeNav === 'perfil' && (
            <ProfileView
              user={currentUser}
              activePlanId={activePlanId}
              onOpenAuth={handleOpenAuth}
              onSignOut={handleSignOut}
              horses={horses}
              onGoToCuadra={() => setActiveNav('cuadra')}
              onOpenPricing={() => setIsPricingOpen(true)}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              onBackToLanding={onBackToLanding}
            />
          )}
        </div>
      </ErrorBoundary>
      )}

      {/* Horse Register / Edit Modal */}
      <HorseModal
        isOpen={isHorseModalOpen}
        onClose={() => setIsHorseModalOpen(false)}
        onSave={handleSaveHorse}
        onDelete={handleDeleteHorse}
        horseToEdit={horseToEdit}
      />

      {/* 16:9 Forced Landscape Camera Recorder & Viewfinder Modal */}
      <CameraRecorderModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onVideoRecorded={(file) => {
          setSelectedFile(file);
          setIsCameraOpen(false);
          setErrorMsg('');
        }}
        onImportFile={() => {
          setIsCameraOpen(false);
        }}
      />

      {/* Stitch 4-Step Equine Biomechanics Onboarding Flow (First launch only) */}
      <OnboardingFlow
        isOpen={Boolean(currentUser) && !showSplash && showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSaveInitialHorse={(name, discipline) => {
          if (name) {
            const newHorse = {
              id: `horse_${Date.now()}`,
              name: name,
              breed: 'Ejemplar Registrado',
              discipline: discipline || 'Salto Olímpico',
              sex: 'Castrado',
              age: 7,
              height: 1.68,
              haras: 'Mi Cuadra',
              notes: 'Registrado durante el onboarding inicial.',
              photoUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=500&q=80',
              lastScore: 88,
              lastEvaluated: 'Hoy',
            };
            const updated = [newHorse, ...horses];
            saveHorsesToStorage(updated);
            setSelectedHorse(newHorse);
          }
        }}
      />

      {/* Exclusive PWA Installation Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={handleCloseInstallModal}
      />

      {/* Supabase Authentication Modal (Login / Sign Up / Recovery) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </NativeShell>
  );
}
