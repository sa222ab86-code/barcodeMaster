import React from 'react';
import { 


  Database, 
  FolderOpen, 
  RefreshCw, 
  Settings2, 
  Info, 
  Sliders, 
  FileSpreadsheet, 
  Cpu, 
  Check, 
  AlertTriangle,
  CloudLightning,
  BookOpen,
  Building
} from 'lucide-react';

const focusProps = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() };

interface DatabaseSyncPanelProps {
  dbSyncMode: 'api' | 'sqlite' | 'cloud_erp' | 'webhook_live';
  setDbSyncMode: (mode: 'api' | 'sqlite' | 'cloud_erp' | 'webhook_live') => void;
  sqlitePath: string;
  setSqlitePath: (path: string) => void;
  sqliteQuery: string;
  setSqliteQuery: (query: string) => void;
  dbApiUrl: string;
  setDbApiUrl: (url: string) => void;
  dbFieldMapName: string;
  setDbFieldMapName: (val: string) => void;
  dbFieldMapPrice: string;
  setDbFieldMapPrice: (val: string) => void;
  dbFieldMapBarcode: string;
  setDbFieldMapBarcode: (val: string) => void;
  dbFieldMapSku: string;
  setDbFieldMapSku: (val: string) => void;
  dbFieldMapProdDate: string;
  setDbFieldMapProdDate: (val: string) => void;
  dbFieldMapExpDate: string;
  setDbFieldMapExpDate: (val: string) => void;

  daftraFieldMapName: string;
  setDaftraFieldMapName: (val: string) => void;
  daftraFieldMapPrice: string;
  setDaftraFieldMapPrice: (val: string) => void;
  daftraFieldMapBarcode: string;
  setDaftraFieldMapBarcode: (val: string) => void;
  daftraFieldMapSku: string;
  setDaftraFieldMapSku: (val: string) => void;
  daftraFieldMapProdDate: string;
  setDaftraFieldMapProdDate: (val: string) => void;
  daftraFieldMapExpDate: string;
  setDaftraFieldMapExpDate: (val: string) => void;

  ostadFieldMapName: string;
  setOstadFieldMapName: (val: string) => void;
  ostadFieldMapPrice: string;
  setOstadFieldMapPrice: (val: string) => void;
  ostadFieldMapBarcode: string;
  setOstadFieldMapBarcode: (val: string) => void;
  ostadFieldMapSku: string;
  setOstadFieldMapSku: (val: string) => void;
  ostadFieldMapProdDate: string;
  setOstadFieldMapProdDate: (val: string) => void;
  ostadFieldMapExpDate: string;
  setOstadFieldMapExpDate: (val: string) => void;

  isSyncingDb: boolean;
  dbSyncResult: { success?: boolean; count?: number; error?: string } | null;
  onSync: (mode?: 'sqlite' | 'api' | 'cloud_erp') => void;
  selectLocalSqliteFile: () => void;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (val: boolean) => void;
  isSmartSyncEnabled: boolean;
  setIsSmartSyncEnabled: (val: boolean) => void;
  autoSyncInterval: number;
  setAutoSyncInterval: (val: number) => void;
  lastAutoSyncTime: string;
  showSqlBridgeInstructions: boolean;
  setShowSqlBridgeInstructions: (val: boolean) => void;
  isElectron: boolean;
  cloudServerUrl: string;
  setCloudServerUrl: (val: string) => void;

  // New Cloud ERP state props
  erpProvider: 'daftra' | 'ostad';
  setErpProvider: (val: 'daftra' | 'ostad') => void;
  erpSubdomain: string;
  setErpSubdomain: (val: string) => void;
  erpApiKey: string;
  setErpApiKey: (val: string) => void;
  erpCustomUrl: string;
  setErpCustomUrl: (val: string) => void;
  erpBranchId: string;
  setErpBranchId: (val: string) => void;

  daftraAuthType: 'apikey' | 'oauth2';
  setDaftraAuthType: (val: 'apikey' | 'oauth2') => void;
  daftraClientId: string;
  setDaftraClientId: (val: string) => void;
  daftraClientSecret: string;
  setDaftraClientSecret: (val: string) => void;
  daftraUsername: string;
  setDaftraUsername: (val: string) => void;
  daftraPassword: string;
  setDaftraPassword: (val: string) => void;

  // Webhooks Integration Props
  webhookLogs: any[];
  onClearWebhooks: () => void;
  onAddWebhookProduct: (prod: any) => void;
  onPollWebhooks: () => void;
  isPollingWebhooks: boolean;

  // Halala division props
  divideBy100Sqlite: boolean;
  setDivideBy100Sqlite: (val: boolean) => void;
  divideBy100Api: boolean;
  setDivideBy100Api: (val: boolean) => void;
  divideBy100Erp: boolean;
  setDivideBy100Erp: (val: boolean) => void;
  divideBy100Webhook: boolean;
  setDivideBy100Webhook: (val: boolean) => void;
}

export const DatabaseSyncPanel: React.FC<DatabaseSyncPanelProps> = ({
  dbSyncMode,
  setDbSyncMode,
  sqlitePath,
  setSqlitePath,
  sqliteQuery,
  setSqliteQuery,
  dbApiUrl,
  setDbApiUrl,
  dbFieldMapName,
  setDbFieldMapName,
  dbFieldMapPrice,
  setDbFieldMapPrice,
  dbFieldMapBarcode,
  setDbFieldMapBarcode,
  dbFieldMapSku,
  setDbFieldMapSku,
  dbFieldMapProdDate,
  setDbFieldMapProdDate,
  dbFieldMapExpDate,
  setDbFieldMapExpDate,

  daftraFieldMapName,
  setDaftraFieldMapName,
  daftraFieldMapPrice,
  setDaftraFieldMapPrice,
  daftraFieldMapBarcode,
  setDaftraFieldMapBarcode,
  daftraFieldMapSku,
  setDaftraFieldMapSku,
  daftraFieldMapProdDate,
  setDaftraFieldMapProdDate,
  daftraFieldMapExpDate,
  setDaftraFieldMapExpDate,

  ostadFieldMapName,
  setOstadFieldMapName,
  ostadFieldMapPrice,
  setOstadFieldMapPrice,
  ostadFieldMapBarcode,
  setOstadFieldMapBarcode,
  ostadFieldMapSku,
  setOstadFieldMapSku,
  ostadFieldMapProdDate,
  setOstadFieldMapProdDate,
  ostadFieldMapExpDate,
  setOstadFieldMapExpDate,

  isSyncingDb,
  dbSyncResult,
  onSync,
  selectLocalSqliteFile,
  isAutoSyncEnabled,
  setIsAutoSyncEnabled,
  isSmartSyncEnabled,
  setIsSmartSyncEnabled,
  autoSyncInterval,
  setAutoSyncInterval,
  lastAutoSyncTime,
  showSqlBridgeInstructions,
  setShowSqlBridgeInstructions,
  isElectron,
  cloudServerUrl,
  setCloudServerUrl,
  erpProvider,
  setErpProvider,
  erpSubdomain,
  setErpSubdomain,
  erpApiKey,
  setErpApiKey,
  erpCustomUrl,
  setErpCustomUrl,
  erpBranchId,
  setErpBranchId,
  daftraAuthType,
  setDaftraAuthType,
  daftraClientId,
  setDaftraClientId,
  daftraClientSecret,
  setDaftraClientSecret,
  daftraUsername,
  setDaftraUsername,
  daftraPassword,
  setDaftraPassword,
  webhookLogs,
  onClearWebhooks,
  onAddWebhookProduct,
  onPollWebhooks,
  isPollingWebhooks,
  divideBy100Sqlite,
  setDivideBy100Sqlite,
  divideBy100Api,
  setDivideBy100Api,
  divideBy100Erp,
  setDivideBy100Erp,
  divideBy100Webhook,
  setDivideBy100Webhook
}) => {
  const [copiedWebhookUrl, setCopiedWebhookUrl] = React.useState(false);
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

  const webhookUrl = `${getServerBaseUrl()}/api/webhook`;
  const detectedUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:') ? window.location.origin : '';

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopiedWebhookUrl(true);
      setTimeout(() => setCopiedWebhookUrl(false), 2000);
    });
  };

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
    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col gap-4 text-right font-sans" dir="rtl" id="db-sync-container">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2" id="db-sync-header">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-850">🔌 لوحة قنوات الاتصال والمزامنة الذكية بقواعد البيانات والأنظمة السحابية (ERP API & Webhooks)</h3>
            <p className="text-[10px] text-slate-450 mt-0.5">قم بإدارة اتصالاتك السحابية والمحلية بشكل منفصل. يمكنك الربط بين عدة مصادر ومزامنة الأصناف وتلقي الفواتير في آن واحد.</p>
          </div>
        </div>
        <span className={`text-[10px] self-start sm:self-center font-black px-2 py-0.5 rounded-full ${isElectron ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-150 text-slate-600'}`}>
          {isElectron ? '💻 بيئة سطح مكتب نشطة' : '🖥️ بيئة متصفح قياسية'}
        </span>
      </div>

      {/* Grid of the 4 independent connection channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card 1: SQLite local gateway */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-white ${dbSyncMode === 'sqlite' ? 'border-indigo-500 shadow-sm' : 'border-slate-200/80 hover:border-slate-300'}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <input {...focusProps} 
                  type="checkbox"
                  id="sync-type-sqlite"
                  checked={dbSyncMode === 'sqlite'}
                  onChange={() => {
                    setDbSyncMode('sqlite');
                    localStorage.setItem('db_sync_mode', 'sqlite');
                  }}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <span className="text-base">🗄️</span>
                <label htmlFor="sync-type-sqlite" className="font-extrabold text-xs text-slate-850 cursor-pointer select-none">
                  قناة اتصال قاعدة SQLite المحلية
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDbSyncMode('sqlite');
                  localStorage.setItem('db_sync_mode', 'sqlite');
                }}
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  dbSyncMode === 'sqlite'
                    ? 'bg-indigo-600 text-white border-indigo-650 font-bold'
                    : 'bg-slate-100 hover:bg-slate-150 text-slate-600 border-slate-200'
                }`}
              >
                {dbSyncMode === 'sqlite' ? '✓ نشطة حالياً' : 'تفعيل القناة 📌'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">📁 مسار ملف قاعدة بيانات SQLite المستهدفة في جهازك:</label>
                <input {...focusProps}
                  type="text"
                  placeholder="مثال: C:\POS_App\data\database.db"
                  value={sqlitePath}
                  onChange={(e) => {
                    setSqlitePath(e.target.value);
                    localStorage.setItem('sqlite_path', e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono"
                  dir="ltr"
                />
              </div>
              {isElectron ? (
                <button
                  type="button"
                  onClick={selectLocalSqliteFile}
                  className="bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  تصفح..
                </button>
              ) : (
                <span className="text-[9.5px] text-slate-450 bg-slate-100 px-2 rounded-lg border border-slate-200 block text-center font-bold self-end py-1.5">
                  يتطلب EXE مستقل
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">✍️ استعلام جلب وحصر المنتجات (SQL Query Command):</label>
              <textarea
                rows={2}
                value={sqliteQuery}
                onChange={(e) => {
                  setSqliteQuery(e.target.value);
                  localStorage.setItem('sqlite_query', e.target.value);
                }}
                placeholder="SELECT name, barcode, sku, code, price, prod_date, exp_date FROM products"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-left focus:bg-white"
                dir="ltr"
              />
            </div>

            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2 mt-1">
              <input {...focusProps}
                type="checkbox"
                id="divide-by-100-sqlite"
                checked={divideBy100Sqlite}
                onChange={(e) => {
                  setDivideBy100Sqlite(e.target.checked);
                  localStorage.setItem('db_divide_by_100_sqlite', e.target.checked.toString());
                }}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border border-slate-300 rounded focus:ring-0 cursor-pointer mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <label htmlFor="divide-by-100-sqlite" className="text-[10.5px] font-black text-amber-950 cursor-pointer select-none">
                  💰 تحويل السعر المسترد من هللة إلى ريال لـ (SQLite)
                </label>
                <span className="text-[9px] font-semibold text-amber-800">
                  عند التفعيل، سيقوم النظام بقسمة القيمة المالية لعمود السعر المسترد على 100 تلقائياً (السعر 200 هـ سيستورد كـ 2.00 ريال).
                </span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-blue-950">تأمين الأصفار البادئة للباركود في SQLite:</span>
                <span className="text-[9px] font-semibold text-blue-800 leading-relaxed">
                  تأكد تماماً من أن نوع عمود الباركود في جدول التزامن على SQLite لديك هو <strong className="font-extrabold text-blue-900">TEXT</strong> أو <strong className="font-extrabold text-blue-900">VARCHAR</strong> وليس نوعاً رقمياً (INTEGER/REAL)؛ وذلك لضمان عدم تلاشي أو حذف الأصفار البادئة في الرموز الكودية أثناء المزامنة.
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center gap-2">
            <span className="text-[9px] text-slate-400 font-mono">SQLite Gateway Active</span>
            <button
              type="button"
              onClick={() => onSync('sqlite')}
              disabled={isSyncingDb}
              className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb && dbSyncMode === 'sqlite' ? 'animate-spin' : ''}`} />
              مزامنة وجلب قاعدة SQLite المحلية 🗄️
            </button>
          </div>
        </div>

        {/* Card 2: REST API JSON Endpoint */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-white ${dbSyncMode === 'api' ? 'border-indigo-500 shadow-sm' : 'border-slate-200/80 hover:border-slate-300'}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <input {...focusProps} 
                  type="checkbox"
                  id="sync-type-api"
                  checked={dbSyncMode === 'api'}
                  onChange={() => {
                    setDbSyncMode('api');
                    localStorage.setItem('db_sync_mode', 'api');
                  }}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <span className="text-base">🌐</span>
                <label htmlFor="sync-type-api" className="font-extrabold text-xs text-slate-850 cursor-pointer select-none">
                  قناة اتصال واجهة REST API JSON
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDbSyncMode('api');
                  localStorage.setItem('db_sync_mode', 'api');
                }}
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  dbSyncMode === 'api'
                    ? 'bg-indigo-600 text-white border-indigo-650 font-bold'
                    : 'bg-slate-100 hover:bg-slate-150 text-slate-600 border-slate-200'
                }`}
              >
                {dbSyncMode === 'api' ? '✓ نشطة حالياً' : 'تفعيل القناة 📌'}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">🔗 رابط الاستقبال من خادم الربط المحلي (API Endpoint JSON):</label>
              <input {...focusProps}
                type="text"
                placeholder="http://localhost:4000/api/products"
                value={dbApiUrl}
                onChange={(e) => {
                  setDbApiUrl(e.target.value);
                  localStorage.setItem('db_api_url', e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono"
                dir="ltr"
              />
              <span className="text-[9px] text-slate-400 mt-1 block leading-snug">
                💡 يقبل البرنامج استيراد مصفوفات المنتجات المسترجعة بتنسيق JSON تلقائي لدعم الربط الحصري مع أنظمة نقاط POS المحلية.
              </span>
            </div>

            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2 mt-1">
              <input {...focusProps}
                type="checkbox"
                id="divide-by-100-api"
                checked={divideBy100Api}
                onChange={(e) => {
                  setDivideBy100Api(e.target.checked);
                  localStorage.setItem('db_divide_by_100_api', e.target.checked.toString());
                }}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border border-slate-300 rounded focus:ring-0 cursor-pointer mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <label htmlFor="divide-by-100-api" className="text-[10.5px] font-black text-amber-950 cursor-pointer select-none">
                  💰 تحويل السعر المسترد من هللة إلى ريال لـ (REST API JSON)
                </label>
                <span className="text-[9px] font-semibold text-amber-800">
                  عند التفعيل، سيتم معاملة حقل السعر كقيمة هللات وسيتم قسمته فوراً على 100 لتسجيله بالريال السعودي تلقائياً.
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center gap-2">
            <span className="text-[9px] text-slate-400 font-mono">REST API Active</span>
            <button
              type="button"
              onClick={() => onSync('api')}
              disabled={isSyncingDb}
              className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb && dbSyncMode === 'api' ? 'animate-spin' : ''}`} />
              مزامنة وجلب واجهة REST API 🌐
            </button>
          </div>
        </div>

        {/* Card 3: Cloud ERP (Daftra & Al-Ostad Accounts) */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-white ${dbSyncMode === 'cloud_erp' ? 'border-indigo-500 shadow-sm' : 'border-slate-200/80 hover:border-slate-300'}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <input {...focusProps} 
                  type="checkbox"
                  id="sync-type-erp"
                  checked={dbSyncMode === 'cloud_erp'}
                  onChange={() => {
                    setDbSyncMode('cloud_erp');
                    localStorage.setItem('db_sync_mode', 'cloud_erp');
                  }}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <span className="text-base">☁️</span>
                <label htmlFor="sync-type-erp" className="font-extrabold text-xs text-slate-850 cursor-pointer select-none">
                  قناة مزامنة أنظمة الـ ERP السحابية
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDbSyncMode('cloud_erp');
                  localStorage.setItem('db_sync_mode', 'cloud_erp');
                }}
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  dbSyncMode === 'cloud_erp'
                    ? 'bg-indigo-600 text-white border-indigo-650 font-bold'
                    : 'bg-slate-100 hover:bg-slate-150 text-slate-600 border-slate-200'
                }`}
              >
                {dbSyncMode === 'cloud_erp' ? '✓ نشطة حالياً' : 'تفعيل القناة 📌'}
              </button>
            </div>

            {/* Provider Selector inside the box */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setErpProvider('daftra');
                  localStorage.setItem('erp_provider', 'daftra');
                }}
                className={`py-1 rounded-md text-[10.5px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  erpProvider === 'daftra' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                🏢 نظام دفترة (Daftra ERP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setErpProvider('ostad');
                  localStorage.setItem('erp_provider', 'ostad');
                }}
                className={`py-1 rounded-md text-[10.5px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  erpProvider === 'ostad' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                🏛️ نظام الأستاذ (Al-Ostad)
              </button>
            </div>

            {erpProvider === 'daftra' ? (
              <div className="flex flex-col gap-3">
                {/* Daftra domain input - always required */}
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🏢 رابط حسابك بدفترة (الدومين):</label>
                  <input {...focusProps}
                    type="text"
                    placeholder="mycompany.daftra.com"
                    value={erpSubdomain}
                    onChange={(e) => {
                      setErpSubdomain(e.target.value);
                      localStorage.setItem('erp_subdomain', e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Authentication Type Selector */}
                <div className="bg-slate-100 p-0.5 rounded-lg grid grid-cols-2 text-center text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setDaftraAuthType('apikey');
                      localStorage.setItem('daftra_auth_type', 'apikey');
                    }}
                    className={`py-1 rounded-md transition-all ${
                      daftraAuthType === 'apikey'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    🔑 مفتاح الـ API مباشر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDaftraAuthType('oauth2');
                      localStorage.setItem('daftra_auth_type', 'oauth2');
                    }}
                    className={`py-1 rounded-md transition-all ${
                      daftraAuthType === 'oauth2'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    🔄 مصادقة OAuth2 (v2)
                  </button>
                </div>

                {/* Conditional Inputs */}
                {daftraAuthType === 'apikey' ? (
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🔑 مفتاح الـ API بدفترة:</label>
                    <input {...focusProps}
                      type="password"
                      placeholder="أدخل مفتاح الـ API..."
                      value={erpApiKey}
                      onChange={(e) => {
                        setErpApiKey(e.target.value);
                        localStorage.setItem('erp_api_key', e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 border-t border-slate-100 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">📧 البريد الإلكتروني أو اسم المستخدم:</label>
                        <input {...focusProps}
                          type="text"
                          placeholder="username or email"
                          value={daftraUsername}
                          onChange={(e) => {
                            setDaftraUsername(e.target.value);
                            localStorage.setItem('daftra_username', e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🔒 كلمة المرور لحساب دفترة:</label>
                        <input {...focusProps}
                          type="password"
                          placeholder="password..."
                          value={daftraPassword}
                          onChange={(e) => {
                            setDaftraPassword(e.target.value);
                            localStorage.setItem('daftra_password', e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🆔 معرف العميل Client ID:</label>
                        <input {...focusProps}
                          type="text"
                          placeholder="Client ID (افتراضي: 1)"
                          value={daftraClientId}
                          onChange={(e) => {
                            setDaftraClientId(e.target.value);
                            localStorage.setItem('daftra_client_id', e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🔑 سر العميل Client Secret:</label>
                        <input {...focusProps}
                          type="password"
                          placeholder="Client Secret..."
                          value={daftraClientSecret}
                          onChange={(e) => {
                            setDaftraClientSecret(e.target.value);
                            localStorage.setItem('daftra_client_secret', e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🔗 رابط الـ API جلب الأصناف من الأستاذ:</label>
                  <input {...focusProps}
                    type="text"
                    placeholder="https://cloud.alostad.net/api/v1/products"
                    value={erpCustomUrl}
                    onChange={(e) => {
                      setErpCustomUrl(e.target.value);
                      localStorage.setItem('erp_custom_url', e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🏢 معرف فرع العمل (X-Branch-Id):</label>
                    <input {...focusProps}
                      type="text"
                      placeholder="رقم الفرع، مثل: 1"
                      value={erpBranchId}
                      onChange={(e) => {
                        setErpBranchId(e.target.value);
                        localStorage.setItem('erp_branch_id', e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-605 mb-0.5">🔑 ترويسة المصادقة Token:</label>
                    <input {...focusProps}
                      type="password"
                      placeholder="رمز ترخيص API الأستاذ..."
                      value={erpApiKey}
                      onChange={(e) => {
                        setErpApiKey(e.target.value);
                        localStorage.setItem('erp_api_key', e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2">
              <input {...focusProps}
                type="checkbox"
                id="divide-by-100-erp"
                checked={divideBy100Erp}
                onChange={(e) => {
                  setDivideBy100Erp(e.target.checked);
                  localStorage.setItem('db_divide_by_100_erp', e.target.checked.toString());
                }}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border border-slate-300 rounded focus:ring-0 cursor-pointer mt-0.5"
              />
              <div className="flex flex-col gap-0.5 text-right">
                <label htmlFor="divide-by-100-erp" className="text-[10.5px] font-black text-amber-950 cursor-pointer select-none">
                  💰 تحويل السعر المسترد من هللة إلى ريال لـ (Daftra & Ostad Cloud)
                </label>
                <span className="text-[9px] font-semibold text-amber-800">
                  عند التفعيل، سيقوم النظام بقسمة أسعار الأصناف المستوردة من النظام السحابي على 100 لتسهيل تسجيلها بالريال تلقائياً.
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center gap-2">
            <span className="text-[9px] text-slate-400 font-mono">Daftra/Ostad Bridge</span>
            <button
              type="button"
              onClick={() => onSync('cloud_erp')}
              disabled={isSyncingDb}
              className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb && dbSyncMode === 'cloud_erp' ? 'animate-spin' : ''}`} />
              جلب ومزامنة المخزن السحابي ☁️
            </button>
          </div>
        </div>

        {/* Card 4: Webhook Live Stream */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-white ${dbSyncMode === 'webhook_live' ? 'border-emerald-500 shadow-sm' : 'border-slate-200/80 hover:border-slate-300'}`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <input {...focusProps} 
                  type="checkbox"
                  id="sync-type-webhook"
                  checked={dbSyncMode === 'webhook_live'}
                  onChange={() => {
                    setDbSyncMode('webhook_live');
                    localStorage.setItem('db_sync_mode', 'webhook_live');
                  }}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <label htmlFor="sync-type-webhook" className="font-extrabold text-xs text-slate-850 cursor-pointer select-none">
                  قناة استقبال البث والربط المباشر Webhook
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDbSyncMode('webhook_live');
                  localStorage.setItem('db_sync_mode', 'webhook_live');
                }}
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  dbSyncMode === 'webhook_live'
                    ? 'bg-emerald-600 text-white border-emerald-650 font-bold'
                    : 'bg-slate-100 hover:bg-slate-150 text-slate-600 border-slate-200'
                }`}
              >
                {dbSyncMode === 'webhook_live' ? '✓ نشطة حالياً' : 'تفعيل القناة 📌'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600">🔌 رابط استقبال البث المباشر (Webhook URL Target):</span>
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                    copiedWebhookUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {copiedWebhookUrl ? 'تمت عملية النسخ! ✓' : 'نسخ الرابط المستهدف 📋'}
                </button>
              </div>
              <input {...focusProps}
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-left font-mono text-slate-705 font-bold"
                dir="ltr"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <span className="text-[8.5px] text-slate-450">
                👉 قم بنسخ هذا الرابط المستحصد تماماً، وضعه ببرنامجك لربط أحداث التعديل والإنشاء الفورية للسلع.
              </span>
            </div>

            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2">
              <input {...focusProps}
                type="checkbox"
                id="divide-by-100-webhook"
                checked={divideBy100Webhook}
                onChange={(e) => {
                  setDivideBy100Webhook(e.target.checked);
                  localStorage.setItem('db_divide_by_100_webhook', e.target.checked.toString());
                }}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border border-slate-300 rounded focus:ring-0 cursor-pointer mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <label htmlFor="divide-by-100-webhook" className="text-[10.5px] font-black text-amber-950 cursor-pointer select-none">
                  💰 تحويل السعر المسترد من هللة إلى ريال لـ (Webhook Live Event)
                </label>
                <span className="text-[9px] font-semibold text-amber-800">
                  عند التفعيل، سيتم تقسيم السعر المسترد عبر حدث الـ Webhook على 100 لتحويله من هللة إلى ريال تلقائياً.
                </span>
              </div>
            </div>

            <div className="border border-slate-150 rounded-lg overflow-y-auto max-h-[85px] bg-slate-50">
              {webhookLogs.length === 0 ? (
                <div className="p-3 text-center text-[9px] text-slate-400">
                  لا توجد طلبات بث مستلمة حالياً
                </div>
              ) : (
                <div className="divide-y divide-slate-100 flex flex-col">
                  {webhookLogs.map((log: any) => {
                    const hasParsed = !!log.parsedProduct;
                    const item = log.parsedProduct || {};
                    return (
                      <div key={log.id} className="p-2 flex items-center justify-between gap-1 text-[10px] text-slate-700 hover:bg-slate-100/50">
                        <div className="truncate flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 truncate">
                            {hasParsed ? item.name : 'طلب بث خام'}
                          </span>
                          <span className="text-[8px] text-slate-450 font-mono" dir="ltr">{log.timestamp}</span>
                        </div>
                        {hasParsed && (
                          <button
                            type="button"
                            onClick={() => onAddWebhookProduct(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[8.5px] px-2 py-0.5 rounded transition-all cursor-pointer shrink-0"
                          >
                            ➕ إدراج
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[9px] text-slate-455">
            <span>Live Stream Socket Enabled</span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              قناة الاستقبال نشطة
            </span>
          </div>
        </div>
      </div>

      {/* Database Field Mappings Center */}
      <div className="flex flex-col gap-4" id="field-mappings-box">
        
        {/* SECTION 1: Daftra ERP Mappings */}
        <div className="bg-blue-50/45 rounded-xl p-3.5 border border-blue-100 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-blue-100 pb-1.5">
            <span className="font-extrabold text-[11px] text-blue-900 flex items-center gap-1">
              🏢 قسم مطابقة أعمدة نظام دفترة السحابي (Daftra ERP Mappings)
            </span>
            <span className="bg-blue-100 text-blue-800 text-[8.5px] font-bold px-2 py-0.5 rounded">
              Daftra Active Mapping
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-right font-semibold">
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">🏢 اسم الصنف:</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapName}
                onChange={(e) => {
                  setDaftraFieldMapName(e.target.value);
                  localStorage.setItem('daftraFieldMapName', e.target.value);
                  localStorage.setItem('daftra_field_map_name', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">💰 السعر (Price):</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapPrice}
                onChange={(e) => {
                  setDaftraFieldMapPrice(e.target.value);
                  localStorage.setItem('daftraFieldMapPrice', e.target.value);
                  localStorage.setItem('daftra_field_map_price', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">🏷️ باركود الملصق الكودي:</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapBarcode}
                onChange={(e) => {
                  setDaftraFieldMapBarcode(e.target.value);
                  localStorage.setItem('daftraFieldMapBarcode', e.target.value);
                  localStorage.setItem('daftra_field_map_barcode', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">📦 كود SKU / الرمز المميز:</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapSku}
                onChange={(e) => {
                  setDaftraFieldMapSku(e.target.value);
                  localStorage.setItem('daftraFieldMapSku', e.target.value);
                  localStorage.setItem('daftra_field_map_sku', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
                placeholder="sku"
              />
            </div>
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">📅 تاريخ الإنتاج:</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapProdDate}
                onChange={(e) => {
                  setDaftraFieldMapProdDate(e.target.value);
                  localStorage.setItem('daftraFieldMapProdDate', e.target.value);
                  localStorage.setItem('daftra_field_map_proddate', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-blue-800/80 font-bold mb-0.5">📅 تاريخ الانتهاء الصلاحية:</label>
              <input {...focusProps}
                type="text"
                value={daftraFieldMapExpDate}
                onChange={(e) => {
                  setDaftraFieldMapExpDate(e.target.value);
                  localStorage.setItem('daftraFieldMapExpDate', e.target.value);
                  localStorage.setItem('daftra_field_map_expdate', e.target.value);
                }}
                className="w-full bg-white border border-blue-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <span className="text-[8px] text-blue-700/80 leading-tight">
            ℹ️ تطابق هذه الأعمدة الحقول المخزنة في حسابك على نظام دفترة لضمان دقة جلب البيانات ومنع التداخل.
          </span>
        </div>

        {/* SECTION 2: Al-Ostad ERP Mappings */}
        <div className="bg-amber-50/45 rounded-xl p-3.5 border border-amber-100 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-amber-100 pb-1.5">
            <span className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1">
              💰 قسم مطابقة أعمدة نظام الأستاذ (Al-Ostad Mappings)
            </span>
            <span className="bg-amber-100 text-amber-800 text-[8.5px] font-bold px-2 py-0.5 rounded">
              Al-Ostad Active Mapping
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-right font-semibold">
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">🏢 اسم الصنف:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapName}
                onChange={(e) => {
                  setOstadFieldMapName(e.target.value);
                  localStorage.setItem('ostadFieldMapName', e.target.value);
                  localStorage.setItem('ostad_field_map_name', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">💰 السعر:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapPrice}
                onChange={(e) => {
                  setOstadFieldMapPrice(e.target.value);
                  localStorage.setItem('ostadFieldMapPrice', e.target.value);
                  localStorage.setItem('ostad_field_map_price', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">🏷️ الباركود:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapBarcode}
                onChange={(e) => {
                  setOstadFieldMapBarcode(e.target.value);
                  localStorage.setItem('ostadFieldMapBarcode', e.target.value);
                  localStorage.setItem('ostad_field_map_barcode', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">📦 كود SKU الحقيقي:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapSku}
                onChange={(e) => {
                  setOstadFieldMapSku(e.target.value);
                  localStorage.setItem('ostadFieldMapSku', e.target.value);
                  localStorage.setItem('ostad_field_map_sku', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
                placeholder="sku"
              />
            </div>
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">📅 تاريخ الإنتاج:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapProdDate}
                onChange={(e) => {
                  setOstadFieldMapProdDate(e.target.value);
                  localStorage.setItem('ostadFieldMapProdDate', e.target.value);
                  localStorage.setItem('ostad_field_map_proddate', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-amber-800/80 font-bold mb-0.5">📅 تاريخ الانتهاء:</label>
              <input {...focusProps}
                type="text"
                value={ostadFieldMapExpDate}
                onChange={(e) => {
                  setOstadFieldMapExpDate(e.target.value);
                  localStorage.setItem('ostadFieldMapExpDate', e.target.value);
                  localStorage.setItem('ostad_field_map_expdate', e.target.value);
                }}
                className="w-full bg-white border border-amber-200/80 rounded px-2 py-1 text-xs font-mono text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <span className="text-[8px] text-amber-700/80 leading-tight">
            ℹ️ تطابق هذه الحقول هيكلة الجداول المحددة مسبقاً في قاعدة بيانات برنامج الأستاذ المالي والحسابي.
          </span>
        </div>

        {/* SECTION 3: General API & SQLite File Mappings */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <span className="font-extrabold text-[11px] text-slate-800 flex items-center gap-1">
              💻 مطابقة أعمدة ملفات SQLite والروابط العامة (General API/SQLite Mappings)
            </span>
            <span className="bg-slate-200 text-slate-800 text-[8.5px] font-bold px-2 py-0.5 rounded">
              Standard Database Mapping
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-right font-semibold">
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">🏢 اسم الصنف:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapName}
                onChange={(e) => {
                  setDbFieldMapName(e.target.value);
                  localStorage.setItem('dbFieldMapName', e.target.value);
                  localStorage.setItem('db_field_map_name', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">💰 السعر:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapPrice}
                onChange={(e) => {
                  setDbFieldMapPrice(e.target.value);
                  localStorage.setItem('dbFieldMapPrice', e.target.value);
                  localStorage.setItem('db_field_map_price', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">🏷️ الباركود:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapBarcode}
                onChange={(e) => {
                  setDbFieldMapBarcode(e.target.value);
                  localStorage.setItem('dbFieldMapBarcode', e.target.value);
                  localStorage.setItem('db_field_map_barcode', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">📦 كود SKU الحقل:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapSku}
                onChange={(e) => {
                  setDbFieldMapSku(e.target.value);
                  localStorage.setItem('dbFieldMapSku', e.target.value);
                  localStorage.setItem('db_field_map_sku', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
                placeholder="sku"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">📅 تاريخ الإنتاج:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapProdDate}
                onChange={(e) => {
                  setDbFieldMapProdDate(e.target.value);
                  localStorage.setItem('dbFieldMapProdDate', e.target.value);
                  localStorage.setItem('db_field_map_proddate', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-0.5">📅 تاريخ الانتهاء:</label>
              <input {...focusProps}
                type="text"
                value={dbFieldMapExpDate}
                onChange={(e) => {
                  setDbFieldMapExpDate(e.target.value);
                  localStorage.setItem('dbFieldMapExpDate', e.target.value);
                  localStorage.setItem('db_field_map_expdate', e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-center focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <span className="text-[8px] text-slate-500/80 leading-tight">
            ℹ️ تطبق هذه التكوينات حصرياً عند اختيار نمط الاتصال بـ SQLite محلياً، أو الربط بروابط الويب API المفتوحة.
          </span>
        </div>

      </div>

      {/* Smart Mirror Sync Integration */}
      <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 flex flex-col gap-2 shadow-3xs" id="smart-mirror-sync-box">
        <div className="flex items-start gap-2.5">
          <input {...focusProps}
            type="checkbox"
            id="db-smart-sync-toggle"
            checked={isSmartSyncEnabled}
            onChange={(e) => {
              setIsSmartSyncEnabled(e.target.checked);
              localStorage.setItem('db_smart_sync_enabled', e.target.checked.toString());
            }}
            className="w-4 h-4 text-emerald-600 bg-slate-100 border border-emerald-300 rounded focus:ring-0 cursor-pointer mt-0.5"
          />
          <div className="flex flex-col gap-0.5 text-right">
            <label htmlFor="db-smart-sync-toggle" className="text-[11.5px] font-black text-emerald-950 cursor-pointer select-none">
              🌐 ربط وتفعيل ميزة المرآة الذكية الذاتية (Smart Mirror Auto-Sync)
            </label>
            <span className="text-[9.5px] text-emerald-800 leading-tight block">
              عند التفعيل، سيقوم النظام بمزامنة أي تغيير على المخزن وجرد السلع تلقائياً مع الشاشة الذكية لضمان تطابق الجرد الفوري دون تدخل يدوي.
            </span>
          </div>
        </div>
      </div>

      {/* Background Auto Sync */}
      <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs" id="background-auto-sync-box">
        <div className="flex items-start gap-2.5">
          <input {...focusProps}
            type="checkbox"
            id="db-auto-sync-toggle"
            checked={isAutoSyncEnabled}
            onChange={(e) => {
              setIsAutoSyncEnabled(e.target.checked);
              localStorage.setItem('db_auto_sync_enabled', e.target.checked.toString());
            }}
            className="w-4 h-4 text-indigo-600 bg-slate-100 border border-indigo-300 rounded focus:ring-0 cursor-pointer mt-0.5"
          />
          <div className="flex flex-col gap-0.5 text-right">
            <label htmlFor="db-auto-sync-toggle" className="text-[11.5px] font-black text-indigo-950 cursor-pointer select-none">
              ⏰ جلب وتحديث المخزون التلقائي الدائم (Background Auto Sync)
            </label>
            <span className="text-[9.5px] text-slate-450 block leading-tight">
              يقوم بسحب وتحديث قوائم الأكواد والأسعار دورياً بالمخزن دون مقاطعة العمل.
            </span>
          </div>
        </div>

        {isAutoSyncEnabled && (
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0">
            <span className="text-[9.5px] text-slate-500 font-bold">كل</span>
            <input {...focusProps}
              type="number"
              min="1"
              max="180"
              value={autoSyncInterval}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 5);
                setAutoSyncInterval(val);
                localStorage.setItem('db_auto_sync_interval', val.toString());
              }}
              className="w-12 text-center bg-slate-50 border border-slate-200 rounded text-xs font-bold py-0.5 px-1"
            />
            <span className="text-[9.5px] text-indigo-750 font-black">دقائق</span>
          </div>
        )}
      </div>

      {/* Output / Results & Last sync timestamp area */}
      {(lastAutoSyncTime || dbSyncMode) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60 pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {lastAutoSyncTime && (
              <span className="text-[10px] text-indigo-805 text-indigo-800 font-black bg-indigo-50 px-2.5 py-1 rounded border border-indigo-120 flex items-center gap-1">
                ⏱️ آخر تحديث مستودع ناجح: {lastAutoSyncTime}
              </span>
            )}
            
            {dbSyncMode && (
              <span className="text-[9.5px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded font-extrabold">
                القناة النشطة لحسابات الفواتير المطبقة: <strong className="text-slate-800 font-black">
                  {dbSyncMode === 'sqlite' ? 'SQLite محلي' :
                   dbSyncMode === 'api' ? 'REST API' :
                   dbSyncMode === 'cloud_erp' ? 'نظام ERP سحابي' : 'بث Webhook مباشر'}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sync Execution Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
        <div className="text-right">
          {lastAutoSyncTime && (
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              آخر تحديث مستودع ناجح: {lastAutoSyncTime}
            </span>
          )}
        </div>
        
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncingDb}
          className="bg-indigo-650 hover:bg-indigo-700 shadow-md shadow-indigo-100 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
          {isSyncingDb ? 'جاري الاتصال والفرز الآن...' : 'بدء الاتصال وجلب المخزون الآن 🔌'}
        </button>
      </div>

      {/* Sync Status / Results Block */}
      {dbSyncResult && (
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
          dbSyncResult.success 
            ? 'bg-emerald-50 border-emerald-150 text-emerald-900' 
            : 'bg-rose-50 border-rose-150 text-rose-900'
        }`} id="sync-results-pushed">
          {dbSyncResult.success ? (
            <>
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-[11.5px] leading-relaxed">
                <strong>تم الاتصال والمزامنة بنجاح! 🟢</strong> تم استيراد وتغذية عدد <strong>{dbSyncResult.count}</strong> حقل سلعة جديدة بنجاح في القائمة الحالية دون تكرار الأكواد.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-650 mt-0.5 flex-shrink-0" />
              <div className="text-[11.5px] leading-relaxed">
                <strong>عطل بقناة الربط والداتا! 🔴</strong> {dbSyncResult.error}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseSyncPanel;
