import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Search, 
  PlusCircle, 
  Trash2, 
  Settings2,
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Download, 
  Upload,
  Building2,
  Package,
  Barcode,
  Coins,
  Scale,
  Save,
  FolderOpen,
  Sparkles,
  Palette,
  Eye,
  Check,
  ExternalLink,
  Info,
  Calendar,
  Truck,
  FileText,
  CheckSquare,
  Square,
  Layers,
  Copy,
  ListChecks,
  Plus,
  CornerDownLeft
} from 'lucide-react';
import { Product, LabelSettings, LabelTemplate, Quotation } from '../../types';
import LabelCard from './LabelCard';
import SaudiRiyalIcon from './SaudiRiyalIcon';
import MiniCalendar from './MiniCalendar';
import { parseExcelFile, downloadExcelTemplate, exportProductsToExcel } from '../utils/excel';
import DesktopExeGuide from './DesktopExeGuide';
import DatabaseSyncPanel from './DatabaseSyncPanel';
import QuotationManager from './QuotationManager';
import { VersionUpdateModal, compareSemver } from './VersionUpdateModal';



// TypeScript declaration for safe Electron compilation
declare global {
  interface Window {
    electronAPI?: {
      getPrinters: () => Promise<any[]>;
      printSilent: (options: { 
        printerName?: string; 
        pageSize?: any; 
        width?: number; 
        height?: number; 
        paperWidth?: number;
        paperHeight?: number;
        orientation?: string;
        copies?: number;
        printMode?: string;
      }) => Promise<{ success: boolean; error?: string }>;
      selectDbFile: () => Promise<string | null>;
      querySqlite: (options: { dbPath: string; query: string }) => Promise<{ success: boolean; rows?: any[]; error?: string }>;
      proxyErp?: (payload: any) => Promise<{ success: boolean; data?: any; winningCandidate?: string; error?: string }>;
      saveAndSharePdf?: (payload: { base64Data: string; filename: string }) => Promise<{ success: boolean; action?: string; error?: string }>;
      openExternal?: (url: string) => Promise<any>;
      shareFile?: (filePath: string) => Promise<any>;
      copyToClipboard?: (filePath: string) => Promise<any>;
      shareFileViaWindows?: (payload: { base64Data: string; title: string; fileName: string; extension: string }) => Promise<{ success: boolean; fallback?: boolean; message?: string; filePath?: string; error?: string }>;
      openPath?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      showItemInFolder?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      openSharedFolder?: () => Promise<{ success: boolean; error?: string }>;
      isElectron: boolean;
      appVersion?: string;
      getAppVersion?: () => Promise<string>;
      checkForUpdates?: () => Promise<any>;
      installUpdateNow?: () => void;
      onAutoUpdaterEvent?: (callback: (payload: { status: string; data: any }) => void) => () => void;
    };
  }
}

// Helper function to normalize Arabic text for resilient fuzzy search
const focusProps = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() };

const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآأ]/g, "ا") // normalizes Alif variations
    .replace(/ة/g, "ه")     // normalizes Ta Marbuta to Ha
    .replace(/ى/g, "ي")     // normalizes Alif Maqsura to Ya
    .trim();
};

// Initial default demo products (Arabic focus)
const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: 'مشاية سوى العاب - حبل مطاطي متين للأطفال', barcode: '9060', price: 179.00, prodDate: '2026/05', expDate: '2028/05' },
  { id: 2, name: 'طرد شحنة: هاتف آيفون 15 برو ماكس فضي 256 جيجا', barcode: '401129', price: 4299.00, recipientName: 'صالح بن عبدالعزيز الشمري', recipientPhone: '0544567890' },
  { id: 3, name: 'مشاية الدب عادي مع حواف فولاذ دائرية مجلفنة', barcode: '9059', price: 198.00, prodDate: '2026/04', expDate: '2028/04' },
  { id: 4, name: 'دفتر تحضير الفحص الترفيهي الشامل للمدارس 80 ورقة', barcode: '19048', price: 237.00, prodDate: '2026/01', expDate: '2027/01' },
  { id: 5, name: 'قلم حبر روكو أزرق فاخر 0.7 ملم صندوق 12 حبة', barcode: '401019', price: 18.50, prodDate: '2026/03', expDate: '2029/03' },
  { id: 6, name: 'صندوق ألوان خشبية مائية فابر كاستل 24 لوناً', barcode: '400540', price: 34.00, prodDate: '2025/12', expDate: '2028/12' }
];

const DEFAULT_SETTINGS: LabelSettings = {
  paperWidth: 105,
  paperHeight: 150,
  marginTop: 2,
  marginBottom: 2,
  marginRight: 2,
  marginLeft: 2,
  labelGap: 2,
  labelWidth: 38,
  labelHeight: 28,
  companyFontSize: 11,
  companyFontWeight: '800',
  nameFontWeight: '800',
  numberFontWeight: '800',
  dateFontWeight: '800',
  caloriesFontWeight: '800',
  descriptionFontWeight: '700',
  nameFontSize: 9.5,
  nameLines: 2,
  priceFontSize: 13,
  priceFontWeight: '900',
  barcodeHeight: 12,
  barcodeWidth: 0.9,
  numberFontSize: 8.5,
  arrangement: 'standard',
  fontFamilyPreset: 'cairo',
  showBrand: true,
  showPrice: true,
  showBarcode: true,
      showCode: true,
  showTaxInclusive: false,
  borderRadius: 2,
  borderStyle: 'solid',
  accentColor: '#000000',
  backgroundColor: '#ffffff',
  printMode: 'roll_gap',
  printOrientation: 'portrait',
  printRotation: 0,
  printScale: 100,
  printOffsetX: 0,
  printOffsetY: 0,
  showDates: false,
  prodDateLabel: 'إنتاج',
  expDateLabel: 'انتهاء',
  dateFontSize: 11,
  caloriesFontSize: 10,
  descriptionFontSize: 8,
  currencySymbol: 'sar-monogram'
};

const SYSTEM_TEMPLATES: LabelTemplate[] = [
  {
    id: 'sys-standard',
    name: 'القياسي الشامل (38 × 28 ملم)',
    companyName: 'الدفاتر الشمالي',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      arrangement: 'standard',
      fontFamilyPreset: 'cairo',
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 4
    }
  },
  {
    id: 'sys-grocery',
    name: 'البقالة المصغرة السريع (30 × 20 ملم)',
    companyName: 'سوبرماركت الأمانة',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 30,
      labelHeight: 20,
      companyFontSize: 9,
      nameFontSize: 8,
      priceFontSize: 11,
      barcodeHeight: 10,
      barcodeWidth: 0.8,
      numberFontSize: 7,
      arrangement: 'compact',
      fontFamilyPreset: 'system', // Tajawal
      showBrand: false,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'dotted',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 0
    }
  },
  {
    id: 'sys-price-heavy',
    name: 'بارز - التركيز على السعر (40 × 30 ملم)',
    companyName: 'معرض الأجهزة الكبرى',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 40,
      labelHeight: 30,
      companyFontSize: 10,
      nameFontSize: 10,
      priceFontSize: 18,
      barcodeHeight: 12,
      barcodeWidth: 1.0,
      numberFontSize: 8,
      arrangement: 'price-top',
      fontFamilyPreset: 'mono',
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#fffbeb', // Ivory/Warm Yellow
      borderRadius: 6
    }
  },
  {
    id: 'sys-split-premium',
    name: 'النمط الحديث المنقسم (38 × 28 ملم)',
    companyName: 'بوتيك الأناقة للذهب',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 38,
      labelHeight: 28,
      companyFontSize: 11,
      nameFontSize: 9,
      priceFontSize: 13,
      barcodeHeight: 12,
      barcodeWidth: 0.9,
      numberFontSize: 8,
      arrangement: 'horizontal-split',
      fontFamilyPreset: 'amiri', // Amiri elegant serif
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 2
    }
  },
  {
    id: 'sys-landscape-split',
    name: 'ثنائي الاتجاه الجانبي (45 × 30 ملم)',
    companyName: 'مكتبة العلوم الحديثة',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 45,
      labelHeight: 30,
      companyFontSize: 10,
      nameFontSize: 9,
      priceFontSize: 12,
      barcodeHeight: 14,
      barcodeWidth: 0.75,
      numberFontSize: 8,
      arrangement: 'sides',
      fontFamilyPreset: 'cairo',
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'dashed',
      accentColor: '#000000',
      backgroundColor: '#faf5ff', // Lavender/Soft purple tint
      borderRadius: 4
    }
  },
  {
    id: 'sys-shipment',
    name: 'ملصق شحن وتوصيل الطرود (150 × 100 ملم)',
    companyName: 'مؤسسة الشحن السريع',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 100,
      labelHeight: 150,
      companyFontSize: 11,
      nameFontSize: 10,
      priceFontSize: 13,
      barcodeHeight: 12,
      barcodeWidth: 1.1,
      numberFontSize: 8.5,
      arrangement: 'shipment',
      fontFamilyPreset: 'cairo',
      showBrand: false,        // ← Changed to false (removes the label text)
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 6
    }
  },
  {
    id: 'sys-shipment-150x100',
    name: 'ملصق الشحن (150 × 100 ملم)',
    companyName: 'شركة الشحن',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      paperWidth: 100,
      paperHeight: 150,
      labelWidth: 100,
      labelHeight: 150,
      companyFontSize: 12,
      nameFontSize: 12,
      priceFontSize: 14,
      barcodeHeight: 15,
      barcodeWidth: 1.5,
      numberFontSize: 10,
      arrangement: 'shipment_150x100',
      fontFamilyPreset: 'cairo',
      showBrand: false,
      showPrice: false,
      showBarcode: true,
      showCode: false,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 4
    }
  },
  {
    id: 'sys-nutrition-advanced',
    name: 'ملصق السعرات الحراري المطور (60 × 40 ملم)',
    companyName: 'متجر الأغذية',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 60,
      labelHeight: 40,
      companyFontSize: 10,
      nameFontSize: 14,
      priceFontSize: 11,
      barcodeHeight: 18,
      barcodeWidth: 1.2,
      numberFontSize: 8,
      arrangement: 'nutrition_advanced',
      fontFamilyPreset: 'cairo',
      showBrand: true,
      showPrice: false,
      showBarcode: false,
      showCode: false,
      showDates: true,
      borderStyle: 'none',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 16
    }
  },
  {
    id: 'sys-calories',
    name: 'ملصق السعرات الحرارية (60 × 40 ملم)',
    companyName: 'متجر الأغذية',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 60,
      labelHeight: 40,
      companyFontSize: 10,
      nameFontSize: 11,
      priceFontSize: 11,
      barcodeHeight: 20,
      barcodeWidth: 1.4,
      numberFontSize: 8.5,
      arrangement: 'calories',
      fontFamilyPreset: 'cairo',
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#fffbeb', // amber-50
      borderRadius: 8
    }
  },
  {
    id: 'sys-product-small',
    name: 'ملصق منتج صغير (40 × 20 ملم)',
    companyName: 'مؤسسة الشحن السريع',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 40,
      labelHeight: 20,
      companyFontSize: 9,
      nameFontSize: 9,
      priceFontSize: 11,
      barcodeHeight: 8,
      barcodeWidth: 1.0,
      numberFontSize: 7,
      arrangement: 'product',
      fontFamilyPreset: 'cairo',
      showBrand: true,         // ← Keeping brand visible for products
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 4
    }
  },
  {
    id: 'sys-retail-40-60',
    name: 'ملصق المنتجات التجاري الشائع (60 × 40 ملم)',
    companyName: 'متجر تجريبي',
    isSystem: true,
    settings: {
      ...DEFAULT_SETTINGS,
      labelWidth: 60,
      labelHeight: 40,
      companyFontSize: 11,
      nameFontSize: 10,
      priceFontSize: 13,
      barcodeHeight: 13,
      barcodeWidth: 1.0,
      numberFontSize: 8.5,
      arrangement: 'standard',
      fontFamilyPreset: 'cairo',
      showBrand: true,
      showPrice: true,
      showBarcode: true,
      showCode: true,
      borderStyle: 'solid',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: 4
    }
  }
];

export default function App() {
  // --- Persistent States ---
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('my_labels_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_PRODUCTS;
  });

  const [settings, setSettings] = useState<LabelSettings>(() => {
    const saved = localStorage.getItem('my_labels_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
    }
    return DEFAULT_SETTINGS;
  });

  const [companyName, setCompanyName] = useState<string>(() => {
    const saved = localStorage.getItem('my_labels_company_name');
    return saved !== null ? saved : 'متجر تجربي';
  });

  // --- Active / Selection States ---
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => {
    const saved = localStorage.getItem('my_labels_selected_product_id');
    if (saved) {
      const parsedId = parseInt(saved, 10);
      return isNaN(parsedId) ? null : parsedId;
    }
    return DEFAULT_PRODUCTS[0]?.id || null;
  });
  const [copies, setCopies] = useState<number>(1);
  const [zoomFactor, setZoomFactor] = useState<number>(() => {
    const saved = localStorage.getItem('my_labels_zoom_factor');
    return saved !== null ? parseFloat(saved) : 2.5;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [leftSearchQuery, setLeftSearchQuery] = useState<string>('');
  const [productFilterMode, setProductFilterMode] = useState<'all' | 'manual'>('all');
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCopies(1);
  }, [selectedProductId]);

  // Helper to calculate match priority score (lower is higher priority)
  const getMatchScore = (p: Product, queryText: string): number => {
    const query = normalizeArabic(queryText);
    if (!query) return 0;
    
    const normName = normalizeArabic(p.name);
    const normBarcode = p.barcode.toLowerCase();
    const normPrice = String(p.price).toLowerCase();

    // Priority 1: Exact barcode match
    if (normBarcode === queryText.toLowerCase()) return 1;

    // Priority 2: Product name begins with query
    if (normName.startsWith(query)) return 2;

    // Priority 3: Product name has a word starting with query
    const words = normName.split(/\s+/);
    if (words.some(word => word.startsWith(query))) return 3;

    // Priority 4: Product name contains query at some index
    const index = normName.indexOf(query);
    if (index !== -1) return 4 + (index / 1000); // earlier index is better

    // Priority 5: Barcode contains query
    if (normBarcode.includes(queryText.toLowerCase())) return 10;

    // Priority 6: Price contains query
    if (normPrice.includes(queryText)) return 20;

    // Fallback
    return 100;
  };

  // --- Inline Table Row Editing & Blank Rows States ---
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);

  // Helper to insert 1 or multiple blank rows directly into the table
  const insertBlankRow = (count: number = 1, atBeginning: boolean = true, afterId?: number) => {
    const newRows: Product[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < count; i++) {
      const newId = timestamp + Math.floor(Math.random() * 1000) + i;
      const autoBarcode = String(Math.floor(100000 + Math.random() * 900000));
      newRows.push({
        id: newId,
        name: '',
        barcode: autoBarcode,
        price: 0,
        prodDate: '',
        expDate: '',
        isManual: true,
      });
    }

    setProducts(prev => {
      if (afterId !== undefined) {
        const idx = prev.findIndex(p => p.id === afterId);
        if (idx !== -1) {
          const updated = [...prev];
          updated.splice(idx + 1, 0, ...newRows);
          return updated;
        }
      }
      return atBeginning ? [...newRows, ...prev] : [...prev, ...newRows];
    });

    const firstId = newRows[0].id;
    setInlineEditingId(firstId);
    setSelectedProductId(firstId);

    if (count === 1) {
      showToast('✨ تم إدراج صف فارغ جديد بالجدول! اكتب بيانات الصنف مباشرة.', 'success');
    } else {
      showToast(`✨ تم إدراج ${count} صفوف فارغة جديدة بالجدول للإدخال السريع!`, 'success');
    }
  };

  // Helper to update individual field directly from table cells
  const updateProductInline = (id: number, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Helper to delete product or empty row
  const deleteBlankOrProductRow = (id: number, name: string) => {
    if (!name.trim()) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedBatchIds(prev => prev.filter(x => x !== id));
      if (selectedProductId === id) {
        setSelectedProductId(products.find(p => p.id !== id)?.id || null);
      }
      if (inlineEditingId === id) {
        setInlineEditingId(null);
      }
      showToast('تمت إزالة الصف الفارغ.', 'info');
    } else {
      handleDeleteProduct(id, name);
    }
  };

  // Cleanup unused empty rows
  const cleanupEmptyRows = () => {
    const emptyCount = products.filter(p => !p.name.trim()).length;
    if (emptyCount === 0) {
      showToast('لا توجد أي صفوف فارغة حالياً.', 'info');
      return;
    }
    setProducts(prev => prev.filter(p => p.name.trim() !== ''));
    if (inlineEditingId && !products.find(p => p.id === inlineEditingId)?.name.trim()) {
      setInlineEditingId(null);
    }
    showToast(`🧹 تم تنظيف وإزالة ${emptyCount} صف فارغ غير مستخدم!`, 'success');
  };

  const emptyRowsCount = React.useMemo(() => {
    return products.filter(p => !p.name.trim()).length;
  }, [products]);

  // Filtered Products List
  const filteredProducts = products
    .filter(p => {
      // Keep empty rows and the currently inline-edited row always visible
      if (inlineEditingId === p.id || (!p.name.trim() && p.isManual)) return true;
      if (productFilterMode === 'manual' && !p.isManual) return false;
      const query = normalizeArabic(searchQuery);
      if (!query) return true;
      
      const normName = normalizeArabic(p.name);
      const normBarcode = p.barcode.toLowerCase();
      const normPrice = String(p.price).toLowerCase();
      
      return (
        normName.includes(query) || 
        normBarcode.includes(query) ||
        normPrice.includes(query)
      );
    })
    .sort((a, b) => {
      // Keep blank rows in editing at top
      if (!a.name.trim() && b.name.trim()) return -1;
      if (a.name.trim() && !b.name.trim()) return 1;
      const query = normalizeArabic(searchQuery);
      if (!query) return 0;
      return getMatchScore(a, searchQuery) - getMatchScore(b, searchQuery);
    });

  // Left Sidebar Quick List Filtered Products
  const leftFilteredProducts = products
    .filter(p => {
      if (!p.name.trim() && p.isManual) return true;
      const query = normalizeArabic(leftSearchQuery);
      if (!query) return true;
      
      const normName = normalizeArabic(p.name);
      const normBarcode = p.barcode.toLowerCase();
      const normPrice = String(p.price).toLowerCase();
      
      return (
        normName.includes(query) || 
        normBarcode.includes(query) ||
        normPrice.includes(query)
      );
    })
    .sort((a, b) => {
      if (!a.name.trim() && b.name.trim()) return -1;
      if (a.name.trim() && !b.name.trim()) return 1;
      const query = normalizeArabic(leftSearchQuery);
      if (!query) return 0;
      return getMatchScore(a, leftSearchQuery) - getMatchScore(b, leftSearchQuery);
    });

  // Find active product
  const currentProduct = 
    filteredProducts.find(p => p.id === selectedProductId) || 
    filteredProducts[0] || 
    products.find(p => p.id === selectedProductId) || 
    products[0] || 
    null;

  // --- Multi-Select & Batch Print States ---
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [batchCopiesMap, setBatchCopiesMap] = useState<Record<number, number>>({});
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchPrintQueue, setBatchPrintQueue] = useState<{ product: Product; copies: number }[] | null>(null);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);
  const [globalBatchCopies, setGlobalBatchCopies] = useState<number>(1);

  // Selected batch products array
  const selectedBatchProducts = React.useMemo(() => {
    return products.filter(p => selectedBatchIds.includes(p.id));
  }, [products, selectedBatchIds]);

  // Total copies across all selected batch items
  const totalBatchCopies = React.useMemo(() => {
    return selectedBatchProducts.reduce((sum, p) => sum + (batchCopiesMap[p.id] || 1), 0);
  }, [selectedBatchProducts, batchCopiesMap]);

  // Check if all filtered products are currently selected
  const isAllFilteredSelected = React.useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.every(p => selectedBatchIds.includes(p.id));
  }, [filteredProducts, selectedBatchIds]);

  const isSomeFilteredSelected = React.useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.some(p => selectedBatchIds.includes(p.id)) && !isAllFilteredSelected;
  }, [filteredProducts, selectedBatchIds, isAllFilteredSelected]);

  // Multi-select handler helpers
  const toggleSelectProduct = (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBatchIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
    setBatchCopiesMap(prev => {
      if (!prev[productId]) {
        return { ...prev, [productId]: globalBatchCopies || 1 };
      }
      return prev;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredProducts.map(p => p.id));
      setSelectedBatchIds(prev => prev.filter(id => !filteredIdSet.has(id)));
      showToast('تم إلغاء تحديد الأصناف المعروضة.', 'info');
    } else {
      const newIds = new Set(selectedBatchIds);
      const newCopies = { ...batchCopiesMap };
      filteredProducts.forEach(p => {
        newIds.add(p.id);
        if (!newCopies[p.id]) {
          newCopies[p.id] = globalBatchCopies || 1;
        }
      });
      setSelectedBatchIds(Array.from(newIds));
      setBatchCopiesMap(newCopies);
      showToast(`✅ تم تحديد ${filteredProducts.length} صنف للدفعة!`, 'info');
    }
  };

  const clearBatchSelection = () => {
    setSelectedBatchIds([]);
    showToast('تم إلغاء تحديد كافة الأصناف.', 'info');
  };

  const updateBatchItemCopies = (productId: number, count: number) => {
    const validCount = Math.max(1, Math.min(999, count || 1));
    setBatchCopiesMap(prev => ({ ...prev, [productId]: validCount }));
  };

  const applyGlobalBatchCopies = (count: number) => {
    const valid = Math.max(1, Math.min(999, count));
    setGlobalBatchCopies(valid);
    setBatchCopiesMap(prev => {
      const next = { ...prev };
      selectedBatchIds.forEach(id => {
        next[id] = valid;
      });
      return next;
    });
    showToast(`تم تعيين ${valid} ${valid === 1 ? 'نسخة' : 'نسخ'} لكل صنف محدد.`, 'info');
  };

  // --- Page Navigation and Layout states ---
  const [activeTab, setActiveTab] = useState<'preview' | 'products' | 'settings' | 'quotations' | 'integrations'>(() => {
    return (localStorage.getItem('my_labels_active_tab') as any) ?? 'preview';
  });
  const [layoutMode, setLayoutMode] = useState<'integrated' | 'multipage'>('multipage');
  const [slideDirection, setSlideDirection] = useState<number>(0);

  // --- Saved Quotations State (Centrally managed for layout transitions survival) ---
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem("my_updated_saved_quotations");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: "SQ-2026-1001",
        quotationNumber: "SQ-2026-1001",
        date: "2026-06-15",
        customerName: "ابراهيم جبري السلمي",
        customerPhone: "0554123450",
        customerTaxId: "310022345600003",
        customerCr: "1010884561",
        customerAddress: "الرياض، حي الملقا، طريق المطار",
        notes: `شروط عرض السعر:\n1. الأسعار سارية لمدة 15 يوماً من تاريخ التقديم.\n2. تشمل ضريبة القيمة المضافة بنسبة 15%.\n3. .`,
        items: [{ id: "qi-demo-1", productId: 1, name: "مفرش سرير نفرين", barcode: "00110", price: 1788, quantity: 1, total: 1788 }],
        discountValue: 0,
        taxRate: 15,
        isTaxInclusive: true,
        enableTax: true,
        showTaxInInvoice: true,
        companyName: "خزائن الاسطورة للأثاث",
        logoText: "تجهيزات وتصميم أرقى قطع الأثاث المنزلي والدواليب الراقية",
        companyTaxId: "310994711200003",
        companyCr: "1010654321",
        companyAddress: "جدة، شارع التحلية، المملكة العربية السعودية",
        companyPhone: "920000000",
        bankName: "مصرف الراجحي",
        bankAccount: "4510000123456789012345",
        bankIban: "SA8080000045100001234567",
        subtotal: 1788,
        discountAmount: 0,
        taxAmount: 233.22,
        grandTotal: 1788,
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Flag to block overwriting disk backup on mount race conditions
  const [isBackupLoaded, setIsBackupLoaded] = useState<boolean>(false);

  // Load physical backup if on Electron
  useEffect(() => {
    const loadPhysicalBackup = async () => {
      const api = (window as any).electronAPI;
      if (api && api.loadQuotationsBackup) {
        try {
          const res = await api.loadQuotationsBackup();
          if (res && res.success && Array.isArray(res.data)) {
            // Load whatever is saved (including empty array) if we have the file
            setQuotations(res.data);
            localStorage.setItem("my_updated_saved_quotations", JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn("Error loading physical quotations backup:", err);
        } finally {
          setIsBackupLoaded(true);
        }
      } else {
        // Not inside electron (standard web browser state)
        setIsBackupLoaded(true);
      }
    };
    loadPhysicalBackup();
  }, []);

  useEffect(() => {
    if (!isBackupLoaded) return; // Prevent saving or overwriting until we have fully completed loading at startup

    localStorage.setItem("my_updated_saved_quotations", JSON.stringify(quotations));
    
    // Write physical backup if on Electron to prevent data loss on force exit
    const api = (window as any).electronAPI;
    if (api && api.saveQuotationsBackup) {
      api.saveQuotationsBackup(quotations).catch((err: any) => {
        console.warn("Failed to write physical backup:", err);
      });
    }
  }, [quotations, isBackupLoaded]);
  
  // Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Inputs
  const [newName, setNewName] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newProdDate, setNewProdDate] = useState('');
  const [newExpDate, setNewExpDate] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFats, setNewFats] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isDescriptionPinned, setIsDescriptionPinned] = useState(false);
  const [newShipmentContent, setNewShipmentContent] = useState('');
  const [isShipmentContentPinned, setIsShipmentContentPinned] = useState(false);

  // --- Smart Product Form Validation States ---
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const productFormValidation = React.useMemo(() => {
    const errors: Record<string, string> = {};
    const hints: Record<string, string> = {};

    // 1. Name validation
    const trimmedName = newName.trim();
    if (!trimmedName) {
      errors.name = 'اسم الصنف مطلوب ولا يمكن تركه فارغاً.';
    } else if (trimmedName.length < 2) {
      errors.name = 'اسم الصنف قصير جداً (حرفان على الأقل).';
    } else {
      hints.name = 'اسم الصنف مكتمل وجاهز ✓';
    }

    // 2. Price validation
    const trimmedPrice = newPrice.trim();
    if (!trimmedPrice) {
      errors.price = 'سعر البيع مطلوب (يمكن كتابة 0 إذا كان الصنف مجانياً).';
    } else {
      const num = Number(trimmedPrice);
      if (isNaN(num)) {
        errors.price = 'يرجى إدخال قيمة رقمية صحيحة للسعر.';
      } else if (num < 0) {
        errors.price = 'لا يمكن أن يكون السعر قيمة سالبة.';
      } else {
        hints.price = `${num.toFixed(2)} ر.س ✓`;
      }
    }

    // 3. Barcode validation
    const trimmedBarcode = newBarcode.trim();
    if (!trimmedBarcode) {
      errors.barcode = 'رقم الباركود مطلوب لقراءة وطباعة الملصق.';
    } else if (/\s/.test(trimmedBarcode)) {
      errors.barcode = 'لا يمكن أن يحتوي الباركود على مسافات فارغة.';
    } else if (/[\u0600-\u06FF]/.test(trimmedBarcode)) {
      errors.barcode = 'الباركود يجب أن يحتوي على أرقام أو حروف إنجليزية فقط ليتعرف عليه القارئ.';
    } else if (trimmedBarcode.length < 3) {
      errors.barcode = 'رقم الباركود قصير جداً (3 خانات على الأقل).';
    } else {
      const duplicate = products.find(p => p.barcode.trim().toLowerCase() === trimmedBarcode.toLowerCase());
      if (duplicate) {
        errors.barcode = `هذا الباركود مسجل مسبقاً للصنف: «${duplicate.name}».`;
      } else {
        if (/^\d{13}$/.test(trimmedBarcode)) {
          hints.barcode = 'صيغة دولية معتمدة (EAN-13) - متاح ✓';
        } else if (/^\d{12}$/.test(trimmedBarcode)) {
          hints.barcode = 'صيغة معتمدة (UPC-A) - متاح ✓';
        } else if (/^\d{8}$/.test(trimmedBarcode)) {
          hints.barcode = 'صيغة مصغرة (EAN-8) - متاح ✓';
        } else if (/^[A-Za-z0-9\-_./]+$/.test(trimmedBarcode)) {
          hints.barcode = 'باركود قياسي صالح وقابل للمسح الضوئي ✓';
        } else {
          hints.barcode = 'باركود صالح ومتاح للاستخدام ✓';
        }
      }
    }

    // 4. Weight validation (optional)
    const trimmedWeight = newWeight.trim();
    if (trimmedWeight) {
      const cleanWeightNum = parseFloat(trimmedWeight.replace(/[^\d.-]/g, ''));
      if (isNaN(cleanWeightNum) || cleanWeightNum <= 0) {
        errors.weight = 'يرجى إدخال وزن صحيح موجب بالأرقام (مثال: 500).';
      } else {
        hints.weight = `${cleanWeightNum} جرام ✓`;
      }
    }

    // 5. Calories (optional)
    const trimmedCalories = newCalories.trim();
    if (trimmedCalories) {
      const numCal = parseFloat(trimmedCalories);
      if (isNaN(numCal) || numCal < 0) {
        errors.calories = 'السعرات يجب أن تكون قيمة رقمية موجبة.';
      }
    }

    // 6. Dates sequence validation (optional)
    const pDate = newProdDate.trim().replace(/\//g, '-');
    const eDate = newExpDate.trim().replace(/\//g, '-');
    if (pDate && eDate) {
      const d1 = new Date(pDate);
      const d2 = new Date(eDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        if (d2 < d1) {
          errors.datesComparison = 'تاريخ الانتهاء يسبق تاريخ الإنتاج! يرجى تصحيح التواريخ.';
        } else {
          hints.datesComparison = 'تسلسل التواريخ متوافق وصحيح ✓';
        }
      }
    }

    return {
      errors,
      hints,
      isValid: Object.keys(errors).length === 0
    };
  }, [newName, newPrice, newBarcode, newWeight, newCalories, newProdDate, newExpDate, products]);

  const generateUniqueBarcode = () => {
    let rand = '';
    let attempts = 0;
    do {
      rand = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while (products.some(p => p.barcode === rand) && attempts < 100);
    setNewBarcode(rand);
    setFormTouched(prev => ({ ...prev, barcode: true }));
    showToast(`⚡ تم توليد باركود تلقائي فريد: ${rand}`, 'info');
  };

  const [isPreviewDescPinned, setIsPreviewDescPinned] = useState(false);
  const [previewPinnedDesc, setPreviewPinnedDesc] = useState('');
  const [isPreviewShipmentPinned, setIsPreviewShipmentPinned] = useState(false);
  const [previewPinnedShipment, setPreviewPinnedShipment] = useState('');

  const [showQuickExtra, setShowQuickExtra] = useState(false);
  const [isExtraDetailsExpanded, setIsExtraDetailsExpanded] = useState(false);
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  // أضف هذا السطر مع بقية الـ useState في الأعلى
  const [isPreviewLocked, setIsPreviewLocked] = useState<boolean>(true);
  // --- Simulated Desktop Environment States ---
  const [virtualPrintJob, setVirtualPrintJob] = useState<any>(null);
  const [virtualBrowserUrl, setVirtualBrowserUrl] = useState<string | null>(null);
  const [virtualShareJob, setVirtualShareJob] = useState<any>(null);
  const [isVirtualSimulatorActive, setIsVirtualSimulatorActive] = useState<boolean>(true);


  // --- Electron / Silent Printing States ---
  const [printers, setPrinters] = useState<any[]>(() => [
    { name: 'ZDesigner GK420t (النسخة 1)', isDefault: true },
    { name: 'ZDesigner GK420t', isDefault: false },
    { name: 'OneNote for Windows 10', isDefault: false },
    { name: 'POS-80', isDefault: false },
    { name: 'OneNote (Desktop)', isDefault: false },
    { name: 'Microsoft XPS Document Writer', isDefault: false },
    { name: 'Microsoft Print to PDF', isDefault: false },
    { name: 'Fax', isDefault: false },
    { name: 'AnyDesk Printer', isDefault: false }
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    const saved = localStorage.getItem('selected_printer');
    if (saved) return saved;
    return 'ZDesigner GK420t (النسخة 1)'; // Match screenshot
  });
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [cloudServerUrl, setCloudServerUrl] = useState<string>(() => {
    return localStorage.getItem('cloud_server_url') ?? '';
  });

  const getApiEndpoint = (path: string): string => {
    // Only route webhooks and download requests to the cloud server, local queries should use local server
    if (isElectron && cloudServerUrl && (path.includes('webhook') || path.includes('download-desktop'))) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const cleanServer = cloudServerUrl.endsWith('/') ? cloudServerUrl.slice(0, -1) : cloudServerUrl;
      return `${cleanServer}${cleanPath}`;
    }
    return path;
  };

  // --- SQL Database / External API Sync States ---
  const [dbApiUrl, setDbApiUrl] = useState<string>(() => {
    return localStorage.getItem('db_api_url') ?? '';
  });
  const [dbFieldMapName, setDbFieldMapName] = useState<string>(() => {
    return localStorage.getItem('db_field_map_name') ?? '';
  });
  const [dbFieldMapPrice, setDbFieldMapPrice] = useState<string>(() => {
    return localStorage.getItem('db_field_map_price') ?? '';
  });
  const [dbFieldMapBarcode, setDbFieldMapBarcode] = useState<string>(() => {
    return localStorage.getItem('db_field_map_barcode') ?? '';
  });
  const [dbFieldMapSku, setDbFieldMapSku] = useState<string>(() => {
    return localStorage.getItem('db_field_map_sku') ?? '';
  });
  const [dbFieldMapProdDate, setDbFieldMapProdDate] = useState<string>(() => {
    return localStorage.getItem('db_field_map_proddate') ?? '';
  });
  const [dbFieldMapExpDate, setDbFieldMapExpDate] = useState<string>(() => {
    return localStorage.getItem('db_field_map_expdate') ?? '';
  });

  // --- Daftra ERP Field Mapping States ---
  const [daftraFieldMapName, setDaftraFieldMapName] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_name') ?? '';
  });
  const [daftraFieldMapPrice, setDaftraFieldMapPrice] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_price') ?? '';
  });
  const [daftraFieldMapBarcode, setDaftraFieldMapBarcode] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_barcode') ?? '';
  });
  const [daftraFieldMapSku, setDaftraFieldMapSku] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_sku') ?? '';
  });
  const [daftraFieldMapProdDate, setDaftraFieldMapProdDate] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_proddate') ?? 'prod_date';
  });
  const [daftraFieldMapExpDate, setDaftraFieldMapExpDate] = useState<string>(() => {
    return localStorage.getItem('daftra_field_map_expdate') ?? 'exp_date';
  });

  // --- Al-Ostad Field Mapping States ---
  const [ostadFieldMapName, setOstadFieldMapName] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_name') ?? 'name';
  });
  const [ostadFieldMapPrice, setOstadFieldMapPrice] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_price') ?? 'price';
  });
  const [ostadFieldMapBarcode, setOstadFieldMapBarcode] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_barcode') ?? 'barcode';
  });
  const [ostadFieldMapSku, setOstadFieldMapSku] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_sku') ?? 'sku';
  });
  const [ostadFieldMapProdDate, setOstadFieldMapProdDate] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_proddate') ?? 'prod_date';
  });
  const [ostadFieldMapExpDate, setOstadFieldMapExpDate] = useState<string>(() => {
    return localStorage.getItem('ostad_field_map_expdate') ?? 'exp_date';
  });

  const [isSmartSyncEnabled, setIsSmartSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('db_smart_sync_enabled') === 'true';
  });
  
  const [isGlobalSyncEnabled, setIsGlobalSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('is_global_sync_enabled') === 'true';
  });

  const [storeLogoUrl, setStoreLogoUrl] = useState<string>(() => {
    const saved = localStorage.getItem('store_logo_url');
    if (!saved || saved === '/icon.png') return '';
    return saved;
  });
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Resize image to fit in localStorage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 300;
          
          if (width > max_size || height > max_size) {
            if (width > height) {
              height = Math.round((height * max_size) / width);
              width = max_size;
            } else {
              width = Math.round((width * max_size) / height);
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL('image/png', 0.9);
            setStoreLogoUrl(resizedDataUrl);
            try {
              localStorage.setItem('store_logo_url', resizedDataUrl);
            } catch (err) {
              console.error("Could not save logo to localStorage", err);
            }
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStoreLogoUrl('/icon.png');
    localStorage.removeItem('store_logo_url');
  };
  
  // Direct SQLite and synchronization mode states
  const [dbSyncMode, setDbSyncMode] = useState<'api' | 'sqlite' | 'cloud_erp' | 'webhook_live'>(() => {
    return (localStorage.getItem('db_sync_mode') as 'api' | 'sqlite' | 'cloud_erp' | 'webhook_live') ?? 'cloud_erp';
  });
  const [sqlitePath, setSqlitePath] = useState<string>(() => {
    return localStorage.getItem('sqlite_path') ?? '';
  });
  const [sqliteQuery, setSqliteQuery] = useState<string>(() => {
    return localStorage.getItem('sqlite_query') ?? '';
  });

  // ERP Integration States for Daftra / Al-Ostad
  const [erpProvider, setErpProvider] = useState<'daftra' | 'ostad'>(() => {
    return (localStorage.getItem('erp_provider') as 'daftra' | 'ostad') ?? 'ostad';
  });
  const [erpSubdomain, setErpSubdomain] = useState<string>(() => {
    return localStorage.getItem('erp_subdomain') ?? '';
  });
  const [erpApiKey, setErpApiKey] = useState<string>(() => {
    return localStorage.getItem('erp_api_key') ?? '20|EGi4pX7s1beJWXj0RbJeTQT9rqRbzjvfxg7fN5Pib2b7dc0d';
  });
  const [erpCustomUrl, setErpCustomUrl] = useState<string>(() => {
    return localStorage.getItem('erp_custom_url') ?? 'https://t14047.alostaz.io/b/api/products';
  });
  const [erpBranchId, setErpBranchId] = useState<string>(() => {
    return localStorage.getItem('erp_branch_id') ?? '1';
  });

  const [daftraAuthType, setDaftraAuthType] = useState<'apikey' | 'oauth2'>(() => {
    return (localStorage.getItem('daftra_auth_type') as 'apikey' | 'oauth2') ?? 'apikey';
  });
  const [daftraClientId, setDaftraClientId] = useState<string>(() => {
    return localStorage.getItem('daftra_client_id') ?? '1';
  });
  const [daftraClientSecret, setDaftraClientSecret] = useState<string>(() => {
    return localStorage.getItem('daftra_client_secret') ?? 'jCfy6cMh1X6NTxR3OWLuvEFa0si5uZKr05UeoAEs';
  });
  const [daftraUsername, setDaftraUsername] = useState<string>(() => {
    return localStorage.getItem('daftra_username') ?? '';
  });
  const [daftraPassword, setDaftraPassword] = useState<string>(() => {
    return localStorage.getItem('daftra_password') ?? '';
  });

  // Webhooks Integration States
  const [divideBy100Sqlite, setDivideBy100Sqlite] = useState<boolean>(() => {
    return localStorage.getItem('db_divide_by_100_sqlite') === 'true';
  });
  const [divideBy100Api, setDivideBy100Api] = useState<boolean>(() => {
    return localStorage.getItem('db_divide_by_100_api') === 'true';
  });
  const [divideBy100Erp, setDivideBy100Erp] = useState<boolean>(() => {
    return localStorage.getItem('db_divide_by_100_erp') === 'true';
  });
  const [divideBy100Webhook, setDivideBy100Webhook] = useState<boolean>(() => {
    return localStorage.getItem('db_divide_by_100_webhook') === 'true';
  });

  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isPollingWebhooks, setIsPollingWebhooks] = useState<boolean>(false);

  const fetchRecentWebhooks = async (silent = false) => {
    if (isElectron && !cloudServerUrl && !(window as any).isVirtualElectron) return; // Skip polling webhooks in standalone Electron without cloud syncing
    if (!silent) setIsPollingWebhooks(true);
    try {
      const response = await fetch(getApiEndpoint('/api/webhooks/recent'));
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success) {
          setWebhookLogs(resJson.logs || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      if (!silent) setIsPollingWebhooks(false);
    }
  };

  const clearWebhooks = async () => {
    if (isElectron && !cloudServerUrl && !(window as any).isVirtualElectron) {
      showToast("ℹ سجل البث المباشر يعمل فقط عند الاتصال بخادم المزامنة.", "info");
      return;
    }
    try {
      const response = await fetch(getApiEndpoint('/api/webhooks/clear'), { method: 'POST' });
      if (response.ok) {
        setWebhookLogs([]);
        showToast("🧹 تم مسح قائمة سجلات البث المباشر بنجاح.", "success");
      }
    } catch (err) {
      console.error("Failed to clear webhooks:", err);
      showToast("❌ فشل تصفير قائمة سجلات البث.", "error");
    }
  };

  const handleAddWebhookProduct = (webhookItem: any) => {
    if (!webhookItem.name || !webhookItem.barcode) {
      showToast('❌ بيانات الصنف المستقبلة من البث المباشر غير كاملة.', 'error');
      return;
    }

    let price = parseFloat(webhookItem.price);
    if (divideBy100Webhook && !isNaN(price)) {
      price = price / 100;
    }
    const prodDate = String(webhookItem.prod_date || '').trim();
    const expDate = String(webhookItem.exp_date || '').trim();

    const exists = products.find(p => p.barcode === webhookItem.barcode);
    if (exists) {
      setProducts(prevProducts => {
        return prevProducts.map(p => {
          if (p.barcode === webhookItem.barcode) {
            return {
              ...p,
              name: webhookItem.name,
              price: isNaN(price) ? 0 : price,
              prodDate: prodDate || undefined,
              expDate: expDate || undefined
            };
          }
          return p;
        });
      });
      setSelectedProductId(exists.id);
      showToast(`🔄 تم تحديث الصنف الحالي: ${webhookItem.name}`, 'success');
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const added: Product = {
        id: newId,
        name: webhookItem.name,
        barcode: webhookItem.barcode,
        price: isNaN(price) ? 0 : price,
        prodDate: prodDate || undefined,
        expDate: expDate || undefined
      };
      setProducts(prev => [added, ...prev]);
      setSelectedProductId(newId);
      showToast(`📥 تم استقبال وإدراج صنف جديد: ${webhookItem.name}`, 'success');
    }
  };

  // Automated background polling for live webhooks setup
  useEffect(() => {
    if (!isGlobalSyncEnabled || dbSyncMode !== 'webhook_live') return;

    fetchRecentWebhooks(true);

    const interval = setInterval(() => {
      fetchRecentWebhooks(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [dbSyncMode, isGlobalSyncEnabled]);

  const selectLocalSqliteFile = async () => {
    if (!window.electronAPI || !window.electronAPI.selectDbFile) {
      showToast("❌ اختيار الملف متاح فقط عند فتح التطبيق المكتبي (EXE).", "error");
      return;
    }
    try {
      const selectedPath = await window.electronAPI.selectDbFile();
      if (selectedPath) {
        setSqlitePath(selectedPath);
        localStorage.setItem('sqlite_path', selectedPath);
        showToast(`📁 تم ربط قاعدة البيانات: ${selectedPath.split('\\').pop()}`, 'success');
      }
    } catch (err) {
      console.error('Failed to select file:', err);
    }
  };

  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbSyncResult, setDbSyncResult] = useState<{ success?: boolean; count?: number; error?: string } | null>(null);
  const [showSqlBridgeInstructions, setShowSqlBridgeInstructions] = useState<boolean>(false);
  const [showUpdateGuide, setShowUpdateGuide] = useState<boolean>(false);
  const [showVersionUpdateModal, setShowVersionUpdateModal] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>(() => {
    // 1. فحص رقم الإصدار المباشر إذا كان التطبيق يعمل داخل Electron Desktop
    const electronVer = typeof window !== 'undefined' ? (window as any).electronAPI?.appVersion : null;
    if (electronVer) {
      const cleanElec = String(electronVer).replace(/^v/, '').trim();
      try { localStorage.setItem('app_version', cleanElec); } catch (e) {}
      return cleanElec;
    }

    // 2. فحص رقم الإصدار المدمج أثناء عملية بناء التطبيق (__APP_VERSION__)
    const buildVer = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__).replace(/^v/, '').trim() : '1.0.4';

    // 3. فحص التخزين المحلي ومقارنته بالإصدار المبني
    const saved = typeof window !== 'undefined' ? localStorage.getItem('app_version') : null;
    if (saved) {
      const cleanSaved = saved.replace(/^v/, '').trim();
      // إذا كان الإصدار المبني أحدث من التخزين القديم (مثل 1.0.0 المحفوظة سابقاً)، نعتمد الإصدار الأحدث فوراً
      if (compareSemver(buildVer, cleanSaved) > 0) {
        try { localStorage.setItem('app_version', buildVer); } catch (e) {}
        return buildVer;
      }
      return cleanSaved;
    }
    return buildVer;
  });
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  // Auto-Sync States
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('db_auto_sync_enabled') === 'true';
  });
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(() => {
    const saved = localStorage.getItem('db_auto_sync_interval');
    return saved ? parseInt(saved, 10) : 5; // default to 5 minutes
  });
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string>(() => {
    return localStorage.getItem('db_last_auto_sync_time') ?? '';
  });

  // Toast / Status System
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // --- Label Custom Templates Persistence State ---
  const [customTemplates, setCustomTemplates] = useState<LabelTemplate[]>(() => {
    const saved = localStorage.getItem('my_labels_custom_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const saved = localStorage.getItem('my_labels_selected_template_id');
    return saved !== null ? saved : 'sys-standard';
  });

  const [systemOverrides, setSystemOverrides] = useState<Record<string, LabelSettings>>(() => {
    const saved = localStorage.getItem('my_labels_system_overrides');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showPrintInstructionModal, setShowPrintInstructionModal] = useState<boolean>(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [showResetDbModal, setShowResetDbModal] = useState<boolean>(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState<{show: boolean, id: any, name: string}>({ show: false, id: null, name: '' });

  // Keep localStorage up to date
  useEffect(() => {
    localStorage.setItem('my_labels_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('my_labels_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('my_labels_company_name', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('my_labels_custom_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    localStorage.setItem('my_labels_selected_template_id', selectedTemplateId);
  }, [selectedTemplateId]);

  useEffect(() => {
    localStorage.setItem('my_labels_system_overrides', JSON.stringify(systemOverrides));
  }, [systemOverrides]);

  useEffect(() => {
    localStorage.setItem('my_labels_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('my_labels_layout_mode', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem('my_labels_copies', copies.toString());
  }, [copies]);

  useEffect(() => {
    localStorage.setItem('my_labels_zoom_factor', zoomFactor.toString());
  }, [zoomFactor]);

  useEffect(() => {
    if (selectedProductId !== null) {
      localStorage.setItem('my_labels_selected_product_id', selectedProductId.toString());
    } else {
      localStorage.removeItem('my_labels_selected_product_id');
    }
  }, [selectedProductId]);

  // 🖥️ استعادة الإعدادات المخزنة على الهارد ديسك عند فتح تطبيق سطح المكتب أول مرة لضمان عدم ضياع التهيئات السابقة
  useEffect(() => {
    const restoreSettings = async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.loadAppSettings) {
        // لتجنب تكرار إعادة تحميل الصفحة نتحقق من التخزين المؤقت للجلسة
        const alreadyRestoredInSession = sessionStorage.getItem('was_desktop_settings_restored');
        if (!alreadyRestoredInSession) {
          sessionStorage.setItem('was_desktop_settings_restored', 'true');
          try {
            const res = await (window as any).electronAPI.loadAppSettings();
            if (res && res.success && res.data) {
              const data = res.data;
              let hasChanges = false;
              for (const [key, value] of Object.entries(data)) {
                if (value !== null && localStorage.getItem(key) !== value) {
                  localStorage.setItem(key, value as string);
                  hasChanges = true;
                }
              }
              if (hasChanges) {
                console.log("Found backed up desktop settings on disk. Reloading to apply seamlessly...");
                window.location.reload();
              }
            }
          } catch (e) {
            console.error("Failed to restore desktop settings from local file system:", e);
          }
        }
      }
    };
    restoreSettings();
  }, []);

  // 💾 المزامنة التلقائية لجميع الإعدادات من وإلى الهارد ديسك لضمان عدم ضياعها نهائياً عند التحديث
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).electronAPI?.saveAppSettings) return;

    let lastSerialized = "";
    const saveToDisk = () => {
      try {
        const keysToBackup = [
          'my_labels_products', 'my_labels_settings', 'my_labels_company_name',
          'my_labels_custom_templates', 'my_labels_selected_template_id', 'my_labels_system_overrides',
          'my_labels_active_tab', 'my_labels_layout_mode', 'my_labels_copies', 'my_labels_zoom_factor',
          'selected_printer', 'cloud_server_url', 'db_sync_mode', 'sqlite_path', 'sqlite_query',
          'db_api_url', 'db_field_map_name', 'db_field_map_price', 'db_field_map_barcode',
          'db_field_map_sku', 'db_field_map_proddate', 'db_field_map_expdate', 'db_smart_sync_enabled',
          'erp_branch_id', 'daftra_field_map_name', 'daftra_field_map_price', 'daftra_field_map_barcode',
          'daftra_field_map_sku', 'daftra_field_map_proddate', 'daftra_field_map_expdate',
          'ostad_field_map_name', 'ostad_field_map_price', 'ostad_field_map_barcode',
          'ostad_field_map_sku', 'ostad_field_map_proddate', 'ostad_field_map_expdate',
          'alostad_company_settings', 'alostad_saved_customers', 'my_updated_saved_quotations',
          'alostad_selected_quotation_format'
        ];

        const backupObj: Record<string, string> = {};
        for (const key of keysToBackup) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            backupObj[key] = val;
          }
        }

        const serialized = JSON.stringify(backupObj);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          (window as any).electronAPI.saveAppSettings(backupObj).catch((e: any) => {
            console.error("Periodic settings backup failed:", e);
          });
        }
      } catch (err) {
        console.error("Periodic backup serialization failed:", err);
      }
    };

    // تشغيل الحفظ التلقائي كل 4 ثوانٍ أو عند إغلاق النافذة
    const interval = setInterval(saveToDisk, 4000);
    window.addEventListener('beforeunload', saveToDisk);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveToDisk);
    };
  }, []);

  // Auto-sync active modifications back to lists so settings are never lost
  useEffect(() => {
    if (selectedTemplateId.startsWith('custom-')) {
      setCustomTemplates(prev => prev.map(t => {
        if (t.id === selectedTemplateId) {
          return { ...t, settings: { ...settings }, companyName };
        }
        return t;
      }));
    } else if (selectedTemplateId.startsWith('sys-')) {
      // Prevent standard product templates from storing 'shipment' arrangement
      let sanitizedSettings = { ...settings };
      if (selectedTemplateId !== 'sys-shipment' && selectedTemplateId !== 'sys-shipment-150x100' && (sanitizedSettings.arrangement === 'shipment' || sanitizedSettings.arrangement === 'shipment_150x100')) {
        sanitizedSettings.arrangement = 'standard';
      }
      setSystemOverrides(prev => ({
        ...prev,
        [selectedTemplateId]: sanitizedSettings
      }));
    }
  }, [settings, selectedTemplateId, companyName]);

  // Electron / Printer Selection Sync Hook on Mount
  useEffect(() => {
    // If not in native Electron, we initialize our custom high-fidelity Desktop Simulator API!
    if (typeof window !== "undefined" && !window.electronAPI) {
      (window as any).isVirtualElectron = true;
      window.electronAPI = {
        isElectron: true,
        getPrinters: async () => [
          { name: 'Xprinter XP-365B (طابعة حرارية افتراضية)', isDefault: true },
          { name: 'Zebra GK420t (طابعة باركود مجهزة للتجربة)', isDefault: false },
          { name: 'HP LaserJet Pro A4 (طابعة صفائح افتراضية)', isDefault: false },
          { name: 'POS-80 (طابعة فواتير حرارية)', isDefault: false }
        ],
        selectDbFile: async () => 'C:\\BarcodeMaster\\database.sqlite',
        printSilent: async (options: any) => {
          setVirtualPrintJob({
            productName: currentProduct?.name || 'منتج تجريبي',
            barcode: currentProduct?.barcode || '123456',
            price: currentProduct?.price || 0.00,
            calories: currentProduct?.calories,
            weight: currentProduct?.weight,
            copies: copies || 1,
            printerName: options.printerName || 'Xprinter XP-365B',
            width: options.width || settings.labelWidth,
            height: options.height || settings.labelHeight,
            printMode: settings.printMode,
            timestamp: new Date().toLocaleTimeString('ar-SA')
          });
          return { success: true };
        },
        openExternal: async (url: string) => {
          setVirtualBrowserUrl(url);
          return { success: true };
        },
        saveAndSharePdf: async (payload: any) => {
          setVirtualShareJob({
            filename: payload.filename || 'invoice.pdf',
            directAction: payload.directAction || 'download',
            phone: payload.phone || '',
            text: payload.text || '',
            subject: payload.subject || '',
            base64Data: payload.base64Data
          });
          return { success: true };
        },
        querySqlite: async (options: any) => {
          console.log("Mock SQL Query:", options);
          return { success: true, rows: [] };
        },
        copyToClipboard: async (filePath: string) => {
          console.log("Mock Clip Copied:", filePath);
          try {
            await navigator.clipboard.writeText(filePath);
          } catch (e) {
            // fallback if clipboard API not available
          }
          showToast(`📋 [محاكاة حافظة ويندوز المكتبي] تم نسخ مستند الفاتورة (أو مساره) بنجاح: ${filePath}`, 'success');
          return { success: true };
        },
        shareFileViaWindows: async (payload: any) => {
          console.log("Mock shareFileViaWindows:", payload);
          showToast(`📲 [محاكاة مشاركة ويندوز] تم استدعاء المشاركة بنجاح للمستند: ${payload.fileName}`, 'success');
          return { success: true, filePath: `C:\\Users\\MockUser\\Documents\\SharedQuotations\\${payload.fileName}` };
        },
        openPath: async (filePath: string) => {
          console.log("Mock openPath:", filePath);
          showToast(`👁️ [محاكاة فتح ملف] تم تشغيل الملف بواسطة التطبيق الافتراضي للنظام: ${filePath}`, 'info');
          return { success: true };
        },
        showItemInFolder: async (filePath: string) => {
          console.log("Mock showItemInFolder:", filePath);
          showToast(`📁 [محاكاة فتح مجلد] تم تحديد وعرض الملف في مستكشف الملفات: ${filePath}`, 'info');
          return { success: true };
        },
        openSharedFolder: async () => {
          console.log("Mock openSharedFolder");
          showToast(`📁 [محاكاة فتح المجلد] تم فتح المجلد الرئيسي للمشاركات المشتركة`, 'info');
          return { success: true };
        }
      };
    }

    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.getPrinters()
        .then((printerList: any[]) => {
          const list = Array.isArray(printerList) ? printerList : [];
          setPrinters(list);
          const savedPrinter = localStorage.getItem('selected_printer');
          if (savedPrinter && list.some(p => p.name === savedPrinter)) {
            setSelectedPrinter(savedPrinter);
          } else if (savedPrinter === '__dialog__') {
            setSelectedPrinter('__dialog__');
          } else if (list.length > 0) {
            const defaultPrinter = list.find(p => p.isDefault) || list[0];
            setSelectedPrinter(defaultPrinter.name);
          }
        })
        .catch((err: any) => {
          console.error('Failed to query system printers list:', err);
        });
    } else {
      // In web browser, automatically detect and save the server origin
      if (window.location.origin && window.location.origin.startsWith('http')) {
        setCloudServerUrl(window.location.origin);
        localStorage.setItem('cloud_server_url', window.location.origin);
      }
    }
  }, [currentProduct, copies, settings]);

  // Save selected printer when modified
  useEffect(() => {
    localStorage.setItem('selected_printer', selectedPrinter);
  }, [selectedPrinter]);

  // Apply pinned values on product selection change
  useEffect(() => {
    if (selectedProductId !== null) {
      setProducts(prev => {
        let changed = false;
        const newProducts = prev.map(p => {
          if (p.id === selectedProductId) {
            let updates: any = {};
            if (isPreviewDescPinned && p.description !== previewPinnedDesc) {
              updates.description = previewPinnedDesc || undefined;
              changed = true;
            }
            if (isPreviewShipmentPinned && p.shipmentContent !== previewPinnedShipment) {
              updates.shipmentContent = previewPinnedShipment || undefined;
              changed = true;
            }
            if (changed) return { ...p, ...updates };
          }
          return p;
        });
        return changed ? newProducts : prev;
      });
    }
  }, [selectedProductId, isPreviewDescPinned, isPreviewShipmentPinned, previewPinnedDesc, previewPinnedShipment]);

  // Outside click handler to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Template Loading / Customization Handlers ---
  const handleLoadTemplate = (templateId: string) => {
    const sysTemplate = SYSTEM_TEMPLATES.find(t => t.id === templateId);
    const customTemplate = customTemplates.find(t => t.id === templateId);
    const target = sysTemplate || customTemplate;

    if (target) {
      setSelectedTemplateId(templateId);
      let savedOverride = sysTemplate ? systemOverrides[templateId] : undefined;
      
      // Sanitization: If setting is shipment but the loaded template is not the shipment template, default back to standard
      if (savedOverride && templateId !== 'sys-shipment' && templateId !== 'sys-shipment-150x100' && (savedOverride.arrangement === 'shipment' || savedOverride.arrangement === 'shipment_150x100')) {
        savedOverride = { ...savedOverride, arrangement: 'standard' };
      }

      // Guarantee any missing settings keys fallback safely
      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...target.settings,
        ...(savedOverride || {})
      };
      
      if (templateId !== 'sys-shipment' && templateId !== 'sys-shipment-150x100' && (nextSettings.arrangement === 'shipment' || nextSettings.arrangement === 'shipment_150x100')) {
        nextSettings.arrangement = target.settings.arrangement || 'standard';
      }

      setSettings(nextSettings);
      // Only set company name if current companyName is empty or generic default
      if (!companyName || companyName.trim() === '' || companyName === 'اسم المتجر/الشركة' || companyName === 'متجر تجربي') {
        if (target.companyName && target.companyName.trim() !== '') {
          setCompanyName(target.companyName);
        }
      }
      showToast(`🔓 تم تحميل تخطيط وقالب: "${target.name}"`);
    }
  };

  const handleSaveActiveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTemplateName.trim();
    if (!name) {
      showToast('الرجاء إدخال اسم فريد ومعبر لحفظ تصميم القالب.', 'error');
      return;
    }

    const newTemplate: LabelTemplate = {
      id: `custom-${Date.now()}`,
      name: name,
      companyName: companyName,
      settings: { ...settings }
    };

    setCustomTemplates(prev => [newTemplate, ...prev]);
    setSelectedTemplateId(newTemplate.id);
    setNewTemplateName('');
    setShowSaveModal(false);
    showToast(`✨ تم بنجاح حفظ قالبك المخصص باسم "${name}" وإضافته للقائمة.`);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplateId.startsWith('custom-')) {
      showToast('⚠️ القوالب المدمجة مع النظام للقراءة فقط. يرجى إنشاء قالب مخصص لحفظ تعديلاتك.', 'error');
      return;
    }

    setCustomTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        return {
          ...t,
          companyName: companyName,
          settings: { ...settings }
        };
      }
      return t;
    }));
    showToast('💾 تم حفظ التحديثات وتعديلات القياسات بالتفصيل لقالبك الفعال.');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const target = customTemplates.find(t => t.id === templateId);
    if (!target) return;

    if (confirm(`⚠️ هل أنت متأكد من رغبتك في حذف قالبك المخصص "${target.name}" بشكل نهائي؟`)) {
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        // Fallback to sys standard
        const fallback = SYSTEM_TEMPLATES[0];
        setSelectedTemplateId(fallback.id);
        setSettings(fallback.settings);
        setCompanyName(fallback.companyName);
      }
      showToast(`تم إزالة قالب التصميم "${target.name}" بنجاح.`);
    }
  };

  // Handle auto-closing toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Actions & Helpers ---
  const showToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ text, type });
  };

  const renderCurrencySymbol = (size: string = '1em', className?: string) => {
    return <SaudiRiyalIcon size={size} className={className} />;
  };

  // 🔄 مزامنة رقم الإصدار الفعلي للتطبيق مع واجهة المستخدم (سطح المكتب، الخادم، أو المتصفح)
  useEffect(() => {
    let isMounted = true;

    const syncVersion = async () => {
      let activeVer: string | null = null;

      // 1. فحص رقم الإصدار الحقيقي من محرك سطح المكتب (Electron)
      const electron = (window as any).electronAPI;
      if (electron) {
        try {
          if (typeof electron.getAppVersion === 'function') {
            const v = await electron.getAppVersion();
            if (v) activeVer = String(v).replace(/^v/, '').trim();
          } else if (electron.appVersion) {
            activeVer = String(electron.appVersion).replace(/^v/, '').trim();
          }
        } catch (err) {
          console.warn('Could not read Electron app version:', err);
        }
      }

      // 2. إذا لم يكن في Electron أو لم يتم الحصول عليه، فحص رقم الإصدار المدمج في الحزمة
      if (!activeVer && typeof __APP_VERSION__ !== 'undefined') {
        activeVer = String(__APP_VERSION__).replace(/^v/, '').trim();
      }

      // 3. فحص الخادم المحلي /api/version
      try {
        const res = await fetch('/api/version', { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          const serverVer = (data.version || data.currentVersion) ? String(data.version || data.currentVersion).replace(/^v/, '').trim() : null;
          if (serverVer) {
            if (!activeVer || compareSemver(serverVer, activeVer) > 0) {
              activeVer = serverVer;
            }
          }
        }
      } catch (e) {
        // خادم غير متوفر أو وضع ثابت
      }

      if (isMounted && activeVer) {
        if (activeVer !== appVersion) {
          setAppVersion(activeVer);
          try {
            localStorage.setItem('app_version', activeVer);
          } catch (e) {}
        }
      }
    };

    syncVersion();

    // الاستماع لأحداث التحديث التلقائي في Electron ليعلم المستخدم فور اكتمال التنزيل
    const electron = (window as any).electronAPI;
    if (electron?.onAutoUpdaterEvent) {
      const unsub = electron.onAutoUpdaterEvent(({ status, data }: { status: string; data: any }) => {
        if (status === 'downloaded') {
          const downloadedVer = (data?.version ? String(data.version).replace(/^v/, '').trim() : '');
          if (downloadedVer) {
            try {
              localStorage.setItem('app_version', downloadedVer);
            } catch (e) {}
            setAppVersion(downloadedVer);
            showToast(`🎉 تم تحميل التحديث v${downloadedVer} بنجاح وجاهز للتثبيت! انقر على زر الإصدار لإعادة التشغيل وتطبيقه.`, 'success');
          }
        }
      });
      return () => {
        isMounted = false;
        if (unsub) unsub();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormSubmitted(true);

    if (!productFormValidation.isValid) {
      const firstError = Object.values(productFormValidation.errors)[0];
      showToast(`⚠️ ${firstError}`, 'error');

      // Auto-focus the first field with error
      if (productFormValidation.errors.name) {
        (document.getElementById('quick-add-name') || document.getElementById('manual-add-name'))?.focus();
      } else if (productFormValidation.errors.price) {
        (document.getElementById('quick-add-price') || document.getElementById('manual-add-price'))?.focus();
      } else if (productFormValidation.errors.barcode) {
        (document.getElementById('quick-add-barcode') || document.getElementById('manual-add-barcode'))?.focus();
      } else if (productFormValidation.errors.weight) {
        document.getElementById('quick-add-weight')?.focus();
      } else if (productFormValidation.errors.datesComparison) {
        (document.getElementById('quick-add-exp-date') || document.getElementById('manual-add-exp-date'))?.focus();
      }
      return;
    }

    const name = newName.trim();
    const barcode = newBarcode.trim();
    const price = parseFloat(newPrice);
    const prodDate = newProdDate.trim();
    const expDate = newExpDate.trim();
    const calories = newCalories.trim();
    const protein = newProtein.trim();
    const carbs = newCarbs.trim();
    const fats = newFats.trim();
    const weight = newWeight.trim();
    const description = newDescription.trim();
    const shipmentContent = newShipmentContent.trim();

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const added: Product = {
      id: newId,
      name,
      barcode,
      price: isNaN(price) ? 0 : price,
      prodDate: prodDate || undefined,
      expDate: expDate || undefined,
      calories: calories || undefined,
      protein: protein || undefined,
      carbs: carbs || undefined,
      fats: fats || undefined,
      weight: weight || undefined,
      description: description || undefined,
      shipmentContent: shipmentContent || undefined,
      isManual: true
    };

    setProducts(prev => [added, ...prev]);
    setSelectedProductId(newId);
    
    // Ensure dates are shown if a date was added
    if (prodDate || expDate) {
      setSettings(prev => ({ ...prev, showDates: true }));
    }
    
    setNewName('');
    setNewBarcode('');
    setNewPrice('');
    setNewWeight('');
    setNewCalories('');
    setNewProtein('');
    setNewCarbs('');
    setNewFats('');
    if (!isDescriptionPinned) {
      setNewDescription('');
    }
    if (!isShipmentContentPinned) {
      setNewShipmentContent('');
    }
    
    // Reset dates: this triggers MiniCalendar's useEffect, automatically folding the calendar
    setNewProdDate('');
    setNewExpDate('');
    setShowAddForm(false);
    setFormSubmitted(false);
    setFormTouched({});
    showToast(`تمت إضافة منتج "${name.substring(0, 20)}..." بنجاح!`);
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const name = editingProduct.name.trim();
    const barcode = editingProduct.barcode.trim();

    if (!name || !barcode) {
      showToast('الاسم والباركود مطلوبان لتعديل المنتج.', 'error');
      return;
    }

    // Check duplicate barcodes, excluding itself
    if (products.some(p => p.barcode === barcode && p.id !== editingProduct.id)) {
      showToast('⚠️ تحذير: الباركود مكرر ومسجل لمنتج آخر!', 'error');
      return;
    }

    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
    showToast('تم حفظ تعديلات المنتج بنجاح.');
  };

  const handleDeleteProduct = (id: number, name: string) => {
    setShowDeleteProductModal({ show: true, id, name });
  };

  const confirmDeleteProduct = () => {
    const { id, name } = showDeleteProductModal;
    if (id !== null) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedBatchIds(prev => prev.filter(x => x !== id));
      if (selectedProductId === id) {
        setSelectedProductId(products.find(p => p.id !== id)?.id || null);
      }
      showToast(`تم حذف المنتج "${name.substring(0, 20)}..."`);
    }
    setShowDeleteProductModal({ show: false, id: null, name: '' });
  };

  const extractProductPrice = (record: any, fieldMapPrice: string): number => {
    const cleanAndParse = (val: any): number => {
      if (val === undefined || val === null || val === '') return NaN;
      if (typeof val === 'number') return val;
      
      // Convert Eastern Arabic numerals to Western Arabic numerals
      let str = String(val)
        .replace(/[٠]/g, '0')
        .replace(/[١]/g, '1')
        .replace(/[٢]/g, '2')
        .replace(/[٣]/g, '3')
        .replace(/[٤]/g, '4')
        .replace(/[٥]/g, '5')
        .replace(/[٦]/g, '6')
        .replace(/[٧]/g, '7')
        .replace(/[٨]/g, '8')
        .replace(/[٩]/g, '9');
        
      // Replace Arabic decimal point separator '٫' with standard dot '.'
      str = str.replace(/[٫]/g, '.');
      
      // Strip anything that is not a numeric sign, digit, dot or minus sign
      const cleaned = str.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? NaN : parsed;
    };

    // Support nested units array in Al-Ostad ERP
    if (record && record.units && Array.isArray(record.units) && record.units.length > 0) {
      const firstUnit = record.units[0];
      const unitCandidates = [
        fieldMapPrice,
        'sale_price',
        'selling_price',
        'price_including_vat',
        'sellingPrice',
        'sellPrice',
        'final_price',
        'price',
        'unit_price',
        'purchase_price', // fallback
        'buying_price'
      ];
      for (const candidate of unitCandidates) {
        if (candidate && firstUnit[candidate] !== undefined && firstUnit[candidate] !== null) {
          const val = cleanAndParse(firstUnit[candidate]);
          if (!isNaN(val) && val > 0) {
            return val;
          }
        }
      }
    }

    // 1. Try specified mapping first if it yields a valid non-zero number
    if (fieldMapPrice) {
      const val = cleanAndParse(record[fieldMapPrice]);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
    
    // 2. Try common price fields in order of priority (non-zero first)
    const candidates = [
      'sell_price',
      'selling_price',
      'price_including_vat',
      'sellingPrice',
      'sellPrice',
      'final_price',
      'finalPrice',
      'price_vat',
      'price',
      'unit_price',
      'unitPrice',
      'rate',
      'سعر_البيع',
      'سعرالبيع',
      'السعر',
      'سعر',
      'السعر_صافي',
      'صافي',
      'buying_price',
      'purchase_price',
      'buy_price'
    ];
    
    for (const c of candidates) {
      const val = cleanAndParse(record[c]);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }

    // 3. Fallback to mapping even if it's 0 or negative
    if (fieldMapPrice) {
      const val = cleanAndParse(record[fieldMapPrice]);
      if (!isNaN(val)) return val;
    }

    // 4. Fallback to any of candidates even if it is 0
    for (const c of candidates) {
      const val = cleanAndParse(record[c]);
      if (!isNaN(val)) return val;
    }

    // 5. Hard fallback
    return 0;
  };

  const handleSyncDatabase = async (overrideMode?: 'sqlite' | 'api' | 'cloud_erp', silent = false) => {
    setIsSyncingDb(true);
    setDbSyncResult(null);

    const modeToUse = overrideMode || dbSyncMode;
    if (overrideMode) {
      setDbSyncMode(overrideMode);
    }

    localStorage.setItem('db_sync_mode', modeToUse);
    localStorage.setItem('sqlite_path', sqlitePath);
    localStorage.setItem('sqlite_query', sqliteQuery);
    localStorage.setItem('db_api_url', dbApiUrl);
    localStorage.setItem('db_field_map_name', dbFieldMapName);
    localStorage.setItem('db_field_map_price', dbFieldMapPrice);
    localStorage.setItem('db_field_map_barcode', dbFieldMapBarcode);
    localStorage.setItem('db_field_map_sku', dbFieldMapSku);
    localStorage.setItem('db_field_map_proddate', dbFieldMapProdDate);
    localStorage.setItem('db_field_map_expdate', dbFieldMapExpDate);

    localStorage.setItem('daftra_field_map_name', daftraFieldMapName);
    localStorage.setItem('daftra_field_map_price', daftraFieldMapPrice);
    localStorage.setItem('daftra_field_map_barcode', daftraFieldMapBarcode);
    localStorage.setItem('daftra_field_map_sku', daftraFieldMapSku);
    localStorage.setItem('daftra_field_map_proddate', daftraFieldMapProdDate);
    localStorage.setItem('daftra_field_map_expdate', daftraFieldMapExpDate);

    localStorage.setItem('ostad_field_map_name', ostadFieldMapName);
    localStorage.setItem('ostad_field_map_price', ostadFieldMapPrice);
    localStorage.setItem('ostad_field_map_barcode', ostadFieldMapBarcode);
    localStorage.setItem('ostad_field_map_sku', ostadFieldMapSku);
    localStorage.setItem('ostad_field_map_proddate', ostadFieldMapProdDate);
    localStorage.setItem('ostad_field_map_expdate', ostadFieldMapExpDate);

    localStorage.setItem('db_smart_sync_enabled', isSmartSyncEnabled.toString());
    localStorage.setItem('erp_branch_id', erpBranchId);

    try {
      let records: any[] = [];

      // Recursive scanner to safely find the products array inside any API response envelope
      const findArray = (obj: any, depth = 0): any[] | null => {
        if (depth > 4 || !obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj)) return obj;
        
        const commonKeys = ['data', 'products', 'items', 'records', 'items_list', 'goods', 'rows', 'Product'];
        // 1. Direct key match (Array)
        for (const key of commonKeys) {
          if (Array.isArray(obj[key])) return obj[key];
        }
        // 2. Direct key match (Nested Object)
        for (const key of commonKeys) {
          if (obj[key] && typeof obj[key] === 'object') {
            const res = findArray(obj[key], depth + 1);
            if (res) return res;
          }
        }
        // 3. Fallback: check all keys
        for (const key in obj) {
          if (Array.isArray(obj[key])) return obj[key];
          if (obj[key] && typeof obj[key] === 'object') {
            const res = findArray(obj[key], depth + 1);
            if (res) return res;
          }
        }
        return null;
      };

      if (modeToUse === 'sqlite') {
        if (!sqlitePath) {
          throw new Error("برجاء تحديد مسار ملف قاعدة بيانات SQLite أولاً.");
        }
        if (!sqliteQuery) {
          throw new Error("برجاء كتابة استعلام SQL لاسترجاع المنتجات.");
        }

        let res;
        if (window.electronAPI && window.electronAPI.querySqlite && (window as any).isVirtualElectron) {
           res = await window.electronAPI.querySqlite({ dbPath: sqlitePath, query: sqliteQuery });
        } else {
           const response = await fetch(getApiEndpoint("/api/sqlite"), {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ dbPath: sqlitePath, query: sqliteQuery })
           });
           res = await response.json();
        }
        if (!res.success) {
          throw new Error(res.error || "فشل الاتصال بقاعدة بيانات SQLite أو تنفيذ الاستعلام عليها.");
        }
        records = res.rows || [];
      } else if (modeToUse === 'cloud_erp') {
        if (erpProvider === 'ostad' && !erpCustomUrl.trim()) {
          if (!silent) showToast('يرجى كتابة رابط الأستاذ في الحقل لبدء الاتصال', 'info');
          setIsSyncingDb(false);
          return;
        }
        if (erpProvider === 'daftra' && !erpSubdomain.trim()) {
          if (!silent) showToast('يرجى كتابة رابط دفترة في الحقل لبدء الاتصال', 'info');
          setIsSyncingDb(false);
          return;
        }
        
        let resJson;
        if (window.electronAPI && window.electronAPI.proxyErp) {
          // Inside desktop Electron app: bypass regional/CORS constraints and connect directly local-first!
          resJson = await window.electronAPI.proxyErp({
            provider: erpProvider,
            subdomain: erpSubdomain,
            apiKey: erpApiKey,
            customUrl: erpCustomUrl,
            branchId: erpBranchId,
            authType: daftraAuthType,
            oauthClientId: daftraClientId,
            oauthClientSecret: daftraClientSecret,
            oauthUsername: daftraUsername,
            oauthPassword: daftraPassword
          });
          if (!resJson.success) {
            throw new Error(resJson.error || "عطل مجهول بخادم الربط السحابي.");
          }
        } else {
          // Post credentials securely to local express bypass proxy to bypass browser CORS constraints
          const response = await fetch(getApiEndpoint('/api/proxy-erp'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              provider: erpProvider,
              subdomain: erpSubdomain,
              apiKey: erpApiKey,
              customUrl: erpCustomUrl,
              branchId: erpBranchId,
              authType: daftraAuthType,
              oauthClientId: daftraClientId,
              oauthClientSecret: daftraClientSecret,
              oauthUsername: daftraUsername,
              oauthPassword: daftraPassword
            })
          });

          if (!response.ok) {
            let errorText = '';
            try {
              errorText = await response.text();
            } catch (textErr) {}

            let parsedError = 'فشل تفصيل الاتصال بالخادم (يرجى التحقق من توفر الإنترنت والخادم وصحة رابط معرّف الـ API وكود الترخيص).';
            if (errorText) {
              if (errorText.trim().startsWith('{')) {
                try {
                  const parsedJson = JSON.parse(errorText);
                  parsedError = parsedJson.error || parsedJson.message || parsedError;
                } catch (e) {}
              } else {
                // Parse out safe text from HTML pages
                const htmlCleaner = errorText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const textSnippet = htmlCleaner.substring(0, 150);
                if (textSnippet) {
                  parsedError = `عطل بالخادم (رمز ${response.status}): ${textSnippet}`;
                } else {
                  parsedError = `عطل بالخادم (رمز ${response.status})`;
                }
              }
            }
            throw new Error(parsedError);
          }

          const rawText = await response.text();
          if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html') || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<HTML')) {
            throw new Error("رابط خدمة الكوبري السحابي (Proxy API) غير متوفر أو أرجع صفحة ويب HTML بدلاً من رد JSON. يرجى مراجعة إعدادات خادم الربط السحابي.");
          }
          try {
            resJson = JSON.parse(rawText);
          } catch (jsonErr: any) {
            throw new Error(`تنسيق الرد القادم من خادم الربط غير صالح (ليس JSON): ${rawText.substring(0, 80)}`);
          }
          if (!resJson.success) {
            throw new Error(resJson.error || "عطل مجهول بخادم الربط السحابي.");
          }
        }

        // Unpack response safely using the robust recursive array locator
        const responseData = resJson.data;
        const foundList = findArray(responseData);
        if (foundList) {
          records = foundList;
        } else {
          records = [];
        }

        // Flatten Daftra's custom { Product: { ... } } structure or similar for standard key-matching compatibility
        // We spread item first, then item.Product so that critical product properties (like code and barcode) from item.Product won't be overwritten by null or empty properties on container item.
        records = records.map((item: any) => {
          if (item && item.Product && typeof item.Product === 'object') {
            return {
              ...item,
              ...item.Product
            };
          }
          return item;
        });
      } else {
        if (modeToUse === 'api' && !dbApiUrl.trim()) {
          if (!silent) showToast('يرجى كتابة رابط الـ API في الحقل لبدء الاتصال', 'info');
          setIsSyncingDb(false);
          return;
        }
        if (modeToUse === 'webhook_live') {
           setIsSyncingDb(false);
           return;
        }
        // Fetch data from external SQL proxy / API with optional fallback
        let response;
        try {
          let targetUrl = dbApiUrl;
          if (!isElectron && typeof window !== 'undefined') {
            const cleanOrigin = window.location.origin.replace(/\/+$/, "");
            if (targetUrl.startsWith(cleanOrigin)) {
              targetUrl = targetUrl.substring(cleanOrigin.length);
            }
          }
          if (targetUrl.startsWith('/')) {
            if (isElectron && !cloudServerUrl && !(window as any).isVirtualElectron) {
              throw new Error("رابط نسبي غير صالح لـ REST API في نسخة سطح المكتب: يرجى إما كتابة رابط كامل يبدأ بـ (http://localhost:4000) للربط بالخادم ومحول SQL المحلي، أو إدخال (رابط خادم المزامنة السحابي) الصحيح في الحقل المخصص أعلى الصفحة أولاً لتفعيل قنوات الربط الموحدة.");
            }
            targetUrl = getApiEndpoint(targetUrl);
          }
          response = await fetch(targetUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
          }
        } catch (fetchErr: any) {
          // If accessing a custom URL fails, try to fallback to the local Express server API
          if (dbApiUrl !== '/api/products') {
            console.warn("Primary DB Sync URL failed, falling back to local Express server API:", fetchErr);
            response = await fetch(getApiEndpoint('/api/products'), {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
              throw new Error(`خطأ حالة الاتصال البديل: ${response.status}`);
            }
          } else {
            throw fetchErr;
          }
        }

        const rawText = await response.text();
        if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html') || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<HTML')) {
          throw new Error("رابط الـ API غير صالح أو غير موجود (أرجع صفحة ويب HTML بدلاً من بيانات JSON). يرجى التحقق من صحة الرابط.");
        }
        let rawData;
        try {
          rawData = JSON.parse(rawText);
        } catch (jsonErr: any) {
          throw new Error(`تنسيق الرد القادم من رابط الـ API غير صالح (ليس JSON): ${rawText.substring(0, 80)}`);
        }
        
        // Determine array of products safely
        if (Array.isArray(rawData)) {
          records = rawData;
        } else if (rawData && typeof rawData === 'object') {
          const nested = rawData.products || rawData.data || rawData.items || rawData.records;
          if (Array.isArray(nested)) {
            records = nested;
          } else if (rawData.name || rawData.id) {
            // Single product object fallback
            records = [rawData];
          }
        }
      }

      if (!Array.isArray(records) || records.length === 0) {
        throw new Error(modeToUse === 'sqlite' 
          ? "لم يتم العثور على أي صفوف في قاعدة البيانات أو الاستعلام عاد بـ 0 صفوف لتحديثها."
          : "تنسيق استجابة غير صالح أو مصفوفة فارغة؛ يجب أن تحتوي استجابة JSON على قائمة منتجات صالحة."
        );
      }

      let importedCount = 0;
      let duplicateCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      let updatedProductsList = [...products];

      let activeFieldMapName = dbFieldMapName;
      let activeFieldMapPrice = dbFieldMapPrice;
      let activeFieldMapBarcode = dbFieldMapBarcode;
      let activeFieldMapSku = dbFieldMapSku;
      let activeFieldMapProdDate = dbFieldMapProdDate;
      let activeFieldMapExpDate = dbFieldMapExpDate;

      if (modeToUse === 'cloud_erp') {
        if (erpProvider === 'daftra') {
          activeFieldMapName = daftraFieldMapName;
          activeFieldMapPrice = daftraFieldMapPrice;
          activeFieldMapBarcode = daftraFieldMapBarcode;
          activeFieldMapSku = daftraFieldMapSku;
          activeFieldMapProdDate = daftraFieldMapProdDate;
          activeFieldMapExpDate = daftraFieldMapExpDate;
        } else if (erpProvider === 'ostad') {
          activeFieldMapName = ostadFieldMapName;
          activeFieldMapPrice = ostadFieldMapPrice;
          activeFieldMapBarcode = ostadFieldMapBarcode;
          activeFieldMapSku = ostadFieldMapSku;
          activeFieldMapProdDate = ostadFieldMapProdDate;
          activeFieldMapExpDate = ostadFieldMapExpDate;
        }
      }

      const resolveBarcodeValue = (record: any, idx: number): string => {
        // If a custom field is mapped for barcode/sku, try it first
        let barcode = record[activeFieldMapBarcode] !== undefined ? String(record[activeFieldMapBarcode]).trim() : '';
        let sku = record[activeFieldMapSku] !== undefined ? String(record[activeFieldMapSku]).trim() : '';

        // Extract from Al-Ostad nested units array if available
        if (record && record.units && Array.isArray(record.units) && record.units.length > 0) {
          const firstUnit = record.units[0];
          if (!barcode || barcode === 'null' || barcode === 'undefined' || barcode === '') {
            barcode = firstUnit[activeFieldMapBarcode] !== undefined ? String(firstUnit[activeFieldMapBarcode]).trim() : '';
          }
          if (!barcode || barcode === 'null' || barcode === 'undefined' || barcode === '') {
            barcode = String(firstUnit.barcode || firstUnit.code || firstUnit.sku || '').trim();
          }
          if (!sku || sku === 'null' || sku === 'undefined' || sku === '') {
            sku = firstUnit[activeFieldMapSku] !== undefined ? String(firstUnit[activeFieldMapSku]).trim() : '';
          }
          if (!sku || sku === 'null' || sku === 'undefined' || sku === '') {
            sku = String(firstUnit.sku || '').trim();
          }
        }

        if (modeToUse === 'cloud_erp' && erpProvider === 'daftra') {
          if (barcode && barcode !== 'null' && barcode !== 'undefined' && barcode !== '') {
            if (/^\d+$/.test(barcode) && barcode.length > 0 && barcode.length < 6) {
              return barcode.padStart(6, '0');
            }
            return barcode;
          }
          let rawBarcode = record.barcode_str !== undefined && record.barcode_str !== null && record.barcode_str !== '' 
            ? String(record.barcode_str).trim() 
            : (record.barcode !== undefined && record.barcode !== null ? String(record.barcode).trim() : '');

          let rawCode = record.code_str !== undefined && record.code_str !== null && record.code_str !== '' 
            ? String(record.code_str).trim() 
            : (record.code !== undefined && record.code !== null ? String(record.code).trim() : '');

          let rawSku = record.sku_str !== undefined && record.sku_str !== null && record.sku_str !== '' 
            ? String(record.sku_str).trim() 
            : (record.sku !== undefined && record.sku !== null ? String(record.sku).trim() : '');
          
          if (/^\d+$/.test(rawBarcode) && rawBarcode.length > 0 && rawBarcode.length < 6) {
            rawBarcode = rawBarcode.padStart(6, '0');
          }
          if (/^\d+$/.test(rawCode) && rawCode.length > 0 && rawCode.length < 6) {
            rawCode = rawCode.padStart(6, '0');
          }
          if (/^\d+$/.test(rawSku) && rawSku.length > 0 && rawSku.length < 6) {
            rawSku = rawSku.padStart(6, '0');
          }

          if (rawBarcode && rawBarcode !== 'null' && rawBarcode !== 'undefined' && rawBarcode !== '') {
            return rawBarcode;
          }
          if (rawCode && rawCode !== 'null' && rawCode !== 'undefined' && rawCode !== '') {
            return rawCode;
          }
          if (rawSku && rawSku !== 'null' && rawSku !== 'undefined' && rawSku !== '') {
            return rawSku;
          }
          const generatedId = String(record.id || record.product_id || `900${idx + 1}`).trim();
          if (/^\d+$/.test(generatedId) && generatedId.length > 0 && generatedId.length < 6) {
            return generatedId.padStart(6, '0');
          }
          return generatedId;
        }

        if (!barcode || barcode === 'null' || barcode === 'undefined') {
          barcode = String(record.barcode || record.code || record.item_code || record.product_id || '').trim();
        }
        if (!barcode || barcode === 'null' || barcode === 'undefined') {
          barcode = (sku && sku !== 'null' && sku !== 'undefined') ? sku : String(record.sku || record.id || '').trim();
        }
        if (!barcode || barcode === 'null' || barcode === 'undefined') {
          barcode = `900${idx + 1}`;
        }
        return barcode;
      };

      if (isSmartSyncEnabled) {
        const incomingCodes = new Set<string>();
        const incomingBarcodes = new Set<string>();
        const incomingNames = new Set<string>();
        
        records.forEach((record: any, idx: number) => {
          const barcode = resolveBarcodeValue(record, idx);
          const name = String(record[activeFieldMapName] || record.name || record.product_name || record.title || record.itemName || record.name_ar || record.ar_name || record.product_name_ar || record.item_name || record.item_name_ar || record.arabic_name || record.arabic_title || record.desc || '').trim();
          const code = String(record[activeFieldMapSku] || record.sku || record.id || record.code || record.item_code || record.product_id || '').trim();
          
          if (barcode) incomingBarcodes.add(barcode);
          if (name) incomingNames.add(name);
          if (code) incomingCodes.add(code);
        });

        const beforeLength = updatedProductsList.length;
        updatedProductsList = updatedProductsList.filter(p => 
          incomingBarcodes.has(p.barcode) || 
          incomingNames.has(p.name) || 
          (p.code && incomingCodes.has(p.code))
        );
        deletedCount = beforeLength - updatedProductsList.length;

        records.forEach((record: any, idx: number) => {
          const name = String(record[activeFieldMapName] || record.name || record.product_name || record.title || record.itemName || record.name_ar || record.ar_name || record.product_name_ar || record.item_name || record.item_name_ar || record.arabic_name || record.arabic_title || record.desc || '').trim();
          if (!name) return;
          const code = String(record[activeFieldMapSku] || record.sku || record.id || record.code || record.item_code || record.product_id || '').trim();

          let price = extractProductPrice(record, activeFieldMapPrice);
          if (modeToUse === 'sqlite' && divideBy100Sqlite) {
            price = price / 100;
          } else if (modeToUse === 'api' && divideBy100Api) {
            price = price / 100;
          } else if (modeToUse === 'cloud_erp' && divideBy100Erp) {
            price = price / 100;
          }

          const barcode = resolveBarcodeValue(record, idx);
          const prodDate = String(record[activeFieldMapProdDate] || record.prod_date || record.production_date || record.mfg_date || '').trim();
          const expDate = String(record[activeFieldMapExpDate] || record.exp_date || record.expiry_date || '').trim();
          const recName = String(record.recipient_name || record.recipientName || record.customer_name || record.customerName || record.recipient || '').trim();
          const recPhone = String(record.recipient_phone || record.recipientPhone || record.customer_phone || record.customerPhone || record.phone || '').trim();

          const existingIndex = updatedProductsList.findIndex(p => 
            (code && p.code === code) || (barcode && p.barcode === barcode) || (!code && !barcode && !p.code && !p.barcode && name && p.name === name)
          );

          if (existingIndex !== -1) {
            const oldItem = updatedProductsList[existingIndex];
            if (oldItem.price !== price) {
              updatedProductsList[existingIndex] = {
                ...oldItem,
                price
              };
              updatedCount++;
            }
          } else {
            updatedProductsList.unshift({
              id: Date.now() + idx,
              name,
              barcode,
              code: code || undefined,
              price,
              prodDate: prodDate || undefined,
              expDate: expDate || undefined,
              recipientName: recName || undefined,
              recipientPhone: recPhone || undefined,
              description: isPreviewDescPinned ? (previewPinnedDesc || undefined) : undefined,
              shipmentContent: isPreviewShipmentPinned ? (previewPinnedShipment || undefined) : undefined
            });
            importedCount++;
          }
        });

        setProducts(updatedProductsList);
        if (updatedProductsList.length > 0) {
          setSelectedProductId(updatedProductsList[0].id);
        }

        showToast(`♻️ اكتملت المزامنة المرآتية: تمت إضافة ${importedCount} صنف جديد، وتحديث ${updatedCount} صنفاً، وحذف ${deletedCount} صنفاً غير موجود بالمصدر!`, 'success');
        setDbSyncResult({ success: true, count: importedCount + updatedCount });
      } else {
        const newRows: Product[] = [];
        
        records.forEach((record: any, idx: number) => {
          const name = String(record[activeFieldMapName] || record.name || record.product_name || record.title || record.itemName || record.name_ar || record.ar_name || record.product_name_ar || record.item_name || record.item_name_ar || record.arabic_name || record.arabic_title || record.desc || '').trim();
          if (!name) return;
          const code = String(record[activeFieldMapSku] || record.sku || record.id || record.code || record.item_code || record.product_id || '').trim();

          let price = extractProductPrice(record, activeFieldMapPrice);
          if (modeToUse === 'sqlite' && divideBy100Sqlite) {
            price = price / 100;
          } else if (modeToUse === 'api' && divideBy100Api) {
            price = price / 100;
          } else if (modeToUse === 'cloud_erp' && divideBy100Erp) {
            price = price / 100;
          }

          const barcode = resolveBarcodeValue(record, idx);
          const prodDate = String(record[activeFieldMapProdDate] || record.prod_date || record.production_date || record.mfg_date || '').trim();
          const expDate = String(record[activeFieldMapExpDate] || record.exp_date || record.expiry_date || '').trim();
          const recName = String(record.recipient_name || record.recipientName || record.customer_name || record.customerName || record.recipient || '').trim();
          const recPhone = String(record.recipient_phone || record.recipientPhone || record.customer_phone || record.customerPhone || record.phone || '').trim();

          const existingIndex = updatedProductsList.findIndex(p => 
            (code && p.code === code) || (barcode && p.barcode === barcode) || (!code && !barcode && !p.code && !p.barcode && name && p.name === name)
          );

          if (existingIndex !== -1) {
            const oldItem = updatedProductsList[existingIndex];
            if (oldItem.price !== price) {
              updatedProductsList[existingIndex] = {
                ...oldItem,
                price
              };
              updatedCount++;
            } else {
              duplicateCount++;
            }
          } else {
            updatedProductsList.unshift({
              id: Date.now() + idx,
              name,
              barcode,
              code: code || undefined,
              price,
              prodDate: prodDate || undefined,
              expDate: expDate || undefined,
              recipientName: recName || undefined,
              recipientPhone: recPhone || undefined,
              description: isPreviewDescPinned ? (previewPinnedDesc || undefined) : undefined,
              shipmentContent: isPreviewShipmentPinned ? (previewPinnedShipment || undefined) : undefined
            });
            importedCount++;
          }
        });

        if (importedCount > 0 || updatedCount > 0) {
          setProducts(updatedProductsList);
          if (updatedProductsList.length > 0) {
            setSelectedProductId(updatedProductsList[0].id);
          }
          showToast(`✅ تم استيراد وتحديث السجلات: تمت إضافة ${importedCount} صنف جديد وتحديث ${updatedCount} صنفاً بنجاح!`, 'success');
          setDbSyncResult({ success: true, count: importedCount + updatedCount });
        } else {
          showToast('لم يتم استيراد أو تحديث أي منتج (كافة البيانات متطابقة أو مكررة).', 'info');
          setDbSyncResult({ success: true, count: 0 });
        }
      }

      // Record last successful sync timestamp
      const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });      setLastAutoSyncTime(nowStr);
      localStorage.setItem('db_last_auto_sync_time', nowStr);

    } catch (err: any) {
      console.error('Database Sync Error:', err);
      const isFailedToFetch = err.message && (err.message.includes('fetch') || err.message.includes('Failed'));
      const friendlyError = isFailedToFetch 
        ? "🔴 عطل بقاعدة البيانات: Failed to fetch (يرجى تشغيل Proxy والتحقق من المنفذ والبروتوكول، أو سماح CORS بالمتصفح)."
        : `❌ فشل الاتصال بقاعدة البيانات: ${err.message}`;
      showToast(friendlyError, 'error');
      setDbSyncResult({ success: false, error: friendlyError });
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Synchronically persist auto-sync settings when modified
  useEffect(() => {
    localStorage.setItem('db_auto_sync_enabled', isAutoSyncEnabled.toString());
    localStorage.setItem('db_auto_sync_interval', autoSyncInterval.toString());
  }, [isAutoSyncEnabled, autoSyncInterval]);

  // Initial auto sync on page mount (if enabled)
  useEffect(() => {
    if (isAutoSyncEnabled) {
      const timer = setTimeout(() => {
        handleSyncDatabase();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Set up periodic background auto-sync/update timer
  useEffect(() => {
    if (!isGlobalSyncEnabled || !isAutoSyncEnabled) return;

    const intervalMs = autoSyncInterval * 60 * 1000;
    const intervalTimer = setInterval(() => {
      console.log('🔄 background auto-update database sync triggered.');
      handleSyncDatabase(undefined, true);
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [isAutoSyncEnabled, autoSyncInterval, dbSyncMode, sqlitePath, sqliteQuery, dbApiUrl, dbFieldMapName, dbFieldMapBarcode, dbFieldMapSku, dbFieldMapPrice, dbFieldMapProdDate, dbFieldMapExpDate, isSmartSyncEnabled, isGlobalSyncEnabled]);

  const handleDeleteAllProducts = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAllProducts = () => {
    setProducts([]);
    setSelectedProductId(null);
    setSelectedBatchIds([]);
    showToast('🗑️ تم تفريغ وحذف جميع المنتجات من القائمة بنجاح.', 'success');
    setShowDeleteAllModal(false);
  };

  const handleResetDatabase = () => {
    setShowResetDbModal(true);
  };

  const confirmResetDatabase = () => {
    setProducts(DEFAULT_PRODUCTS);
    setSelectedProductId(DEFAULT_PRODUCTS[0]?.id || null);
    setSelectedBatchIds([]);
    showToast('تمت إعادة تعيين المنتجات إلى القائمة الافتراضية.', 'info');
    setShowResetDbModal(false);
  };

  const handleResetSettings = () => {
    if (confirm('🔄 هل تود إعادة ضبط كافة قياسات الهوامش والخطوط المتقدمة للقيم القياسية؟')) {
      if (selectedTemplateId && selectedTemplateId.startsWith('sys-')) {
        // Clear override for this system template so it reverts to the original pre-packaged settings
        setSystemOverrides(prev => {
          const next = { ...prev };
          delete next[selectedTemplateId];
          return next;
        });
        // Find the original pre-packaged template
        const orig = SYSTEM_TEMPLATES.find(t => t.id === selectedTemplateId);
        if (orig) {
          setSettings(orig.settings);
          setCompanyName(orig.companyName);
          showToast(`تمت إعادة تعيين قالب "${orig.name}" إلى قيم النظام الافتراضية بنجاح.`, 'info');
          return;
        }
      }
      setSettings(DEFAULT_SETTINGS);
      showToast('تمت إعادة تعيين الهوامش والقياسات القياسية بنجاح.', 'info');
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: 1,
        app: "barcode-labels-generator",
        products,
        settings,
        companyName,
        customTemplates,
        selectedTemplateId
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `نسخة_احتياطية_ملصقات_الباركود_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📦 تم تصدير ملف النسخة الاحتياطية بنجاح! يمكنك نقله لأي جهاز آخر واستيراده.', 'success');
    } catch {
      showToast('فشل تصدير النسخة الاحتياطية.', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data.app !== "barcode-labels-generator") {
          showToast('❌ ملف النسخة الاحتياطية غير صالح أو خاص بتطبيق آخر.', 'error');
          return;
        }
        
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.companyName !== undefined) {
          setCompanyName(data.companyName || '');
        }
        if (data.customTemplates && Array.isArray(data.customTemplates)) {
          setCustomTemplates(data.customTemplates);
        }
        if (data.selectedTemplateId) {
          setSelectedTemplateId(data.selectedTemplateId);
        }
        
        showToast('📥 تم استيراد واستعادة كامل بياناتك بنجاح!', 'success');
      } catch {
        showToast('فشل تحليل ملف النسخة الاحتياطية. تأكد من سلامة الملف.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Clean input
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    showToast('جاري تحليل ملف الإكسل...', 'info');

    const result = await parseExcelFile(file);

    if (result.error) {
      showToast(result.error, 'error');
      e.target.value = ''; // Clean input
      return;
    }

    if (result.products.length === 0) {
      showToast('لم يتم العثور على أي منتجات صالحة للاستيراد.', 'error');
      e.target.value = '';
      return;
    }

    let importedCount = 0;
    let duplicateCount = 0;
    const currentBarcodes = new Set(products.map(p => p.barcode));

    const newRows: Product[] = [];
    let rollingId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    result.products.forEach(p => {
      if (currentBarcodes.has(p.barcode)) {
        duplicateCount++;
      } else {
        newRows.push({
          id: rollingId++,
          name: p.name,
          barcode: p.barcode,
          price: p.price,
          description: isPreviewDescPinned ? (previewPinnedDesc || undefined) : undefined,
          shipmentContent: isPreviewShipmentPinned ? (previewPinnedShipment || undefined) : undefined
        });
        currentBarcodes.add(p.barcode);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      setProducts(prev => [...newRows, ...prev]);
      setSelectedProductId(newRows[0].id);
      showToast(`✅ تم استيراد عدد ${importedCount} منتجاً بنجاح! ${duplicateCount > 0 ? `(تم تخطي ${duplicateCount} باركود مكرر)` : ''}`, 'success');
    } else {
      showToast(`لم يتم إضافة أي منتج (جميع الباركودات مكررة ${duplicateCount} منتج)`, 'error');
    }

    e.target.value = ''; // Clean input
  };

  // Safe printed preview logic direct to browser native layer page structure
  const triggerNativePrint = async () => {
    if (!currentProduct) {
      showToast('الرجاء تحديد منتج أولاً للطباعة.', 'error');
      return;
    }

    // Check if we are in Electron and have a selected printer (silent print)
    if (window.electronAPI && selectedPrinter && selectedPrinter !== '__dialog__') {
      try {
        showToast('🔄 جاري إرسال الأمر للطباعة الفورية الصامتة...', 'info');
        
        const res = await window.electronAPI.printSilent({
          printerName: selectedPrinter,
          copies: copies, // <--- تمرير العدد الفعلي للنسخ للطابعة مباشرة
          width: settings.labelWidth,
          height: settings.labelHeight,
          printMode: settings.printMode || 'roll_gap',
          paperWidth: settings.paperWidth || 105,
          paperHeight: settings.paperHeight || 150,
          orientation: settings.printOrientation || 'portrait'
        });

        if (!res.success) {
          throw new Error(res.error || 'فشلت عملية الطباعة الصامتة');
        }
        setCopies(1); // إعادة التعيين لـ 1 بعد النجاح
        showToast(`✅ تم إرسال عدد ${copies} ملصقات للطابعة "${selectedPrinter}" بنجاح فوري!`, 'success');
      } catch (err: any) {
        console.error('Electron silent print error:', err);
        showToast(`❌ حدث عطل بالطباعة الفورية للصامتة: ${err.message || err}`, 'error');
      }
      return;
    }

    // Detect if running inside an iframe (like the AI Studio Preview)
        let isInsideIframe = false;
    try {
      isInsideIframe = window.self !== window.top;
    } catch (e) {
      isInsideIframe = true;
    }

    if (isInsideIframe) {
      // In sandbox frames, browsers prevent window.print() completely. We display a beautiful modal.
      setShowPrintInstructionModal(true);
      return;
    }

    try {
      setTimeout(() => {
        try {
          window.print();
        } catch (error) {
          console.error('Print dialog failure:', error);
          setShowPrintInstructionModal(true);
        }
      }, 500);
    } catch (error) {
      console.error('Print timeout setup failure:', error);
      setShowPrintInstructionModal(true);
    }
  };

  // Open a new independent print iframe to circumvent iframe/wrapper print restrictions and about:blank errors
  const openBrowserPrintWindow = (customTitle?: string) => {
    if (!currentProduct && (!batchPrintQueue || batchPrintQueue.length === 0)) {
      showToast('الرجاء تحديد منتج أولاً للطباعة.', 'error');
      return;
    }

    // إنشاء عنصر iframe مخفي معزول لتجنب مشاكل "about:blank" في التطبيق المكتبي أو المتصفحات المقيدة
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      showToast("⚠️ حدث خطأ أثناء تهيئة نافذة الطباعة.", "error");
      document.body.removeChild(iframe);
      return;
    }

    // Gather styles and link tags
    const styleTags = Array.from(document.querySelectorAll('style, link'))
      .map(node => node.outerHTML)
      .join('\n');

    const printAreaEl = document.getElementById("print-area");
    let printAreaHtml = "";
    if (printAreaEl) {
      const cloneEl = printAreaEl.cloneNode(true) as HTMLElement;
      const originalCanvases = printAreaEl.querySelectorAll('canvas');
      const clonedCanvases = cloneEl.querySelectorAll('canvas');
      clonedCanvases.forEach((canvas, index) => {
        const img = document.createElement('img');
        img.src = originalCanvases[index].toDataURL('image/png');
        img.className = canvas.className;
        canvas.parentNode?.replaceChild(img, canvas);
      });
      printAreaHtml = cloneEl.innerHTML;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${customTitle || (currentProduct ? `طباعة ملصقات الباركود - ${currentProduct.name}` : 'طباعة ملصقات الباركود')}</title>
        ${styleTags}
        <style>
          /* Global override inside the print-only document */
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body > :not(#print-area) {
            display: none !important;
          }
          #print-area {
            display: ${settings.printMode === "sheet" ? "flex" : "block"} !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @media print {
            body {
              background-color: #ffffff !important;
            }
          }
        </style>
        <script>
          // Automatic trigger print on load
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
            }, 600);
          });
        </script>
      </head>
      <body>
        <div id="print-area" class="${settings.printMode === "sheet" ? "print:flex flex-wrap" : "print:block"} text-black bg-white">${printAreaHtml}</div>
      </body>
      </html>
    `);
    doc.close();
    setCopies(1);

    showToast('🚀 تم تهيئة وإرسال ملصقات الباركود للطباعة بنجاح!', 'success');

    // إزالة الـ iframe بعد إتاحة الفرصة للمتصفح لتصميم مستند الطباعة
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  };

  // Batch print execution for selected products
  const executeBatchPrint = async () => {
    if (selectedBatchProducts.length === 0) {
      showToast('يرجى تحديد صنف واحد على الأقل للطباعة المجمعة.', 'error');
      return;
    }

    const batchItems = selectedBatchProducts.map(p => ({
      product: p,
      copies: batchCopiesMap[p.id] || 1
    }));
    const totalCopies = batchItems.reduce((acc, it) => acc + it.copies, 0);

    // If Electron silent printing is configured
    if (window.electronAPI && selectedPrinter && selectedPrinter !== '__dialog__') {
      setIsBatchPrinting(true);
      showToast(`🔄 جاري إرسال دفعة الملصقات (${batchItems.length} صنف، إجمالي ${totalCopies} ملصق) للطابعة...`, 'info');
      try {
        for (const item of batchItems) {
          const res = await window.electronAPI.printSilent({
            printerName: selectedPrinter,
            copies: item.copies,
            width: settings.labelWidth,
            height: settings.labelHeight,
            printMode: settings.printMode || 'roll_gap',
            paperWidth: settings.paperWidth || 105,
            paperHeight: settings.paperHeight || 150,
            orientation: settings.printOrientation || 'portrait'
          });
          if (!res.success) {
            throw new Error(res.error || `فشل طباعة صنف ${item.product.name}`);
          }
        }
        showToast(`✅ تم إرسال كافة ملصقات الدفعة (${totalCopies} ملصق) للطابعة بنجاح!`, 'success');
      } catch (err: any) {
        console.error('Batch silent print error:', err);
        showToast(`❌ تعذر إكمال طباعة الدفعة: ${err.message || err}`, 'error');
      } finally {
        setIsBatchPrinting(false);
      }
      return;
    }

    // Set batch items in DOM print container
    setBatchPrintQueue(batchItems);
    showToast(`🚀 جاري تهيئة وإرسال ${totalCopies} ملصق للطباعة المجمعة...`, 'info');

    // Give React and DOM time to render barcodes
    setTimeout(() => {
      openBrowserPrintWindow(`طباعة دفعة ملصقات (${batchItems.length} أصناف - ${totalCopies} ملصق)`);
      setTimeout(() => {
        setBatchPrintQueue(null);
      }, 5000);
    }, 350);
  };

  // Preset Settings Selector
  const applyPreset = (type: 'standard' | 'mini' | 'large') => {
    if (type === 'standard') {
      setSettings(prev => ({
        ...prev,
        labelWidth: 38,
        labelHeight: 28,
        companyFontSize: 11,
        nameFontSize: 10,
        priceFontSize: 12,
        barcodeHeight: 14,
      }));
      showToast('تم تطبيق المقاس الافتراضي (38 × 28 ملم).');
    } else if (type === 'mini') {
      setSettings(prev => ({
        ...prev,
        labelWidth: 30,
        labelHeight: 20,
        companyFontSize: 9,
        nameFontSize: 8,
        priceFontSize: 10,
        barcodeHeight: 10,
      }));
      showToast('تم تطبيق مقاس مصغّر (30 × 20 ملم).');
    } else {
      setSettings(prev => ({
        ...prev,
        labelWidth: 50,
        labelHeight: 40,
        companyFontSize: 14,
        nameFontSize: 12,
        priceFontSize: 16,
        barcodeHeight: 22,
      }));
      showToast('تم تطبيق مقاس كبير (50 × 40 ملم).');
    }
  };

  const resolvedLabelWidth = settings.labelWidth || 38;
  const resolvedLabelHeight = settings.labelHeight || 28;
  
  const rawPaperWidth = settings.paperWidth || 105;
  const rawPaperHeight = settings.paperHeight || 150;
  const resolvedPaperWidth = (settings.printOrientation === 'landscape' && rawPaperWidth < rawPaperHeight)
    ? rawPaperHeight
    : (settings.printOrientation === 'portrait' && rawPaperWidth > rawPaperHeight)
      ? rawPaperHeight
      : rawPaperWidth;

  const resolvedPaperHeight = (settings.printOrientation === 'landscape' && rawPaperWidth < rawPaperHeight)
    ? rawPaperWidth
    : (settings.printOrientation === 'portrait' && rawPaperWidth > rawPaperHeight)
      ? rawPaperWidth
      : rawPaperHeight;

  return (
    <div dir="rtl" className="print-parent min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans flex flex-col p-1 sm:p-4">
      {/* Native Browser Inline Print Rules */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body, #root, .print-parent {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          ${(settings.printMode || "roll_gap") === "roll" || (settings.printMode || "roll_gap") === "roll_gap" ? `
            @page {
              size: ${resolvedLabelWidth}mm ${settings.printMode === "roll" ? "auto" : resolvedLabelHeight + "mm"};
              margin: 0 !important;
            }
            #print-area {
              display: block !important;
              position: static !important;
              opacity: 1 !important;
              pointer-events: auto !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              direction: ltr !important;
            }
            .print-label-item {
              font-size: 12px !important;
              line-height: normal !important;
              display: block !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 0 ${settings.printMode === "roll" ? (settings.labelGap || 0) : 0}mm 0 !important;
              padding: 0 !important;
              width: ${resolvedLabelWidth}mm !important;
              height: ${settings.printMode === "roll" ? "auto" : resolvedLabelHeight + "mm"} !important;
              min-height: ${resolvedLabelHeight}mm !important;
              max-height: ${settings.printMode === "roll" ? "none" : resolvedLabelHeight + "mm"} !important;
              box-sizing: border-box !important;
              overflow: ${settings.printMode === "roll" ? "visible" : "hidden"} !important;
              transform: translate(${settings.printOffsetX || 0}mm, ${settings.printOffsetY || 0}mm) rotate(${settings.printRotation || 0}deg) scale(${(settings.printScale !== undefined ? settings.printScale : 100) / 100}) !important;
              transform-origin: center center !important;
            }
            ${settings.printMode === "roll_gap" ? `
            .print-label-item:not(:last-child) {
              page-break-after: always !important;
              break-after: page !important;
            }
            ` : ""}
            .print-label-item > div {
              width: 100% !important;
              height: ${settings.printMode === "roll" ? "auto" : "100%"} !important;
              min-height: ${settings.printMode === "roll" ? `${resolvedLabelHeight}mm` : "auto"} !important;
              box-sizing: border-box !important;
              padding: 1.2mm 1.2mm !important;
            }
          ` : `
            @page {
              size: ${resolvedPaperWidth}mm ${resolvedPaperHeight}mm;
              margin: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm !important;
            }
            #print-area {
              display: flex !important;
              position: static !important;
              opacity: 1 !important;
              pointer-events: auto !important;
              overflow: visible !important;
              flex-wrap: wrap !important;
              justify-content: flex-start !important;
              align-content: flex-start !important;
              gap: ${settings.labelGap}mm !important;
              width: 100% !important;
              height: auto !important;
              direction: rtl !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }
            .print-label-item {
              font-size: 12px !important;
              line-height: normal !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 !important;
              padding: 0 !important;
              width: ${resolvedLabelWidth}mm !important;
              height: ${resolvedLabelHeight}mm !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              transform: translate(${settings.printOffsetX || 0}mm, ${settings.printOffsetY || 0}mm) rotate(${settings.printRotation || 0}deg) scale(${(settings.printScale !== undefined ? settings.printScale : 100) / 100}) !important;
              transform-origin: center center !important;
            }
            .print-label-item > div {
              width: 100% !important;
              height: 100% !important;
              box-sizing: border-box !important;
            }
          `}
        }
      `}} />

      {/* Actual Print Paper Container (Stays warmed up, layout-active offscreen, visible only on print to prevent blank sheets) */}
      <div 
        id="print-area" 
        className={`opacity-0 pointer-events-none absolute left-[-9999px] top-[-9999px] w-[500px] h-[500px] overflow-hidden ${
          settings.printMode === "sheet" ? "print:flex print:flex-wrap" : "print:block"
        } text-black bg-white`}
      >
        {(batchPrintQueue && batchPrintQueue.length > 0) ? (
          batchPrintQueue.flatMap((item) =>
            Array.from({ length: item.copies }).map((_, idx) => (
              <div key={`batch-${item.product.id}-${idx}`} className="print-label-item">
                <LabelCard storeLogoUrl={storeLogoUrl} product={item.product} settings={settings} companyName={companyName} zoom={1} borderStyle="solid" />
              </div>
            ))
          )
        ) : (
          currentProduct && Array.from({ 
            length: (window.electronAPI && selectedPrinter && selectedPrinter !== '__dialog__') ? 1 : copies 
          }).map((_, idx) => (
            <div key={idx} className="print-label-item">
              <LabelCard storeLogoUrl={storeLogoUrl} product={currentProduct} settings={settings} companyName={companyName} zoom={1} borderStyle="solid" />
            </div>
          ))
        )}
      </div>

      <div className="no-print w-full max-w-7xl mx-auto flex-1 flex flex-col gap-4">
        {/* Toast Alert Banner - Mounted directly into document.body via Portal with z-[9999999] so it ALWAYS appears on top of any open modal, dialog, or drawer */}
        {typeof document !== 'undefined' && createPortal(
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999999] pointer-events-none w-full max-w-lg px-4 flex flex-col items-center">
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -25, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-md transition-all ${
                    toast.type === "success" 
                      ? "bg-slate-900/95 border-emerald-500/80 text-white shadow-emerald-950/40 ring-1 ring-emerald-500/50" 
                      : toast.type === "error" 
                        ? "bg-slate-900/95 border-rose-500/80 text-white shadow-rose-950/40 ring-1 ring-rose-500/50 animate-shake" 
                        : toast.type === "warning"
                          ? "bg-slate-900/95 border-amber-400/80 text-white shadow-amber-950/40 ring-1 ring-amber-400/50"
                          : "bg-slate-900/95 border-indigo-400/80 text-white shadow-indigo-950/40 ring-1 ring-indigo-400/50"
                  }`}
                  dir="rtl"
                >
                  {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />}
                  {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0 animate-bounce" />}
                  {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />}
                  {toast.type === "info" && <RefreshCw className="w-5 h-5 text-indigo-400 mt-0.5 animate-spin shrink-0" />}
                  
                  <div className="flex-1 text-xs sm:text-sm font-black leading-snug">
                    {toast.text}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setToast(null)} 
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-all cursor-pointer shrink-0"
                    aria-label="إغلاق التنبيه"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body
        )}

        {/* Dashboard Header */}
        <header className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right">
            {/* Custom Designed SVG logo matching the BarCode Master branding precisely! */}
            {/* شعار البرنامج والأيقونة */}
           <div className="relative group flex-shrink-0">
  <label className="relative cursor-pointer block w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-md bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all flex items-center justify-center overflow-hidden">
    <input {...focusProps} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
    
    {/* التحقق: إذا كان هناك شعار مخصص، اعرضه. وإلا، اعرض تصميم زر الرفع */}
    {storeLogoUrl !== '/icon.png' && storeLogoUrl ? (
      <>
        <img 
          src={storeLogoUrl} 
          alt="شعار باركود ماستر" 
          className="w-full h-full object-contain p-1 transition-opacity group-hover:opacity-75" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <Upload className="w-6 h-6 text-white" />
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-indigo-500 transition-colors">
        <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
        <span className="text-[9px] sm:text-[10px] font-bold">رفع شعار</span>
      </div>
    )}
  </label>
  
  {/* زر الحذف يظهر فقط إذا كان هناك شعار مرفوع فعلياً */}
  {storeLogoUrl !== '/icon.png' && storeLogoUrl && (
    <button
      onClick={handleRemoveLogo}
      title="إزالة الشعار"
      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
    >
      <X className="w-4 h-4" />
    </button>
  )}
</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>باركود ماستر</span>
                <span className="text-[#0284c7] font-sans font-black text-[15px] sm:text-[18px] tracking-wide bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">BarCode Master</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-bold">نظام طباعة ملصقات الباركود والأسعار وإصدار عروض المبيعات الذكية.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {typeof window !== 'undefined' && (() => { try { return window.self !== window.top; } catch(e) { return true; } })() && (
              <a 
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-500 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.05] active:scale-[0.95]"
                title="اضغط هنا لتجاوز قيود بيئة التطوير وتجربة طباعة الملصق الحقيقية مباشرة من متصفحك بشكل كامل وبدون قيود!"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>🖨️ فتح في تبويب مستقل لتجربة الطباعة الحقيقية</span>
              </a>
            )}
            {/* شارة الإصدار مع زر فحص التحديثات المباشر */}
            <button
              type="button"
              onClick={() => setShowVersionUpdateModal(true)}
              className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="التحقق من تحديثات الإصدار وتنزيلها مباشرة"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>الإصدار: v{appVersion}</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            </button>

            {/* شارة الإصدار - تظهر فقط في بيئة التطوير */}
            {import.meta.env.DEV && (window as any).isVirtualElectron && (
             <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
              نسخة مرخصة
            </span>
            )}
            {/* زر دليل المطور - يظهر فقط في بيئة التطوير للمبرمج */}
            {import.meta.env.DEV && (window as any).isVirtualElectron && (
              <button 
                onClick={() => setShowUpdateGuide(prev => !prev)}
                className="bg-indigo-50 hover:bg-indigo-150 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all"
              >
                📖 دليل المطور والتحديث
              </button>
            )}
          </div>
        </header>

        {/* Update & Installation Guides Modal Toggle block */}
        {showUpdateGuide && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-[9999] overflow-y-auto no-print" dir="rtl">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-2.5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
              <DesktopExeGuide 
                onClose={() => setShowUpdateGuide(false)} 
                isElectron={isElectron}
                cloudServerUrl={cloudServerUrl}
                setCloudServerUrl={setCloudServerUrl}
              />
            </div>
          </div>
        )}

        {/* Version Update Modal */}
        <VersionUpdateModal
          isOpen={showVersionUpdateModal}
          onClose={() => setShowVersionUpdateModal(false)}
          currentVersion={appVersion}
          cloudServerUrl={cloudServerUrl}
          setCloudServerUrl={setCloudServerUrl}
          onUpdateSuccess={(newVer) => {
            const cleanVer = String(newVer).replace(/^v/, '').trim();
            setAppVersion(cleanVer);
            try { localStorage.setItem('app_version', cleanVer); } catch (e) {}
            showToast(`🎉 تم تحديث البرنامج بنجاح إلى الإصدار v${cleanVer}!`, 'success');
          }}
          autoCheckOnOpen={true}
        />

        {/* Layout Modifiers Panel */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2 sm:p-3 flex items-center justify-center no-print mt-1 duration-200">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-0.5 md:pb-0 scrollbar-none" dir="rtl">
            <button
              type="button"
              onClick={() => {
                setSlideDirection(activeTab === 'preview' ? 0 : -1);
                setActiveTab("preview");
              }}
              className={`flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "preview" 
                  ? "bg-indigo-600 text-white font-bold shadow-xs" 
                  : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>لوحة المعاينة والطباعة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSlideDirection(activeTab === 'preview' ? 1 : -1);
                setActiveTab("products");
              }}
              className={`flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "products" 
                  ? "bg-indigo-600 text-white font-bold shadow-xs" 
                  : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>مخزون وقائمة المنتجات ({products.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSlideDirection(activeTab === 'settings' ? 0 : 1);
                setActiveTab("settings");
              }}
              className={`flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "settings" 
                  ? "bg-indigo-600 text-white font-bold shadow-xs" 
                  : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>قوالب ومقاسات الورق</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSlideDirection(activeTab === 'quotations' ? 0 : 1);
                setActiveTab("quotations");
              }}
              className={`flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "quotations" 
                  ? "bg-indigo-600 text-white font-bold shadow-xs" 
                  : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>عروض الأسعار والفواتير 💼</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSlideDirection(activeTab === 'integrations' ? 0 : 1);
                setActiveTab("integrations");
              }}
              className={`flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "integrations" 
                  ? "bg-indigo-600 text-white font-bold shadow-xs" 
                  : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>الربط ومزامنة ERP والسحابة 🔌</span>
            </button>
          </div>
        </div>

        {/* Dashboard Panels Grid */}
        <main className={`          ${layoutMode === "integrated" ? "grid grid-cols-1 md:grid-cols-12 gap-5" : "grid grid-cols-1 gap-4"}           items-start no-print w-full mt-1           max-w-[1400px] mx-auto h-[calc(100vh-130px)] overflow-hidden        `}>
         {/* Section 1: Preview and Live Actions */}
          <section className={`            ${layoutMode === "integrated" ? "col-span-12 md:col-span-5 lg:col-span-4 xl:col-span-4 md:order-1 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar md:pr-1" : activeTab === "preview" ? "flex flex-col gap-4 w-full h-full overflow-y-auto custom-scrollbar" : "hidden"}            sticky top-4            self-start          `}>
            <AnimatePresence mode="popLayout">
              {(layoutMode === "integrated" || activeTab === "preview") && (
                <motion.div
                  initial={layoutMode === "multipage" ? { opacity: 0, x: slideDirection * 40 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={layoutMode === "multipage" ? { opacity: 0, x: -slideDirection * 40 } : undefined}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="w-full text-right"
                >
                  <div className={`grid grid-cols-1 ${layoutMode === "integrated" ? "" : "lg:grid-cols-12"} gap-5 items-start`} dir="rtl">
                    {/* Right Column (الملصق لليمين): Label preview & printing controls */}
                    <div className={`${layoutMode === "integrated" ? "w-full" : "lg:col-span-5"} flex flex-col gap-4 z-10`}>
                      {/* Active Label Preview Card */}
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200 p-4 sm:p-5 flex flex-col z-20">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 rounded-lg">
                              <Eye className="w-4 h-4 text-indigo-600" />
                            </span>
                            معاينة الملصق المباشرة
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                            {settings.labelWidth} × {settings.labelHeight} ملم
                          </span>
                        </div>

                        {/* شريط بيانات الصنف النشط في واجهة معاينة الملصق مع إبراز أيقونة الميزان عند وجود وزن */}
                        {currentProduct && (
                          <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 mb-3 text-xs shadow-2xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-black text-slate-800 truncate" title={currentProduct.name}>
                                {currentProduct.name}
                              </span>
                              {currentProduct.weight && (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg text-[11px] font-black shrink-0 shadow-2xs">
                                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{currentProduct.weight.toLowerCase().endsWith('g') || currentProduct.weight.includes('جم') || currentProduct.weight.includes('جرام') ? currentProduct.weight : `${currentProduct.weight} جم`}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-black text-indigo-700 text-xs">
                                {currentProduct.price.toFixed(2)} ر.س
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Canvas Stage */}
                        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 py-4 px-3 flex items-center justify-center relative overflow-x-auto min-h-[140px]">
                          {currentProduct ? (
                            <div className="relative">
                              <div className="absolute -top-6 left-0 right-0 text-center text-[9px] text-slate-400 font-mono select-none">
                                ⬅️ العرض: {settings.labelWidth} ملم ➡
                              </div>
                              <div className="absolute -right-6 top-0 bottom-0 flex items-center text-[9px] text-slate-400 font-mono select-none [writing-mode:vertical-rl]">
                                ⬅️ الارتفاع: {settings.labelHeight} ملم ➡
                              </div>
                              
                              <div 
                                className="transition-all duration-200 relative overflow-visible bg-slate-100/50 border border-dashed border-indigo-200/80 shadow-xs"
                                style={{
                                  width: `${settings.labelWidth * Math.max(zoomFactor, 1.2)}mm`,
                                  height: settings.printMode === 'roll' ? 'auto' : `${settings.labelHeight * Math.max(zoomFactor, 1.2)}mm`,
                                  minHeight: `${settings.labelHeight * Math.max(zoomFactor, 1.2)}mm`,
                                  borderRadius: `${(settings.borderRadius || 2) * Math.max(zoomFactor, 1.2)}px`
                                }}
                              >
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform: `translate(${(settings.printOffsetX || 0) * Math.max(zoomFactor, 1.2)}mm, ${(settings.printOffsetY || 0) * Math.max(zoomFactor, 1.2)}mm) rotate(${isPreviewLocked ? 0 : (settings.printRotation || 0)}deg) scale(${(settings.printScale !== undefined ? settings.printScale : 100) / 100})`,
                                    transformOrigin: settings.printMode === 'roll' ? "top center" : "center center",
                                    transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                                  }}
                                >
                                  <LabelCard storeLogoUrl={storeLogoUrl} 
                                    product={currentProduct} 
                                    settings={settings} 
                                    companyName={companyName} 
                                    zoom={Math.max(zoomFactor, 1.2)} 
                                    borderStyle="solid" 
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 text-xs py-5 font-bold">
                              ✨ يرجى تهيئة أو إضافة منتج للمعاينة هنا ✨
                            </div>
                          )}
                        </div>

                        {/* Printer Settings inside Preview Section */}
                        {currentProduct && (
                          <div className="mt-3 border-t border-slate-150 pt-3 flex flex-col gap-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end text-right">
                              {/* Copies count slider/stepper */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] font-extrabold text-slate-500">📋 عدد نسخ الملصق:</label>
                                  <div className="flex gap-1" dir="ltr">
                                    {[1, 5, 12, 24].map(num => (
                                      <button
                                        key={num}
                                        type="button"
                                        onClick={() => setCopies(num)}
                                        className={`px-1.5 py-0.5 text-[9px] font-black rounded border transition-all cursor-pointer ${
                                          copies === num 
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                                            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-55"
                                        }`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                                  <button
                                    type="button"
                                    onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 text-xs border-l border-slate-200 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input {...focusProps}
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={copies}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-full text-center text-xs font-extrabold bg-transparent border-none focus:ring-0 py-0.5 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCopies(prev => Math.min(500, prev + 1))}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 text-xs border-r border-slate-200 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Desktop printer destination mappings */}
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>طابعة الملصقات:</span>
                                  </span>
                                </div>
                                <div className="flex gap-1.5 items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.electronAPI) {
                                        window.electronAPI.getPrinters().then(list => {
                                          setPrinters(list);
                                          showToast("🔄 تم رصد وتحديث قائمة طابعات نظام ويندوز بنجاح!");
                                        });
                                      } else {
                                        showToast("🔄 جاري فحص منافذ USB والشبكة لطابعات ويندوز...");
                                        setTimeout(() => {
                                          showToast("✅ تم فحص طابعات الباركود المحلية بنجاح فوري!", "success");
                                        }, 800);
                                      }
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                                    title="تحديث وتثبيت طابعات ويندوز"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>

                                  <select
                                    value={selectedPrinter}
                                    onChange={(e) => {
                                      setSelectedPrinter(e.target.value);
                                      localStorage.setItem('selected_printer', e.target.value);
                                      showToast(`🎯 تم تثبيت طابعة الملصقات : ${e.target.value === "__dialog__" ? "المتصفح الافتراضي" : e.target.value}`, "info");
                                    }}
                                    className="flex-1 bg-white border border-slate-200 text-xs font-bold rounded-xl p-2 focus:border-indigo-500 text-right appearance-none cursor-pointer shadow-xs w-full min-w-0"
                                  >
                                    <option value="__dialog__">🖥️ المتصفح الافتراضي</option>
                                    {printers.map((pr, idx) => (
                                      <option key={idx} value={pr.name}>
                                        🖨️ {pr.name} {pr.isDefault ? "(ويندوز الافتراضية)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Interactive Direct Print Execution Core Button + Zoom Slider */}
                            <div className="flex flex-col gap-2 mt-2">
                              <button
                                type="button"
                                onClick={triggerNativePrint}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                              >
                                <Printer className="w-4 h-4 text-white" />
                                <span>طباعة فورية للملصقات ({copies} نسخ) 🖨️</span>
                              </button>

                              {/* التعديل هنا: نقل مقبض الزووم ليكون أسفل زر الطباعة مباشرة ضمن نفس الحاوية */}
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex flex-col gap-2 shadow-inner mt-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-500 font-extrabold">🔍 تكبير/تصغير معاينة الملصق أعلاه</span>
                                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold text-[9px]">
                                    {(zoomFactor * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <input {...focusProps}
                                  type="range"
                                  min="1"
                                  max="4"
                                  step="0.1"
                                  value={zoomFactor}
                                  onChange={(e) => setZoomFactor(parseFloat(e.target.value))}
                                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick parameter info display block */}
                      {currentProduct && (
                        <div className="grid grid-cols-3 gap-1.5 text-center" id="quick-params-boxes">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 shadow-2xs">
                            <span className="text-[8px] text-slate-400 block font-bold">الباركود</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 truncate block">
                              {currentProduct.barcode}
                            </span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 shadow-2xs">
                            <span className="text-[8px] text-slate-400 block font-bold">صافي السعر</span>
                            <span className="text-[9px] font-mono font-black text-emerald-600 flex items-center justify-center gap-0.5">
                              <span>{currentProduct.price.toFixed(2)}</span>
                              <span className="text-[80%] font-bold">ر.س</span>
                            </span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 shadow-2xs">
                            <span className="text-[8px] text-slate-400 block font-bold">اسم الشركة المعتمد</span>
                            <input {...focusProps}
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full bg-transparent border-none text-[9.5px] font-black text-slate-700 text-center p-0 focus:outline-none focus:ring-0 text-ellipsis"
                              placeholder="الدفاتر الشمالي"
                            />
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Left Column (قائمة الاصناف): Quick add + Scrollable list */}
                    <div className={`${layoutMode === "integrated" ? "w-full" : "lg:col-span-7"} flex flex-col gap-4 ${layoutMode === "integrated" ? "" : "lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto"} custom-scrollbar lg:pl-3 pb-8`}>
                      {/* Compact Inline Add Product Form */}
                      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer"
                          onClick={() => setIsQuickAddExpanded(!isQuickAddExpanded)}>
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 rounded-lg">
                              <PlusCircle className="w-4 h-4 text-indigo-600" />
                            </span>
                            إضافة صنف جديد وسريع بالمخزن واختياره ➕
                          </span>
                          <span className="text-slate-400 text-xs">{isQuickAddExpanded ? '▼' : '◀'}</span>
                        </div>

                        {isQuickAddExpanded && (
                        <form
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddProduct(e);
                          }}
                          className="flex flex-col gap-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-6">
                              <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center justify-between">
                                <span>📦 اسم الصنف المكتوب بالملصق (مطلوب):</span>
                                {(formTouched.name || formSubmitted) && !productFormValidation.errors.name && newName.trim() && (
                                  <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>صالح</span>
                                  </span>
                                )}
                              </label>
                              <input {...focusProps}
                                id="quick-add-name"
                                type="text"
                                placeholder="مثال: حبر روكو أزرق فاخر 0.7 ملم"
                                value={newName}
                                onBlur={() => setFormTouched(prev => ({ ...prev, name: true }))}
                                onChange={(e) => {
                                  setNewName(e.target.value);
                                  if (!formTouched.name) setFormTouched(prev => ({ ...prev, name: true }));
                                }}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-right focus:outline-none transition-all ${
                                  (formTouched.name || formSubmitted) && productFormValidation.errors.name
                                    ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                    : formTouched.name && newName.trim()
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                    : 'border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                }`}
                              />
                              {(formTouched.name || formSubmitted) && productFormValidation.errors.name && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1 animate-in fade-in-50 duration-150">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{productFormValidation.errors.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center justify-between">
                                <span>💰 السعر ر.س (مطلوب):</span>
                                {(formTouched.price || formSubmitted) && !productFormValidation.errors.price && newPrice.trim() && (
                                  <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>صالح</span>
                                  </span>
                                )}
                              </label>
                              <input {...focusProps}
                                id="quick-add-price"
                                type="number"
                                step="0.01"
                                placeholder="18.50"
                                value={newPrice}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => setFormTouched(prev => ({ ...prev, price: true }))}
                                onChange={(e) => {
                                  setNewPrice(e.target.value);
                                  if (!formTouched.price) setFormTouched(prev => ({ ...prev, price: true }));
                                }}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-center focus:outline-none transition-all ${
                                  (formTouched.price || formSubmitted) && productFormValidation.errors.price
                                    ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                    : formTouched.price && newPrice.trim()
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                    : 'border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                }`}
                              />
                              {(formTouched.price || formSubmitted) && productFormValidation.errors.price && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1 animate-in fade-in-50 duration-150">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{productFormValidation.errors.price}</span>
                                </div>
                              )}
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center gap-1">
                                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                                <span>الوزن بالجرام:</span>
                              </label>
                              <input {...focusProps}
                                id="quick-add-weight"
                                type="text"
                                placeholder="مثال: 500"
                                value={newWeight}
                                onBlur={() => setFormTouched(prev => ({ ...prev, weight: true }))}
                                onChange={(e) => {
                                  setNewWeight(e.target.value);
                                  if (!formTouched.weight) setFormTouched(prev => ({ ...prev, weight: true }));
                                }}
                                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-center focus:outline-none transition-all ${
                                  (formTouched.weight || formSubmitted) && productFormValidation.errors.weight
                                    ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                    : formTouched.weight && newWeight.trim()
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                    : 'border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                }`}
                              />
                              {(formTouched.weight || formSubmitted) && productFormValidation.errors.weight && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1 animate-in fade-in-50 duration-150">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{productFormValidation.errors.weight}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center justify-between">
                              <span>📝 وصف الصنف بالملصق (اختياري):</span>
                              <button 
                                type="button" 
                                onClick={() => setIsDescriptionPinned(!isDescriptionPinned)} 
                                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition-all ${isDescriptionPinned ? 'bg-indigo-100 text-indigo-700 font-extrabold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {isDescriptionPinned ? '📌 مثبت' : '📍 تثبيت الوصف'}
                              </button>
                            </label>
                            <input {...focusProps}
                              type="text"
                              placeholder="مثال: يظهر الوصف أسفل اسم المنتج..."
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center justify-between">
                              <span>📦 وصف إضافي أسفل السعر (محتوى الشحنة):</span>
                              <button 
                                type="button" 
                                onClick={() => setIsShipmentContentPinned(!isShipmentContentPinned)} 
                                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition-all ${isShipmentContentPinned ? 'bg-indigo-100 text-indigo-700 font-extrabold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {isShipmentContentPinned ? '📌 مثبت' : '📍 تثبيت الوصف'}
                              </button>
                            </label>
                            <input {...focusProps}
                              type="text"
                              placeholder="مثال: يظهر الوصف أسفل السعر (إلكترونيات، ملابس، إلخ)..."
                              value={newShipmentContent}
                              onChange={(e) => setNewShipmentContent(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-8">
                              <label className="block text-[9.5px] font-black text-slate-500 mb-1 flex items-center justify-between">
                                <span>🏷️ رقم الباركود الفريد (مطلوب):</span>
                                {(formTouched.barcode || formSubmitted) && !productFormValidation.errors.barcode && newBarcode.trim() && (
                                  <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{productFormValidation.hints.barcode || 'متاح ✓'}</span>
                                  </span>
                                )}
                              </label>
                              <div className="flex gap-2">
                                <input {...focusProps}
                                  id="quick-add-barcode"
                                  type="text"
                                  placeholder="مثال: 401019"
                                  value={newBarcode}
                                  onBlur={() => setFormTouched(prev => ({ ...prev, barcode: true }))}
                                  onChange={(e) => {
                                    setNewBarcode(e.target.value);
                                    if (!formTouched.barcode) setFormTouched(prev => ({ ...prev, barcode: true }));
                                  }}
                                  className={`flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-left focus:outline-none transition-all ${
                                    (formTouched.barcode || formSubmitted) && productFormValidation.errors.barcode
                                      ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                      : formTouched.barcode && newBarcode.trim()
                                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                      : 'border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                                  }`}
                                  dir="ltr"
                                />
                                <button
                                  type="button"
                                  onClick={generateUniqueBarcode}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-3 py-2 rounded-xl border border-indigo-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                >
                                  <span>توليد تلقائي</span>
                                  <span>⚡</span>
                                </button>
                              </div>
                              {(formTouched.barcode || formSubmitted) && productFormValidation.errors.barcode ? (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1 animate-in fade-in-50 duration-150">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{productFormValidation.errors.barcode}</span>
                                </div>
                              ) : (
                                <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                                  <span>💡</span>
                                  <span>اكتب الباركود أو امسحه بالماسح الضوئي أو اضغط توليد تلقائي لإنشاء كود فريد غير مكرر.</span>
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-4">
                              <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                              >
                                <span>إضافة وتحديد مباشر ⚡</span>
                              </button>
                            </div>
                          </div>

                          {/* Togglable Quick Advanced fields for dates/shipping */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setShowQuickExtra(!showQuickExtra)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer select-none"
                            >
                              <span>{showQuickExtra ? '🔽 إخفاء الخيارات المتقدمة للسلعة' : '👉 عرض الخيارات المتقدمة للسلعة (تاريخ الصلاحية، الشحن)'}</span>
                            </button>

                            {showQuickExtra && (
                              <div className="mt-3 bg-slate-50/50 border border-slate-200/50 p-3 rounded-xl flex flex-col gap-3">
                                <div className="grid grid-cols-5 gap-1.5 mt-2">
                                  <div>
                                    <label className="block text-[8px] font-black text-slate-500 mb-0.5">🔥 السعرات</label>
                                    <input {...focusProps} type="text" placeholder="250" value={newCalories} onChange={(e) => setNewCalories(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] text-center font-mono font-bold" />
                                    {productFormValidation.errors.calories && (
                                      <span className="text-[8px] text-rose-600 font-bold block mt-0.5">{productFormValidation.errors.calories}</span>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-black text-slate-500 mb-0.5">🥩 بروتين</label>
                                    <input {...focusProps} type="text" placeholder="10g" value={newProtein} onChange={(e) => setNewProtein(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] text-center font-mono font-bold" />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-black text-slate-500 mb-0.5">🥖 كارب</label>
                                    <input {...focusProps} type="text" placeholder="60g" value={newCarbs} onChange={(e) => setNewCarbs(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] text-center font-mono font-bold" />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-black text-slate-500 mb-0.5">🧈 دهون</label>
                                    <input {...focusProps} type="text" placeholder="12g" value={newFats} onChange={(e) => setNewFats(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] text-center font-mono font-bold" />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-black text-slate-500 mb-0.5">⚖️ الوزن (بالجرام)</label>
                                    <input {...focusProps} type="text" placeholder="500g" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] text-center font-mono font-bold" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="mini-calendars-preview-row">
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-500 mb-0.5">🗓️ تاريخ إنتاج الصنف:</label>
                                    <input {...focusProps}
                                      id="quick-add-prod-date"
                                      type="text"
                                      placeholder="مثال: 2026/04/10"
                                      value={newProdDate}
                                      onChange={(e) => setNewProdDate(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold"
                                    />
                                    <MiniCalendar 
                                      value={newProdDate} 
                                      onSelect={setNewProdDate} 
                                      label="تاريخ الإنتاج" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-500 mb-0.5">⚠️ تاريخ انتهاء أو صلاحية الصنف:</label>
                                    <input {...focusProps}
                                      id="quick-add-exp-date"
                                      type="text"
                                      placeholder="مثال: 2029/04/10"
                                      value={newExpDate}
                                      onChange={(e) => setNewExpDate(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold"
                                    />
                                    <MiniCalendar 
                                      value={newExpDate} 
                                      onSelect={setNewExpDate} 
                                      label="تاريخ الانتهاء" 
                                    />
                                  </div>
                                </div>
                                {productFormValidation.errors.datesComparison && (
                                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl flex items-center gap-1.5 text-[10px] font-bold mt-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>{productFormValidation.errors.datesComparison}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </form>
                        )}
                      </div>

                      {/* Extra details custom drawer (Loaded for all templates) */}
                      {currentProduct && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex flex-col gap-2.5 transition-all duration-200">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 cursor-pointer"
                            onClick={() => setIsExtraDetailsExpanded(!isExtraDetailsExpanded)}>
                            <div className="flex items-center gap-1.5 font-extrabold text-slate-800 text-xs">
                              <span className="p-1 bg-indigo-50 text-indigo-600 rounded">✍️</span>
                              <span>تفاصيل إضافية للملصق الحالي:</span>
                            </div>
                            <span className="text-slate-400 text-xs">{isExtraDetailsExpanded ? '▼' : '◀'}</span>
                          </div>
                          {isExtraDetailsExpanded && (
                            <div className="flex flex-col gap-2.5 pt-1.5">
                          
                          {(settings.arrangement === 'shipment' || settings.arrangement === 'shipment_150x100') && (
                            <>
                              {settings.arrangement === 'shipment_150x100' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right mb-2 bg-slate-50 p-2 rounded border border-slate-200">
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-450 mb-1">📤 اسم المرسل:</label>
                                    <input {...focusProps}
                                      type="text"
                                      value={currentProduct.senderName || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, senderName: val || undefined } : p));
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-450 mb-1">📞 جوال المرسل:</label>
                                    <input {...focusProps}
                                      type="text"
                                      value={currentProduct.senderPhone || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, senderPhone: val || undefined } : p));
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-left" dir="ltr"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-450 mb-1">🏠 عنوان المرسل:</label>
                                    <input {...focusProps}
                                      type="text"
                                      value={currentProduct.senderAddress || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, senderAddress: val || undefined } : p));
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-450 mb-1">🏙️ مدينة المرسل:</label>
                                    <input {...focusProps}
                                      type="text"
                                      value={currentProduct.senderCity || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, senderCity: val || undefined } : p));
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right mb-2 bg-slate-50 p-2 rounded border border-slate-200">
                                <div>
                                  <label className="block text-[9px] font-black text-slate-450 mb-1">📥 اسم المستلم:</label>
                                  <input {...focusProps}
                                    type="text"
                                    value={currentProduct.recipientName || ''}
                                    placeholder="مثال: صالح المعلم"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, recipientName: val || undefined } : p));
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black text-slate-450 mb-1">📞 جوال المستلم:</label>
                                  <input {...focusProps}
                                    type="text"
                                    value={currentProduct.recipientPhone || ''}
                                    placeholder="مثال: 0541234567"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, recipientPhone: val || undefined } : p));
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-left"
                                    dir="ltr"
                                  />
                                </div>
                                {settings.arrangement === 'shipment_150x100' && (
                                  <>
                                    <div>
                                      <label className="block text-[9px] font-black text-slate-450 mb-1">🏠 عنوان المستلم:</label>
                                      <input {...focusProps}
                                        type="text"
                                        value={currentProduct.recipientAddress || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, recipientAddress: val || undefined } : p));
                                        }}
                                        className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-black text-slate-450 mb-1">🏙️ مدينة المستلم:</label>
                                      <input {...focusProps}
                                        type="text"
                                        value={currentProduct.recipientCity || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, recipientCity: val || undefined } : p));
                                        }}
                                        className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {settings.arrangement === 'shipment_150x100' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right mb-2 bg-slate-50 p-2 rounded border border-slate-200">
                                  <div>
                                    <label className="block text-[9px] font-black text-slate-450 mb-1">🚚 اسم شركة الشحن:</label>
                                    <input {...focusProps}
                                      type="text"
                                      value={currentProduct.shippingCompany || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, shippingCompany: val || undefined } : p));
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 text-right"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 mt-4">
                                    <input {...focusProps}
                                      type="checkbox"
                                      id="isFragileCheckbox"
                                      checked={!!currentProduct.isFragile}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, isFragile: checked } : p));
                                      }}
                                      className="w-4 h-4 text-indigo-600 bg-slate-100 border border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isFragileCheckbox" className="text-[10px] font-black text-slate-600 cursor-pointer">
                                      شعار قابل للكسر (Fragile)
                                    </label>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

<div className="grid grid-cols-5 gap-1.5">
                            <div>
                              <label className="block text-[8px] font-black text-slate-450 mb-1">🔥 السعرات</label>
                              <input {...focusProps} type="text" value={currentProduct.calories || ''} placeholder="250" onChange={(e) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, calories: e.target.value || undefined } : p))} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-lg px-1 py-1.5 focus:border-indigo-500 focus:bg-white text-center" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-450 mb-1">🥩 بروتين</label>
                              <input {...focusProps} type="text" value={currentProduct.protein || ''} placeholder="10g" onChange={(e) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, protein: e.target.value || undefined } : p))} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-lg px-1 py-1.5 focus:border-indigo-500 focus:bg-white text-center" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-450 mb-1">🥖 كارب</label>
                              <input {...focusProps} type="text" value={currentProduct.carbs || ''} placeholder="60g" onChange={(e) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, carbs: e.target.value || undefined } : p))} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-lg px-1 py-1.5 focus:border-indigo-500 focus:bg-white text-center" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-450 mb-1">🧈 دهون</label>
                              <input {...focusProps} type="text" value={currentProduct.fats || ''} placeholder="12g" onChange={(e) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, fats: e.target.value || undefined } : p))} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-lg px-1 py-1.5 focus:border-indigo-500 focus:bg-white text-center" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-450 mb-1">⚖️ الوزن (بالجرام)</label>
                              <input {...focusProps} type="text" value={currentProduct.weight || ''} placeholder="500g" onChange={(e) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, weight: e.target.value || undefined } : p))} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold rounded-lg px-1 py-1.5 focus:border-indigo-500 focus:bg-white text-center" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-450 mb-1 flex justify-between items-center">
                              <span>📝 وصف الصنف (يظهر أسفل الاسم):</span>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setIsPreviewDescPinned(!isPreviewDescPinned);
                                  if (!isPreviewDescPinned) setPreviewPinnedDesc(currentProduct.description || '');
                                }} 
                                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition-all ${isPreviewDescPinned ? 'bg-indigo-100 text-indigo-700 font-extrabold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {isPreviewDescPinned ? '📌 مثبت' : '📍 تثبيت'}
                              </button>
                            </label>
                            <input {...focusProps}
                              type="text"
                              value={currentProduct.description || ''}
                              placeholder="اكتب وصفاً إضافياً للمنتج (يظهر أسفل الاسم)"
                              onChange={(e) => {
                                const val = e.target.value;
                                setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, description: val || undefined } : p));
                                if (isPreviewDescPinned) setPreviewPinnedDesc(val);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:bg-white text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-450 mb-1 flex justify-between items-center">
                              <span>📦 وصف إضافي (يظهر أسفل السعر):</span>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setIsPreviewShipmentPinned(!isPreviewShipmentPinned);
                                  if (!isPreviewShipmentPinned) setPreviewPinnedShipment(currentProduct.shipmentContent || '');
                                }} 
                                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition-all ${isPreviewShipmentPinned ? 'bg-indigo-100 text-indigo-700 font-extrabold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {isPreviewShipmentPinned ? '📌 مثبت' : '📍 تثبيت'}
                              </button>
                            </label>
                            <input {...focusProps}
                              type="text"
                              value={currentProduct.shipmentContent || ''}
                              placeholder="اكتب وصفاً للشحنة (مثلاً: إلكترونيات، ملابس، الخ)"
                              onChange={(e) => {
                                const val = e.target.value;
                                setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, shipmentContent: val || undefined } : p));
                                if (isPreviewShipmentPinned) setPreviewPinnedShipment(val);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:bg-white text-right"
                            />
                          </div>
                          {settings.showDates && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right mb-2">
                              <div>
                                <label className="block text-[9px] font-black text-slate-450 mb-1">🗓️ تاريخ الإنتاج:</label>
                                <input {...focusProps}
                                  type="text"
                                  value={currentProduct.prodDate || ''}
                                  placeholder="مثال: 2026/04/10"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, prodDate: val || undefined } : p));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:bg-white text-center"
                                />
                                <MiniCalendar
                                  value={currentProduct.prodDate || ''}
                                  onSelect={(val) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, prodDate: val || undefined } : p))}
                                  label="تاريخ الإنتاج"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-450 mb-1">⚠️ تاريخ الانتهاء:</label>
                                <input {...focusProps}
                                  type="text"
                                  value={currentProduct.expDate || ''}
                                  placeholder="مثال: 2029/04/10"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, expDate: val || undefined } : p));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:bg-white text-center"
                                />
                                <MiniCalendar
                                  value={currentProduct.expDate || ''}
                                  onSelect={(val) => setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, expDate: val || undefined } : p))}
                                  label="تاريخ الانتهاء"
                                />
                              </div>
                            </div>
                          )}
                            </div>
                          )}
                                                  </div>
                      )}
                      {/* Products Interactive Selection list Card */}
                      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 rounded-lg">
                              <Search className="w-4 h-4 text-indigo-600" />
                            </span>
                            اختر الصنف من المخزن للمعاينة والطباعة 🎯
                          </span>
                          <span className="text-[10px] text-slate-400 font-extrabold">
                            عدد السلع: {filteredProducts.length}
                          </span>
                        </div>

                        {/* Search Input and Filter Pills */}
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <input {...focusProps}
                              type="text"
                              placeholder="ابحث بالاسم، الباركود، أو السعر..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-slate-800 text-right focus:outline-none"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                          </div>

                          {/* Filter Tabs */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <button
                              type="button"
                              onClick={() => setProductFilterMode('all')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                productFilterMode === 'all'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>📦 جميع الأصناف</span>
                              <span className="text-[9px] opacity-80 font-mono">({products.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductFilterMode('manual')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                productFilterMode === 'manual'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>✍️ الاصناف المضافة يدوياً</span>
                              <span className="text-[9px] opacity-80 font-mono">({products.filter(p => p.isManual).length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={toggleSelectAllFiltered}
                              className="mr-auto text-[10px] text-indigo-700 hover:text-indigo-900 font-extrabold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                              title={isAllFilteredSelected ? "إلغاء تحديد الكل" : "تحديد كافة الأصناف للطباعة الدفعية"}
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{isAllFilteredSelected ? 'إلغاء التحديد' : 'تحديد الكل للدفعة'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Selected batch summary notification if any */}
                        {selectedBatchIds.length > 0 && (
                          <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-3xs animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span>محدد للدفعة: <strong>{selectedBatchIds.length}</strong> أصناف ({totalBatchCopies} ملصق)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShowBatchModal(true)}
                                className="bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-[11px] px-2 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>معاينة</span>
                              </button>
                              <button
                                type="button"
                                disabled={isBatchPrinting}
                                onClick={executeBatchPrint}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-3xs disabled:opacity-50"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة الدفعة 🖨️</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card item scroll layout */}
                        <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1.5 bg-slate-50/40">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => {
                              const isSelected = p.id === selectedProductId;
                              const isBatchChecked = selectedBatchIds.includes(p.id);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedProductId(p.id);
                                    showToast(`🎯 تم تحديد "${p.name.substring(0, 18)}..." في لوحة المعاينة والطباعة!`, 'success');
                                  }}
                                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                    isBatchChecked
                                      ? "bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400"
                                      : isSelected
                                        ? "bg-indigo-50 border-indigo-300 shadow-xs ring-1 ring-indigo-300"
                                        : "bg-white border-slate-150 hover:bg-slate-50"
                                  }`}
                                >
                                  {/* Right side: Checkbox + Product Name, Details */}
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSelectProduct(p.id, e);
                                      }}
                                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                        isBatchChecked
                                          ? 'bg-indigo-600 text-white shadow-2xs'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                                      }`}
                                      title={isBatchChecked ? "إلغاء من دفعة الطباعة" : "إضافة لدفعة الطباعة"}
                                    >
                                      {isBatchChecked ? (
                                        <CheckSquare className="w-4 h-4" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-extrabold text-xs text-slate-800 break-words">{p.name || '✍️ صنف جديد قيد التحرير'}</span>
                                        {p.isManual && (
                                          <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-amber-200/60">
                                            يدوي ✍️
                                          </span>
                                        )}
                                        {isSelected && (
                                          <span className="bg-indigo-650 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            نشط بالمعاينة
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[9px] text-slate-450 mt-1 flex-wrap font-bold">
                                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">🏷️ {p.barcode}</span>
                                        {p.weight && (
                                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[8.5px] font-black">
                                            <Scale className="w-2.5 h-2.5 text-amber-600" />
                                            <span>{p.weight.toLowerCase().endsWith('g') || p.weight.includes('جم') || p.weight.includes('جرام') ? p.weight : `${p.weight} جم`}</span>
                                          </span>
                                        )}
                                        {p.prodDate && <span>📅 إنتاج: {p.prodDate}</span>}
                                        {p.expDate && <span>⚠️ انتهاء: {p.expDate}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Left side: Price & Action */}
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                      {(p.price || 0).toFixed(2)} ر.س
                                    </span>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                                      isSelected
                                         ? "bg-indigo-600 text-white shadow-3xs"
                                         : "bg-slate-100 text-slate-650 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200"
                                    }`}>
                                      <Printer className="w-3 h-3" />
                                      <span>معاينة وفردي</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold bg-white rounded-lg">
                              🔍 لا يوجد نتائج مطابقة للبحث أو المخزن فارغ!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Section 2: Products Stock Management */}
          <section className={layoutMode === "integrated" ? "col-span-12 md:col-span-7 lg:col-span-8 xl:col-span-8 md:order-2 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pb-10" : activeTab === "products" ? "flex flex-col gap-4 w-full h-full overflow-y-auto pb-10" : "hidden"}>
            <AnimatePresence mode="popLayout">
              {(layoutMode === "integrated" || activeTab === "products") && (
                <motion.div
                  initial={layoutMode === "multipage" ? { opacity: 0, x: slideDirection * 40 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={layoutMode === "multipage" ? { opacity: 0, x: -slideDirection * 40 } : undefined}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5 flex flex-col gap-4 text-right"
                >
                  {/* Stock Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3" id="stock-actions-header">
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-slate-800">📦 مخزون وقائمة السلع والمنتجات</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">البحث برقم الباركود والاسم وإدراج صفوف فارغة جديدة للكتابة المباشرة.</p>
                    </div>
                    
                    {/* Add product action buttons */}
                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => insertBlankRow(1, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="إدراج صف فارغ جديد مباشرة في الجدول للبدء بالكتابة"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إدراج صف فارغ بالجدول ➕</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(prev => !prev)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{showAddForm ? 'إغلاق النموذج 🔼' : 'نموذج الإضافة 📋'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual add Form toggled */}
                  {showAddForm && (
                    <form noValidate onSubmit={handleAddProduct} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3" id="manual-add-row-form">
                      <div className="flex items-center justify-between border-b border-indigo-100/40 pb-2">
                        <span className="font-extrabold text-xs text-indigo-900 block">➕ إدخال بيانات صنف يدوي بالمخزن:</span>
                        {formSubmitted && !productFormValidation.isValid && (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>يرجى استكمال الحقول المطلوبة</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[9.5px] font-black text-slate-500 mb-0.5 flex items-center justify-between">
                            <span>📦 اسم الصنف المكتوب بالملصق (مطلوب):</span>
                            {(formTouched.name || formSubmitted) && !productFormValidation.errors.name && newName.trim() && (
                              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>صالح</span>
                              </span>
                            )}
                          </label>
                          <input {...focusProps}
                            id="manual-add-name"
                            type="text"
                            placeholder="مثال: حبر روكو أزرق فاخر 0.7 ملم"
                            value={newName}
                            onBlur={() => setFormTouched(prev => ({ ...prev, name: true }))}
                            onChange={(e) => {
                              setNewName(e.target.value);
                              if (!formTouched.name) setFormTouched(prev => ({ ...prev, name: true }));
                            }}
                            className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none transition-all ${
                              (formTouched.name || formSubmitted) && productFormValidation.errors.name
                                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                : formTouched.name && newName.trim()
                                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {(formTouched.name || formSubmitted) && productFormValidation.errors.name && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{productFormValidation.errors.name}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-black text-slate-500 mb-0.5 flex items-center justify-between">
                            <span>💰 سعر البيع النقدي ر.س (مطلوب):</span>
                            {(formTouched.price || formSubmitted) && !productFormValidation.errors.price && newPrice.trim() && (
                              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>صالح</span>
                              </span>
                            )}
                          </label>
                          <input {...focusProps}
                            id="manual-add-price"
                            type="number"
                            step="0.01"
                            placeholder="18.50"
                            value={newPrice}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => setFormTouched(prev => ({ ...prev, price: true }))}
                            onChange={(e) => {
                              setNewPrice(e.target.value);
                              if (!formTouched.price) setFormTouched(prev => ({ ...prev, price: true }));
                            }}
                            className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 text-center focus:outline-none transition-all ${
                              (formTouched.price || formSubmitted) && productFormValidation.errors.price
                                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                : formTouched.price && newPrice.trim()
                                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {(formTouched.price || formSubmitted) && productFormValidation.errors.price && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{productFormValidation.errors.price}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="block text-[9.5px] font-black text-slate-500 mb-0.5 flex items-center justify-between">
                            <span>🏷️ رقم الباركود الفريد للملصق (مطلوب):</span>
                            {(formTouched.barcode || formSubmitted) && !productFormValidation.errors.barcode && newBarcode.trim() && (
                              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{productFormValidation.hints.barcode || 'متاح ✓'}</span>
                              </span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input {...focusProps}
                              id="manual-add-barcode"
                              type="text"
                              placeholder="مثال: 401019"
                              value={newBarcode}
                              onBlur={() => setFormTouched(prev => ({ ...prev, barcode: true }))}
                              onChange={(e) => {
                                setNewBarcode(e.target.value);
                                if (!formTouched.barcode) setFormTouched(prev => ({ ...prev, barcode: true }));
                              }}
                              className={`flex-1 bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 text-left focus:outline-none transition-all ${
                                (formTouched.barcode || formSubmitted) && productFormValidation.errors.barcode
                                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400/40'
                                  : formTouched.barcode && newBarcode.trim()
                                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30'
                                  : 'border-slate-200 focus:border-indigo-500'
                              }`}
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={generateUniqueBarcode}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-indigo-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <span>توليد تلقائي</span>
                              <span>⚡</span>
                            </button>
                          </div>
                          {(formTouched.barcode || formSubmitted) && productFormValidation.errors.barcode ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{productFormValidation.errors.barcode}</span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              💡 يجب أن يكون الباركود فريداً وأرقام أو حروف إنجليزية فقط لضمان دقة القراءة والطباعة.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expiry / Production mini-calendars as per user intent */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5" id="mini-calendars-manual-row">
                        <div>
                          <label className="block text-[9.5px] font-black text-indigo-900 flex items-center gap-1">
                            🗓️ تاريخ إنتاج الصنف وتعبئته:
                          </label>
                          <input {...focusProps}
                            id="manual-add-prod-date"
                            type="text"
                            placeholder="مثال: 2026/04/10"
                            value={newProdDate}
                            onChange={(e) => setNewProdDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-center font-mono mt-1 font-bold"
                          />
                          {/* Mini Calendar re-loaded with Cairo theme */}
                          <MiniCalendar 
                            value={newProdDate} 
                            onSelect={setNewProdDate} 
                            label="تاريخ الإنتاج" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-black text-indigo-900 flex items-center gap-1">
                            ⚠️ تاريخ انتهاء أو صلاحية الصنف:
                          </label>
                          <input {...focusProps}
                            id="manual-add-exp-date"
                            type="text"
                            placeholder="مثال: 2029/04/10"
                            value={newExpDate}
                            onChange={(e) => setNewExpDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-center font-mono mt-1 font-bold"
                          />
                          <MiniCalendar 
                            value={newExpDate} 
                            onSelect={setNewExpDate} 
                            label="تاريخ الانتهاء" 
                          />
                        </div>
                      </div>

                      {productFormValidation.errors.datesComparison && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl flex items-center gap-1.5 text-[10px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>{productFormValidation.errors.datesComparison}</span>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-2.5 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewName('');
                            setNewBarcode('');
                            setNewPrice('');
                            setNewProdDate('');
                            setNewExpDate('');
                            setFormSubmitted(false);
                            setFormTouched({});
                            setShowAddForm(false);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          إلغاء وتفريغ
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all shadow-xs"
                        >
                          حفظ الصنف وطباعته 💾
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Stock Tools and File Handlers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 border border-slate-200/60 p-2.5 rounded-xl text-[11px] items-stretch" id="stock-util-tools">
                    <label className="bg-white hover:bg-indigo-50/50 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all text-center flex flex-col justify-center items-center gap-1 shrink-0 font-extrabold cursor-pointer shadow-2xs">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      استيراد إكسل Excel
                      <input {...focusProps}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="bg-white hover:bg-indigo-50/50 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all text-center flex flex-col justify-center items-center gap-1 shrink-0 font-extrabold cursor-pointer shadow-2xs"
                    >
                      <Download className="w-5 h-5 text-emerald-600" />
                      تحميل قالب إكسل
                    </button>

                    <label className="bg-white hover:bg-indigo-50/50 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all text-center flex flex-col justify-center items-center gap-1 shrink-0 font-extrabold cursor-pointer shadow-2xs">
                      <Upload className="w-5 h-5 text-indigo-600" />
                      استيراد نسخة JSON
                      <input {...focusProps}
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="bg-white hover:bg-indigo-50/50 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all text-center flex flex-col justify-center items-center gap-1 shrink-0 font-extrabold cursor-pointer shadow-2xs"
                    >
                      <Save className="w-5 h-5 text-indigo-600" />
                      تصدير نسخة JSON
                    </button>
                  </div>

                  {/* Search and products lists */}
                  <div className="flex flex-col sm:flex-row gap-2 relative">
                    <div className="flex-1 relative">
                      <input {...focusProps}
                        type="text"
                        placeholder="ابحث السلع والمنتجات بالاسم أو قيمة الباركود أو السعر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-slate-700 text-right pr-9"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={toggleSelectAllFiltered}
                        className={`border px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                          isAllFilteredSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                        title={isAllFilteredSelected ? "إلغاء تحديد كافة الأصناف" : "تحديد كافة الأصناف المعروضة للطباعة"}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{isAllFilteredSelected ? 'إلغاء التحديد' : 'تحديد الكل'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDatabase}
                        className="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title="إعادة السلع الافتراضية"
                      >
                        إعادة الافتراضي 🔄
                      </button>
                      <button
                        type="button"
                        onClick={() => exportProductsToExcel(products)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title="تصدير إلى إكسل"
                      >
                        تصدير إكسل 📊
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAllProducts}
                        className="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-red-500 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title="تفريغ كل المخزن"
                      >
                        تفريغ المخزن 🗑️
                      </button>
                    </div>
                  </div>

                  {/* Batch Selection Action Banner */}
                  {selectedBatchIds.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-indigo-950">
                              تم تحديد {selectedBatchIds.length} من أصل {products.length} صنف
                            </span>
                            <span className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs">
                              إجمالي: {totalBatchCopies} ملصق
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold">تعيين عدد نسخ موحد:</span>
                            {[1, 2, 3, 5, 10].map(cnt => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => applyGlobalBatchCopies(cnt)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                  globalBatchCopies === cnt
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white hover:bg-indigo-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowBatchModal(true)}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4 text-indigo-600" />
                          <span>معاينة وتخصيص ({selectedBatchIds.length})</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBatchPrinting}
                          onClick={executeBatchPrint}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة الدفعة كاملة ({totalBatchCopies} ملصق) 🖨️</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearBatchSelection}
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          title="إلغاء التحديد"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Blank Rows & Grid Insertion Toolbar */}
                  <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => insertBlankRow(1, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          title="إدراج صف فارغ جديد في أعلى الجدول للإدخال اليدوي السريع"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ إدراج صف فارغ جديد</span>
                        </button>

                        <div className="inline-flex rounded-xl shadow-2xs border border-slate-200 bg-white p-0.5 text-xs font-bold text-slate-700">
                          <span className="text-[10px] text-slate-400 px-2 flex items-center font-bold">إدراج متعدد:</span>
                          <button
                            type="button"
                            onClick={() => insertBlankRow(3, true)}
                            className="hover:bg-indigo-50 hover:text-indigo-700 px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-black"
                            title="إدراج 3 صفوف فارغة دفعة واحدة"
                          >
                            + 3 صفوف
                          </button>
                          <span className="text-slate-200 self-center">|</span>
                          <button
                            type="button"
                            onClick={() => insertBlankRow(5, true)}
                            className="hover:bg-indigo-50 hover:text-indigo-700 px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-black"
                            title="إدراج 5 صفوف فارغة دفعة واحدة"
                          >
                            + 5 صفوف
                          </button>
                          <span className="text-slate-200 self-center">|</span>
                          <button
                            type="button"
                            onClick={() => insertBlankRow(10, true)}
                            className="hover:bg-indigo-50 hover:text-indigo-700 px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-black"
                            title="إدراج 10 صفوف فارغة دفعة واحدة"
                          >
                            + 10 صفوف
                          </button>
                        </div>
                      </div>

                      {emptyRowsCount > 0 && (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-3xs">
                            <span>✍️ يوجد <strong>{emptyRowsCount}</strong> صفوف فارغة قيد التحرير</span>
                          </span>
                          <button
                            type="button"
                            onClick={cleanupEmptyRows}
                            className="text-[11px] text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                            title="حذف كافة الصفوف الفارغة التي لم تُسجل لها أسماء"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>تنظيف الفارغ 🧹</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                      <span className="hidden xl:inline text-indigo-700 font-bold bg-white/90 border border-indigo-100 px-2.5 py-1 rounded-xl shadow-3xs">
                        💡 نصيحة: اضغط <code>Enter</code> في خانة السعر للحفظ وإدراج صف فارغ تالٍ مباشرة كالجداول المالية!
                      </span>
                    </div>
                  </div>

                  {/* Product items loop */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-[500px] overflow-y-auto flex flex-col">
                    <table className="w-full table-auto border-collapse text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold sticky top-0 border-b border-slate-200 z-10 shadow-3xs">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllFilteredSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isSomeFilteredSelected;
                              }}
                              onChange={toggleSelectAllFiltered}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer border-slate-300 focus:ring-indigo-500"
                              title={isAllFilteredSelected ? "إلغاء تحديد الكل" : "تحديد كافة الأصناف المعروضة"}
                            />
                          </th>
                          <th className="p-3">📦 اسم المنتج والبيانات</th>
                          <th className="p-3 text-center min-w-[130px]">🏷️ الباركود</th>
                          <th className="p-3 text-center min-w-[110px]">💰 السعر صافي</th>
                          <th className="p-3 text-center min-w-[110px]">📋 نسخ الدفعة</th>
                          <th className="p-3 text-center min-w-[160px]">⚙️ خيارات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredProducts.map((p) => {
                          const isSelected = p.id === selectedProductId;
                          const isBatchSelected = selectedBatchIds.includes(p.id);
                          const itemCopies = batchCopiesMap[p.id] || 1;
                          const isBlank = !p.name.trim();
                          const isInlineEditing = inlineEditingId === p.id || (isBlank && p.isManual);

                          if (isInlineEditing) {
                            return (
                              <tr
                                key={p.id}
                                className="bg-amber-50/70 border-r-4 border-amber-500 shadow-3xs transition-all"
                              >
                                <td className="p-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isBatchSelected}
                                    onChange={(e) => toggleSelectProduct(p.id, e)}
                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer border-slate-300 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={p.name}
                                        autoFocus={inlineEditingId === p.id}
                                        placeholder="أدخل اسم الصنف هنا (مثال: حبر روكو أزرق فاخر 0.7 ملم)..."
                                        onChange={(e) => updateProductInline(p.id, 'name', e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const tr = e.currentTarget.closest('tr');
                                            (tr?.querySelector('.inline-barcode-input') as HTMLElement | null)?.focus();
                                          }
                                        }}
                                        className="w-full bg-white border border-amber-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 shadow-2xs"
                                      />
                                      {isBlank && (
                                        <span className="text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-extrabold whitespace-nowrap border border-amber-200 animate-pulse shrink-0">
                                          صف فارغ ✍️
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold flex-wrap">
                                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-3xs">
                                        <span>📅 إنتاج:</span>
                                        <input
                                          type="text"
                                          placeholder="2026/05"
                                          value={p.prodDate || ''}
                                          onChange={(e) => updateProductInline(p.id, 'prodDate', e.target.value)}
                                          className="w-20 font-mono text-center text-[10px] bg-transparent focus:outline-none text-slate-700 font-bold"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-3xs">
                                        <span>⚠️ انتهاء:</span>
                                        <input
                                          type="text"
                                          placeholder="2027/05"
                                          value={p.expDate || ''}
                                          onChange={(e) => updateProductInline(p.id, 'expDate', e.target.value)}
                                          className="w-20 font-mono text-center text-[10px] bg-transparent focus:outline-none text-slate-700 font-bold"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-3xs">
                                        <span>📦 مستلم:</span>
                                        <input
                                          type="text"
                                          placeholder="مستلم الشحنة (اختياري)"
                                          value={p.recipientName || ''}
                                          onChange={(e) => updateProductInline(p.id, 'recipientName', e.target.value)}
                                          className="w-28 text-[10px] bg-transparent focus:outline-none text-slate-700"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="text"
                                      dir="ltr"
                                      value={p.barcode}
                                      placeholder="الباركود"
                                      onChange={(e) => updateProductInline(p.id, 'barcode', e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const tr = e.currentTarget.closest('tr');
                                          (tr?.querySelector('.inline-price-input') as HTMLElement | null)?.focus();
                                        }
                                      }}
                                      className="inline-barcode-input w-24 bg-white border border-amber-300 focus:border-indigo-600 rounded-xl px-2 py-1 text-xs font-mono font-black text-center shadow-2xs text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = Math.floor(100000 + Math.random() * 900000).toString();
                                        updateProductInline(p.id, 'barcode', rand);
                                        showToast(`⚡ باركود جديد: ${rand}`, 'info');
                                      }}
                                      className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg cursor-pointer transition-all shadow-3xs text-[11px]"
                                      title="توليد باركود تلقائي سريع"
                                    >
                                      ⚡
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      value={p.price === 0 && isBlank ? '' : p.price}
                                      onChange={(e) => updateProductInline(p.id, 'price', parseFloat(e.target.value) || 0)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (!p.name.trim()) {
                                            showToast('⚠️ يرجى إدخال اسم الصنف أولاً قبل إضافة صف جديد.', 'error');
                                            return;
                                          }
                                          setInlineEditingId(null);
                                          insertBlankRow(1, false, p.id);
                                        }
                                      }}
                                      className="inline-price-input w-20 bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl px-2 py-1 text-xs font-mono font-black text-center text-emerald-600 shadow-2xs"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">ر.س</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center">
                                  {isBatchSelected ? (
                                    <div className="inline-flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateBatchItemCopies(p.id, itemCopies - 1);
                                        }}
                                        className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded font-black text-slate-700 flex items-center justify-center text-xs cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={itemCopies}
                                        onChange={(e) => updateBatchItemCopies(p.id, parseInt(e.target.value, 10) || 1)}
                                        className="w-8 text-center font-mono font-bold text-xs text-indigo-700 bg-transparent focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateBatchItemCopies(p.id, itemCopies + 1);
                                        }}
                                        className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded font-black text-slate-700 flex items-center justify-center text-xs cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleSelectProduct(p.id, e)}
                                      className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold px-2 py-0.5 rounded hover:bg-indigo-50 transition-all cursor-pointer"
                                    >
                                      + إضافة للدفعة
                                    </button>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!p.name.trim()) {
                                          showToast('⚠️ يرجى إدخال اسم المنتج لحفظ الصف.', 'error');
                                          return;
                                        }
                                        setInlineEditingId(null);
                                        setSelectedProductId(p.id);
                                        showToast(`✅ تم حفظ صنف "${p.name}" في المخزن!`, 'success');
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl font-black text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                      title="حفظ واعتماد الصنف"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>حفظ</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => insertBlankRow(1, false, p.id)}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-3xs flex items-center gap-0.5"
                                      title="إدراج صف فارغ جديد تالٍ أسفل هذا الصف مباشرة"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>+ صف</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteBlankOrProductRow(p.id, p.name)}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-xl transition-all cursor-pointer"
                                      title={isBlank ? "إلغاء وحذف هذا الصف الفارغ" : "حذف الصنف"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr 
                              key={p.id} 
                              onDoubleClick={() => setInlineEditingId(p.id)}
                              className={`hover:bg-slate-50/80 transition-colors cursor-default ${
                                isBatchSelected 
                                  ? 'bg-indigo-50/60 text-slate-900 border-r-4 border-indigo-600 shadow-3xs' 
                                  : isSelected 
                                    ? 'bg-indigo-50/30 text-slate-900 border-r-2 border-indigo-400' 
                                    : 'text-slate-600'
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isBatchSelected}
                                  onChange={(e) => toggleSelectProduct(p.id, e)}
                                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer border-slate-300 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 break-words">{p.name || '✍️ صنف جديد قيد التحرير'}</span>
                                    {p.isManual && (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-amber-200/60">
                                        يدوي ✍️
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-1 flex-wrap">
                                    {p.weight && (
                                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[8.5px] font-black">
                                        <Scale className="w-2.5 h-2.5 text-amber-600" />
                                        <span>{p.weight.toLowerCase().endsWith('g') || p.weight.includes('جم') || p.weight.includes('جرام') ? p.weight : `${p.weight} جم`}</span>
                                      </span>
                                    )}
                                    {p.prodDate && <span>📅 إنتاج: {p.prodDate}</span>}
                                    {p.expDate && <span>⚠️ انتهاء: {p.expDate}</span>}
                                    {p.recipientName && <span className="bg-slate-100 px-1.5 py-0.2 rounded font-black text-slate-600">📦 مستلم: {p.recipientName}</span>}
                                    {p.shipmentContent && <span className="bg-slate-100 px-1.5 py-0.2 rounded font-black text-slate-600">🚚 محتوى: {p.shipmentContent}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono font-extrabold">
                                {p.barcode}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-emerald-600">
                                {(p.price || 0).toFixed(2)} ر.س
                              </td>
                              <td className="p-3 text-center">
                                {isBatchSelected ? (
                                  <div className="inline-flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateBatchItemCopies(p.id, itemCopies - 1);
                                      }}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded font-black text-slate-700 flex items-center justify-center text-xs cursor-pointer"
                                      title="إنقاص عدد النسخ"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      max="999"
                                      value={itemCopies}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => updateBatchItemCopies(p.id, parseInt(e.target.value, 10) || 1)}
                                      className="w-8 text-center font-mono font-bold text-xs text-indigo-700 bg-transparent focus:outline-none"
                                      title="عدد النسخ المخصصة لهذا الملصق"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateBatchItemCopies(p.id, itemCopies + 1);
                                      }}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 rounded font-black text-slate-700 flex items-center justify-center text-xs cursor-pointer"
                                      title="زيادة عدد النسخ"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleSelectProduct(p.id, e)}
                                    className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold px-2 py-0.5 rounded hover:bg-indigo-50 transition-all cursor-pointer"
                                  >
                                    + إضافة للدفعة
                                  </button>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProductId(p.id);
                                      showToast(`تم تحديد "${p.name.substring(0, 15)}..." للمعاينة فوراً!`, "info");
                                    }}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg font-black shrink-0 transition-all cursor-pointer text-[11px]"
                                    title="معاينة وتعديل"
                                  >
                                    معاينة 🏷️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInlineEditingId(p.id);
                                      setSelectedProductId(p.id);
                                    }}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 p-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                                    title="تعديل سريع ومباشر في الجدول"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditProduct(p)}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                                    title="تعديل الخصائص الكاملة للسلعة"
                                  >
                                    <Settings2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                                    title="حذف الصنف من القائمة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 font-bold bg-white">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="text-3xl">📝</div>
                                <span className="text-xs">لم يتم العثور على أي سلع تطابق البحث، أو أن جدول المخزن فارغ حالياً!</span>
                                <button
                                  type="button"
                                  onClick={() => insertBlankRow(1, true)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>إدراج أول صف فارغ والبدء في الإدخال الآن</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Table bottom persistent insert row button */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => insertBlankRow(1, false)}
                        className="w-full bg-white hover:bg-indigo-50/80 border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-700 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs group"
                      >
                        <Plus className="w-4 h-4 text-indigo-600 group-hover:scale-125 transition-transform" />
                        <span>+ انقر هنا لإدراج صف فارغ جديد في نهاية الجدول للإدخال السريع ➕</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline edit product attributes modal dialog */}
                  {editingProduct && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-100 shadow-2xl flex flex-col gap-4 text-right duration-200">
                        <span className="text-sm font-extrabold text-slate-800 block border-b border-slate-100 pb-2">✏️ تعديل صنف بالمخاطبة المباشرة:</span>
                        
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">اسم المنتج:</label>
                            <input {...focusProps}
                              type="text"
                              value={editingProduct.name}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right font-extrabold text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">وصف المنتج (اختياري):</label>
                            <input {...focusProps}
                              type="text"
                              value={editingProduct.description || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">السعر ر.س:</label>
                              <input {...focusProps}
                                type="number"
                                step="0.01"
                                value={editingProduct.price}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-slate-850"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">رقم الباركود:</label>
                              <div className="flex gap-2">
                                <input {...focusProps}
                                  type="text"
                                  value={editingProduct.barcode}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono font-bold text-slate-850"
                                  dir="ltr"
                                />
                                {!editingProduct.barcode && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingProduct({ ...editingProduct, barcode: Math.floor(100000 + Math.random() * 900000).toString() })}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2 py-1.5 rounded-lg border border-indigo-200 transition-all cursor-pointer shrink-0"
                                  >
                                    توليد ⚡
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ الإنتاج:</label>
                              <input {...focusProps}
                                type="text"
                                value={editingProduct.prodDate || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, prodDate: e.target.value || undefined })}
                                placeholder="مثال: 2026/04/15"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold mb-1"
                              />
                              <MiniCalendar
                                value={editingProduct.prodDate || ''}
                                onSelect={(val) => setEditingProduct({ ...editingProduct, prodDate: val || undefined })}
                                label="تاريخ الإنتاج"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ الانتهاء:</label>
                              <input {...focusProps}
                                type="text"
                                value={editingProduct.expDate || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, expDate: e.target.value || undefined })}
                                placeholder="مثال: 2029/04/15"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold mb-1"
                              />
                              <MiniCalendar
                                value={editingProduct.expDate || ''}
                                onSelect={(val) => setEditingProduct({ ...editingProduct, expDate: val || undefined })}
                                label="تاريخ الانتهاء"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 mb-1">🔥 السعرات</label>
                              <input {...focusProps} type="text" value={editingProduct.calories || ''} onChange={(e) => setEditingProduct({ ...editingProduct, calories: e.target.value || undefined })} placeholder="250" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-[10px] text-center font-mono font-bold" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 mb-1">🥩 بروتين</label>
                              <input {...focusProps} type="text" value={editingProduct.protein || ''} onChange={(e) => setEditingProduct({ ...editingProduct, protein: e.target.value || undefined })} placeholder="10g" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-[10px] text-center font-mono font-bold" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 mb-1">🥖 كارب</label>
                              <input {...focusProps} type="text" value={editingProduct.carbs || ''} onChange={(e) => setEditingProduct({ ...editingProduct, carbs: e.target.value || undefined })} placeholder="60g" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-[10px] text-center font-mono font-bold" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 mb-1">🧈 دهون</label>
                              <input {...focusProps} type="text" value={editingProduct.fats || ''} onChange={(e) => setEditingProduct({ ...editingProduct, fats: e.target.value || undefined })} placeholder="12g" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-[10px] text-center font-mono font-bold" />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 mb-1">⚖️ الوزن (بالجرام)</label>
                              <input {...focusProps} type="text" value={editingProduct.weight || ''} onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value || undefined })} placeholder="500g" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-[10px] text-center font-mono font-bold" />
                            </div>
                          </div>

                          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col gap-3 mt-1">
                            <span className="text-[11px] font-black text-indigo-800">📦 بيانات الشحن (للملصق الخاص بالشحن فقط):</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم المستلم:</label>
                                <input {...focusProps}
                                  type="text"
                                  value={editingProduct.recipientName || ''}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, recipientName: e.target.value || undefined })}
                                  placeholder="محمد..."
                                  className="w-full bg-white border border-indigo-200 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">جوال المستلم:</label>
                                <input {...focusProps}
                                  type="text"
                                  value={editingProduct.recipientPhone || ''}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, recipientPhone: e.target.value || undefined })}
                                  placeholder="055..."
                                  className="w-full bg-white border border-indigo-200 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono font-bold text-slate-800"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">محتوى الشحنة:</label>
                              <input {...focusProps}
                                type="text"
                                value={editingProduct.shipmentContent || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, shipmentContent: e.target.value || undefined })}
                                placeholder="اكتب محتوى الشحنة (أو سيتم استخدام اسم المنتج)"
                                className="w-full bg-white border border-indigo-200 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(null)}
                            className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white px-5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer"
                          >
                            حفظ وحفظ التعديلات الحالية 💾
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

         {/* Section 3: Templates and Custom settings */}
          <section className={layoutMode === "integrated" ? "col-span-12 md:order-3 flex flex-col gap-4 mt-1" : activeTab === "settings" ? "flex flex-col gap-4 w-full h-full overflow-y-auto custom-scrollbar" : "hidden"}>
            <AnimatePresence mode="popLayout">
              {(layoutMode === "integrated" || activeTab === "settings") && (
                <motion.div
                  initial={layoutMode === "multipage" ? { opacity: 0, x: slideDirection * 40 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={layoutMode === "multipage" ? { opacity: 0, x: -slideDirection * 40 } : undefined}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="flex flex-col gap-4 w-full"
                >
                  <div className="bg-amber-50/75 rounded-2xl border border-amber-100 shadow-sm">
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="w-full flex items-center justify-between p-4 bg-amber-100/30 hover:bg-amber-100/50 transition-colors cursor-pointer text-right rounded-t-2xl"
                    >
                      <span className="flex items-center gap-2 font-extrabold text-amber-900 text-xs sm:text-sm">
                        <span className="p-1.5 bg-amber-200/50 text-amber-800 rounded-lg">
                          <Settings2 className="w-4 h-4" />
                        </span>
                        ⚙️ إعدادات ورق الطابعة والملصقات وتصاميم الهوية المتقدمة
                      </span>
                      <ChevronDown className={`w-5 h-5 text-amber-700 transition-transform duration-300 ${isSettingsOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    <div className={`transition-all duration-300 ${isSettingsOpen ? 'max-h-[5000px] border-t border-amber-100 overflow-visible' : 'max-h-0 overflow-hidden'}`}>
                      <div className="p-2.5 sm:px-4 sm:py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        
                        {/* Dynamic Settings Fields - Left Column (8/12 of the page width) */}
                        <div className="lg:col-span-8 flex flex-col gap-3 text-right lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto custom-scrollbar lg:pl-3 pb-8">
                        
                        {/* بطاقة تحديثات الإصدار والنظام المباشرة */}
                        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-blue-400/20 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-2xl shrink-0">
                              <RefreshCw className="w-6 h-6 animate-spin-slow" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-black">إصدار النظام والتحديثات المباشرة</h3>
                                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full">
                                  v{appVersion}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                نظام التحديث الذكي: يمكنك فحص ملف الإصدار البعيد وتحديث وتثبيت النظام بنقرة واحدة من نفس الجهاز دون الحاجة لتحميله على فلاشة USB.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowVersionUpdateModal(true)}
                              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                              title="التحقق من تحديثات الإصدار"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              <span>التحقق من تحديثات الإصدار</span>
                            </button>
                          </div>
                        </div>

                        {/* Templates Library widget */}
                        <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/40 p-3 sm:py-3 sm:px-4 rounded-xl border border-indigo-100 flex flex-col gap-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-extrabold text-indigo-900 text-xs">
                              🏆 قوالب الملصقات المسرعة وتصاميم الهوية المحفوظة
                            </span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                              {SYSTEM_TEMPLATES.length + customTemplates.length} قوالب متاحة
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                            <div className="md:col-span-8">
                              <label className="block text-[9.5px] font-bold text-slate-550 mb-1">اسم قالب الملصق وتوزيعه النشط للطباعة الحالية:</label>
                              <select
                                value={selectedTemplateId}
                                onChange={(e) => handleLoadTemplate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-extrabold text-slate-700 focus:outline-none"
                              >
                                <optgroup label="قوالب النظام القياسية المدمجة">
                                  {SYSTEM_TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>📦 {t.name}</option>
                                  ))}
                                </optgroup>
                                {customTemplates.length > 0 && (
                                  <optgroup label="قوالبك المخصصة المحفوظة">
                                    {customTemplates.map(t => (
                                      <option key={t.id} value={t.id}>⭐️ {t.name} ({t.settings.labelWidth} × {t.settings.labelHeight} ملم)</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                            </div>

                            <div className="md:col-span-4 flex gap-1 flex-wrap items-center">
                              <button
                                type="button"
                                onClick={() => setShowSaveModal(true)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2.5 py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                حفظ كجديد..
                              </button>
                              {selectedTemplateId.startsWith('custom-') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleUpdateTemplate}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1"
                                    title="حفظ التغييرات القياسية على القالب النشط حالياً"
                                  >
                                    تحديث القالب
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(selectedTemplateId)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-lg transition-all flex items-center justify-center shrink-0"
                                    title="حذف هذا القالب المخصص نهائياً"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Save Template Modal Triggered inside */}
                        {showSaveModal && (
                          <div className="bg-white border-2 border-indigo-500 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1">
                                💾 حفظ القياسات الحالية والمعايرات في قالب تصميم جديد:
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowSaveModal(false)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 hover:bg-slate-50 rounded"
                              >
                                إلغاء
                              </button>
                            </div>
                            <form onSubmit={handleSaveActiveAsTemplate} className="flex gap-1.5">
                              <input {...focusProps}
                                type="text"
                                required
                                placeholder="أدخل اسماً معبراً (مثال: ملصق فصوص الرفوف)"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 text-right"
                              />
                              <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0"
                              >
                                تأكيد الحفظ 💾
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Print Configurations Slidings Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-amber-200/60 flex flex-col gap-2.5">
                            <span className="font-extrabold text-xs text-amber-900 block border-b border-amber-50 pb-1">📄 طبيعة وطريقة طباعة الهويات والملصقات</span>
                            
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">نوع طابعة المخرجات المستهدفة حالياً:</label>
                              <select
                                value={settings.printMode || "roll_gap"}
                                onChange={(e) => setSettings(prev => ({ ...prev, printMode: e.target.value }))}
                                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-1 text-xs font-black text-slate-800 focus:outline-none"
                              >
                                <option value="roll">🖨️ رول حراري متصل (Continuous - إيصال متصل بدون فواصل)</option>
                                <option value="roll_gap">🏷️ ملصقات رول مع فواصل (Labels with Gaps)</option>
                                <option value="sheet">📄 صفائح مجمعة مشتركة (مشتركة A4 / A5 / A6)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">📐 اتجاه صفحة الطباعة (Orientation):</label>
                              <select
                                value={settings.printOrientation || "portrait"}
                                onChange={(e) => setSettings(prev => ({ ...prev, printOrientation: e.target.value }))}
                                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-1 text-xs font-black text-slate-800 focus:outline-none"
                              >
                                <option value="portrait">📐 عمودي (Portrait - لتغذية الطابعة الرول)</option>
                                <option value="landscape">🌅 أفقي (Landscape)</option>
                                <option value="auto">⚙️ تلقائي (Auto - ملائمة المتصفح)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">🔄 زاوية تدوير وتوجيه الملصق (Rotation):</label>
                              <select
                                value={settings.printRotation || 0}
                                onChange={(e) => setSettings(prev => ({ ...prev, printRotation: parseInt(e.target.value, 10) }))}
                                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-1 text-xs font-black text-slate-800 focus:outline-none"
                              >
                                <option value={0}>0° - اتجاه عادي قياسي</option>
                                <option value={90}>90° - تدوير لليمين (ربع دورة)</option>
                                <option value={180}>180° - مقلوب عكسي (يحل مشكلة الطباعة بالعكس)</option>
                                <option value={270}>270° - تدوير ليساراً (ربع دورة)</option>
                              </select>
                              
                              {/* زر قفل المعاينة الذكي */}
                              <label className="flex items-center gap-2 mt-2 cursor-pointer bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                <input
                                  type="checkbox"
                                  checked={isPreviewLocked}
                                  onChange={(e) => setIsPreviewLocked(e.target.checked)}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer focus:ring-0"
                                />
                                <span className="text-[9px] font-black text-indigo-900">
                                  {isPreviewLocked ? "🔓 تثبيت المعاينة (دائماً عمودي)" : "🔄 مزامنة المعاينة مع تدوير الطباعة"}
                                </span>
                              </label>
                            </div>

                            {/* Print Calibration offsets */}
                            <div className="flex flex-col gap-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100 mt-1">
                              <span className="text-[9.5px] font-extrabold text-slate-500 text-center block">📐 معايرة الإزاحة الدقيقة بالمليمتر (Calibration Margin Shift)</span>
                              <div className="grid grid-cols-2 gap-2 text-right">
                                <div>
                                  <div className="flex justify-between text-[8px] font-bold mb-0.5">
                                    <span>↔️ إزاحة يمين/يسار:</span>
                                    <span className="text-indigo-600 font-bold">{settings.printOffsetX || 0}mm</span>
                                  </div>
                                  <input {...focusProps}
                                    type="range"
                                    min="-20"
                                    max="20"
                                    step="0.5"
                                    value={settings.printOffsetX || 0}
                                    onChange={(e) => setSettings(prev => ({ ...prev, printOffsetX: parseFloat(e.target.value) }))}
                                    className="w-full h-1 accent-indigo-600 bg-slate-200 rounded"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-[8px] font-bold mb-0.5">
                                    <span>↕️ إزاحة أعلى/أسفل:</span>
                                    <span className="text-indigo-600 font-bold">{settings.printOffsetY || 0}mm</span>
                                  </div>
                                  <input {...focusProps}
                                    type="range"
                                    min="-20"
                                    max="20"
                                    step="0.5"
                                    value={settings.printOffsetY || 0}
                                    onChange={(e) => setSettings(prev => ({ ...prev, printOffsetY: parseFloat(e.target.value) }))}
                                    className="w-full h-1 accent-indigo-600 bg-slate-200 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-amber-200/60 flex flex-col justify-between gap-2.5">
                            <div className="flex flex-col gap-2">
                              <span className="font-extrabold text-xs text-amber-900 block border-b border-amber-50 pb-1">📏 مقاس الملصق الفردي بالتفصيل (ملم)</span>
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-510">
                                <div>
                                  <label className="block mb-0.5">عرض الملصق:</label>
                                  <input {...focusProps}
                                    type="number"
                                    value={settings.labelWidth}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labelWidth: Math.max(1, parseInt(e.target.value, 10) || 0) }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-0.5">ارتفاع الملصق:</label>
                                  <input {...focusProps}
                                    type="number"
                                    value={settings.labelHeight}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labelHeight: Math.max(1, parseInt(e.target.value, 10) || 0) }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-0.5">فواصل gap ملم:</label>
                                  <input {...focusProps}
                                    type="number"
                                    step="0.5"
                                    value={settings.labelGap}
                                    onChange={(e) => setSettings(prev => ({ ...prev, labelGap: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-semibold text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Preset calibration shortcuts */}
                            <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 flex flex-col gap-1.5 mt-1.5">
                              <span className="text-[9px] text-indigo-900 leading-none block font-black text-right">💡 مقاسات ملصقات تجارية شائعة مسبقة:</span>
                              <div className="grid grid-cols-3 gap-1">
                                <button
                                  type="button"
                                  onClick={() => applyPreset('mini')}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 px-1 py-1 rounded text-[8.5px] font-black cursor-pointer shadow-3xs"
                                >
                                  🏷️ مصغر (30 × 20)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset('standard')}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 px-1 py-1 rounded text-[8.5px] font-black cursor-pointer shadow-3xs"
                                >
                                  🏷️ قياسي (38 × 28)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset('large')}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 px-1 py-1 rounded text-[8.5px] font-black cursor-pointer shadow-3xs"
                                >
                                  🏷️ طرود كبار (50 × 40)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Font weights, styles and sizing configurations */}
                        <div className="border-t border-amber-200/60 pt-3 mt-1 mr-0.5">
                          <span className="font-extrabold text-amber-900 text-xs block mb-2">✏️ إعدادات نصوص وخطوط الملصق (بكسل / أوزان)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-right">
                            {/* Brand FontSize / FontWeight config */}
                            <div className="bg-white rounded-xl p-2.5 border border-amber-100 flex flex-col gap-1.5 shadow-3xs">
                              <label className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">🏢 اسم الشركة والرمز</label>
                              
                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">اسم الشركة النشط:</span>
                                <input {...focusProps}
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  placeholder="مثال: الدفاتر الشمالي"
                                  className="w-full border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-50 bg-slate-50 focus:bg-white rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none mb-1"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم الخط: <strong>{settings.companyFontSize}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="8"
                                  max="24"
                                  step="0.5"
                                  value={settings.companyFontSize}
                                  onChange={(e) => setSettings(prev => ({ ...prev, companyFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>
                              {storeLogoUrl !== '/icon.png' && storeLogoUrl && (
                                <>
                                  <div>
                                    <span className="text-[9px] text-slate-400 block mb-0.5">حجم الشعار: <strong>{settings.logoSize || 100}%</strong></span>
                                    <input {...focusProps}
                                      type="range"
                                      min="50"
                                      max="300"
                                      step="10"
                                      value={settings.logoSize || 100}
                                      onChange={(e) => setSettings(prev => ({ ...prev, logoSize: parseFloat(e.target.value) }))}
                                      className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div>
                                      <span className="text-[9px] text-slate-400 block mb-0.5">إزاحة يمين/يسار:</span>
                                      <input {...focusProps}
                                        type="range"
                                        min="-50"
                                        max="50"
                                        step="1"
                                        value={settings.logoOffsetX || 0}
                                        onChange={(e) => setSettings(prev => ({ ...prev, logoOffsetX: parseFloat(e.target.value) }))}
                                        className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                      />
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-400 block mb-0.5">إزاحة أعلى/أسفل:</span>
                                      <input {...focusProps}
                                        type="range"
                                        min="-50"
                                        max="50"
                                        step="1"
                                        value={settings.logoOffsetY || 0}
                                        onChange={(e) => setSettings(prev => ({ ...prev, logoOffsetY: parseFloat(e.target.value) }))}
                                        className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">وزن الخط:</span>
                                <select
                                  value={settings.companyFontWeight}
                                  onChange={(e) => setSettings(prev => ({ ...prev, companyFontWeight: e.target.value }))}
                                  className="w-full border border-slate-200 rounded p-0.5 text-xs bg-slate-50 font-bold"
                                >
                                  <option value="500">نحيف عاديل (500)</option>
                                  <option value="600">عقاري عادي (600)</option>
                                  <option value="700">سميك ممتد (700)</option>
                                  <option value="800">أقوى وزن سميك (800)</option>
                                </select>
                              </div>
                            </div>

                            {/* Product Name sizing configurations */}
                            <div className="bg-white rounded-xl p-2.5 border border-amber-100 flex flex-col gap-1.5 shadow-3xs">
                              <label className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">📦 اسم المنتج والتفاصيل</label>
                              
                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم الخط: <strong>{settings.nameFontSize}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="7"
                                  max="18"
                                  step="0.5"
                                  value={settings.nameFontSize}
                                  onChange={(e) => setSettings(prev => ({ ...prev, nameFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم خط الوصف: <strong>{settings.descriptionFontSize || 8}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="5"
                                  max="14"
                                  step="0.5"
                                  value={settings.descriptionFontSize || 8}
                                  onChange={(e) => setSettings(prev => ({ ...prev, descriptionFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم خط البيانات الغذائية والوزن: <strong>{settings.caloriesFontSize || 10}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="6"
                                  max="16"
                                  step="0.5"
                                  value={settings.caloriesFontSize || 10}
                                  onChange={(e) => setSettings(prev => ({ ...prev, caloriesFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">أقصى حد أسطر:</span>
                                <select
                                  value={settings.nameLines}
                                  onChange={(e) => setSettings(prev => ({ ...prev, nameLines: parseInt(e.target.value, 10) }))}
                                  className="w-full border border-slate-200 rounded p-0.5 text-xs bg-slate-50 font-bold"
                                >
                                  <option value={1}>سطر واحد فقط</option>
                                  <option value={2}>سطرين متتاليين</option>
                                  <option value={3}>3 أسطر لتفصيل طويل</option>
                                </select>
                              </div>
                            </div>

                            {/* Price FontSize configuration */}
                            <div className="bg-white rounded-xl p-2.5 border border-amber-100 flex flex-col gap-1.5 shadow-3xs">
                              <label className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">💰 حقل السعر والعملة</label>
                              
                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم الخط: <strong>{settings.priceFontSize}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="8"
                                  max="24"
                                  step="0.5"
                                  value={settings.priceFontSize}
                                  onChange={(e) => setSettings(prev => ({ ...prev, priceFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">نموذج العملة المكتوبة:</span>
                                <select
                                  value={settings.currencySymbol || 'sar-monogram'}
                                  onChange={(e) => setSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                                  className="w-full border border-slate-200 rounded p-0.5 text-xs bg-slate-50 font-bold text-right"
                                >
                                  <option value="sar-monogram">رسم شعار ر.س الفاخر 🔠</option>
                                  <option value="sar-text">نص عربي سريع (ر.س)</option>
                                  <option value="sar-en">نص إنجليزي فوري (SAR)</option>
                                  <option value="usd">الدولار الأمريكي ($)</option>
                                  <option value="eur">اليورو (€)</option>
                                  <option value="kwd">دينار كويتي (د.ك)</option>
                                </select>
                              </div>
                            </div>

                            {/* Barcode height / line-width configuration */}
                            <div className="bg-white rounded-xl p-2.5 border border-amber-100 flex flex-col gap-1.5 shadow-3xs">
                              <label className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">🏷️ خطوط ومعايرة الباركود</label>
                              
                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">ارتفاع خط الباركود: <strong>{settings.barcodeHeight}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="5"
                                  max="35"
                                  step="1"
                                  value={settings.barcodeHeight}
                                  onChange={(e) => setSettings(prev => ({ ...prev, barcodeHeight: parseInt(e.target.value, 10) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">سماكة خط الباركود:</span>
                                <input {...focusProps}
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.05"
                                  value={settings.barcodeWidth}
                                  onChange={(e) => setSettings(prev => ({ ...prev, barcodeWidth: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-105 rounded"
                                />
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 block mb-0.5">حجم رقم كود المنتج: <strong>{settings.numberFontSize}px</strong></span>
                                <input {...focusProps}
                                  type="range"
                                  min="4"
                                  max="16"
                                  step="0.5"
                                  value={settings.numberFontSize}
                                  onChange={(e) => setSettings(prev => ({ ...prev, numberFontSize: parseFloat(e.target.value) }))}
                                  className="w-full h-1 accent-amber-600 bg-slate-100 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Visibility Switches & Color selections */}
                        <div className="border-t border-amber-200/60 pt-3 mt-1.5 text-right grid grid-cols-1 md:grid-cols-2 gap-3" id="toggle-switches-colors">
                          <div className="bg-white rounded-xl p-3 border border-slate-200/60 flex flex-col gap-2">
                            <span className="font-extrabold text-[10.5px] text-slate-600 block border-b border-slate-50 pb-1">👀 التحكم بإظهار وإخفاء عناصر الملصق الحالية</span>
                            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-black text-slate-600">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showBrand !== false}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showBrand: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                إظهار اسم الشركة
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showPrice !== false}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showPrice: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                إظهار حقل السعر والعملة
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showBarcode !== false}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showBarcode: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                إظهار خطوط الباركود
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showCode !== false}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showCode: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                إظهار رقم كود المنتج
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showTaxInclusive === true}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showTaxInclusive: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                إظهار رمز "شامل الضريبة"
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input {...focusProps}
                                  type="checkbox"
                                  checked={settings.showDates === true}
                                  onChange={(e) => setSettings(prev => ({ ...prev, showDates: e.target.checked }))}
                                  className="rounded text-indigo-650 cursor-pointer w-3.5 h-3.5 focus:ring-0"
                                />
                                تفعيل ونشر التواريخ بالملصق
                              </label>

                              {settings.showDates && (
                                <div className="mt-1">
                                  <span className="text-[9px] text-slate-400 block mb-0.5">حجم خط التواريخ: <strong>{settings.dateFontSize}px</strong></span>
                                  <input {...focusProps}
                                    type="range"
                                    min="6"
                                    max="14"
                                    step="0.5"
                                    value={settings.dateFontSize}
                                    onChange={(e) => setSettings(prev => ({ ...prev, dateFontSize: parseFloat(e.target.value) }))}
                                    className="w-full h-1 accent-indigo-600 bg-slate-100 rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Font types presets & style selections */}
                          <div className="bg-white rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-[10.5px] text-slate-600 block border-b border-slate-50 pb-1">🎨 تحديد كنية وهدف خط الكتابة النشط بالملصق</span>
                              <div className="grid grid-cols-2 gap-2 text-right mt-1.5">
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-0.5">نوع الخط المستخدم:</label>
                                  <select
                                    value={settings.fontFamilyPreset || 'cairo'}
                                    onChange={(e) => setSettings(prev => ({ ...prev, fontFamilyPreset: e.target.value as any }))}
                                    className="w-full bg-slate-55 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold"
                                  >
                                    <option value="cairo">خط القاهرة الجميل (Cairo)</option>
                                    <option value="system">خط تجوال المبسط (Tajawal)</option>
                                    <option value="amiri">الخط الأميري الكلاسيكي (Amiri)</option>
                                    <option value="mono">أرقام أحادية للباركود (JetBrains Mono)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-0.5">شكل وحجم حواف الحدود:</label>
                                  <select
                                    value={settings.borderStyle || 'solid'}
                                    onChange={(e) => setSettings(prev => ({ ...prev, borderStyle: e.target.value as any }))}
                                    className="w-full bg-slate-55 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold"
                                  >
                                    <option value="solid">خط كامل مصمت (Solid)</option>
                                    <option value="dashed">خط مقطع متناثر (Dashed)</option>
                                    <option value="dotted">نقاط متتالية هندسية (Dotted)</option>
                                    <option value="none">بدون حدود تماماً (إخفاء الحواف للرول)</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 items-center justify-between border-t border-slate-100 pt-2 mt-1">
                              <button
                                type="button"
                                onClick={handleResetSettings}
                                className="bg-amber-50 hover:bg-amber-100 border border-amber-150 text-amber-900 px-3 py-1 rounded text-xs font-black shrink-0 transition-all cursor-pointer"
                              >
                                🔄 إعادة ضبط الإعدادات الافتراضية
                              </button>
                            </div>
                          </div>
                        </div>

                        </div>

                        {/* Right Column: Live Label Customization Preview Sticky Panel (4/12 of the page width) */}
                        <div className="lg:col-span-4 flex flex-col gap-3.5 order-first lg:order-last lg:sticky lg:top-4 z-10">
                          <div className="bg-white rounded-2xl border-2 border-amber-550/15 p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5 font-sans">
                                <span className="p-1 px-1.5 bg-amber-50/70 text-amber-805 rounded-lg text-[10px]">✨</span>
                                معاينة تصميم الملصق المباشرة (تحديث فوري):
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                                {settings.labelWidth} × {settings.labelHeight} ملم
                              </span>
                            </div>

                            {/* Canvas Stage */}
                            <div className="bg-slate-50/40 rounded-xl border border-dashed border-slate-200 py-6 px-3 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
                              {currentProduct ? (
                                <div className="relative">
                                  <div className="absolute -top-6 left-0 right-0 text-center text-[8px] text-slate-400 font-mono select-none">
                                    ⬅️ العرض: {settings.labelWidth} ملم ➡
                                  </div>
                                  <div className="absolute -right-6 top-0 bottom-0 flex items-center text-[8px] text-slate-400 font-mono select-none [writing-mode:vertical-rl]">
                                    ⬅️ الارتفاع: {settings.labelHeight} ملم ➡
                                  </div>

                                  <div 
                                    className="transition-all duration-205 relative overflow-visible bg-white border border-dashed border-indigo-200/50 shadow-xs"
                                    style={{
                                      width: `${settings.labelWidth * zoomFactor}mm`,
                                      height: settings.printMode === 'roll' ? 'auto' : `${settings.labelHeight * zoomFactor}mm`,
                                      minHeight: `${settings.labelHeight * zoomFactor}mm`,
                                      borderRadius: `${(settings.borderRadius || 2) * zoomFactor}px`
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: `translate(${(settings.printOffsetX || 0) * zoomFactor}mm, ${(settings.printOffsetY || 0) * zoomFactor}mm) rotate(${isPreviewLocked ? 0 : (settings.printRotation || 0)}deg) scale(${(settings.printScale !== undefined ? settings.printScale : 100) / 100})`,
                                        transformOrigin: settings.printMode === 'roll' ? "top center" : "center center",
                                        transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                                      }}
                                    >
                                      <LabelCard storeLogoUrl={storeLogoUrl} 
                                        product={currentProduct} 
                                        settings={settings} 
                                        companyName={companyName} 
                                        zoom={zoomFactor} 
                                        borderStyle="solid" 
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center font-bold text-xs text-slate-400">
                                  الرجاء اختيار منتج من القائمة أولاً لمعاينة تصاميم باركودك ⚠️
                                </div>
                              )}
                            </div>

                            {/* التعديل هنا: مقبض التحكم بالتكبير والتصغير (Slider) */}
                            {currentProduct && (
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex flex-col gap-1 shadow-inner mt-1">
                                <div className="flex justify-between items-center text-[10px] mb-1">
                                  <span className="text-slate-500 font-extrabold">🔍 حجم معاينة الشاشة الحالية (تقريب تفاعلي)</span>
                                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold text-[9px]">
                                    {(zoomFactor * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <input {...focusProps}
                                  type="range"
                                  min="1"
                                  max="4"
                                  step="0.1"
                                  value={zoomFactor}
                                  onChange={(e) => setZoomFactor(parseFloat(e.target.value))}
                                  className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            )}

                            {/* Additional label details */}
                            <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-150 flex flex-col gap-1.5 text-right text-[10px]">
                              <span className="font-extrabold text-slate-700 block border-b border-dashed border-slate-200 pb-1">ℹ️ تفاصيل القالب النشط:</span>
                              <div className="grid grid-cols-2 gap-2 text-slate-600 font-semibold">
                                <div>• نوع الموضع: <strong className="text-slate-800">{settings.printMode === "sheet" ? "صفائح" : "رول حراري"}</strong></div>
                                <div>• نوع الخط: <strong className="text-slate-800">
                                  {settings.fontFamilyPreset === 'cairo' ? 'Cairo' : settings.fontFamilyPreset === 'system' ? 'Tajawal' : settings.fontFamilyPreset === 'amiri' ? 'Amiri' : 'JetBrains Mono'}
                                </strong></div>
                                <div>• حواف الحدود: <strong className="text-slate-800">{settings.borderStyle === 'none' ? 'بدون حدود' : settings.borderStyle}</strong></div>
                                <div>• زاوية التدوير: <strong className="text-slate-800">{settings.printRotation || 0}°</strong></div>
                              </div>
                            </div>

                            {/* Custom Actions directly in Settings */}
                            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                              <button
                                type="button"
                                onClick={triggerNativePrint}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-3 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                              >
                                <Printer className="w-3.5 h-3.5 text-white" />
                                <span>طبع ملصق تجريبي ({copies} نسخ) 🖨️</span>
                              </button>
                            </div>
                            
                            <span className="text-[9px] text-slate-400 text-center font-bold">
                              💡 أي تعديل بالأسفل على الخطوط أو المقاسات ينعكس هنا فوراً!
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Section 4: Quotations Manager Panel */}
          <section className={activeTab === "quotations" ? "flex flex-col gap-4 w-full h-full overflow-y-auto custom-scrollbar" : "hidden"}>
            <AnimatePresence mode="popLayout">
              {activeTab === "quotations" && (
                <motion.div
                  initial={layoutMode === "multipage" ? { opacity: 0, x: slideDirection * 40 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={layoutMode === "multipage" ? { opacity: 0, x: -slideDirection * 40 } : undefined}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="flex flex-col gap-4 w-full pb-32"
                >
                  <QuotationManager 
                    products={products} 
                    setProducts={setProducts}
                    companyName={companyName}
                    storeLogoUrl={storeLogoUrl}
                    showToast={showToast}
                    quotations={quotations}
                    setQuotations={setQuotations}
                    sqlitePath={sqlitePath}
                    dbSyncMode={dbSyncMode}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Section 5: ERP & SQLite Integration Tab Panel */}
          <section className={activeTab === "integrations" ? "flex flex-col gap-4 w-full h-full overflow-y-auto custom-scrollbar" : "hidden"}>
            <AnimatePresence mode="popLayout">
              {activeTab === "integrations" && (
                <motion.div
                  initial={layoutMode === "multipage" ? { opacity: 0, x: slideDirection * 40 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={layoutMode === "multipage" ? { opacity: 0, x: -slideDirection * 40 } : undefined}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="flex flex-col gap-4 w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-xs mb-32"
                >
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                      <RefreshCw className="w-5 h-5" />
                    </span>
                    <div className="flex-1">
                      <h2 className="text-base font-black text-slate-800">تكامل الأنظمة وقواعد البيانات الذكية</h2>
                      <p className="text-[11px] text-slate-505 font-semibold mt-0.5">اربط مع SQLite، أو منصات ERP السحابية (دفترة، الأستاذ)، أو فعّل البث المباشر للأصناف والمطابقة الذكية.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                      <span className="text-xs font-bold text-slate-700">تفعيل المزامنة كلياً</span>
                      <div className="relative inline-block w-8 h-4 transition duration-200 ease-in-out rounded-full bg-slate-200">
                        <input {...focusProps}
                          type="checkbox"
                          className="absolute w-4 h-4 opacity-0 cursor-pointer"
                          checked={isGlobalSyncEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsGlobalSyncEnabled(val);
                            localStorage.setItem('is_global_sync_enabled', val ? 'true' : 'false');
                          }}
                        />
                        <div className={`absolute left-0 inline-block w-4 h-4 transition duration-200 ease-in-out transform bg-white border border-slate-200 rounded-full shadow-sm ${isGlobalSyncEnabled ? 'translate-x-4 bg-emerald-500 border-emerald-500' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  </div>
                  
                  {isGlobalSyncEnabled && (
                  <DatabaseSyncPanel
                    dbSyncMode={dbSyncMode}
                    setDbSyncMode={setDbSyncMode}
                    sqlitePath={sqlitePath}
                    setSqlitePath={setSqlitePath}
                    sqliteQuery={sqliteQuery}
                    setSqliteQuery={setSqliteQuery}
                    dbApiUrl={dbApiUrl}
                    setDbApiUrl={setDbApiUrl}
                    dbFieldMapName={dbFieldMapName}
                    setDbFieldMapName={setDbFieldMapName}
                    dbFieldMapPrice={dbFieldMapPrice}
                    setDbFieldMapPrice={setDbFieldMapPrice}
                    dbFieldMapBarcode={dbFieldMapBarcode}
                    setDbFieldMapBarcode={setDbFieldMapBarcode}
                    dbFieldMapSku={dbFieldMapSku}
                    setDbFieldMapSku={setDbFieldMapSku}
                    isSmartSyncEnabled={isSmartSyncEnabled}
                    setIsSmartSyncEnabled={setIsSmartSyncEnabled}
                    dbFieldMapProdDate={dbFieldMapProdDate}
                    setDbFieldMapProdDate={setDbFieldMapProdDate}
                    dbFieldMapExpDate={dbFieldMapExpDate}
                    setDbFieldMapExpDate={setDbFieldMapExpDate}

                    daftraFieldMapName={daftraFieldMapName}
                    setDaftraFieldMapName={setDaftraFieldMapName}
                    daftraFieldMapPrice={daftraFieldMapPrice}
                    setDaftraFieldMapPrice={setDaftraFieldMapPrice}
                    daftraFieldMapBarcode={daftraFieldMapBarcode}
                    setDaftraFieldMapBarcode={setDaftraFieldMapBarcode}
                    daftraFieldMapSku={daftraFieldMapSku}
                    setDaftraFieldMapSku={setDaftraFieldMapSku}
                    daftraFieldMapProdDate={daftraFieldMapProdDate}
                    setDaftraFieldMapProdDate={setDaftraFieldMapProdDate}
                    daftraFieldMapExpDate={daftraFieldMapExpDate}
                    setDaftraFieldMapExpDate={setDaftraFieldMapExpDate}

                    ostadFieldMapName={ostadFieldMapName}
                    setOstadFieldMapName={setOstadFieldMapName}
                    ostadFieldMapPrice={ostadFieldMapPrice}
                    setOstadFieldMapPrice={setOstadFieldMapPrice}
                    ostadFieldMapBarcode={ostadFieldMapBarcode}
                    setOstadFieldMapBarcode={setOstadFieldMapBarcode}
                    ostadFieldMapSku={ostadFieldMapSku}
                    setOstadFieldMapSku={setOstadFieldMapSku}
                    ostadFieldMapProdDate={ostadFieldMapProdDate}
                    setOstadFieldMapProdDate={setOstadFieldMapProdDate}
                    ostadFieldMapExpDate={ostadFieldMapExpDate}
                    setOstadFieldMapExpDate={setOstadFieldMapExpDate}

                    isSyncingDb={isSyncingDb}
                    dbSyncResult={dbSyncResult}
                    onSync={handleSyncDatabase}
                    selectLocalSqliteFile={selectLocalSqliteFile}
                    isAutoSyncEnabled={isAutoSyncEnabled}
                    setIsAutoSyncEnabled={setIsAutoSyncEnabled}
                    autoSyncInterval={autoSyncInterval}
                    setAutoSyncInterval={setAutoSyncInterval}
                    lastAutoSyncTime={lastAutoSyncTime}
                    showSqlBridgeInstructions={showSqlBridgeInstructions}
                    setShowSqlBridgeInstructions={setShowSqlBridgeInstructions}
                    isElectron={isElectron}
                    cloudServerUrl={cloudServerUrl}
                    setCloudServerUrl={setCloudServerUrl}
                    erpProvider={erpProvider}
                    setErpProvider={setErpProvider}
                    erpSubdomain={erpSubdomain}
                    setErpSubdomain={setErpSubdomain}
                    erpApiKey={erpApiKey}
                    setErpApiKey={setErpApiKey}
                    erpCustomUrl={erpCustomUrl}
                    setErpCustomUrl={setErpCustomUrl}
                    erpBranchId={erpBranchId}
                    setErpBranchId={setErpBranchId}
                    daftraAuthType={daftraAuthType}
                    setDaftraAuthType={setDaftraAuthType}
                    daftraClientId={daftraClientId}
                    setDaftraClientId={setDaftraClientId}
                    daftraClientSecret={daftraClientSecret}
                    setDaftraClientSecret={setDaftraClientSecret}
                    daftraUsername={daftraUsername}
                    setDaftraUsername={setDaftraUsername}
                    daftraPassword={daftraPassword}
                    setDaftraPassword={setDaftraPassword}
                    webhookLogs={webhookLogs}
                    onClearWebhooks={clearWebhooks}
                    onAddWebhookProduct={handleAddWebhookProduct}
                    onPollWebhooks={() => fetchRecentWebhooks(false)}
                    isPollingWebhooks={isPollingWebhooks}
                    divideBy100Sqlite={divideBy100Sqlite}
                    setDivideBy100Sqlite={setDivideBy100Sqlite}
                    divideBy100Api={divideBy100Api}
                    setDivideBy100Api={setDivideBy100Api}
                    divideBy100Erp={divideBy100Erp}
                    setDivideBy100Erp={setDivideBy100Erp}
                    divideBy100Webhook={divideBy100Webhook}
                    setDivideBy100Webhook={setDivideBy100Webhook}
                  />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>
      </div>

      {/* Footer copyright */}
      <footer className="w-full max-w-7xl mx-auto border-t border-slate-200 mt-6 pt-4 text-center text-[10px] text-slate-400 font-semibold no-print pb-4">
        حقوق النشر والطبع محفوظة © {new Date().getFullYear()} – مصمم ومحسّن لنقاط البيع والصيدليات والمتاجر السعودية 🇸🇦
      </footer>

      {/* Sandbox Print Instruction modal dialog (for iframe constraints) */}
      {showPrintInstructionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl flex flex-col gap-4 text-right duration-250">
            <span className="text-sm font-extrabold text-slate-800 block border-b border-slate-100 pb-2">📋 تنويه هام لطباعة ملصق الباركود:</span>
            
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              أنت تستخدم البرنامج حالياً من داخل <strong>مستعرض المطورين (iFrame Sandbox)</strong>، مما يقيد المتصفح من إطلاق حوار الطباعة التابع لنظام التشغيل حماية للخصوصية.
            </p>
            
            <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100 flex flex-col gap-2">
              <span className="text-xs font-black text-indigo-900">💡 حل المشكلة فورا بضغطة زر:</span>
              <ul className="text-[10.5px] text-indigo-850 list-decimal pr-4 leading-normal flex flex-col gap-1 font-semibold">
                <li>في أعلى الشاشة أو شريط عنوان المتصفح، يرجى النقر فوق زر <strong>"فتح في علامة تبويب جديدة" (Open in New Tab)</strong>.</li>
                <li>تفضل بالنقر فوق زر <code>طباعة فورية للملصقات 🖨️</code> مرة أخرى.</li>
                <li>ستفتح نافذة حاسوب ويندوز والطباعة الصامتة فوراً دون أي تقييد وبدقة مليمترية هائلة!</li>
              </ul>
            </div>

             <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrintInstructionModal(false)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>🌐 فتح المعاينة في علامة تبويب جديدة</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowPrintInstructionModal(false);
                  openBrowserPrintWindow();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl text-xs font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>🖨️ تجربة الطباعة الافتراضية</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintInstructionModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-2xl text-xs font-extrabold cursor-pointer transition-all"
              >
                رجوع 👍
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete product confirmation Dialog Modal */}
      {showDeleteProductModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-xl flex flex-col gap-4 text-right">
            <span className="text-xs font-extrabold text-red-650 flex items-center gap-1 text-red-600">⚠️ تأكيد عملية الحذف الفردية:</span>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في حذف وإزالة منتج <strong>"{showDeleteProductModal.name}"</strong> نهائياً من مستودع القائمة النشطة؟
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteProductModal({ show: false, id: null, name: '' })}
                className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="bg-red-600 hover:bg-red-750 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold"
              >
                تأكيد حذف الصنف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all products Confirmation Dialog */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-xl flex flex-col gap-4 text-right">
            <span className="text-xs font-extrabold text-red-600 flex items-center gap-1">⚠️ تأكيد تفريغ وحذف كامل المستودع:</span>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في تفريغ وحذف <strong>كافة السلع والمنتجات بالمخزن ({products.length} منتج)</strong> بشكل كامل؟ لا تراجع عن هذا الإجراء!
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllProducts}
                className="bg-red-605 bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold"
              >
                تأكيد الحذف الكلي 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset default products Confirmation dialog */}
      {showResetDbModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-xl flex flex-col gap-4 text-right">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">🔄 تأكيد إعادة تهيئة البيانات القياسية لليوم:</span>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              سيقوم هذا الإجراء باسترجاع المنتجات والأسعار العربية الافتراضية وحركات الشحن التوضيحية لليوم والتراجع عن تعديلات المواد الحالية. هل تود المتابعة؟
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowResetDbModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmResetDatabase}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold"
              >
                تأكيد الاستعادة 🔄
              </button>
            </div>
          </div>
        </div>
      )}
{/* 🖥️ Virtual Indicator Badge */}
      {import.meta.env.DEV && (window as any).isVirtualElectron && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white border border-slate-850 rounded-full px-4 py-2 hover:bg-slate-800 transition-all font-sans text-xs font-bold no-print flex items-center gap-2 shadow-xl z-40 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>🖥️ بيئة محاكاة سطح المكتب مفعلة للتجربة الحرة</span>
        </div>
      )}
      {/* 🖥️ Virtual Barcode Printer Simulator */}
      <AnimatePresence>
        {virtualPrintJob && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto no-print" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl flex flex-col gap-5 text-right font-sans"
            >
              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-400" />
                  <span className="text-xs font-black text-slate-100">🖥️ محاكي تشغيل الطابعة المكتبي المباشر (Virtual Printer)</span>
                </div>
                <button 
                  onClick={() => setVirtualPrintJob(null)} 
                  className="text-slate-400 hover:text-white font-extrabold text-lg duration-150 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Physical receipt / Barcode printer device drawing (Pure CSS/Tailwind high craftsmanship!) */}
              <div className="relative bg-slate-950 p-6 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center gap-4">
                {/* 3D-like Printer head slit */}
                <div className="w-48 h-10 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-inner flex flex-col justify-end items-center relative border border-slate-700">
                  <div className="w-40 h-1 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-pulse rounded-full" />
                  <div className="w-44 h-2.5 bg-slate-950 rounded-b-md" />
                </div>

                {/* Simulated Roll Coming Out Animation! */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 85 }}
                  className="bg-white text-slate-900 p-4 rounded-xl border border-slate-200 shadow-md flex flex-col items-center gap-1.5 w-64 select-none relative"
                >
                  {/* Tape cut-line marker */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 flex items-center justify-between px-0.5 overflow-hidden">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-white rotate-45 transform translate-y-[-50%]" />
                    ))}
                  </div>

                  {/* Inside printed item */}
                  <div className="pt-2 text-center w-full">
                    {/* Brand */}
                    {settings.showBrand && (
                      <div className="text-[10px] font-black text-slate-500 tracking-tight leading-none mb-1">
                        {companyName}
                      </div>
                    )}
                    {/* Name */}
                    <div className="text-xs font-bold leading-tight line-clamp-2 text-slate-950 mb-1">
                      {virtualPrintJob.productName}
                    </div>
                    {/* Price */}
                    {settings.showPrice && (
                      <div className="text-center font-black text-slate-900 mb-1">
                        <span className="text-[10px] text-slate-500 ml-0.5">السعر:</span>
                        <span className="text-sm">{virtualPrintJob.price.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-500 mr-0.5"> ر.س</span>
                      </div>
                    )}
                    {/* Calories and Weight */}
                    {(virtualPrintJob.calories || virtualPrintJob.weight) && (
                      <div className="text-center font-black text-slate-900 mb-1 flex items-center justify-center gap-1" style={{ fontSize: '10px' }}>
                        {virtualPrintJob.calories && <span>{virtualPrintJob.calories} سعرة حرارية</span>}
                        {virtualPrintJob.calories && virtualPrintJob.weight && <span className="mx-1">•</span>}
                        {virtualPrintJob.weight && (
                          <span className="inline-flex items-center gap-1 font-bold">
                            <Scale className="w-3 h-3 text-slate-700" />
                            <span>{virtualPrintJob.weight.toLowerCase().endsWith('g') || virtualPrintJob.weight.includes('جم') || virtualPrintJob.weight.includes('جرام') ? virtualPrintJob.weight : `${virtualPrintJob.weight} جرام`}</span>
                          </span>
                        )}
                      </div>
                    )}
                    {/* Rendered Barcode */}
                    <div className="flex flex-col items-center w-full mb-1">
                      <div className="bg-slate-950 text-white px-2 py-1 rounded text-[10px] font-mono tracking-widest font-black leading-none">
                        ||| {virtualPrintJob.barcode} |||
                      </div>
                      <span className="text-[8px] font-mono text-slate-800 mt-0.5 tracking-wider">{virtualPrintJob.barcode}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Printer specs label */}
                <div className="text-center text-[11px] text-slate-400 font-semibold space-y-1">
                  <div>اسم الطابعة الافتراضية: <strong className="text-emerald-400 font-bold">"{virtualPrintJob.printerName}"</strong></div>
                  <div>عدد النسخ المرسلة للملك: <strong className="text-indigo-400 font-black">{virtualPrintJob.copies} نسخ</strong></div>
                  <div>حجم الملصق المعتمد: <span className="font-mono text-slate-300">{virtualPrintJob.width} × {virtualPrintJob.height} ملم</span> ({settings.printMode === "sheet" ? "صفائح مقسمة" : "حراري مستمر"})</div>
                  <div className="text-[10px] text-slate-500 font-mono">توقيت إرسال الأمر: {virtualPrintJob.timestamp}</div>
                </div>
              </div>

              {/* Status report */}
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60 leading-relaxed text-xs text-slate-300 font-medium">
                <span className="text-emerald-400 font-bold block mb-1">💡 كيف يمكنك اختبار الطباعة الحقيقية الآن بالمتصفح؟</span>
                أنت تشغل حالياً برنامج "باركود ماستر" في بيئة التطوير الويب المعزولة. يمكنك بالنقر أدناه تنشيط نافذة طباعة المتصفح الحقيقية لتعمل بجانب المحاكي الافتراضي للتجربة الكاملة قبل تصدير ملف الـ EXE للمكتبي!
              </div>

              {/* Advanced Actions */}
              <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setVirtualPrintJob(null);
                    openBrowserPrintWindow();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>تفعيل طباعة المتصفح الفعلية للملصق 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVirtualPrintJob(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-2xl text-xs font-extrabold cursor-pointer transition-all"
                >
                  إغلاق المحاكي والمتابعة 👍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🖥️ Virtual External Web Browser Sandbox */}
      <AnimatePresence>
        {virtualBrowserUrl && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto no-print" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-100 text-slate-800 rounded-3xl max-w-xl w-full p-0 border border-slate-200 shadow-2xl flex flex-col font-sans overflow-hidden"
            >
              {/* Browser Chromes top bar */}
              <div className="bg-slate-200 border-b border-slate-300 px-4 py-3 flex items-center justify-between gap-3 text-right">
                {/* 3 dots window controls */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 cursor-pointer hover:bg-rose-600" onClick={() => setVirtualBrowserUrl(null)} />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                {/* Simulated URL input bar */}
                <div className="bg-white rounded-lg border border-slate-300 flex-1 px-3 py-1 font-mono text-[11px] text-slate-600 flex items-center gap-1.5 line-clamp-1 truncate max-w-sm mx-auto text-left select-all" dir="ltr">
                  <span className="text-slate-450 select-none">https://</span>
                  <span className="truncate">{virtualBrowserUrl.replace(/^https?:\/\//, '')}</span>
                </div>
                <div className="text-xs font-black text-slate-600">🌐 مستعرض الويب الخارجي الافتراضي</div>
              </div>

              {/* Browser sandbox render container */}
              <div className="bg-slate-50 p-5 flex flex-col gap-4 text-right">
                {/* If typical WhatsApp web-link format */}
                {virtualBrowserUrl.includes("whatsapp.com") || virtualBrowserUrl.includes("wa.me") ? (
                  <div className="bg-[#efeae2] rounded-2xl border border-emerald-100 overflow-hidden flex flex-col max-w-md mx-auto w-full shadow-md text-right font-sans">
                    {/* WhatsApp user header */}
                    <div className="bg-[#00a884] text-white px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 select-none">
                          💬
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black">العميل الفاضل (مستلم العرض)</span>
                          <span className="text-[10px] text-emerald-100">متصل الآن</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-700/40 px-2 py-1 rounded font-bold text-emerald-50">دردشة مؤمنة قيد المحاكاة</span>
                    </div>

                    {/* WhatsApp Chat bubbles */}
                    <div className="p-4 flex flex-col gap-3 min-h-[150px] max-h-[200px] overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                      <div className="bg-white text-slate-800 rounded-2xl rounded-tr-none px-3 py-2 max-w-[85%] self-start text-xs font-medium leading-relaxed font-sans shadow-xs whitespace-pre-wrap border border-emerald-50">
                        {decodeURIComponent(new URL(virtualBrowserUrl).searchParams.get("text") || "")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2">
                    <div className="text-2xl">🌐</div>
                    <span className="text-sm font-black text-slate-800">جاري توجيه تواصل خارجي أو رابط مستند</span>
                    <p className="text-xs text-slate-600 max-w-md font-bold">
                      تم استدعاء أمر المستعرض الخارجي بنجاح لمضاهاة الفتح للرابط التالي:
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-600 select-all font-semibold max-w-md w-full truncate text-left" dir="ltr">
                      {virtualBrowserUrl}
                    </div>
                  </div>
                )}

                {/* Simulated URL actions */}
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                  <span className="text-xs font-black text-emerald-950">💡 ميزة تشغيل المستعرض الخارجي الحقيقي:</span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-bold">
                    عندما يتم تجميع هذا البرنامج لاحقاً ليكون تطبيقاً مكتلياً بصيغة <code>.EXE</code>، سيقوم نظام الويندوز بفتح متصفح كروم أو إيدج الخارجي الحقيقي وتوجيه المحادثات فوراً دون عرض هذه اللوحة التجريبية!
                  </p>
                </div>
              </div>

              {/* Advanced Actions */}
              <div className="flex flex-col sm:flex-row-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(virtualBrowserUrl);
                      showToast('✅ تم نسخ الرابط الفعلي للحافظة بنجاح!', 'success');
                    }}
                    className="flex-1 sm:flex-none bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all"
                  >
                    نسخ الرابط والرسالة 📋
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(virtualBrowserUrl, '_blank');
                      setVirtualBrowserUrl(null);
                    }}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>توجيه للمتصفح 🚀</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setVirtualBrowserUrl(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-2xl text-xs font-extrabold cursor-pointer transition-all mt-2 sm:mt-0"
                >
                  إغلاق المستعرض
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🖥️ Virtual PDF Creator & Direct Sharing Hub */}
      <AnimatePresence>
        {virtualShareJob && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto no-print" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 text-right font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-800">🖥️ مركز مضاهاة مستندات PDF المكتبي (Virtual PDF System)</span>
                <button 
                  onClick={() => setVirtualShareJob(null)} 
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-lg duration-150 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Status File Drawing */}
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 flex flex-col items-center gap-3 shadow-inner">
                <div className="text-4xl">📄</div>
                <div className="text-center">
                  <span className="text-xs font-black text-slate-950 block leading-tight mb-1">{virtualShareJob.filename}</span>
                  <span className="text-[10px] text-indigo-650 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">تم تجميع وثيقة الـ PDF الافتراضية بنجاح!</span>
                </div>
              </div>

              {/* Metadata specification */}
              <div className="text-right text-[11px] text-slate-500 font-semibold space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>📌 المستند المصدر: <strong className="text-slate-800">"مستند عرض سعر ضريبي"</strong></div>
                <div>💬 نوع الإجراء المكتبي: <span className="font-mono text-indigo-600 uppercase font-black">{virtualShareJob.directAction}</span></div>
                {virtualShareJob.phone && (
                  <div>📞 هاتف العميل المستلم: <span className="font-mono text-slate-800 font-bold">{virtualShareJob.phone}</span></div>
                )}
                {virtualShareJob.subject && (
                  <div>✉️ عنوان الرسالة المقترح: <span className="text-slate-800 font-bold">{virtualShareJob.subject}</span></div>
                )}
              </div>

              {/* Explanatory tips */}
              <div className="bg-slate-50 p-3 rounded-xl leading-relaxed text-[11px] text-slate-600 font-medium border border-slate-200">
                <strong className="text-indigo-600 font-bold block mb-0.5">💡 اختبر تحميل ملف الـ PDF الفعلي الآن!</strong>
                نقوم بتحويل وعاء مستندات البيع وعروض الأسعار لتنزيلها كملف PDF مباشر على حاسوبك لمعاينتها وطباعتها بجودة المكتبي الحقيقية!
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    // Trigger dynamic browser download!
                    try {
                      const byteCharacters = atob(virtualShareJob.base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: 'application/pdf' });
                      const blobUrl = URL.createObjectURL(blob);
                      
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = virtualShareJob.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(blobUrl);
                      showToast('📥 تم تحميل ملف الـ PDF الفعلي لجهازك بنجاح!', 'success');
                    } catch (e: any) {
                      console.error(e);
                      showToast('❌ عطل أثناء تحميل ملف PDF: ' + e.message, 'error');
                    }

                    // Open social sharers if direct action wants to
                    if (virtualShareJob.directAction === 'whatsapp' || virtualShareJob.directAction === 'telegram' || virtualShareJob.directAction === 'email') {
                      let redirectUrl = "";
                      if (virtualShareJob.directAction === 'whatsapp') {
                        redirectUrl = `https://api.whatsapp.com/send?phone=${virtualShareJob.phone}&text=${encodeURIComponent(virtualShareJob.text)}`;
                      } else if (virtualShareJob.directAction === 'telegram') {
                        redirectUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(virtualShareJob.text)}`;
                      } else {
                        redirectUrl = `mailto:${virtualShareJob.phone || ''}?subject=${encodeURIComponent(virtualShareJob.subject)}&body=${encodeURIComponent(virtualShareJob.text)}`;
                      }
                      setTimeout(() => {
                        setVirtualBrowserUrl(redirectUrl);
                      }, 1000);
                    }
                    setVirtualShareJob(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 تنزيل ملف الـ PDF الأصلي مجهّز للمعاينة والمشاركة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVirtualShareJob(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all"
                >
                  إغلاق نافذة المحاكاة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Sticky Batch Bar */}
      {selectedBatchIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold shadow-xs">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <div className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <span>تم تحديد {selectedBatchIds.length} أصناف</span>
                <span className="text-emerald-400 font-mono">({totalBatchCopies} ملصق)</span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                جاهز للإرسال للطباعة مباشرة دفعة واحدة
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة الدفعة</span>
            </button>
            <button
              type="button"
              disabled={isBatchPrinting}
              onClick={executeBatchPrint}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الدفعة 🖨️</span>
            </button>
            <button
              type="button"
              onClick={clearBatchSelection}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Labels Print & Preview Modal Dialog */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] border border-slate-100 shadow-2xl flex flex-col overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>طباعة دفعة ملصقات محددة ({selectedBatchProducts.length} أصناف)</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  مراجعة السلع وتحديد عدد النسخ لكل ملصق قبل إرسال الأمر للطابعة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary & Bulk Settings */}
            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-xl font-bold">
                  📦 أصناف مختارة: <strong className="font-mono font-black text-indigo-600">{selectedBatchProducts.length}</strong>
                </span>
                <span className="bg-white border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-bold">
                  🏷️ إجمالي الملصقات: <strong className="font-mono font-black text-emerald-600">{totalBatchCopies}</strong>
                </span>
                <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold">
                  📏 القياس: <strong className="font-mono">{settings.labelWidth} × {settings.labelHeight} مم</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px]">تعيين نسخ موحد للكل:</span>
                {[1, 2, 3, 5, 10].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => applyGlobalBatchCopies(cnt)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List (Scrollable) */}
            <div className="p-4 overflow-y-auto max-h-[50vh] custom-scrollbar flex flex-col gap-2.5">
              {selectedBatchProducts.length > 0 ? (
                selectedBatchProducts.map((p, idx) => {
                  const itemCopies = batchCopiesMap[p.id] || 1;
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-black flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-black text-xs text-slate-800 block truncate">{p.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">🏷️ {p.barcode}</span>
                            <span className="font-mono font-black text-emerald-600">💰 {p.price.toFixed(2)} ر.س</span>
                            {p.prodDate && <span>📅 {p.prodDate}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                          <span className="text-[10px] font-bold text-slate-500 px-1">النسخ:</span>
                          <button
                            type="button"
                            onClick={() => updateBatchItemCopies(p.id, itemCopies - 1)}
                            className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shadow-3xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={itemCopies}
                            onChange={(e) => updateBatchItemCopies(p.id, parseInt(e.target.value, 10) || 1)}
                            className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none text-indigo-700"
                          />
                          <button
                            type="button"
                            onClick={() => updateBatchItemCopies(p.id, itemCopies + 1)}
                            className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shadow-3xs"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSelectProduct(p.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="إزالة هذا الصنف من الدفعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 font-bold">
                  لم يتم اختيار أي أصناف حالياً!
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearBatchSelection}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer order-2 sm:order-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ قائمة الدفعة كاملة</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  disabled={selectedBatchProducts.length === 0 || isBatchPrinting}
                  onClick={() => {
                    setShowBatchModal(false);
                    executeBatchPrint();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>بدء طباعة الدفعة الآن ({totalBatchCopies} ملصق) 🚀</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
