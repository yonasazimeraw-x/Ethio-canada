import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { FINGER_DEFINITIONS, TOTAL_FINGERS } from './data/fingers';
import { FingerDefinition, FingerId, FingerSubmissionMap, SubmissionMethod } from './types/fingerprint';
import { EthiopianEmblem } from './components/EthiopianEmblem';
import { HandDiagram } from './components/HandDiagram';
import { ProgressSection } from './components/ProgressSection';
import { FingerprintCard } from './components/FingerprintCard';
import { FingerprintModal } from './components/FingerprintModal';
import { CompletionModal } from './components/CompletionModal';

const STORAGE_KEY = 'ethiopian_federation_fingerprint_demo_v1';

function loadSavedSubmissions(): FingerSubmissionMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FingerSubmissionMap;
    if (typeof parsed !== 'object' || parsed === null) return {};
    const sanitized: FingerSubmissionMap = {};
    for (const finger of FINGER_DEFINITIONS) {
      const entry = parsed[finger.id];
      if (entry && entry.status === 'completed' && entry.fingerId === finger.id) {
        sanitized[finger.id] = entry;
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

function saveSubmissions(data: FingerSubmissionMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota or private mode restrictions gracefully
  }
}

function generateReferenceCode(fingerId: FingerId): string {
  const prefix = fingerId.slice(0, 2).toUpperCase();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `ETF-${prefix}-${suffix}`;
}

export default function App() {
  const [submissions, setSubmissions] = useState<FingerSubmissionMap>(() =>
    loadSavedSubmissions()
  );
  const [activeFinger, setActiveFinger] = useState<FingerDefinition | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  const completedCount = useMemo(
    () => FINGER_DEFINITIONS.filter((f) => submissions[f.id]?.status === 'completed').length,
    [submissions]
  );

  const remainingCount = TOTAL_FINGERS - completedCount;
  const percentage = Math.round((completedCount / TOTAL_FINGERS) * 100);

  const nextPendingFinger = useMemo(
    () => FINGER_DEFINITIONS.find((f) => !submissions[f.id]) ?? null,
    [submissions]
  );

  const handleSelectFingerById = (fingerId: FingerId) => {
    const found = FINGER_DEFINITIONS.find((f) => f.id === fingerId);
    if (found) {
      setStatusNotice(null);
      setActiveFinger(found);
    }
  };

  const handleHeaderPrimaryAction = () => {
    if (nextPendingFinger) {
      setStatusNotice(null);
      setActiveFinger(nextPendingFinger);
    } else if (completedCount === TOTAL_FINGERS) {
      setShowCompletionModal(true);
    }
  };

  const handleSubmitFinger = ({
    fingerId,
    method,
    fileName,
    previewUrl,
  }: {
    fingerId: FingerId;
    method: SubmissionMethod;
    fileName?: string;
    previewUrl?: string;
  }) => {
    // Prevent duplicate submission
    if (submissions[fingerId]?.status === 'completed') {
      setStatusNotice('ይህ የጣት አሻራ አስቀድሞ ተመዝግቧል። ድጋሚ ማስገባት አይቻልም።');
      setActiveFinger(null);
      return;
    }

    const updated: FingerSubmissionMap = {
      ...submissions,
      [fingerId]: {
        fingerId,
        status: 'completed',
        method,
        submittedAt: new Date().toISOString(),
        referenceCode: generateReferenceCode(fingerId),
        fileName,
        previewUrl,
      },
    };

    setSubmissions(updated);
    setActiveFinger(null);

    const nextTotalCompleted = FINGER_DEFINITIONS.filter(
      (f) => updated[f.id]?.status === 'completed'
    ).length;

    if (nextTotalCompleted === TOTAL_FINGERS) {
      setStatusNotice(null);
      window.setTimeout(() => {
        setShowCompletionModal(true);
      }, 220);
    } else {
      const submittedFinger = FINGER_DEFINITIONS.find((f) => f.id === fingerId);
      if (submittedFinger) {
        setStatusNotice(
          `${submittedFinger.amharicName} (${submittedFinger.englishName}) በተሳካ ሁኔታ ተመዝግቧል። (${nextTotalCompleted}/${TOTAL_FINGERS})`
        );
      }
    }
  };

  const handleResetAll = () => {
    setSubmissions({});
    setActiveFinger(null);
    setShowCompletionModal(false);
    setStatusNotice('የምዝገባ ሂደቱ እንደገና ተጀምሯል። እባክዎ አሻራዎችን ከመጀመሪያው ያስገቡ።');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F8] text-slate-900">
      {/* Ceremonial Ethiopian Tricolor Top Hairline */}
      <div className="h-1 w-full flex" aria-hidden="true">
        <div className="flex-1 bg-[#078930]" />
        <div className="flex-1 bg-[#FCDD09]" />
        <div className="flex-1 bg-[#DA121A]" />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract, <= 15% mobile height) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-[#078930] transition-colors"
          >
            የኢትዮጵያ ፌድሬሽን
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="ዋና ማውጫ"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#top"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
            >
              መነሻ
            </a>
            <a
              href="#instructions"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
            >
              መመሪያ
            </a>
            <a
              href="#submission-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
            >
              አሻራ ማስገቢያ
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleHeaderPrimaryAction}
              className="min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#078930] text-white hover:bg-[#067027] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {completedCount === TOTAL_FINGERS ? 'ውጤት ይመልከቱ' : 'አሻራ ይስጡ'}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Official Hero Section */}
        <section className="relative bg-gradient-to-b from-white via-[#F9FCFA] to-[#F7F9F8] border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Emblem, Official Headings, Welcome & Instruction */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  <div className="shrink-0">
                    <EthiopianEmblem size={82} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      ይፋዊ የዲጂታል ምዝገባ መድረክ · Official Registration Portal
                    </p>
                    <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.2] text-balance">
                      የኢትዮጵያ ፌድሬሽን
                    </h1>
                    <p className="text-lg sm:text-xl font-semibold text-[#078930] mt-1">
                      የአሻራ ማስመዝገቢያ ስርዓት
                    </p>
                  </div>
                </div>

                {/* Short Welcoming Message in Amharic */}
                <p className="text-base text-slate-700 leading-relaxed max-w-2xl">
                  እንኳን ወደ የኢትዮጵያ ፌድሬሽን የአሻራ መስጫ ገፅ በደህና መጡ። ይህ ዘመናዊ የዲጂታል መድረክ
                  አምስቱንም የጣት አሻራዎችዎን በተደራጀ እና ደህንነቱ በተጠበቀ መልኩ በቅደም ተከተል እንዲያስገቡ
                  ያስችልዎታል።
                </p>

                {/* Required Prominent Instruction */}
                <div
                  id="instructions"
                  className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs max-w-2xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#078930]/20 text-[#078930] flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        የአሰራር መመሪያ · Registration Instruction
                      </p>
                      <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                        &ldquo;እባክዎ አምስቱንም የጣት አሻራዎች በቅደም ተከተል ያስገቡ።&rdquo;
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        ከአውራ ጣት እስከ ትንሹ ጣት ያሉትን 5 ካርዶች በመጫን የሙከራ ስካን ወይም የአሻራ ምስል
                        በመጫን ማስገባት ይችላሉ።
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Action Row */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {nextPendingFinger ? (
                    <button
                      type="button"
                      onClick={() => setActiveFinger(nextPendingFinger)}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-[#078930] hover:bg-[#067027] active:scale-[0.98] text-white text-sm sm:text-base font-semibold inline-flex items-center gap-2.5 shadow-sm transition-all cursor-pointer"
                    >
                      <span>
                        ቀጣዩን ጣት ይጀምሩ፦ {nextPendingFinger.amharicName}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-[#078930] hover:bg-[#067027] text-white text-sm sm:text-base font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>የማረጋገጫ መልዕክት ይመልከቱ (5/5)</span>
                    </button>
                  )}

                  <a
                    href="#submission-section"
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center transition-colors"
                  >
                    አምስቱንም ጣቶች ይመልከቱ
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive Right-Hand Schematic */}
              <div className="lg:col-span-5">
                <HandDiagram
                  submissions={submissions}
                  nextPendingId={nextPendingFinger?.id ?? null}
                  onSelectFinger={handleSelectFingerById}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Fingerprint Submission Section */}
        <section
          id="submission-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6"
        >
          {/* Progress Indicator at Top of Fingerprint Section */}
          <ProgressSection
            total={TOTAL_FINGERS}
            completed={completedCount}
            remaining={remainingCount}
            percentage={percentage}
            onResetAll={handleResetAll}
          />

          {/* Live Feedback Banner after individual submission or reset */}
          {statusNotice && (
            <div
              role="status"
              className="rounded-xl bg-white border border-[#078930]/30 px-4 py-3 flex items-center justify-between gap-3 text-sm text-slate-800 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#078930] shrink-0" />
                <span className="font-medium">{statusNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 cursor-pointer"
              >
                ዝጋ
              </button>
            </div>
          )}

          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                አምስቱ የእጅ ጣቶች · Five Fingerprints
              </p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                የጣት አሻራ መስጫ ካርዶች
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              እያንዳንዱ ካርድ በተናጠል ይሰራል · Click any pending card to submit
            </p>
          </div>

          {/* Five Fingerprint Cards Grid (Ordered 1 -> 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {FINGER_DEFINITIONS.map((finger) => (
              <FingerprintCard
                key={finger.id}
                finger={finger}
                submission={submissions[finger.id]}
                isNextInSequence={nextPendingFinger?.id === finger.id}
                onOpenModal={(selected) => {
                  setStatusNotice(null);
                  setActiveFinger(selected);
                }}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            የኢትዮጵያ ፌድሬሽን · የአሻራ ማስመዝገቢያ ስርዓት
          </p>
          <p>
            © {new Date().getFullYear()} የኢትዮጵያ ፌድሬሽን አሻራ መስጫ ገፅ · All Rights Reserved
          </p>
        </div>
      </footer>

      {/* Individual Finger Interaction Modal */}
      <FingerprintModal
        finger={activeFinger}
        existingSubmission={activeFinger ? submissions[activeFinger.id] : undefined}
        onClose={() => setActiveFinger(null)}
        onSubmit={handleSubmitFinger}
      />

      {/* All-5-Completed Congratulations Popup */}
      <CompletionModal
        isOpen={showCompletionModal && completedCount === TOTAL_FINGERS}
        submissions={submissions}
        onFinish={() => setShowCompletionModal(false)}
      />
    </div>
  );
}
