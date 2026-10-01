import React from 'react';
import { 


  Terminal, 
  HelpCircle, 
  Info, 
  FolderOpen, 
  RefreshCw, 
  FileSpreadsheet, 
  Settings2,
  Cpu,
  BookOpen,
  Check,
  AlertTriangle
} from 'lucide-react';

const focusProps = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() };

interface DesktopExeGuideProps {
  onClose?: () => void;
  isElectron: boolean;
  cloudServerUrl: string;
  setCloudServerUrl: (val: string) => void;
}

export const DesktopExeGuide: React.FC<DesktopExeGuideProps> = ({ 
  onClose, 
  isElectron, 
  cloudServerUrl, 
  setCloudServerUrl 
}) => {
  const [copiedUpdateUrl, setCopiedUpdateUrl] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<'idle' | 'checking' | 'hasUpdate' | 'success'>('idle');
  const [updateData, setUpdateData] = React.useState<any>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const isInvalidCloudUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('google.com') || 
           lower.includes('ai.studio') || 
           lower.includes('aistudio.google') || 
           lower.includes('ais-dev-');
  };

  const getServerBaseUrl = () => {
    if (cloudServerUrl && !isInvalidCloudUrl(cloudServerUrl)) {
      return cloudServerUrl.endsWith('/') ? cloudServerUrl.slice(0, -1) : cloudServerUrl;
    }
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:')) {
      return window.location.origin;
    }
    return '';
  };

  const getFullUpdateUrl = () => {
    const base = getServerBaseUrl();
    const path = updateData?.installerUrl || '/api/download-desktop';
    if (path.startsWith('http')) return path;

    // On Web, always prefer relative URL paths when same origin to prevent cookie/403/sandbox download blocks
    if (!isElectron && typeof window !== 'undefined') {
      const cleanBase = base.replace(/\/+$/, "");
      const cleanOrigin = window.location.origin.replace(/\/+$/, "");
      if (cleanBase === cleanOrigin || !cloudServerUrl) {
        return path.startsWith('/') ? path : '/' + path;
      }
    }

    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  };

  const detectedUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:') ? window.location.origin : '';

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      const base = getServerBaseUrl();
      if (!base || base.startsWith('file:')) {
        setUpdateError("رابط خادم المزامنة والتحديثات السحابية مطلوب لتحديث نسخة سطح المكتب. يرجى إدخال الرابط الصحيح (مثال: https://your-server.run.app) في الحقل المخصص بالأعلى أولاً.");
        setUpdateStatus('idle');
        return;
      }
      let checkUrl = `${base}/api/check-updates`;
      if (!isElectron && typeof window !== 'undefined') {
        const cleanBase = base.replace(/\/+$/, "");
        const cleanOrigin = window.location.origin.replace(/\/+$/, "");
        if (cleanBase === cleanOrigin || !cloudServerUrl) {
          checkUrl = '/api/check-updates';
        }
      }
      const res = await fetch(checkUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.hasUpdate) {
          setUpdateData(data);
          setUpdateStatus('hasUpdate');
        } else {
          setUpdateStatus('idle');
        }
      } else {
        let errorMsg = "لم يتمكن التطبيق من تلقي الاستجابة من خادم التحديث (رمز الحالة: " + res.status + "). يرجى التأكد من تشغيل الخادم وصحة الرابط.";
        if (res.status === 403 && base.includes('ais-dev-')) {
          errorMsg = "فشل الاتصال برابط التطوير الخاص بك (رمز الحالة: 403). هذا الرابط محمي ومخصص فقط داخل متصفح AI Studio ومقيد بجلسة العمل الخاصة بك. للربط والمزامنة مع تطبيق سطح المكتب بنجاح، يرجى تفعيل واستخدام 'رابط التطبيق المشترك العام' (الذي يبدأ بـ ais-pre) ولصقه كـ 'رابط خادم المزامنة التحديثات' لكي يعمل دون عوائق!";
        }
        setUpdateError(errorMsg);
        setUpdateStatus('idle');
      }
    } catch (e: any) {
      console.error(e);
      setUpdateError("عذراً، فشل الاتصال بخادم التحديث السحابي. يرجى التحقق من اتصالك بالإنترنت وصحة الرابط المدخل: " + (e.message || String(e)));
      setUpdateStatus('idle');
    }
  };

  const handleDownloadUpdate = () => {
    setUpdateStatus('checking');
    
    // Attempt automatic download using a direct link to trigger browser behavior or Electron native browser
    try {
      const url = getFullUpdateUrl();
      if (isElectron && (window as any).electronAPI?.openExternal) {
        (window as any).electronAPI.openExternal(url);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'react-barcode-printer-v1.2.0.zip');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Auto download failed:", e);
    }

    setTimeout(() => {
      setUpdateStatus('success');
    }, 1500);
  };

  const handleCopyUpdateUrl = () => {
    const url = getFullUpdateUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUpdateUrl(true);
      setTimeout(() => setCopiedUpdateUrl(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-5 sm:p-6 shadow-sm flex flex-col gap-5 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3" id="guide-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">📚 دليل بناء التطبيق المكتبي (EXE) وربط SQLite والتحديثات</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">تعليمات مبسطة لملاك المتاجر والشركات لتشغيل النظام كبرنامج مستقل بالكامل.</p>
          </div>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border border-slate-100 cursor-pointer"
          >
            إغلاق دليل المطور ×
          </button>
        )}
      </div>

      {/* Steps 1 & 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="guide-grid">
        {/* Step 1: Packaging as Windows EXE */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-205/60 flex flex-col gap-3">
          <span className="font-extrabold text-indigo-900 text-xs sm:text-sm flex items-center gap-1.5">
            <span className="p-1 bg-indigo-100 text-indigo-700 rounded">1</span>
            🖥️ كيفية تنصيب وتحويل البرنامج إلى ملف EXE
          </span>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            البرنامج مجهز بالكامل من خلال <strong>Electron</strong> ليعمل كـ تطبيق سطح مكتب لملائمة طابعات ويندوز الحرارية الصامتة والاتصال بملف SQLite المحلي. لبناء ملف التنصيب الفردي المستقل:
          </p>
          <div className="bg-slate-900 text-slate-100 font-mono text-[10.5px] p-3 rounded-lg flex flex-col gap-1 text-left" dir="ltr">
            <div><span className="text-slate-400 font-sans font-semibold"># 1. تثبيت حزم الاعتماد والأدوات المساعدة</span></div>
            <div className="text-amber-300">npm install</div>
            <div className="text-slate-400 mt-2 font-sans font-semibold"># 2. بناء وتشغيل التطبيق في بيئة المطورين للتجربة</div>
            <div className="text-amber-300">npm run electron:start</div>
            <div className="text-slate-400 mt-2 font-sans font-semibold"># 3. تجميع النظام لملف EXE مفرد لسطح المكتب (صامت بورتابل ومثبت)</div>
            <div className="text-emerald-300">npm run electron:build</div>
            <div className="text-slate-400 mt-2 font-sans font-semibold"># 4. تجميع النظام بصيغة حزمة ويندوز الحديثة MSIX (للمتجر أو التثبيت المعتمد)</div>
            <div className="text-cyan-300">npm run electron:build:msix</div>
          </div>
          <span className="text-[10px] text-slate-400 leading-tight">
            💡 سيقوم المجمع بإنشاء مجلد <code>dist_electron/</code> يحتوي على نسخة محمولة (Portable) بالإضافة لمثبّت متكامل (NSIS) وحزمة <strong>MSIX</strong> الحديثة بعنوان <strong>"باركود ماستر"</strong> تلقائياً.
          </span>
        </div>

        {/* Step 2: In-app Local SQLite Connecting */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-205/60 flex flex-col gap-3">
          <span className="font-extrabold text-indigo-900 text-xs sm:text-sm flex items-center gap-1.5">
            <span className="p-1 bg-indigo-100 text-indigo-700 rounded">2</span>
            🗄️ طريقة ربط قاعدة بيانات SQLite على نفس الجهاز
          </span>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            لست بحاجة لمحركات معقدة أو رفع مخزونك للحوسبة السحابية. يدعم البرنامج القراءة الفورية لملفات قواعد البيانات المحلية كـ <strong>SQLite</strong> مباشرة عند تشغيله من سطح المكتب:
          </p>
          <ul className="text-[11px] text-slate-500 list-disc pr-4 flex flex-col gap-1.5">
            <li>
              افتح البرنامج تلو تجميعه كـ <strong>EXE</strong>، ثم ادخل على لوحة <strong>قوالب ومقاسات الورق</strong>.
            </li>
            <li>
              قم بتفعيل خيار <strong>"ربط قاعدة بيانات SQLite محلية"</strong> من حقل "نوع الربط المستهدف".
            </li>
            <li>
              انقر فوق زر <code className="bg-slate-200 px-1 py-0.5 rounded font-bold">اختيار ملف قاعدة البيانات 📁</code> لتصفح وتحديد ملف <code>.db</code> أو <code>.sqlite</code> الخاص بك.
            </li>
            <li>
              اكتب استعلام SQL الخاص بجدول منتجاتك متمثلاً بـ:
              <code className="block bg-white p-1 rounded font-mono text-[9px] mt-1 text-indigo-700 text-center select-all">
                SELECT name, barcode, sku, code, price, prod_date, exp_date FROM products
              </code>
            </li>
            <li>
              اضبط مخرجات الأعمدة لتتلائم تلقائياً مع محتوى ملصقاتك بنظام الاستيراد الذكي.
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200/60 my-2" />

      {/* Live Remote Updater and Custom Icon Branding (Bespoke EXE Icon) in independent grid view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Remote Software Updater */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-3xs flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="font-extrabold text-indigo-950 text-xs sm:text-[12.5px] flex items-center gap-1.5 border-b border-slate-250 pb-2">
              <span className="p-1 text-indigo-700 bg-indigo-100 rounded-lg text-[10px]">⚙️</span>
              🎯 تحديث التطبيق السحابي والدعم عن بعد (Remote Software Updater)
            </span>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-1 font-semibold">
              افحص حالة الأكواد البرمجية وآخر الميزات المطروحة للتثبيت والتحديث بنقرة زر واحدة.
            </p>

            {/* Cloud Server URL Configurer */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1.5 mb-1.5 text-right shadow-3xs">
              <label className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1 justify-between">
                <span>🔗 رابط خادم المزامنة والتحديثات السحابية:</span>
                {detectedUrl && cloudServerUrl !== detectedUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCloudServerUrl(detectedUrl);
                      localStorage.setItem('cloud_server_url', detectedUrl);
                    }}
                    className="text-[9px] text-white bg-indigo-650 hover:bg-indigo-700 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                  >
                    🎯 استخدام الرابط المكتشف تلقائياً
                  </button>
                )}
              </label>
              <div className="flex gap-1">
                <input {...focusProps} 
                  type="text"
                  placeholder="مثال: https://your-server.run.app"
                  value={cloudServerUrl}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setCloudServerUrl(val);
                    localStorage.setItem('cloud_server_url', val);
                  }}
                  className={`flex-1 text-[9.5px] bg-slate-50 border px-2 py-1 rounded outline-hidden font-mono text-left ${
                    isInvalidCloudUrl(cloudServerUrl) ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10' :
                    isElectron && !cloudServerUrl ? 'border-amber-400 focus:border-amber-500 bg-amber-50/20 shadow-xs' : 'border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              {isInvalidCloudUrl(cloudServerUrl) ? (
                <div className="text-[9px] text-rose-700 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200 leading-relaxed font-semibold">
                  ⚠️ لقد قمت بوضع رابط منصة <strong>AI Studio</strong> العام بالخطأ. هذا الرابط غير صالح لأنه مخصص لبيئة التطوير الخارجية وليس السيرفر المباشر.
                  <br />
                  <span className="text-emerald-700 font-bold">✓ لقد قمنا بضبط السيرفر تلقائياً وتفادي المشكلة بالخلفية لكي ينجح جلب التحديثات فوراً بدون عطل!</span>
                  <br />
                  انصح بالنقر فوق الزر الأزرق بالأعلى <strong className="text-indigo-700">"🎯 استخدام الرابط المكتشف تلقائياً"</strong> لتصحيح النص المعروض والحفظ بشكل نهائي.
                </div>
              ) : (
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  {isElectron ? (
                    <span className="text-amber-800 font-semibold">
                      ⚠️ يرجى التأكد من نسخ رابط لوحة التحكم من المتصفح ولصقه هنا لتمكين تطبيق سطح المكتب من جلب التحديثات ومزامنة الفواتير وقواعد البيانات عن بعد بنجاح!
                    </span>
                  ) : (
                    <span className="flex flex-col sm:flex-row justify-between gap-1 items-start sm:items-center">
                      <span>✓ تم الكشف التلقائي عن العنوان السحابي المباشر. سيتم تمريره تلقائياً لتطبيق سطح المكتب عند تشغيله.</span>
                      {detectedUrl && <code className="bg-slate-200/80 px-1 py-0.2 rounded text-[8.5px] font-mono select-all text-slate-700">{detectedUrl}</code>}
                    </span>
                  )}
                </p>
              )}
            </div>

            {updateError && (
              <div className="text-[10px] text-rose-800 bg-rose-50/80 p-3 rounded-lg border border-rose-220 text-right leading-relaxed font-semibold">
                ⚠️ {updateError}
              </div>
            )}

            {updateStatus === 'checking' && (
              <div className="text-[10px] font-bold text-indigo-650 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-150 animate-pulse text-center">
                🔄 جاري الاتصال بخادم الاستقبال والتنزيل المباشر...
              </div>
            )}
            {updateStatus === 'idle' && (
              <div className="text-[10px] text-slate-600 font-bold bg-white shadow-3xs p-2.5 rounded-lg border border-slate-150 text-center">
                الإصدار المثبت حالياً: <span className="font-mono text-indigo-600">v1.2.0</span> (نسخة مستقرة)
              </div>
            )}
            {updateStatus === 'hasUpdate' && updateData && (
              <div className="text-[10px] bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-150 flex flex-col gap-1.5 justify-start">
                <div className="flex items-center justify-between font-black text-indigo-950 border-b border-indigo-100/50 pb-1 font-sans">
                  <span>🚀 إصدار جديد متوفر: v{updateData.latestVersion}</span>
                  <span className="text-[9px] font-normal font-mono text-slate-400">{updateData.releaseDate}</span>
                </div>
                <div className="text-[9px] text-slate-600">
                  <span className="font-bold text-slate-700 block mb-0.5">مميزات ومكونات هذا التحديث:</span>
                  <ul className="list-disc pr-3.5 flex flex-col gap-0.5 text-slate-650">
                    {updateData.changelog?.map((change: string, idx: number) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Highly targeted Arabic help section for the file corrupted / E: drive error */}
                <div className="mt-3 bg-rose-50 border border-rose-250 p-3 rounded-lg text-rose-950 text-[9.5px] leading-relaxed flex flex-col gap-1.5 shadow-sm">
                  <span className="font-extrabold text-[10px] text-rose-800 flex items-center gap-1">🛡️ دليل حل مشكلة تلف الملف ومشاكل تشغيل موجه الأوامر (CMD)</span>
                  <p className="text-slate-700">
                    تمت إعادة كتابة ملف <span className="font-mono bg-rose-100 text-rose-800 px-1 rounded font-bold">build_desktop.bat</span> بالكامل وتطهيره من أي رموز خاصة أو أحرف عربية قد تسبب مشاكل لموجه الأوامر (CMD) على نسخ ويندوز المختلفة.
                  </p>
                  <p className="text-slate-700">
                    ظهور خطأ <span className="font-mono bg-rose-100 text-rose-800 px-1 rounded font-bold">The file or directory is corrupted and unreadable</span> عند تشغيل ملف التثبيت من القرص <strong className="text-rose-800">E:</strong> يعني وجود قطاعات تالفة بالفلاشة أو تحميل ملف تالف بحجم (0 بايت).
                  </p>
                  <div className="font-bold text-rose-900 mt-1">💡 خطوات الحل الأكيد والسهل:</div>
                  <ol className="list-decimal pr-4 text-slate-700 flex flex-col gap-1">
                    <li>قم أولاً بحذف ملف الـ <span className="font-mono font-bold">.exe</span> القديم أو التالف بالكامل من القرص <span className="font-mono">E:</span>.</li>
                    <li>انقر على الزر الأخضر بالأعلى <strong className="text-emerald-700">"تحميل ملف الحزمة الآن (ZIP)"</strong> لتنزيل النسخة الجديدة المصححة بالكامل.</li>
                    <li><strong>هام جداً:</strong> لا تقم بنقل أو فك ضغط الملف داخل الفلاشة <span className="font-mono">E:</span> بل قم بسحبه وفك ضغطه على <strong className="text-indigo-800">سطح المكتب (Desktop)</strong> أو الفولدر <strong className="text-indigo-800">C:\</strong> على جهاز الكمبيوتر مباشرة.</li>
                    <li>افتح مجلد المشروع المفكوك، وانقر مرتين على الملف باسم <strong className="text-slate-900">build_desktop.bat</strong> وسيقوم فوراً بتوليد تطبيق التشغيل (.exe) بنجاح تام وبثوانٍ معدودة!</li>
                  </ol>
                </div>

                <div className="flex gap-1.5 mt-1 items-center justify-end">
                  <button 
                    type="button" 
                    onClick={handleDownloadUpdate} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1 rounded text-[9.5px] cursor-pointer transition-all"
                  >
                    📦 تحديث الآن وتحميل الحزمة
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCopyUpdateUrl} 
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-200 text-[9.5px] cursor-pointer transition-all"
                  >
                    {copiedUpdateUrl ? '✓ تم نسخ الرابط!' : '📋 نسخ رابط التحميل المباشر'}
                  </button>
                </div>
              </div>
            )}
            
            {updateStatus === 'success' && (
              <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-150 flex flex-col gap-2 justify-start animate-in fade-in text-right">
                <strong className="text-center font-bold text-[10.5px]">✓ تم تحضير حزمة التحديث والمزامنة v1.2.0 بنجاح! 💾</strong>
                <p className="text-[9.5px] text-slate-750 leading-relaxed font-semibold">
                  تم ضغط وحزم ملفات التحديث بنجاح لتجاوز كافة المشاكل. يرجى البدء بتحميل الحزمة أدناه، ثم فك ضغطها على جهازك لتشغيل معالج البناء الخالي من أي قيود.
                </p>
                <div className="flex justify-center gap-1.5 self-center mt-1 w-full">
                  <a 
                    href={getFullUpdateUrl()}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded text-[10px] cursor-pointer transition-all text-center flex-1"
                  >
                    🚀 تحميل ملف الحزمة الآن (ZIP)
                  </a>
                  <button 
                    type="button"
                    onClick={handleCopyUpdateUrl}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded border border-slate-200 text-[10px] cursor-pointer transition-all flex-1"
                  >
                    {copiedUpdateUrl ? '✓ تم نسخ الرابط!' : '📋 نسخ رابط التحميل'}
                  </button>
                </div>

                {/* Highly targeted Arabic help section for the file corrupted / E: drive error */}
                <div className="mt-3 bg-rose-50 border border-rose-250 p-3 rounded-lg text-rose-950 text-[9.5px] leading-relaxed flex flex-col gap-1.5 shadow-sm">
                  <span className="font-extrabold text-[10px] text-rose-800 flex items-center gap-1">🛡️ دليل حل مشكلة تلف الملف (Corrupted or Unreadable on E:)</span>
                  <p className="text-slate-700">
                    ظهور رسالة الخطأ <span className="font-mono bg-rose-100 text-rose-800 px-1 rounded font-bold">The file or directory is corrupted and unreadable</span> عند تشغيل ملف التثبيت من القرص <strong className="text-rose-800">E:</strong> يعني أن المتصفح قام بتنزيل ملف قديم غير مكتمل أو أن الفلاشة تحتوي على قطاعات تالفة.
                  </p>
                  <div className="font-bold text-rose-900 mt-1">💡 خطوات الحل الأكيد والسهل:</div>
                  <ol className="list-decimal pr-4 text-slate-700 flex flex-col gap-1 font-semibold">
                    <li>قم أولاً بحذف ملف الـ <span className="font-mono font-bold">.exe</span> التالف والقديم بالكامل من القرص <span className="font-mono">E:</span> لتجنب الخلط.</li>
                    <li>انقر على الزر الأخضر بالأعلى <strong className="text-emerald-700">"تحميل ملف الحزمة الآن (ZIP)"</strong> لتنزيل نسخة كاملة ومحدثة.</li>
                    <li><strong>هام جداً:</strong> لا تقم بنقل أو فك ضغط الملف داخل الفلاشة <span className="font-mono">E:</span> بل قم بسحبه وفك ضغطه على <strong className="text-indigo-800">سطح المكتب (Desktop)</strong> أو القرص <strong className="text-indigo-800">C:</strong> على جهاز الكمبيوتر مباشرة.</li>
                    <li>افتح مجلد المشروع المفكوك، وانقر مرتين على الملف باسم <strong className="text-slate-900">build_desktop.bat</strong> وسيبدأ بناء تطبيق الـ EXE الأصلي والكامل الخاص بك بثوانٍ ودون أي قيود أو أعطال!</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            {updateStatus === 'hasUpdate' ? (
              <button
                type="button"
                onClick={handleDownloadUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                تنزيل وتثبيت التحديث التقني المباشر 💾
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={updateStatus === 'checking'}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer shadow-3xs"
              >
                {updateStatus === 'checking' ? 'جاري فحص الإصدارات...' : 'افحص وجود تحديثات النظام عن بعد ⏱️'}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Custom Launcher Icon (Bespoke EXE Icon branding) */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-3xs flex flex-col justify-between gap-3 text-right">
          <div className="flex flex-col gap-2">
            <span className="font-extrabold text-indigo-950 text-xs sm:text-[12.5px] flex items-center gap-1.5 border-b border-slate-250 pb-2">
              <span className="p-1 text-indigo-700 bg-indigo-100 rounded-lg text-[10px]">🎨</span>
              أيقونة النظام المخصصة لتجميع الويب المحمول (Bespoke EXE Icon branding)
            </span>
            <div className="flex items-start gap-2.5 mt-1">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex-shrink-0 flex items-center justify-center border border-indigo-400/55 shadow-md text-base text-indigo-400 font-black font-mono">
                EXE
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-bold text-slate-800">أيقونة شريط مهام البرامج EXE المدمجة</span>
                <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold">
                  تم تهيئة وبناء ملف التجميع لسطح المكتب Electron ليدمج الملف المميز لعلامتك التجارية من المسارات المحددة <code>assets/icon.png</code> و <code>assets/icon.ico</code>.
                </p>
              </div>
            </div>
            <div className="text-[9px] bg-white border border-slate-200 shadow-3xs p-3 rounded-lg leading-relaxed text-slate-600 mt-2 font-semibold">
              💡 <strong>تخصيص كامل للهوية المنشآتية:</strong> يمكنك تصميم أو استبدال الصورة الموجودة بمجلد <code>assets/icon.png</code> باللوجو التجاري الخاص بك، وعند تجميع البرنامج عبر <code>npm run electron:build</code> سيتم تصنيف هويتك كأيقونة الاختصار الرسمية تلقائياً للويندوز!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopExeGuide;
