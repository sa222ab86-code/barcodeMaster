import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Share2, 
  Edit3, 
  Trash2, 
  Plus, 
  Settings, 
  FileText, 
  X, 
  Eye, 
  FolderDown,
  Sliders,
  Search,
  Package,
  Save,
  Check,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { Product, Quotation, QuotationItem } from '../../types';
import SaudiRiyalIcon from './SaudiRiyalIcon';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

import { 
  normalizeArabic, 
  convertNumberToArabicWords, 
  riyalSvgRaw, 
  getTodayDateStr, 
  formatDateArabic 
} from '../utils/quotation_utils';

const focusProps = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() };

interface QuotationManagerProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  companyName: string;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  sqlitePath: string;
  dbSyncMode: string;
  storeLogoUrl?: string;
}

export default function QuotationManager({
  products = [],
  setProducts,
  companyName,
  showToast,
  quotations,
  setQuotations,
  sqlitePath,
  dbSyncMode,
  storeLogoUrl
}: QuotationManagerProps) {

  const [companySettings, setCompanySettings] = useState(() => {
    const saved = localStorage.getItem("alostad_company_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (err) {}
    }
    return {
      companyName: companyName || "خزائن الاسطورة للأثاث",
      logoText: "تجهيزات وتصميم أرقى قطع الأثاث المنزلي والدواليب الراقية",
      companyTaxId: "310994711200003",
      companyCr: "1010654321",
      companyAddress: "جدة، شارع التحلية، المملكة العربية السعودية",
      companyPhone: "920000000",
      bankName: "مصرف الراجحي",
      bankAccount: "4510000123456789012345",
      bankIban: "SA8080000045100001234567",
      defaultTaxEnabled: true,
      defaultTaxRate: 15,
      defaultIsTaxInclusive: true,
      defaultShowTaxInInvoice: true,
      defaultTerms: "شروط عرض السعر:\n1. الأسعار سارية لمدة 15 يوماً من تاريخ التقديم.\n2. تشمل ضريبة القيمة المضافة بنسبة 15%."
    };
  });

  useEffect(() => {
    localStorage.setItem("alostad_company_settings", JSON.stringify(companySettings));
  }, [companySettings]);

  const [savedCustomers, setSavedCustomers] = useState(() => {
    const saved = localStorage.getItem("alostad_saved_customers");
    if (saved) {
      try { return JSON.parse(saved); } catch (err) {}
    }
    return [
      { name: "عبدالعزيز القرشي", phone: "0555432109", taxId: "310000000000003", cr: "1010000000", address: "مكة المكرمة، حي العزيزية" },
      { name: "ابراهيم جبري السلمي", phone: "0554123450", taxId: "310022345600003", cr: "1010884561", address: "جدة، حي أبحر الشمالي" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("alostad_saved_customers", JSON.stringify(savedCustomers));
  }, [savedCustomers]);

  const [localQuotations, setLocalQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem("my_updated_saved_quotations");
    if (saved) {
      try { return JSON.parse(saved); } catch (err) {}
    }
    return [];
  });

  const finalQuotations = quotations !== undefined ? quotations : localQuotations;
  
  const syncQuotationsToAllLayers = (updatedList: Quotation[]) => {
    if (setQuotations) setQuotations(updatedList);
    setLocalQuotations(updatedList);
    localStorage.setItem("my_updated_saved_quotations", JSON.stringify(updatedList));
    const api = (window as any).electronAPI;
    if (api && api.saveQuotationsBackup) {
      api.saveQuotationsBackup(updatedList).catch((err: any) => {
        console.warn("Desktop backup write failure:", err);
      });
    }
  };

  useEffect(() => {
    if (quotations === undefined) {
      localStorage.setItem("my_updated_saved_quotations", JSON.stringify(localQuotations));
    }
  }, [localQuotations, quotations]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
  
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"arabic_english" | "thermal_80mm">((): "arabic_english" | "thermal_80mm" => {
    const saved = localStorage.getItem("alostad_selected_quotation_format");
    return (saved === "thermal_80mm" || saved === "arabic_english") ? saved : "arabic_english";
  });

  useEffect(() => {
    localStorage.setItem("alostad_selected_quotation_format", selectedFormat);
  }, [selectedFormat]);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedPath, setLastExportedPath] = useState<string | null>(null);

  const [searchFilterText, setSearchFilterText] = useState("");
  const [searchFilterStartDate, setSearchFilterStartDate] = useState("");
  const [searchFilterEndDate, setSearchFilterEndDate] = useState("");

  const [formQuoteNumber, setFormQuoteNumber] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formValidity, setFormValidity] = useState("15 يوماً");
  
  const [formCustName, setFormCustName] = useState("");
  const [formCustPhone, setFormCustPhone] = useState("");
  const [formCustTaxId, setFormCustTaxId] = useState("");
  const [formCustCr, setFormCustCr] = useState("");
  const [formCustAddress, setFormCustAddress] = useState("");
  const [custNameError, setCustNameError] = useState(false);
  
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formNotes, setFormNotes] = useState("");
  const [formEnableTax, setFormEnableTax] = useState(true);
  const [formTaxRate, setFormTaxRate] = useState(15);
  const [formIsTaxInclusive, setFormIsTaxInclusive] = useState(true);
  const [formShowTaxInInvoice, setFormShowTaxInInvoice] = useState(true);
  const [formItems, setFormItems] = useState<QuotationItem[]>([]);

  const [activeRowDropdown, setActiveRowDropdown] = useState(-1);
  const [isTaxCollapsed, setIsTaxCollapsed] = useState(true);
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);
  const [productSearchModalQuery, setProductSearchModalQuery] = useState("");
  const [quickNewProdName, setQuickNewProdName] = useState("");
  const [quickNewProdPrice, setQuickNewProdPrice] = useState("");
  const [quickNewProdBarcode, setQuickNewProdBarcode] = useState("");
  const [quickNewProdDesc, setQuickNewProdDesc] = useState("");
  const [isAddingNewProdInModal, setIsAddingNewProdInModal] = useState(false);

  const getProductMatchScore = (prod: Product, query: string): number => {
    if (!query) return 0;
    const qNorm = normalizeArabic(query.toLowerCase());
    const nameNorm = normalizeArabic((prod.name || "").toLowerCase());
    const barNorm = (prod.barcode || "").toLowerCase();
    
    if (nameNorm === qNorm) return 1;
    if (nameNorm.startsWith(qNorm)) return 2;
    if (nameNorm.includes(qNorm)) return 3;
    if (barNorm.includes(qNorm)) return 4;
    return 5;
  };

  useEffect(() => {
    if (activeRowDropdown === -1) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-dropdown-container')) {
        setActiveRowDropdown(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeRowDropdown]);

  const saveProductToInventory = (name: string, price: number, barcode?: string, description?: string): Product | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existing = products.find(p => 
      p.name.trim().toLowerCase() === trimmedName.toLowerCase() ||
      (barcode && barcode.trim() && p.barcode && p.barcode.trim() === barcode.trim())
    );

    if (existing) {
      showToast(`ℹ️ الصنف «${existing.name}» مسجل بالفعل في المخزن مسبقاً.`, "info");
      return existing;
    }

    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id || 0)) : 0;
    const generatedBarcode = (barcode && barcode.trim()) || `PRD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const parsedPrice = typeof price === 'number' && !isNaN(price) ? price : (parseFloat(String(price)) || 0);

    const newProd: Product = {
      id: maxId + 1,
      name: trimmedName,
      barcode: generatedBarcode,
      price: parsedPrice,
      description: description?.trim() || undefined,
      isManual: true
    };

    if (setProducts) {
      setProducts(prev => [newProd, ...prev]);
    }

    try {
      const saved = localStorage.getItem("my_labels_products");
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem("my_labels_products", JSON.stringify([newProd, ...list]));
    } catch (err) {
      console.error(err);
    }

    showToast(`📦 تم حفظ الصنف «${trimmedName}» في المخزن تلقائياً بسعر ${parsedPrice.toFixed(2)} ر.س`, "success");
    return newProd;
  };

  const handleInsertProductFromModal = (prod: Product) => {
    const resolvedPrice = parseFloat(String(prod.price ?? 0)) || 0;
    setFormItems(prev => {
      const emptyRowIdx = prev.findIndex(item => !item.name.trim() && item.price === 0);
      if (emptyRowIdx !== -1) {
        return prev.map((item, idx) => {
          if (idx === emptyRowIdx) {
            return {
              ...item,
              productId: prod.id,
              name: prod.name,
              barcode: prod.barcode || "",
              description: item.description || prod.description || "",
              price: resolvedPrice,
              total: resolvedPrice * item.quantity
            };
          }
          return item;
        });
      } else {
        return [
          ...prev,
          {
            id: `qi-row-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            productId: prod.id,
            name: prod.name,
            barcode: prod.barcode || "",
            description: prod.description || "",
            price: resolvedPrice,
            quantity: 1,
            total: resolvedPrice
          }
        ];
      }
    });
    showToast(`✅ تمت إضافة «${prod.name}» إلى بنود عرض السعر`, "success");
  };

  const [settName, setSettName] = useState("");
  const [settLogoText, setSettLogoText] = useState("");
  const [settCr, setSettCr] = useState("");
  const [settTaxId, setSettTaxId] = useState("");
  const [settPhone, setSettPhone] = useState("");
  const [settAddress, setSettAddress] = useState("");
  const [settBank, setSettBank] = useState("");
  const [settAccount, setSettAccount] = useState("");
  const [settIban, setSettIban] = useState("");
  const [settDefaultTaxEnabled, setSettDefaultTaxEnabled] = useState(true);
  const [settDefaultTaxRate, setSettDefaultTaxRate] = useState(15);
  const [settDefaultIsTaxInclusive, setSettDefaultIsTaxInclusive] = useState(true);
  const [settDefaultShowTaxInInvoice, setSettDefaultShowTaxInInvoice] = useState(true);
  const [settTerms, setSettTerms] = useState("");

  const createNewItemRow = (): QuotationItem => ({
    id: `qi-row-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: "", description: "", barcode: "", price: 0, quantity: 1, total: 0
  });

  const addNewItemRow = () => {
    setFormItems(prev => [...prev, createNewItemRow()]);
    setTimeout(() => {
      const container = document.getElementById("quotation-items-container");
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  };

  const handleItemFieldKeyDown = (e: React.KeyboardEvent, index: number, field: "name" | "desc" | "qty" | "price") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "name") document.getElementById(`item-desc-${index}`)?.focus();
      else if (field === "desc") document.getElementById(`item-qty-${index}`)?.focus();
      else if (field === "qty") document.getElementById(`item-price-${index}`)?.focus();
      else if (field === "price") {
        if (index === formItems.length - 1) addNewItemRow();
        else document.getElementById(`item-name-${index + 1}`)?.focus();
      }
    }
  };

  const handleProductSelection = (rowIndex: number, prod: Product) => {
    const resolvedPrice = parseFloat(String(prod.price ?? 0)) || 0;
    const duplicateIndex = formItems.findIndex((x, idx) => idx !== rowIndex && x.name.trim().toLowerCase() === prod.name.trim().toLowerCase());
    
    if (duplicateIndex !== -1) {
      setFormItems(prev => {
        let list = prev.map((item, idx) => {
          if (idx === duplicateIndex) {
            const nextQty = item.quantity + 1;
            return { ...item, quantity: nextQty, total: item.price * nextQty };
          }
          return item;
        });
        list = list.filter((_, idx) => idx !== rowIndex);
        if (list.length === 0) list = [createNewItemRow()];
        return list;
      });
      setActiveRowDropdown(-1);
      showToast("🛒 تم دمج الصنف المكرر وزيادة الكمية تلقائياً (+1)", "success");
      return;
    }

    setFormItems(prev => prev.map((item, idx) => {
      if (idx === rowIndex) {
        return {
          ...item, productId: prod.id, name: prod.name, 
          description: item.description || prod.description || "",
          barcode: prod.barcode || "", price: resolvedPrice, total: resolvedPrice * item.quantity
        };
      }
      return item;
    }));
    setActiveRowDropdown(-1);
    
    setTimeout(() => {
      const input = document.getElementById(`item-name-${rowIndex}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const updateItemRow = (rowIndex: number, patch: Partial<QuotationItem>) => {
    setFormItems(prev => prev.map((item, idx) => {
      if (idx === rowIndex) {
        const updated = { ...item, ...patch };
        updated.total = updated.price * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const deleteItemRow = (rowIndex: number) => {
    setFormItems(prev => {
      const list = prev.filter((_, idx) => idx !== rowIndex);
      return list.length === 0 ? [createNewItemRow()] : list;
    });
  };

  const calculateFormTotals = (list = formItems) => {
    const subtotal = list.reduce((acc, x) => acc + (x.price * x.quantity), 0);
    const discountAmount = Math.min(formDiscountValue, subtotal);
    const net = subtotal - discountAmount;
    
    let taxAmount = 0;
    const effectiveTaxRate = formEnableTax ? (formTaxRate || 0) : 0;
    if (effectiveTaxRate > 0) {
      if (formIsTaxInclusive) {
        taxAmount = net * (effectiveTaxRate / (100 + effectiveTaxRate));
      } else {
        taxAmount = net * (effectiveTaxRate / 100);
      }
    }
    
    const grandTotal = (formEnableTax && !formIsTaxInclusive) ? (net + taxAmount) : net;
    return {
      subtotal,
      discountAmount,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const currentTotals = calculateFormTotals();

  const openNewQuotationForm = () => {
    const nextNum = `SQ-2026-${String(1000 + finalQuotations.length + 1)}`;
    setFormQuoteNumber(nextNum);
    setFormDate(getTodayDateStr());
    setFormValidity("15 يوماً");
    setFormCustName("");
    setFormCustPhone("");
    setFormCustTaxId("");
    setFormCustCr("");
    setFormCustAddress("");
    setFormDiscountValue(0);
    const isTaxOn = companySettings.defaultTaxEnabled !== false;
    const initialRate = companySettings.defaultTaxRate ?? 15;
    setFormEnableTax(isTaxOn);
    setFormTaxRate(initialRate);
    setFormIsTaxInclusive(companySettings.defaultIsTaxInclusive !== false);
    setFormShowTaxInInvoice(companySettings.defaultShowTaxInInvoice !== false);
    const defaultTermsText = companySettings.defaultTerms || `شروط عرض السعر:\n1. الأسعار سارية لمدة 15 يوماً من تاريخ التقديم.${isTaxOn ? `\n2. تطبيق ضريبة القيمة المضافة بنسبة ${initialRate}%.` : '\n2. الأسعار صافية ولا تشمل أي ضريبة.'}`;
    setFormNotes(defaultTermsText);
    setFormItems([createNewItemRow()]);
    setCustNameError(false);
    setIsEditingMode(false);
    setShowAddForm(true);
  };

  const openEditQuotationForm = (quote: Quotation) => {
    setCustNameError(false);
    setFormQuoteNumber(quote.quotationNumber);
    setFormDate(quote.date);
    setFormCustName(quote.customerName);
    setFormCustPhone(quote.customerPhone || "");
    setFormCustTaxId(quote.customerTaxId || "");
    setFormCustCr(quote.customerCr || "");
    setFormCustAddress(quote.customerAddress || "");
    setFormDiscountValue(quote.discountValue || 0);
    setFormNotes(quote.notes || "");
    const isTaxOn = quote.enableTax !== undefined ? quote.enableTax : ((quote.taxRate ?? 0) > 0 || (quote.taxAmount ?? 0) > 0);
    setFormEnableTax(isTaxOn);
    setFormTaxRate(quote.taxRate !== undefined ? quote.taxRate : 15);
    setFormIsTaxInclusive(quote.isTaxInclusive !== false);
    setFormShowTaxInInvoice(quote.showTaxInInvoice !== false);
    setFormItems(quote.items.map(x => ({
      id: x.id || `row-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      productId: x.productId, name: x.name, description: x.description || "",
      barcode: x.barcode || "", price: x.price, quantity: x.quantity, total: x.price * x.quantity
    })));
    setIsEditingMode(true);
    setShowAddForm(true);
  };

  const commitQuotationToState = () => {
    if (!formCustName.trim()) {
      setCustNameError(true);
      showToast("⚠️ يرجى اختيار أو إدخال اسم العميل أولاً.", "error");
      return;
    }
    setCustNameError(false);
    const cleanItems = formItems.filter(x => x.name.trim() !== "");
    if (cleanItems.length === 0) {
      showToast("⚠️ لا يمكن حفظ عرض السعر فارغ بدون أصناف.", "error");
      return;
    }

    const calc = calculateFormTotals(cleanItems);
    const effectiveTaxRate = formEnableTax ? formTaxRate : 0;
    const newQuotation: Quotation = {
      id: formQuoteNumber, quotationNumber: formQuoteNumber, date: formDate,
      customerName: formCustName.trim(), customerPhone: formCustPhone.trim() || undefined,
      customerTaxId: formCustTaxId.trim() || undefined, customerCr: formCustCr.trim() || undefined,
      customerAddress: formCustAddress.trim() || undefined, notes: formNotes, items: cleanItems,
      discountValue: formDiscountValue, 
      taxRate: effectiveTaxRate, 
      isTaxInclusive: formIsTaxInclusive,
      enableTax: formEnableTax,
      showTaxInInvoice: formShowTaxInInvoice,
      companyName: companySettings.companyName, logoText: companySettings.logoText,
      companyTaxId: companySettings.companyTaxId, companyCr: companySettings.companyCr,
      companyAddress: companySettings.companyAddress, companyPhone: companySettings.companyPhone,
      bankName: companySettings.bankName, bankAccount: companySettings.bankAccount,
      bankIban: companySettings.bankIban, subtotal: calc.subtotal, discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount, grandTotal: calc.grandTotal, createdAt: new Date().toISOString()
    };

    const newWarehouseItems: Product[] = [];
    let curMaxId = products.length > 0 ? Math.max(...products.map(p => p.id || 0)) : 0;
    
    cleanItems.forEach(ci => {
      const tName = ci.name.trim();
      const alreadyInWarehouse = products.some(p => 
        p.name.trim().toLowerCase() === tName.toLowerCase() || 
        (ci.barcode && ci.barcode.trim() && p.barcode && p.barcode.trim() === ci.barcode.trim())
      );
      if (!alreadyInWarehouse) {
        curMaxId += 1;
        const newProd: Product = {
          id: curMaxId,
          name: tName,
          barcode: ci.barcode?.trim() || `PRD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
          price: ci.price || 0,
          description: ci.description?.trim() || undefined,
          isManual: true
        };
        newWarehouseItems.push(newProd);
      }
    });

    if (newWarehouseItems.length > 0) {
      if (setProducts) {
        setProducts(prev => [...newWarehouseItems, ...prev]);
      }
      try {
        const saved = localStorage.getItem("my_labels_products");
        const cur = saved ? JSON.parse(saved) : [];
        localStorage.setItem("my_labels_products", JSON.stringify([...newWarehouseItems, ...cur]));
      } catch (e) {
        console.error(e);
      }
      showToast(`📦 تم حفظ ${newWarehouseItems.length} صنف جديد تلقائياً في المخزن!`, "success");
    }

    let updatedList: Quotation[] = [];
    if (finalQuotations.some(x => x.id === formQuoteNumber)) {
      updatedList = finalQuotations.map(x => x.id === formQuoteNumber ? newQuotation : x);
      showToast(`📝 تم تعديل عرض السعر (${formQuoteNumber}) بنجاح!`, "success");
    } else {
      updatedList = [newQuotation, ...finalQuotations];
      showToast(`✨ تم إصدار عرض السعر (${formQuoteNumber}) بنجاح!`, "success");
    }

    syncQuotationsToAllLayers(updatedList);
    
    // 1. إغلاق نموذج الإدخال
    setShowAddForm(false);

    // 2. انبثاق نافذة المعاينة والمشاركة تلقائياً
    setSelectedQuote(newQuotation);
    setLastExportedPath(null);
    setShowPreviewModal(true);
  };

  const executeQuotationDeletion = (quoteId: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف عرض السعر ${quoteId} نهائياً؟`)) {
      const updatedList = finalQuotations.filter(x => x.id !== quoteId);
      syncQuotationsToAllLayers(updatedList);
      showToast(`🗑️ تم الحذف بنجاح.`, "success");
    }
  };

  const triggerPrintingOperation = async (quote: Quotation) => {
    const isThermal80 = selectedFormat === "thermal_80mm";
    const fullHtmlSource = getTemplateHtmlContent(quote, isThermal80);
    fallbackNormalIframePrint(fullHtmlSource, isThermal80);
  };

  const fallbackNormalIframePrint = (htmlSnippet: string, isThermal80: boolean) => {
    const hiddenIframe = document.createElement("iframe");
    hiddenIframe.style.position = "fixed";
    hiddenIframe.style.left = "-9999px";
    hiddenIframe.style.top = "0px";
    hiddenIframe.style.width = isThermal80 ? "300px" : "794px";
    hiddenIframe.style.height = "1000px";
    hiddenIframe.style.border = "0";
    document.body.appendChild(hiddenIframe);

    const frameDoc = hiddenIframe.contentWindow?.document || hiddenIframe.contentDocument;
    if (!frameDoc) {
      showToast("⚠️ حدث خطأ أثناء محاولة تهيئة الطباعة البديلة.", "error");
      if (document.body.contains(hiddenIframe)) document.body.removeChild(hiddenIframe);
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { 
            margin: 0; 
            size: ${isThermal80 ? "80mm auto" : "A4 portrait"}; 
          }
          *, *::before, *::after {
            font-weight: 800 !important;
            color: #000000 !important;
            -webkit-font-smoothing: antialiased !important;
            box-sizing: border-box !important;
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: #ffffff !important; 
            font-family: 'Cairo', sans-serif !important;
            font-weight: 800 !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }
            .quotation-page {
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div style="width: ${isThermal80 ? "78mm" : "794px"}; margin: 0 auto;">${htmlSnippet}</div>
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        if (hiddenIframe.contentWindow) {
          hiddenIframe.contentWindow.focus();
          hiddenIframe.contentWindow.print();
        }
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(hiddenIframe)) {
            document.body.removeChild(hiddenIframe);
          }
        }, 3000);
      }
    }, 600);

    showToast("🖨️ تم فتح المعاينة وبدء التشغيل لمهمة الطباعة بنجاح!", "success");
  };

  const triggerSharingOperation = async (quote: Quotation) => {
    if (isGeneratingPdf) { showToast("⏳ يرجى الانتظار، جاري تحضير ملف PDF...", "info"); return; }
    if (!pdfBlob) { showToast("❌ ملف PDF غير جاهز. يرجى الانتظار لثوانٍ.", "error"); return; }
    setIsExporting(true);
    showToast("🔄 جاري فتح نافذة المشاركة...", "info");

    try {
      const filename = `Quotation_${quote.quotationNumber || "Doc"}`;
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const api = (window as any).electronAPI;

          if (api && api.shareFileViaWindows) {
            const result = await api.shareFileViaWindows({
              base64Data: base64Data, title: `عرض سعر رقم ${quote.quotationNumber}`,
              fileName: `${filename}.pdf`, extension: 'pdf'
            });
            if (result.success) {
              showToast("✅ تم استدعاء قائمة المشاركة بنجاح", "success");
              if (result.filePath) setLastExportedPath(result.filePath);
            }
            else if (result.fallback) {
              showToast(`📁 ${result.message || 'تم حفظ الملف'}`, "info");
              if (result.filePath) setLastExportedPath(result.filePath);
            }
            else { showToast(`⚠️ ${result.error || 'فشل المشاركة'}`, "error"); downloadFallback(pdfBlob, filename, 'pdf'); }
          } 
          else if (navigator.share && navigator.canShare) {
            const file = new File([pdfBlob], `${filename}.pdf`, { type: "application/pdf" });
            await navigator.share({ title: `عرض سعر رقم ${quote.quotationNumber}`, text: `مرفق لكم عرض السعر من ${quote.companyName}`, files: [file] });
            showToast("✅ تمت المشاركة بنجاح", "success");
          } 
          else {
            downloadFallback(pdfBlob, filename, 'pdf');
            showToast("📥 تم تحميل الملف (بديل المشاركة)", "info");
          }
        } catch (err: any) {
          if (err.name === "AbortError") showToast("❌ تم إلغاء المشاركة", "info");
          else { showToast(`❌ خطأ: ${err.message || err}`, "error"); downloadFallback(pdfBlob, filename, 'pdf'); }
        } finally {
          setIsExporting(false);
        }
      };
      reader.onerror = () => { showToast("❌ فشل قراءة الملف", "error"); setIsExporting(false); };
      reader.readAsDataURL(pdfBlob);
    } catch (error: any) {
      showToast("❌ حدث خطأ غير متوقع", "error"); setIsExporting(false);
    }
  };

  const triggerWhatsAppShare = (quote: Quotation) => {
    try {
      const cleanPhone = (quote.customerPhone || "").replace(/[^0-9]/g, "");
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith("05")) {
        formattedPhone = "966" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("5") && formattedPhone.length === 9) {
        formattedPhone = "966" + formattedPhone;
      }

      const activeItemsList = (quote.items || []).filter(it => it && it.name && it.name.trim() !== "");
      const itemsSummary = activeItemsList.slice(0, 5).map((it, idx) => `  ${idx + 1}. ${it.name}${it.description ? ` (${it.description})` : ''} (الكمية: ${it.quantity}) - ${(it.price * it.quantity).toFixed(2)} ر.س`).join("\n");
      const moreItems = activeItemsList.length > 5 ? `\n  ... وباقي ${activeItemsList.length - 5} أصناف أخرى.` : "";

      const msgLines = [
        `مرحباً ${quote.customerName || "عميلنا العزيز"}،`,
        `يسرنا تزويدكم بعرض السعر من *${quote.companyName || "مؤسستنا"}*:`,
        `📄 *رقم عرض السعر:* ${quote.quotationNumber}`,
        `📅 *التاريخ:* ${formatDateArabic(quote.date)}`,
        itemsSummary ? `\n📦 *أبرز البنود:*\n${itemsSummary}${moreItems}` : "",
        `\n💰 *الإجمالي المستحق:* *${quote.grandTotal.toFixed(2)} ر.س*`,
        quote.notes ? `\n📋 *الشروط والأحكام:*\n${quote.notes}` : "",
        `\nشكراً لتعاملكم معنا ويسعدنا خدمتكم دائماً!`
      ].filter(Boolean);

      const messageText = encodeURIComponent(msgLines.join("\n"));
      const url = formattedPhone 
        ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${messageText}`
        : `https://api.whatsapp.com/send?text=${messageText}`;

      window.open(url, "_blank");
      showToast("💬 تم فتح واتساب لمشاركة تفاصيل عرض السعر!", "success");
    } catch (e: any) {
      showToast("❌ حدث خطأ أثناء تجهيز رسالة الواتساب", "error");
    }
  };

  const downloadFallback = (blob: Blob, baseName: string, ext: string = 'png') => {
    const link = document.createElement("a");
    link.download = `${baseName}.${ext}`; link.href = URL.createObjectURL(blob);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  };

  useEffect(() => {
    if (showPreviewModal && selectedQuote) {
      setPdfBlob(null); setIsGeneratingPdf(true);
      const isThermal = selectedFormat === "thermal_80mm";
      const snippet = getTemplateHtmlContent(selectedQuote, isThermal);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed"; iframe.style.left = "-9999px"; iframe.style.top = "0px";
      iframe.style.width = isThermal ? "300px" : "794px"; iframe.style.height = "1200px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) { document.body.removeChild(iframe); setIsGeneratingPdf(false); return; }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after {
              font-weight: 800 !important;
              color: #000000 !important;
              -webkit-font-smoothing: antialiased !important;
              box-sizing: border-box !important;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: #ffffff; 
              font-family: 'Cairo', sans-serif; 
              font-weight: 800 !important; 
              color: #000000 !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .quotation-page {
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="pdf-container" style="width: ${isThermal ? "78mm" : "794px"}; margin: 0 auto; background: #ffffff;">${snippet}</div>
        </body>
        </html>
      `);
      doc.close();

      const params = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Quotation_${selectedQuote.quotationNumber}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 2.0, 
          useCORS: true, 
          backgroundColor: "#ffffff", 
          scrollX: 0, 
          scrollY: 0,
          windowWidth: isThermal ? 300 : 794
        },
        jsPDF: { unit: "mm", format: (isThermal ? [80, 220] : "a4") as any, orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const workerTimer = setTimeout(() => {
        const targetElement = doc.getElementById("pdf-container");
        if (!targetElement) {
          try { document.body.removeChild(iframe); } catch (e) {}
          setIsGeneratingPdf(false); return;
        }

        html2pdf().from(targetElement).set(params as any).outputPdf("blob").then((blob: Blob) => {
          try { document.body.removeChild(iframe); } catch (e) {}
          if (blob && blob.size > 0) setPdfBlob(blob);
          setIsGeneratingPdf(false);
        }).catch((err: any) => {
          try { document.body.removeChild(iframe); } catch (e) {}
          setIsGeneratingPdf(false);
        });
      }, 1200);

      return () => {
        clearTimeout(workerTimer);
        try { if (iframe.parentNode) document.body.removeChild(iframe); } catch (e) {}
      };
    }
  }, [showPreviewModal, selectedQuote, selectedFormat]);

  const commitCompanySettings = () => {
    const updatedSettings = {
      companyName: settName.trim() !== "" ? settName.trim() : companySettings.companyName, 
      logoText: settLogoText.trim(),
      companyCr: settCr.trim(), 
      companyTaxId: settTaxId.trim(),
      companyPhone: settPhone.trim(), 
      companyAddress: settAddress.trim(),
      bankName: settBank.trim(),          
      bankAccount: settAccount.trim(),    
      bankIban: settIban.trim(),          
      defaultTaxEnabled: settDefaultTaxEnabled,
      defaultTaxRate: settDefaultTaxRate,
      defaultIsTaxInclusive: settDefaultIsTaxInclusive,
      defaultShowTaxInInvoice: settDefaultShowTaxInInvoice,
      defaultTerms: settTerms.trim()
    };

    setCompanySettings(updatedSettings);
    localStorage.setItem("alostad_company_settings", JSON.stringify(updatedSettings));
    setShowSettingsModal(false); 
    showToast("💾 تم تحديث إعدادات المنشأة والشروط والأحكام بنجاح!", "success");
  };

  const openSettingsModalHandler = () => {
    setSettName(companySettings.companyName || ""); 
    setSettLogoText(companySettings.logoText || "");
    setSettCr(companySettings.companyCr || ""); 
    setSettTaxId(companySettings.companyTaxId || "");
    setSettPhone(companySettings.companyPhone || ""); 
    setSettAddress(companySettings.companyAddress || "");
    setSettBank(companySettings.bankName || ""); 
    setSettAccount(companySettings.bankAccount || "");
    setSettIban(companySettings.bankIban || ""); 
    setSettDefaultTaxEnabled(companySettings.defaultTaxEnabled !== false);
    setSettDefaultTaxRate(companySettings.defaultTaxRate ?? 15);
    setSettDefaultIsTaxInclusive(companySettings.defaultIsTaxInclusive !== false);
    setSettDefaultShowTaxInInvoice(companySettings.defaultShowTaxInInvoice !== false);
    setSettTerms(companySettings.defaultTerms !== undefined ? companySettings.defaultTerms : "شروط عرض السعر:\n1. الأسعار سارية لمدة 15 يوماً من تاريخ التقديم.\n2. تشمل ضريبة القيمة المضافة بنسبة 15%.");
    setShowSettingsModal(true);
  };

  const commitCustomerSelect = () => {
    if (!formCustName.trim()) { showToast("⚠️ يرجى إدخال اسم العميل.", "warning"); return; }
    const idx = savedCustomers.findIndex((x: any) => normalizeArabic(x.name) === normalizeArabic(formCustName));
    const payload = {
      name: formCustName.trim(), phone: formCustPhone.trim() || undefined, taxId: formCustTaxId.trim() || undefined,
      cr: formCustCr.trim() || undefined, address: formCustAddress.trim() || undefined
    };

    if (idx === -1) {
      setSavedCustomers(prev => [...prev, payload]);
      showToast(`👤 تم تسجيل العميل الجديد!`, "success");
    } else {
      setSavedCustomers(prev => prev.map((item, i) => i === idx ? payload : item));
      showToast(`👤 تم التحديث بنجاح.`, "success");
    }
    setShowCustomerSelectModal(false);
  };

  const todayLiteral = getTodayDateStr();
  const searchNormalized = normalizeArabic(searchFilterText);
  
  const filteredQuotationsLog = finalQuotations.filter(quote => {
    let matchesDate = true;
    if (searchFilterStartDate && searchFilterEndDate) {
      matchesDate = quote.date >= searchFilterStartDate && quote.date <= searchFilterEndDate;
    } else if (searchFilterStartDate) {
      matchesDate = quote.date >= searchFilterStartDate;
    } else if (searchFilterEndDate) {
      matchesDate = quote.date <= searchFilterEndDate;
    } else {
      matchesDate = searchFilterText ? true : quote.date === todayLiteral;
    }
    const matchesText = normalizeArabic(`${quote.customerName} ${quote.quotationNumber}`).includes(searchNormalized);
    return matchesDate && matchesText;
  });

  const getTemplateHtmlContent = (quote: Quotation, is80mm: boolean): string => {
    const formattedDate = formatDateArabic(quote.date);
    const activeItems = (quote.items || []).filter(it => it && it.name && it.name.trim() !== "");
    
    const subtotal = activeItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const discountAmount = Math.min(quote.discountAmount || 0, subtotal);
    const netAfterDiscount = subtotal - discountAmount;
    const enableTax = quote.enableTax !== false && (quote.taxRate > 0 || quote.taxAmount > 0);
    const showTaxInInvoice = quote.showTaxInInvoice !== false;
    const taxRate = enableTax ? (quote.taxRate ?? 15) : 0;
    
    const taxAmount = enableTax ? (quote.isTaxInclusive ? (netAfterDiscount * (taxRate / (100 + taxRate))) : (netAfterDiscount * (taxRate / 100))) : 0;
    const grandTotal = (enableTax && !quote.isTaxInclusive) ? netAfterDiscount + taxAmount : netAfterDiscount;
    const arabicWords = convertNumberToArabicWords(grandTotal);

    const pureSubtotal = (enableTax && quote.isTaxInclusive) ? (subtotal / (1 + (taxRate / 100))) : subtotal;

    const T = (text: string | number | undefined | null): string => {
      if (!text && text !== 0) return "";
      return String(text).replace(/\n/g, '<br/>');
    };
    
    const formatSAR = (amount: number, color = "#000000", size = "12px", weight = "900"): string => {
      return `<span style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; vertical-align: middle; direction: ltr;">
        ${riyalSvgRaw(color, size)}
        <span style="font-family: Arial, Tahoma, sans-serif; font-variant-numeric: tabular-nums; font-weight: ${weight}; font-size: ${size}; color: ${color};">${amount.toFixed(2)}</span>
      </span>`;
    };

    if (is80mm) {
      return `
        <div class="quotation-page" style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 2mm 2mm; background: #ffffff; color: #000000; width: 78mm; margin: 0 auto; line-height: 1.5; font-size: 12.5px; font-weight: 900; box-sizing: border-box; page-break-after: avoid; page-break-inside: avoid; break-after: avoid; break-inside: avoid;">
          <center style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px dashed #000000;">
            ${(storeLogoUrl && storeLogoUrl !== '/icon.png') ? `<div style="margin-bottom: 4px;"><img src="${storeLogoUrl}" style="max-height: 50px; max-width: 100%; object-fit: contain;" /></div>` : ''}
            <h3 style="margin: 0 0 2px 0; font-size: 16px; font-weight: 900; line-height: 1.2; color: #000000;">${T(quote.companyName)}</h3>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #000000; font-weight: 900; line-height: 1.3;">${T(quote.logoText)}</p>
            <div style="display: inline-block; padding: 3px 8px; border: 2px solid #000000; border-radius: 4px; font-size: 11px; font-weight: 900; color: #000000; margin-top: 2px;">
              ${T('الهاتف:')} <span style="font-family: Arial, Tahoma, sans-serif; font-size: 12px; font-weight: 900; color: #000000;">${T(quote.companyPhone)}</span>
            </div>
          </center>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; font-weight: 900; line-height: 1.6; color: #000000;">
            <tr><td style="text-align: right; width: 35%; font-weight: 900; color: #000000;">${T('رقم العرض:')}</td><td style="text-align: left; font-family: Arial, Tahoma, sans-serif; font-weight: 900; font-size: 12.5px; color: #000000;">${T(quote.quotationNumber)}</td></tr>
            <tr><td style="text-align: right; font-weight: 900; color: #000000;">${T('التاريخ:')}</td><td style="text-align: left; font-weight: 900; color: #000000;">${T(formattedDate)}</td></tr>
            <tr><td style="text-align: right; font-weight: 900; color: #000000;">${T('العميل:')}</td><td style="text-align: left; font-weight: 900; font-size: 12.5px; color: #000000;">${T(quote.customerName)}</td></tr>
          </table>
          <table style="width: 100%; font-size: 12px; font-weight: 900; border-collapse: collapse; margin-bottom: 8px; text-align: right; color: #000000;">
            <thead>
              <tr style="border-bottom: 2px solid #000000;">
                <th style="padding: 6px 2px; font-weight: 900; text-align: right; width: 42%; color: #000000;">الصنف</th>
                <th style="padding: 6px 2px; font-weight: 900; text-align: center; width: 13%; color: #000000;">الكمية</th>
                <th style="padding: 6px 2px; font-weight: 900; text-align: left; width: 45%; color: #000000;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${activeItems.map(it => {
                const itemTotal = it.price * it.quantity;
                return `
                  <tr style="border-bottom: 1.5px dashed #000000;">
                    <td style="padding: 6px 2px; line-height: 1.4; color: #000000;">
                      <div style="font-weight: 900; font-size: 12px; color: #000000;">${T(it.name)}</div>
                      ${it.description ? `<div style="font-size: 10px; color: #374151; font-weight: 700; margin-top: 2px; line-height: 1.3; word-break: break-word;">${T(it.description)}</div>` : ''}
                    </td>
                    <td style="padding: 6px 2px; text-align: center; font-family: Arial, Tahoma, sans-serif; font-weight: 900; font-size: 12.5px; color: #000000;">${it.quantity}</td>
                    <td style="padding: 6px 2px; text-align: left; font-weight: 900; color: #000000;">${formatSAR(itemTotal, '#000000', '12.5px', '900')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="border-top: 2px solid #000000; padding-top: 6px; margin-bottom: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-weight: 900; line-height: 1.8; color: #000000;">
              <tr><td style="text-align: right; font-weight: 900; color: #000000;">${T('المجموع الفرعي:')}</td><td style="text-align: left; font-weight: 900; color: #000000;">${formatSAR(pureSubtotal, '#000000', '12.5px', '900')}</td></tr>
              ${enableTax && showTaxInInvoice ? `<tr><td style="text-align: right; font-weight: 900; color: #000000;">${T(`الضريبة (${taxRate}%):`)}</td><td style="text-align: left; font-weight: 900; color: #000000;">${formatSAR(taxAmount, '#000000', '12.5px', '900')}</td></tr>` : ''}
              <tr><td colspan="2" style="border-bottom: 2px solid #000000; margin: 2px 0;"></td></tr>
              <tr><td style="text-align: right; padding: 6px 2px; font-size: 14px; font-weight: 900; color: #000000;">${T('الإجمالي المستحق:')}</td><td style="text-align: left; padding: 6px 2px; font-weight: 900; color: #000000;">${formatSAR(grandTotal, '#000000', '14px', '900')}</td></tr>
            </table>
          </div>
          <div style="font-size: 11px; font-weight: 900; border: 2px solid #000000; padding: 6px; border-radius: 4px; text-align: center; line-height: 1.4; color: #000000; display: flex; align-items: center; justify-content: center;">
            <span style="font-weight: 900; color: #000000;">${T(arabicWords)}</span>
          </div>
          ${quote.notes ? `
            <div style="border-top: 1.5px dashed #000000; margin-top: 8px; padding-top: 6px; text-align: right; font-size: 10px; line-height: 1.4; color: #000000; font-weight: 800;">
              <b style="display: block; margin-bottom: 2px;">📋 الشروط والملاحظات:</b>
              <div>${T(quote.notes)}</div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      return `
        <div class="quotation-page" style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 8mm 10mm; background: #ffffff; color: #000000; box-sizing: border-box; width: 794px; height: auto; font-weight: 800; page-break-after: avoid; page-break-inside: avoid; break-after: avoid; break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="vertical-align: top; width: 60%;">
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                  ${(storeLogoUrl && storeLogoUrl !== '/icon.png') ? `<div style="width: 55px;"><img src="${storeLogoUrl}" style="max-height: 55px; max-width: 55px; object-fit: contain;" /></div>` : ''}
                  <div>
                    <h2 style="margin: 0 0 3px 0; color: #000000; font-size: 20px; font-weight: 900;">${T(quote.companyName)}</h2>
                    <span style="font-size: 11px; color: #000000; font-weight: 800;">${T(quote.logoText)}</span>
                  </div>
                </div>
                <div style="font-size: 11px; color: #000000; line-height: 1.6; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-weight: 800;">
                  <div><span style="color:#000000; font-weight: 800;">السجل التجاري:</span> <b style="font-family: Arial, Tahoma, sans-serif; font-weight: 900; color:#000000;">${T(quote.companyCr)}</b></div>
                  <div><span style="color:#000000; font-weight: 800;">الرقم الضريبي:</span> <b style="font-family: Arial, Tahoma, sans-serif; font-weight: 900; color:#000000;">${T(quote.companyTaxId)}</b></div>
                  <div><span style="color:#000000; font-weight: 800;">الهاتف:</span> <b style="font-family: Arial, Tahoma, sans-serif; font-weight: 900; color:#000000; font-size:12px;">${T(quote.companyPhone)}</b></div>
                  <div><span style="color:#000000; font-weight: 800;">العنوان:</span> <b style="color:#000000; font-weight: 800;">${T(quote.companyAddress)}</b></div>
                </div>
              </td>
              <td style="vertical-align: top; text-align: left; width: 40%;">
                <div style="background: #ffffff; padding: 12px; border-radius: 10px; border: 2px solid #000000; text-align: left;">
                  <h1 style="margin: 0 0 8px 0; color: #000000; font-size: 22px; font-weight: 900;">عـرض سـعـر</h1>
                  <table style="width: 100%; font-size: 11.5px; line-height: 1.6; border-collapse: collapse; font-weight: 800;">
                    <tr><td style="color: #000000; text-align: right; padding-bottom: 2px; font-weight: 800;">رقم المستند:</td><td style="text-align: left; font-family: Arial, Tahoma, sans-serif; font-size: 14px; font-weight: 900; color: #000000; padding-bottom: 2px;">${T(quote.quotationNumber)}</td></tr>
                    <tr><td style="color: #000000; text-align: right; font-weight: 800;">التاريخ:</td><td style="text-align: left; font-weight: 900; color: #000000;">${T(formattedDate)}</td></tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
          <div style="width: 100%; height: 2px; background: #000000; margin: 0 0 14px 0; border-radius: 4px;"></div>
          <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <div style="font-weight: 900; color: #000000; font-size: 13.5px; margin-bottom: 8px;">معلومات العميل والمستفيد</div>
            <table style="width: 100%; font-size: 11.5px; line-height: 1.8; border-collapse: collapse; font-weight: 800;">
              <tr><td style="width: 50%;"><span style="color: #000000; font-weight: 800;">اسم العميل:</span> <b style="color: #000000; font-size: 12.5px; font-weight: 900;">${T(quote.customerName)}</b></td><td style="width: 50%;"><span style="color: #000000; font-weight: 800;">رقم الجوال:</span> <b style="font-family: Arial, sans-serif; font-size: 12.5px; color: #000000; font-weight: 900;">${T(quote.customerPhone || '---')}</b></td></tr>
              <tr><td><span style="color: #000000; font-weight: 800;">الرقم الضريبي:</span> <b style="font-family: Arial, sans-serif; color: #000000; font-weight: 900;">${T(quote.customerTaxId || '---')}</b></td><td><span style="color: #000000; font-weight: 800;">رقم السجل:</span> <b style="font-family: Arial, sans-serif; color: #000000; font-weight: 900;">${T(quote.customerCr || '---')}</b></td></tr>
              <tr><td colspan="2"><span style="color: #000000; font-weight: 800;">العنوان:</span> <b style="color: #000000; font-weight: 900;">${T(quote.customerAddress || '---')}</b></td></tr>
            </table>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11.5px; border: 2px solid #000000; border-radius: 8px; overflow: hidden; font-weight: 800;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #000000; border-bottom: 2px solid #000000;">
                <th style="padding: 10px 6px; text-align: center; width: 6%; font-weight: 900; color: #000000; border-left: 1px solid #000000;">ت</th>
                <th style="padding: 10px 6px; text-align: right; width: ${enableTax && showTaxInInvoice ? '40%' : '50%'}; font-weight: 900; color: #000000; border-left: 1px solid #000000;">بيان الأصناف والخدمات</th>
                <th style="padding: 10px 6px; text-align: center; width: 10%; font-weight: 900; color: #000000; border-left: 1px solid #000000;">الكمية</th>
                <th style="padding: 10px 6px; text-align: left; width: 14%; font-weight: 900; color: #000000; border-left: 1px solid #000000;">سعر الوحدة</th>
                ${enableTax && showTaxInInvoice ? `<th style="padding: 10px 6px; text-align: left; width: 14%; font-weight: 900; color: #000000; border-left: 1px solid #000000;">الضريبة (${taxRate}%)</th>` : ''}
                <th style="padding: 10px 6px; text-align: left; width: ${enableTax && showTaxInInvoice ? '16%' : '20%'}; font-weight: 900; color: #000000;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${activeItems.map((it, idx) => {
                const itemTotal = it.price * it.quantity;
                const itemTax = enableTax ? (quote.isTaxInclusive ? (itemTotal * (taxRate / (100 + taxRate))) : (itemTotal * (taxRate / 100))) : 0;
                const isLast = idx === activeItems.length - 1;
                const borderBottom = isLast ? 'none' : '1px solid #000000';
                return `
                  <tr style="background-color: #ffffff;">
                    <td align="center" style="padding: 10px 6px; font-weight: 900; color: #000000; border-bottom: ${borderBottom}; border-left: 1px solid #000000;">${idx + 1}</td>
                    <td style="padding: 10px 6px; border-bottom: ${borderBottom}; border-left: 1px solid #000000; color: #000000;">
                      <div style="font-weight: 900; color: #000000; font-size: 12.5px;">${T(it.name)}</div>
                      ${it.description ? `<div style="font-size: 10.5px; color: #374151; font-weight: 700; margin-top: 3px; line-height: 1.4; word-break: break-word;">${T(it.description)}</div>` : ''}
                    </td>
                    <td align="center" style="padding: 10px 6px; font-family: Arial, Tahoma, sans-serif; font-weight: 900; font-size: 13px; color: #000000; border-bottom: ${borderBottom}; border-left: 1px solid #000000;">${it.quantity}</td>
                    <td align="left" style="padding: 10px 6px; border-bottom: ${borderBottom}; border-left: 1px solid #000000; font-weight: 900; color: #000000;">${formatSAR(it.price, '#000000', '12px', '900')}</td>
                    ${enableTax && showTaxInInvoice ? `<td align="left" style="padding: 10px 6px; border-bottom: ${borderBottom}; border-left: 1px solid #000000; font-weight: 900; color: #000000;">${formatSAR(itemTax, '#000000', '12px', '900')}</td>` : ''}
                    <td align="left" style="padding: 10px 6px; border-bottom: ${borderBottom}; font-weight: 900; color: #000000;">${formatSAR(itemTotal, '#000000', '13px', '900')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
            <tr>
              <td style="vertical-align: top; width: 55%; padding-left: 14px;">
                <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 10px; padding: 10px; min-height: 90px;">
                  <b style="color: #000000; display: block; margin-bottom: 6px; font-size: 12px; font-weight: 900;">📋 الشروط والأحكام:</b>
                  <div style="font-size: 11px; color: #000000; font-weight: 800; line-height: 1.5;">${quote.notes ? T(quote.notes) : T("لا يوجد شروط إضافية مسجلة.")}</div>
                </div>
              </td>
              <td style="vertical-align: bottom; width: 45%;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000; border-radius: 10px; overflow: hidden; font-size: 12px; font-weight: 900;">
                  <tr><td style="padding: 10px 12px; color: #000000; font-weight: 900; border-bottom: 1px solid #000000; background: #ffffff;">${(enableTax && quote.isTaxInclusive) ? 'المجموع قبل الضريبة:' : 'المجموع الفرعي:'}</td><td style="padding: 10px 12px; text-align: left; border-bottom: 1px solid #000000; background: #ffffff; color: #000000; font-weight: 900;">${formatSAR(pureSubtotal, '#000000', '12.5px', '900')}</td></tr>
                  ${enableTax && showTaxInInvoice ? `<tr><td style="padding: 10px 12px; color: #000000; font-weight: 900; border-bottom: 1px solid #000000; background: #ffffff;">الضريبة المضافة (${taxRate}%):</td><td style="padding: 10px 12px; text-align: left; border-bottom: 1px solid #000000; background: #ffffff; color: #000000; font-weight: 900;">${formatSAR(taxAmount, '#000000', '12.5px', '900')}</td></tr>` : ''}
                  <tr style="background-color: #ffffff; color: #000000;"><td style="padding: 12px 12px; font-weight: 900; font-size: 15px; color: #000000;">الصافي النهائي:</td><td style="padding: 12px 12px; text-align: left; color: #000000; font-weight: 900;">${formatSAR(grandTotal, '#000000', '15px', '900')}</td></tr>
                </table>
              </td>
            </tr>
          </table>
          <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; font-size: 12px; font-weight: 900; color: #000000; display: flex; align-items: center; justify-content: center; text-align: center;">
            <span style="font-weight: 900; color: #000000;">${T(arabicWords)}</span>
          </div>
          ${(quote.bankName || quote.bankAccount || quote.bankIban) ? `
            <div style="border-top: 2px dashed #000000; padding-top: 10px;">
              <div style="font-weight: 900; color: #000000; font-size: 12px; margin-bottom: 6px;">📂 الحسابات البنكية المعتمدة للتحويل:</div>
              <table style="width: 100%; font-size: 11px; font-weight: 900; line-height: 1.6; border-collapse: collapse;">
                <tr>
                  ${quote.bankName ? `<td style="width: 33%;"><span style="color: #000000; font-weight: 800;">اسم البنك:</span> <b style="color: #000000; font-weight: 900;">${T(quote.bankName)}</b></td>` : ''}
                  ${quote.bankAccount ? `<td style="width: 33%;"><span style="color: #000000; font-weight: 800;">رقم الحساب:</span> <b style="font-family: Arial, Tahoma, sans-serif; color: #000000; font-size: 12px; font-weight: 900;">${T(quote.bankAccount)}</b></td>` : ''}
                  ${quote.bankIban ? `<td style="width: 34%;"><span style="color: #000000; font-weight: 800;">الآيبان (IBAN):</span> <b style="font-family: Arial, Tahoma, sans-serif; color: #000000; font-size: 12.5px; font-weight: 900;">${T(quote.bankIban)}</b></td>` : ''}
                </tr>
              </table>
            </div>
          ` : ''}
        </div>
      `;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col gap-4 text-xs font-bold text-gray-900" dir="rtl">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#4c3cc2]" />
          <div className="text-right">
            <h2 className="text-base font-bold text-gray-900">سجل عروض الأسعار</h2>
            <p className="text-[11px] text-gray-500 font-medium">إصدار ومتابعة المستندات المالية والضريبية الرسمية لخدمة عملائك</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={openSettingsModalHandler} className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 font-bold cursor-pointer transition-all flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /><span>المنشأة والبنك</span>
          </button>
          <button type="button" onClick={openNewQuotationForm} className="px-4 py-1.5 bg-[#4c3cc2] hover:bg-[#3d30a2] text-white rounded-lg font-black cursor-pointer shadow-sm transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-white" /><span>إنشاء عرض سعر جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input {...focusProps} type="text" placeholder="ابحث باسم العميل أو رقم العرض..." value={searchFilterText} onChange={r => setSearchFilterText(r.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-hidden text-xs font-bold focus:bg-white focus:border-indigo-400 transition-colors" />
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
          <span className="text-[10px] text-gray-500 font-black shrink-0">من:</span>
          <input {...focusProps} type="date" value={searchFilterStartDate} onChange={r => setSearchFilterStartDate(r.target.value)} className="w-full bg-transparent outline-none text-xs text-right focus:bg-white transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
          <span className="text-[10px] text-gray-500 font-black shrink-0">إلى:</span>
          <input {...focusProps} type="date" value={searchFilterEndDate} onChange={r => setSearchFilterEndDate(r.target.value)} className="w-full bg-transparent outline-none text-xs text-right focus:bg-white transition-colors" />
        </div>
        <button type="button" onClick={() => { setSearchFilterStartDate(""); setSearchFilterEndDate(""); setSearchFilterText(""); }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 font-bold cursor-pointer transition-all">إعادة ضبط التصفية ✕</button>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-right flex justify-between items-center">
        <span className="text-xs font-bold text-indigo-700">
          📅 عروض تاريخ:{" "}
          <span className="font-black">
            {searchFilterStartDate || searchFilterEndDate ? (
              <>
                {searchFilterStartDate ? `من ${formatDateArabic(searchFilterStartDate)}` : ""}
                {searchFilterEndDate ? ` إلى ${formatDateArabic(searchFilterEndDate)}` : ""}
              </>
            ) : (
              formatDateArabic(todayLiteral)
            )}
          </span>
          <span className="mr-3 text-gray-500 font-normal">
            {searchFilterStartDate || searchFilterEndDate 
              ? "(يتم عرض عروض النطاق الزمني المحدد)" 
              : "(يتم عرض عروض اليوم افتراضياً عند عدم اختيار تصفية)"}
          </span>
        </span>
      </div>

      <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-s">
        <table className="w-full text-right text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
              <th className="p-2.5 text-center w-[5%]">ت</th><th className="p-2.5">رقم عرض السعر</th><th className="p-2.5">اسم العميل والمنشأة</th><th className="p-2.5 text-left">الإجمالي النهائي</th><th className="p-2.5 text-center w-[25%] block sm:table-cell">الخيارات والتحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredQuotationsLog.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400 font-medium font-sans">⚠️ لا توجد عروض أسعار مسجلة لهذا التاريخ.</td></tr>
            ) : (
              filteredQuotationsLog.map((quote, idx) => (
                <tr className="hover:bg-gray-50/50 transition-all font-sans" key={quote.id}>
                  <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-gray-900">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#4c3cc2] font-mono">{quote.quotationNumber}</span>
                      {quote.enableTax === false || quote.taxRate === 0 ? (
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">بدون ضريبة</span>
                      ) : (
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                          ضريبة {quote.taxRate}% {quote.isTaxInclusive ? '(شامل)' : '(مضاف)'}
                        </span>
                      )}
                      {quote.showTaxInInvoice === false && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-200">مخفية بالفاتورة</span>
                      )}
                    </div>
                    <span className="block text-[9.5px] text-gray-400 font-normal mt-0.5">{formatDateArabic(quote.date)}</span>
                  </td>
                  <td className="p-2.5 font-black text-gray-800">
                    <div>{quote.customerName}</div>
                    {quote.items && quote.items.length > 0 && (
                      <div className="text-[10px] text-gray-400 font-normal truncate max-w-[280px] mt-0.5" title={quote.items.map(it => `${it.name}${it.description ? ` (${it.description})` : ''}`).join('، ')}>
                        {quote.items.map(it => `${it.name}${it.description ? ` (${it.description})` : ''}`).join('، ')}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-left font-black text-[#4c3cc2] text-sm">{quote.grandTotal.toFixed(2)} SR</td>
                  <td className="p-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <button type="button" onClick={() => triggerWhatsAppShare(quote)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-3xs" title="مشاركة عبر واتساب"><MessageCircle className="w-3 h-3 text-white" /><span>واتساب</span></button>
                    <button type="button" onClick={() => { setSelectedQuote(quote); setLastExportedPath(null); setShowPreviewModal(true); }} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] cursor-pointer hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"><Eye className="w-3 h-3" /><span>تصدير</span></button>
                    <button type="button" onClick={() => openEditQuotationForm(quote)} className="p-1 px-2 bg-amber-50 text-amber-600 rounded-md cursor-pointer hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"><Edit3 className="w-3 h-3" /><span>تعديل</span></button>
                    <button type="button" onClick={() => executeQuotationDeletion(quote.id)} className="p-1 px-1.5 text-red-550 bg-red-50 hover:bg-red-550 hover:text-white rounded-md cursor-pointer transition-all flex items-center"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-hidden block" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden h-[92vh] flex flex-col text-right border border-gray-100">
              <div className="flex justify-between items-center bg-[#4c3cc2] px-4 py-3 text-white shrink-0">
                <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-200" /><span className="font-black text-sm">{isEditingMode ? `تعديل عرض السعر الضريبي رقم: ${formQuoteNumber}` : "إصدار مستند مالي وعرض سعر ضريبي جديد"}</span></div>
                <button type="button" onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/10 rounded-md text-white/80 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-0 bg-slate-50/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-150 shrink-0">
                  <div><label className="block text-[10px] font-bold text-gray-500 mb-0.5">رقم عرض السعر</label><input {...focusProps} type="text" value={formQuoteNumber} onChange={r => setFormQuoteNumber(r.target.value)} className="w-full px-2.5 py-1 bg-gray-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-md text-xs font-mono font-bold text-gray-900 outline-hidden" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 mb-0.5">تاريخ الإصدار</label><input {...focusProps} type="date" value={formDate} onChange={r => setFormDate(r.target.value)} className="w-full px-2.5 py-1 bg-gray-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-md text-xs font-medium outline-hidden" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 mb-0.5">صلاحية العرض والتعاقد</label><input {...focusProps} type="text" value={formValidity} onChange={r => setFormValidity(r.target.value)} className="w-full px-2.5 py-1 bg-gray-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-md text-xs font-medium outline-hidden" /></div>
                </div>

                {custNameError && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-800 p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-black animate-shake shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                      <span>⚠️ تنبيه: حقل "اسم العميل" فارغ! يرجى إدخال اسم العميل أدناه لإتمام حفظ عرض السعر.</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCustNameError(false)} 
                      className="text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 rounded-lg hover:bg-rose-100 cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                )}

                <div className={`border rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 shadow-3xs transition-all ${
                  custNameError ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-200" : "border-gray-200 bg-white"
                }`}>
                  <div className="flex items-center gap-2.5 text-right w-full sm:w-auto flex-1">
                    <span className="text-xl shrink-0">👤</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-xs text-gray-900 block">
                          اسم العميل أو المنشأة المستفيدة ضريبياً <span className="text-rose-500 font-black">*</span>
                        </span>
                        {custNameError && (
                          <span className="text-[10px] text-rose-600 font-black flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            حقل مطلوب
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          {...focusProps}
                          type="text"
                          placeholder="اكتب اسم العميل أو الشركة هنا (مثال: شركة الأفق المحدودة)..."
                          value={formCustName}
                          onChange={e => {
                            setFormCustName(e.target.value);
                            if (custNameError && e.target.value.trim()) setCustNameError(false);
                          }}
                          className={`flex-1 px-3 py-1.5 border rounded-lg text-xs font-bold text-gray-900 bg-white focus:outline-none transition-all ${
                            custNameError 
                              ? "border-rose-500 focus:border-rose-600 ring-1 ring-rose-300" 
                              : "border-gray-200 focus:border-[#4c3cc2]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => { setShowCustomerSelectModal(true); setCustomerSearchQuery(""); }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4c3cc2] border border-indigo-200 rounded-lg text-[11px] font-black cursor-pointer transition-all shrink-0 flex items-center gap-1 shadow-3xs"
                          title="البحث والاختيار من قائمة العملاء المسجلين"
                        >
                          <span>👥 دليل العملاء</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-150 shadow-3xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#4c3cc2]" />
                      <span>بنود وأصناف عرض السعر ({formItems.length})</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                      • اكتب أي صنف وسعره وسيحفظ تلقائياً في المخزن
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearchModalQuery("");
                        setShowProductSearchModal(true);
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#4c3cc2] border border-indigo-200 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-3xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>🔍 استعراض وبحث موسع في المخزن</span>
                    </button>
                    <button
                      type="button"
                      onClick={addNewItemRow}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-3xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ بند فارغ</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1.5 px-3 pt-1.5 text-[10.5px] font-black text-indigo-900 shrink-0 text-right bg-indigo-50/50 py-2 rounded-t-xl border-b border-indigo-200">
                  <div className="col-span-4">اسم صنف السلعة والمنتج المالي</div>
                  <div className="col-span-3">وصف / ملاحظات البند الجانبية</div>
                  <div className="col-span-1.5 text-center">الكمية</div>
                  <div className="col-span-1.5 text-left">سعر الوحدة</div>
                  <div className="col-span-1 text-left">{formEnableTax ? `الضريبة (${formTaxRate}%)` : "بدون ضريبة"}</div>
                  <div className="col-span-1 text-left">الإجمالي</div>
                </div>

                <div className="flex-1 overflow-y-auto border border-t-0 border-gray-100 bg-white/70 p-2 rounded-b-xl flex flex-col gap-1.5 max-h-[48vh] min-h-[180px]" id="quotation-items-container">
                  {formItems.map((item, idx) => {
                    const isFocused = activeRowDropdown === idx;
                    const queryNormalized = normalizeArabic(item.name);

                    const filteredProducts = products.filter(p => {
                      if (!item.name) return true;
                      const nameNorm = p.name ? p.name.toLowerCase() : "";
                      const barNorm = p.barcode ? p.barcode.toLowerCase() : "";
                      return nameNorm.includes(queryNormalized) || barNorm.includes(queryNormalized) || normalizeArabic(nameNorm).includes(queryNormalized);
                    }).sort((a, b) => {
                      if (!item.name) return 0;
                      return getProductMatchScore(a, item.name) - getProductMatchScore(b, item.name);
                    });

                    const unitTotal = item.price * item.quantity;
                    const resolvedTax = formEnableTax 
                      ? (formIsTaxInclusive ? unitTotal * (formTaxRate / (100 + formTaxRate)) : unitTotal * (formTaxRate / 100)) 
                      : 0;

                    return (
                      <div className={`grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border ${isFocused ? 'border-[#4c3cc2] ring-1 ring-indigo-500/20 shadow-sm z-30' : 'border-gray-150 hover:border-indigo-200 z-10'} transition-all relative`} key={item.id}>
                        <div className="col-span-4 relative product-dropdown-container">
                          <div className="relative flex items-center">
                            <input 
                              {...focusProps} 
                              type="text" 
                              id={`item-name-${idx}`} 
                              placeholder="ابحث بالاسم أو اكتب صنفاً جديداً..." 
                              value={item.name} 
                              onFocus={() => setActiveRowDropdown(idx)} 
                              onKeyDown={e => handleItemFieldKeyDown(e, idx, "name")} 
                              onChange={v => updateItemRow(idx, { name: v.target.value })} 
                              className="w-full pl-20 pr-2.5 py-1.5 bg-slate-50/70 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-lg text-xs font-bold text-gray-900 outline-hidden transition-all" 
                              autoComplete="off" 
                            />
                            {item.name.trim() !== "" && (
                              <div className="absolute left-1.5 flex items-center gap-1">
                                {products.some(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()) ? (
                                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5" title="الصنف مسجل بالمخزن">
                                    <span>✓</span>
                                    <span>بالمخزن</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    title="حفظ الصنف وسعره الحالي في المخزن فوراً"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveProductToInventory(item.name, item.price, item.barcode, item.description);
                                    }}
                                    className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white px-1.5 py-0.5 rounded font-black cursor-pointer shadow-3xs transition-all flex items-center gap-0.5"
                                  >
                                    <span>💾</span>
                                    <span>حفظ بالمخزن</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {isFocused && (
                            <div 
                              className="absolute right-0 top-full mt-1.5 w-[460px] sm:w-[580px] max-w-[92vw] bg-white border border-indigo-200 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-72 text-right"
                              onMouseDown={e => e.preventDefault()}
                            >
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 border-b border-indigo-150 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-1.5 text-indigo-950 font-black text-[11px]">
                                  <Package className="w-3.5 h-3.5 text-[#4c3cc2]" />
                                  <span>نتائج البحث في المخزن ({filteredProducts.length} صنف متاح)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRowDropdown(-1);
                                    setProductSearchModalQuery(item.name);
                                    setShowProductSearchModal(true);
                                  }}
                                  className="text-[10px] bg-white hover:bg-indigo-100 text-[#4c3cc2] px-2 py-0.5 rounded-md font-black border border-indigo-200 cursor-pointer transition-all flex items-center gap-1 shadow-3xs"
                                >
                                  <Search className="w-3 h-3" />
                                  <span>بحث موسع بالنافذة</span>
                                </button>
                              </div>

                              {item.name.trim() !== "" && !products.some(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()) && (
                                <div 
                                  onClick={() => {
                                    const newP = saveProductToInventory(item.name, item.price, item.barcode, item.description);
                                    if (newP) updateItemRow(idx, { productId: newP.id });
                                    setActiveRowDropdown(-1);
                                  }}
                                  className="p-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border-b border-emerald-200 cursor-pointer flex justify-between items-center transition-all group shrink-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">✨</span>
                                    <div>
                                      <span className="font-black text-xs text-emerald-950 block">
                                        صنف غير مسجل: حفظ «{item.name}» في المخزن
                                      </span>
                                      <span className="text-[10px] text-emerald-700 block">
                                        سيتم حفظه تلقائياً في المخزن بسعر {Number(item.price || 0).toFixed(2)} ر.س
                                      </span>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-black shadow-xs whitespace-nowrap flex items-center gap-1">
                                    <span>حفظ بالمخزن</span>
                                    <span>💾</span>
                                  </span>
                                </div>
                              )}

                              <div className="overflow-y-auto divide-y divide-gray-100 flex-1 max-h-56">
                                {filteredProducts.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                                    <span>لا توجد أصناف مطابقة لكلمة البحث «{item.name}» بالمخزن.</span>
                                    {item.name.trim() !== "" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newP = saveProductToInventory(item.name, item.price, item.barcode, item.description);
                                          if (newP) updateItemRow(idx, { productId: newP.id });
                                          setActiveRowDropdown(-1);
                                        }}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                                      >
                                        <span>➕ حفظ «{item.name}» كصنف جديد في المخزن</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  filteredProducts.map(p => (
                                    <div
                                      key={p.id}
                                      onClick={() => handleProductSelection(idx, p)}
                                      className="p-2.5 hover:bg-indigo-50/80 cursor-pointer flex justify-between items-center transition-colors group"
                                    >
                                      <div className="flex flex-col gap-0.5 text-right flex-1 min-w-0 pr-1">
                                        <span className="text-xs font-black text-gray-900 group-hover:text-[#4c3cc2] leading-tight">
                                          {p.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono flex-wrap">
                                          {p.barcode && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">باركود: {p.barcode}</span>}
                                          {p.sku && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">كود: {p.sku}</span>}
                                          {p.description && <span className="text-gray-400 truncate max-w-[240px]">{p.description}</span>}
                                        </div>
                                      </div>
                                      <div className="shrink-0 pl-1 flex items-center gap-2">
                                        <span className="text-xs font-black text-[#4c3cc2] bg-indigo-50 border border-indigo-150 px-2 py-1 rounded-lg font-mono flex items-center gap-1">
                                          {parseFloat(String(p.price ?? 0)).toFixed(2)}
                                          <SaudiRiyalIcon size="11px" className="text-[#4c3cc2]" />
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#4c3cc2]">اختيار ↵</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <input 
                            {...focusProps} 
                            type="text" 
                            id={`item-desc-${idx}`}
                            placeholder="الوصف والمقاسات..." 
                            value={item.description || ""} 
                            onKeyDown={e => handleItemFieldKeyDown(e, idx, "desc")}
                            onChange={v => updateItemRow(idx, { description: v.target.value })} 
                            className="w-full px-2 py-1.5 border border-gray-150 rounded-lg text-[11px] text-gray-650 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden" 
                          />
                        </div>
                        <div className="col-span-1.5"><input {...focusProps} type="number" id={`item-qty-${idx}`} min={1} value={item.quantity} onFocus={e => e.target.select()} onKeyDown={e => handleItemFieldKeyDown(e, idx, "qty")} onChange={v => updateItemRow(idx, { quantity: Math.max(1, parseInt(v.target.value) || 1) })} className="w-full text-center px-1 py-1.5 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-lg text-xs font-mono font-black text-gray-900 outline-hidden" /></div>
                        <div className="col-span-1.5"><input {...focusProps} type="number" id={`item-price-${idx}`} min={0} step="any" value={item.price === 0 ? "" : item.price} onFocus={e => e.target.select()} onKeyDown={e => handleItemFieldKeyDown(e, idx, "price")} onChange={v => updateItemRow(idx, { price: parseFloat(v.target.value) || 0 })} className="w-full text-left px-2 py-1.5 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-lg text-xs font-mono font-black text-indigo-700 outline-hidden" placeholder="0.00" /></div>
                        <div className="col-span-1 text-left text-[10.5px] font-bold text-gray-400 px-1 truncate font-mono">{resolvedTax.toFixed(2)}</div>
                        <div className="col-span-1 flex items-center justify-between gap-1 pl-1"><span className="text-[11px] font-black text-gray-800 font-mono">{unitTotal.toFixed(2)}</span><button type="button" onClick={() => deleteItemRow(idx)} className="text-gray-400 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors">✕</button></div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 shrink-0">
                  <button type="button" onClick={addNewItemRow} className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-[11px] font-black cursor-pointer transition-all shadow-3xs flex items-center gap-1">+ إضافة بند جديد</button>
                  <span className="text-[10px] text-gray-400 font-medium">💡 نصيحة: يمكنك التنقل بين الحقول بمفتاح Enter لإضافة سريعة.</span>
                </div>

                <div className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-purple-50/15 rounded-xl border border-indigo-150 shrink-0 text-right overflow-hidden shadow-2xs transition-all">
                  <div 
                    onClick={() => setIsTaxCollapsed(!isTaxCollapsed)}
                    className="p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-indigo-50/40 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        <span className="text-sm">⚙️</span>
                        <span>إعدادات وخيارات الضريبة:</span>
                      </span>

                      <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 ${
                        formEnableTax ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}>
                        {formEnableTax ? `✓ الضريبة مفعلة (${formTaxRate}%)` : "✕ معفى بدون ضريبة"}
                      </span>

                      {formEnableTax && (
                        <span className="text-[10px] bg-indigo-100/80 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                          {formIsTaxInclusive ? "شاملة الضريبة" : "غير شاملة (تضاف فوق الإجمالي)"}
                        </span>
                      )}

                      {formEnableTax && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                          formShowTaxInInvoice 
                            ? "bg-sky-50 text-sky-800 border-sky-200" 
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}>
                          {formShowTaxInInvoice ? "👁️ ظاهرة بالفاتورة" : "🔒 مخفية بالفاتورة"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1">
                        <span>{isTaxCollapsed ? "تعديل تفاصيل الضريبة ▾" : "طي الإعدادات ▴"}</span>
                      </span>
                    </div>
                  </div>

                  {!isTaxCollapsed && (
                    <div className="p-3 pt-1 border-t border-indigo-100/70 flex flex-col gap-2.5 animate-in fade-in-50 duration-150">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormEnableTax(!formEnableTax)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                              formEnableTax
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            <span>{formEnableTax ? "✓ الضريبة مفعلة" : "✕ بدون ضريبة (معفى)"}</span>
                          </button>
                        </div>

                        {formEnableTax && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500 font-bold">نسب سريعة:</span>
                            {[15, 5, 0].map(rate => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setFormTaxRate(rate)}
                                className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold cursor-pointer transition-all ${
                                  formTaxRate === rate
                                    ? "bg-[#4c3cc2] text-white shadow-xs"
                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {formEnableTax ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-right items-center">
                          <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                            <label className="text-[11px] font-bold text-gray-700 whitespace-nowrap">نسبة ضريبة مخصصة:</label>
                            <div className="flex items-center gap-1">
                              <input
                                {...focusProps}
                                type="number"
                                min={0}
                                max={100}
                                step="any"
                                value={formTaxRate}
                                onChange={e => setFormTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-16 px-1.5 py-0.5 bg-slate-50 border border-gray-300 rounded text-center text-xs font-mono font-black text-indigo-700 focus:bg-white focus:outline-none"
                                placeholder="15"
                              />
                              <span className="text-xs font-black text-indigo-900 font-mono">%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                            <input
                              {...focusProps}
                              type="checkbox"
                              id="taxInclusiveToggleId"
                              checked={formIsTaxInclusive}
                              onChange={e => setFormIsTaxInclusive(e.target.checked)}
                              className="rounded-sm text-[#4c3cc2] cursor-pointer"
                            />
                            <label htmlFor="taxInclusiveToggleId" className="font-bold text-[10.5px] text-gray-750 cursor-pointer select-none">
                              {formIsTaxInclusive ? "الأسعار شاملة الضريبة (VAT Inclusive)" : "الأسعار غير شاملة (تضاف الضريبة)"}
                            </label>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                            <input
                              {...focusProps}
                              type="checkbox"
                              id="showTaxInInvoiceToggleId"
                              checked={formShowTaxInInvoice}
                              onChange={e => setFormShowTaxInInvoice(e.target.checked)}
                              className="rounded-sm text-[#4c3cc2] cursor-pointer"
                            />
                            <label htmlFor="showTaxInInvoiceToggleId" className="font-bold text-[10.5px] text-gray-750 cursor-pointer select-none">
                              {formShowTaxInInvoice ? "👁️ عرض قيمة الضريبة في الفاتورة" : "🔒 إخفاء قيمة الضريبة في الفاتورة"}
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-800 text-[10.5px] font-bold p-2 rounded-lg border border-amber-200 text-right">
                          ℹ️ تم إلغاء تفعيل الضريبة لهذا العرض. لن يتم احتساب أي مبلغ ضريبة وستُعرض الأسعار كقيمة صافية معفاة.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 border border-gray-150 shadow-sm rounded-xl shrink-0 text-right">
                  <div className="md:col-span-6 flex flex-col gap-1">
                    <label className="block text-[10px] font-bold text-gray-500">📝 الشروط والأحكام الخاصة بالتعاقد وتوريد عرض السعر</label>
                    <textarea rows={3} value={formNotes} onChange={r => setFormNotes(r.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-xs text-gray-600 outline-hidden focus:border-[#4c3cc2] focus:bg-white focus:outline-none bg-gray-50/50 resize-none" placeholder="اكتب البنود العامة هنا..." />
                  </div>
                  <div className="md:col-span-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-slate-50/70 p-2.5 rounded-lg border border-gray-150">
                    
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>{(formEnableTax && formIsTaxInclusive) ? "المجموع الفرعي (قبل الضريبة):" : "إجمالي البنود الصافي:"}</span>
                      <span className="text-gray-800 font-bold flex items-center gap-1 font-mono">
                        {((formEnableTax && formIsTaxInclusive) ? (currentTotals.subtotal / (1 + (formTaxRate / 100))) : currentTotals.subtotal).toFixed(2)}
                        <SaudiRiyalIcon size="11px" className="text-gray-800" />
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white px-2 py-0.5 rounded border border-gray-100">
                      <span className="text-gray-500">الخصم الممنوح:</span>
                      <input {...focusProps} type="number" min={0} value={formDiscountValue || ""} onChange={r => setFormDiscountValue(Math.max(0, parseFloat(r.target.value) || 0))} className="w-16 text-left px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-mono font-bold text-red-500 focus:bg-white focus:outline-none" placeholder="0.00" />
                    </div>

                    <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-1.5 font-bold">
                      <span>
                        {formEnableTax ? `الضريبة (${formTaxRate}%):` : "الضريبة (معفى):"}
                        {formEnableTax && !formShowTaxInInvoice && <span className="text-[9px] text-amber-600 mr-1 font-normal">(مخفية بالفاتورة)</span>}
                      </span>
                      <span className="text-gray-800 font-bold flex items-center gap-1 font-mono">
                        {formEnableTax ? currentTotals.taxAmount.toFixed(2) : "0.00"}
                        <SaudiRiyalIcon size="11px" className="text-gray-800" />
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 border-t border-gray-200 pt-1.5">
                      <span className="text-[9.5px] font-bold text-gray-500">
                        {formEnableTax 
                          ? (formIsTaxInclusive ? "الأسعار شاملة الـ VAT" : "الأسعار غير شاملة الـ VAT") 
                          : "عرض أسعار بدون ضريبة"}
                      </span>
                    </div>

                    <div className="col-span-2 border-t-2 border-dashed border-indigo-200 pt-2 flex justify-between items-center text-[#4c3cc2] font-black text-sm bg-indigo-50/50 px-2 rounded-md mt-1">
                      <span>الصافي النهائي المستحق:</span><span className="text-base flex items-center font-mono tracking-wide gap-1">{currentTotals.grandTotal.toFixed(2)}<SaudiRiyalIcon size="14px" className="text-[#4c3cc2]" /></span>
                    </div>

                    <div className="col-span-2 text-[10px] text-indigo-800 font-extrabold text-left mt-0.5">تفقيط: {convertNumberToArabicWords(currentTotals.grandTotal)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-600 bg-white font-bold cursor-pointer hover:bg-gray-100 transition-all">إلغاء الإجراء</button>
                <button type="button" onClick={commitQuotationToState} className="px-5 py-1.5 bg-[#4c3cc2] hover:bg-[#3d30a2] text-white rounded-lg font-black cursor-pointer shadow-md transition-all flex items-center gap-1"><span>حفظ واعتماد المستند الضريبي 💾</span></button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreviewModal && selectedQuote && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 block" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-right border border-gray-100">
              <div className="bg-[#4c3cc2] p-3 text-white flex justify-between items-center font-bold">
                <div className="flex items-center gap-1.5"><Printer className="w-4 h-4 text-indigo-200" /><span>بوابة التصدير وطباعة عرض السعر</span></div>
                <button type="button" onClick={() => setShowPreviewModal(false)} className="text-white hover:bg-white/10 p-1 rounded-md cursor-pointer">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSelectedFormat("arabic_english")} className={`p-3 border rounded-xl text-center cursor-pointer flex flex-col items-center gap-1.5 transition-all ${selectedFormat === "arabic_english" ? "border-[#4c3cc2] bg-indigo-50 text-[#4c3cc2]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}><FileText className="w-5 h-5" /><b className="text-xs">📄 قالب A4 المكتبي</b></button>
                  <button type="button" onClick={() => setSelectedFormat("thermal_80mm")} className={`p-3 border rounded-xl text-center cursor-pointer flex flex-col items-center gap-1.5 transition-all ${selectedFormat === "thermal_80mm" ? "border-[#4c3cc2] bg-indigo-50 text-[#4c3cc2]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}><Printer className="w-5 h-5" /><b className="text-xs">🖨️ قالب 80 مم الحراري</b></button>
                </div>
                <div className="flex flex-col gap-3 border-t pt-3">
                  <button type="button" onClick={() => triggerPrintingOperation(selectedQuote)} className="w-full py-3 bg-[#4c3cc2] hover:bg-[#3d30a2] text-white font-extrabold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md text-sm"><Printer className="w-4 h-4 text-white" /><span>طباعة وااختيار الطابعة 🖨️</span></button>
                  {isGeneratingPdf ? (
                    <div className="w-full py-2 bg-slate-50 border border-gray-150 rounded-xl text-center text-slate-400 font-medium">🔄 جاري تمشيط الملف وتحضير PDF...</div>
                  ) : pdfBlob && (
                    <a href={URL.createObjectURL(pdfBlob)} download={`Quotation_No_${selectedQuote.quotationNumber}.pdf`} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl block transition-all flex items-center justify-center gap-1.5 text-xs"><FolderDown className="w-4 h-4" /><span>حفظ المستند كملف PDF مستقل</span></a>
                  )}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mt-1 text-right flex flex-col gap-2">
                    <span className="text-[11px] font-black text-slate-700 block mb-0.5">📲 مشاركة عرض السعر مع العميل:</span>
                    <button 
                      type="button" 
                      onClick={() => triggerWhatsAppShare(selectedQuote)} 
                      className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md text-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span>مشاركة مباشرة عبر واتساب 💬</span>
                    </button>
                    <button type="button" onClick={() => triggerSharingOperation(selectedQuote)} disabled={isExporting} className="w-full py-2.5 px-3 bg-[#ff9900] hover:bg-[#e08600] text-slate-950 font-black rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm text-xs disabled:opacity-50"><Share2 className="w-4 h-4 text-slate-950" /><span>{isExporting ? "يرجى الانتظار..." : "مشاركة ملف PDF عبر النظام والتطبيقات 🚀"}</span></button>
                    
                    {lastExportedPath && (window as any).electronAPI && (
                      <div className="mt-3 border-t border-slate-200/65 pt-3 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-indigo-900 block">✨ تم تصدير الملف بنجاح! تحكم بمستند الـ PDF كمطور مكتبي:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button" 
                            onClick={async () => {
                              const api = (window as any).electronAPI;
                              if (api?.openPath && lastExportedPath) {
                                const res = await api.openPath(lastExportedPath);
                                if (res && !res.success) {
                                  showToast(`❌ تعذر فتح الملف مباشرة: ${res.error || 'يرجى تفقده بالمجلد'}`, "error");
                                } else {
                                  showToast("👁️ تم فتح مستند الـ PDF بالتطبيق الافتراضي للنظام", "success");
                                }
                              }
                            }}
                            className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1 transition-all shadow-sm"
                          >
                            <span>👁️ فتح الملف مباشرة</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={async () => {
                              const api = (window as any).electronAPI;
                              if (api?.showItemInFolder && lastExportedPath) {
                                await api.showItemInFolder(lastExportedPath);
                                showToast("📁 تم فتح مستكشف الملفات وتحديد المستند", "success");
                              }
                            }}
                            className="py-1.5 px-2 bg-white hover:bg-indigo-50/50 text-indigo-700 border border-indigo-200 font-extrabold rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1 transition-all shadow-sm"
                          >
                            <span>📁 عرض في المجلد</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {(window as any).electronAPI && (
                      <button 
                        type="button" 
                        onClick={async () => {
                          const api = (window as any).electronAPI;
                          if (api?.openSharedFolder) {
                            await api.openSharedFolder();
                            showToast("📂 تم فتح مجلد أرشيف عروض الأسعار بنجاح", "success");
                          }
                        }} 
                        className="w-full mt-2.5 py-1.5 px-2.5 bg-slate-200/70 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300/80 rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>📂 فتح مجلد عروض الأسعار المحفوظة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomerSelectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto block" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden text-right border border-gray-100 flex flex-col">
              <div className="bg-[#4c3cc2] p-3 text-white flex justify-between items-center font-bold">
                <span className="text-xs">👥 تحديد وتعديل بيانات العميل والمستفيد ضريبياً</span>
                <button type="button" onClick={() => setShowCustomerSelectModal(false)} className="text-white hover:bg-white/10 p-1 rounded-md cursor-pointer">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <label className="block text-[11px] font-black text-[#4c3cc2] mb-1">🔍 ابحث وسرّع الملء من قائمة عملائك المسجلين:</label>
                  <div className="relative"><input {...focusProps} type="text" placeholder="ابحث باسم العميل أو رقم الجوال..." value={customerSearchQuery} onChange={r => setCustomerSearchQuery(r.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-[#4c3cc2] focus:bg-white bg-white focus:outline-none" /></div>
                  {customerSearchQuery.trim() !== "" && (
                    <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto mt-2 bg-white border border-gray-150 rounded-md shadow-inner p-1">
                      {savedCustomers.filter(item => normalizeArabic(item.name).includes(normalizeArabic(customerSearchQuery)) || (item.phone && item.phone.includes(customerSearchQuery))).map((cust, idx) => (
                          <div key={idx} onClick={() => { setFormCustName(cust.name); setFormCustPhone(cust.phone || ""); setFormCustTaxId(cust.taxId || ""); setFormCustCr(cust.cr || ""); setFormCustAddress(cust.address || ""); setCustomerSearchQuery(""); showToast(`✅ تم استيراد بيانات العميل: ${cust.name}`, "success"); }} className="p-2 hover:bg-indigo-50 cursor-pointer rounded text-[10.5px] font-bold text-gray-750 flex justify-between items-center transition-all border-b border-gray-50 text-right">
                            <span>{cust.name}</span><span className="font-mono text-gray-400 text-[9.5px]">{cust.phone || "بدون جوال"}</span>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 bg-white p-3 border border-gray-150 rounded-xl">
                  <div className="font-extrabold text-[#4c3cc2] text-xs pb-1.5 border-b mb-1">✍️ تعديل أو تسجيل بيانات العميل الحالية:</div>
                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">اسم العميل والمنشأة</label><input {...focusProps} type="text" value={formCustName} onChange={v => setFormCustName(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden rounded text-xs font-bold" /></div>
                    <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">رقم الهاتف والجوال</label><input {...focusProps} type="text" value={formCustPhone} onChange={v => setFormCustPhone(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden rounded text-xs font-bold" /></div>
                    <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">الرقم الضريبي VAT ID</label><input {...focusProps} type="text" value={formCustTaxId} onChange={v => setFormCustTaxId(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden rounded text-xs font-mono font-bold" /></div>
                    <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">رقم السجل التجاري CR</label><input {...focusProps} type="text" value={formCustCr} onChange={v => setFormCustCr(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden rounded text-xs font-mono font-bold" /></div>
                    <div className="col-span-2"><label className="block text-[10px] text-gray-400 font-bold mb-0.5">العنوان الجغرافي والفرع</label><input {...focusProps} type="text" value={formCustAddress} onChange={v => setFormCustAddress(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none outline-hidden rounded text-xs font-bold" /></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-150 px-4 py-2 bg-gray-50 flex justify-end gap-1.5 shrink-0">
                <button type="button" onClick={() => setShowCustomerSelectModal(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-600 bg-white font-bold cursor-pointer hover:bg-gray-100 transition-all text-xs">تراجع</button>
                <button type="button" onClick={commitCustomerSelect} className="px-5 py-1.5 bg-[#4c3cc2] hover:bg-[#3d30a2] text-white rounded-lg font-black cursor-pointer transition-all text-xs shadow">حفظ واعتماد بيانات العميل 👤</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto block" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden text-right border border-gray-100 flex flex-col">
              <div className="bg-[#4c3cc2] p-3 text-white flex justify-between items-center font-bold">
                <div className="flex items-center gap-1.5"><Settings className="w-4 h-4 text-indigo-200" /><span>تكوين وإصلاح معلومات المنشأة والبنك</span></div>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="text-white hover:bg-white/10 p-1 rounded-md cursor-pointer">✕</button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-right">
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">اسم المنشأة والشركة مصلحاً</label><input {...focusProps} type="text" value={settName} onChange={v => setSettName(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-bold" /></div>
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">شعار أو وصف العلامة النصي</label><input {...focusProps} type="text" value={settLogoText} onChange={v => setSettLogoText(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-bold" /></div>
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">رقم السجل التجاري للشركة</label><input {...focusProps} type="text" value={settCr} onChange={v => setSettCr(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-mono font-bold" /></div>
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">الرقم الضريبي للمستندات</label><input {...focusProps} type="text" value={settTaxId} onChange={v => setSettTaxId(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-mono font-bold" /></div>
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">رقم الهاتف للتواصل</label><input {...focusProps} type="text" value={settPhone} onChange={v => setSettPhone(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-bold" /></div>
                  <div><label className="block text-[10px] text-gray-400 font-bold mb-0.5">العنوان ومقر الفروع</label><input {...focusProps} type="text" value={settAddress} onChange={v => setSettAddress(v.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded text-xs font-bold" /></div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-right flex flex-col gap-2">
                  <span className="text-[11px] font-black text-indigo-850">📂 معلومات الحساب البنكي المعتمد المطبوع تلقائياً:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="block text-[9.5px] text-gray-400 font-bold mb-0.5">اسم المصرف والبنك</label><input {...focusProps} type="text" value={settBank} onChange={v => setSettBank(v.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 focus:border-[#4c3cc2] focus:outline-none rounded text-xs font-bold" /></div>
                    <div><label className="block text-[9.5px] text-gray-400 font-bold mb-0.5">رقم الحساب البنكي</label><input {...focusProps} type="text" value={settAccount} onChange={v => setSettAccount(v.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 focus:border-[#4c3cc2] focus:outline-none rounded text-xs font-mono font-bold" /></div>
                    <div><label className="block text-[9.5px] text-gray-400 font-bold mb-0.5">رقم الآيبان الدولي IBAN</label><input {...focusProps} type="text" value={settIban} onChange={v => setSettIban(v.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 focus:border-[#4c3cc2] focus:outline-none rounded text-xs font-mono font-bold" /></div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-150 text-right flex flex-col gap-2.5">
                  <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1">
                    <span>⚙️</span>
                    <span>إعدادات الضريبة الافتراضية لعروض الأسعار الجديدة:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                      <span className="text-[11px] font-bold text-gray-700">تفعيل الضريبة افتراضياً:</span>
                      <button
                        type="button"
                        onClick={() => setSettDefaultTaxEnabled(!settDefaultTaxEnabled)}
                        className={`px-3 py-1 rounded text-[10.5px] font-black cursor-pointer transition-all ${
                          settDefaultTaxEnabled ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {settDefaultTaxEnabled ? "✓ مفعلة" : "✕ معطلة"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                      <span className="text-[11px] font-bold text-gray-700">نسبة الضريبة الافتراضية:</span>
                      <div className="flex items-center gap-1">
                        <input
                          {...focusProps}
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={settDefaultTaxRate}
                          onChange={e => setSettDefaultTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-16 px-1.5 py-0.5 bg-slate-50 border border-gray-300 rounded text-center text-xs font-mono font-black text-indigo-700 focus:bg-white focus:outline-none"
                        />
                        <span className="text-xs font-bold text-gray-500 font-mono">%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                      <input
                        {...focusProps}
                        type="checkbox"
                        id="settDefaultTaxInclusiveId"
                        checked={settDefaultIsTaxInclusive}
                        onChange={e => setSettDefaultIsTaxInclusive(e.target.checked)}
                        className="rounded-sm text-[#4c3cc2] cursor-pointer"
                      />
                      <label htmlFor="settDefaultTaxInclusiveId" className="text-[10.5px] font-bold text-gray-700 cursor-pointer select-none">
                        الأسعار شاملة الضريبة افتراضياً
                      </label>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-3xs">
                      <input
                        {...focusProps}
                        type="checkbox"
                        id="settDefaultShowTaxInInvoiceId"
                        checked={settDefaultShowTaxInInvoice}
                        onChange={e => setSettDefaultShowTaxInInvoice(e.target.checked)}
                        className="rounded-sm text-[#4c3cc2] cursor-pointer"
                      />
                      <label htmlFor="settDefaultShowTaxInInvoiceId" className="text-[10.5px] font-bold text-gray-700 cursor-pointer select-none">
                        عرض قيمة الضريبة في الفاتورة النهائية
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-right flex flex-col gap-2">
                  <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1">
                    <span>📋</span>
                    <span>الشروط والأحكام الافتراضية لعروض الأسعار:</span>
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium">
                    هذه الشروط ستظهر تلقائياً في خانة الشروط عند إنشاء أي عرض سعر جديد، ويمكنك تعديلها هنا في أي وقت:
                  </p>
                  <textarea
                    rows={3}
                    value={settTerms}
                    onChange={e => setSettTerms(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#4c3cc2] focus:outline-none rounded-lg text-xs font-bold text-gray-800 resize-none leading-relaxed"
                    placeholder="اكتب الشروط والأحكام الافتراضية هنا..."
                  />
                </div>
              </div>
              <div className="border-t border-gray-150 px-4 py-3 bg-gray-50 flex justify-end gap-1.5 shrink-0">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-1.5 border border-gray-300 rounded-[#4c3cc2] text-gray-600 bg-white font-bold cursor-pointer hover:bg-gray-100 transition-all text-xs rounded-lg">تراجع</button>
                <button type="button" onClick={commitCompanySettings} className="px-5 py-1.5 bg-[#4c3cc2] hover:bg-[#3d30a2] text-white rounded-lg font-black cursor-pointer transition-all text-xs shadow-md">حفظ التعديلات المنشأة 💾</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProductSearchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-[60] overflow-hidden block" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden text-right border border-gray-150 flex flex-col h-[85vh]">
              <div className="bg-[#4c3cc2] px-4 py-3 text-white flex justify-between items-center font-bold shrink-0">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-200" />
                  <span className="text-sm font-black">استعراض والبحث في أصناف المخزن وإضافة صنف جديد</span>
                  <span className="text-xs font-mono bg-indigo-800/80 px-2 py-0.5 rounded-full text-indigo-100">
                    {products.length} صنف متاح
                  </span>
                </div>
                <button type="button" onClick={() => setShowProductSearchModal(false)} className="text-white hover:bg-white/10 p-1.5 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto bg-slate-50/50">
                <div className="relative shrink-0">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                  <input
                    {...focusProps}
                    type="text"
                    placeholder="ابحث عن صنف بالاسم، الباركود، الكود، أو السعر..."
                    value={productSearchModalQuery}
                    onChange={e => setProductSearchModalQuery(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 bg-white border border-gray-200 focus:border-[#4c3cc2] focus:outline-none rounded-xl text-xs font-bold text-gray-900 shadow-3xs"
                    autoFocus
                  />
                  {productSearchModalQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchModalQuery("")}
                      className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                    >
                      ✕ مسح
                    </button>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-150 shadow-3xs flex flex-col gap-2 shrink-0">
                  <div 
                    onClick={() => setIsAddingNewProdInModal(!isAddingNewProdInModal)} 
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-[#4c3cc2]">
                      <PlusCircle className="w-4 h-4" />
                      <span>كتابة صنف وسعره يدوياً وحفظه تلقائياً في المخزن فوراً</span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                      {isAddingNewProdInModal ? "إخفاء النموذج ▴" : "إظهار نموذج الإدخال السريع ▾"}
                    </span>
                  </div>

                  {isAddingNewProdInModal && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!quickNewProdName.trim()) {
                          showToast("يرجى كتابة اسم الصنف أولاً.", "error");
                          return;
                        }
                        const parsedPrice = parseFloat(quickNewProdPrice) || 0;
                        const newP = saveProductToInventory(quickNewProdName, parsedPrice, quickNewProdBarcode, quickNewProdDesc);
                        if (newP) {
                          handleInsertProductFromModal(newP);
                          setQuickNewProdName("");
                          setQuickNewProdPrice("");
                          setQuickNewProdBarcode("");
                          setQuickNewProdDesc("");
                          setIsAddingNewProdInModal(false);
                          setShowProductSearchModal(false);
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-gray-100"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">اسم الصنف الجديد *</label>
                        <input
                          {...focusProps}
                          type="text"
                          required
                          placeholder="مثال: دولاب زاوية مودرن 200 سم"
                          value={quickNewProdName}
                          onChange={e => setQuickNewProdName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">سعر البيع (ر.س) *</label>
                        <input
                          {...focusProps}
                          type="number"
                          min={0}
                          step="any"
                          required
                          placeholder="0.00"
                          value={quickNewProdPrice}
                          onChange={e => setQuickNewProdPrice(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 focus:border-[#4c3cc2] focus:bg-white focus:outline-none rounded-lg text-xs font-mono font-bold text-left"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-end">
                        <button
                          type="submit"
                          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer transition-all shadow-3xs flex items-center justify-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>حفظ بالمخزن وإدراج بالعرض 💾</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-3xs">
                  <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                    {(() => {
                      const qNorm = normalizeArabic(productSearchModalQuery);
                      const filteredList = products.filter(p => {
                        if (!productSearchModalQuery.trim()) return true;
                        const pName = p.name ? p.name.toLowerCase() : "";
                        const pBar = p.barcode ? p.barcode.toLowerCase() : "";
                        const pSku = p.sku ? p.sku.toLowerCase() : "";
                        return pName.includes(qNorm) || pBar.includes(qNorm) || pSku.includes(qNorm) || normalizeArabic(pName).includes(qNorm);
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="py-12 text-center text-gray-400 font-bold text-xs flex flex-col items-center gap-2">
                            <span>⚠️ لم يتم العثور على أي صنف مطابق في المخزن</span>
                            {productSearchModalQuery.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickNewProdName(productSearchModalQuery);
                                  setIsAddingNewProdInModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-indigo-50 text-[#4c3cc2] hover:bg-indigo-100 rounded-lg text-xs font-black cursor-pointer transition-all border border-indigo-200"
                              >
                                ➕ إضافة «{productSearchModalQuery}» الآن كصنف جديد في المخزن
                              </button>
                            )}
                          </div>
                        );
                      }

                      return filteredList.map(p => (
                        <div
                          key={p.id}
                          className="p-3 hover:bg-indigo-50/50 flex items-center justify-between gap-3 transition-colors text-right"
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-extrabold text-xs text-gray-900">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10.5px] text-gray-500 font-mono flex-wrap">
                              {p.barcode && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-gray-600">باركود: {p.barcode}</span>}
                              {p.sku && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-gray-600">كود: {p.sku}</span>}
                              {p.description && <span className="text-gray-400">{p.description}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-black text-[#4c3cc2] font-mono flex items-center gap-1 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg">
                              {parseFloat(String(p.price ?? 0)).toFixed(2)}
                              <SaudiRiyalIcon size="11px" className="text-[#4c3cc2]" />
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertProductFromModal(p);
                                setShowProductSearchModal(false);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer transition-all shadow-3xs flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إدراج في العرض</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-150 flex justify-between items-center shrink-0">
                <span className="text-[10.5px] text-gray-500 font-medium">
                  أي صنف جديد يضاف يحفظ تلقائياً في المخزن للاستخدام في عروض الأسعار والطباعة.
                </span>
                <button
                  type="button"
                  onClick={() => setShowProductSearchModal(false)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  إغلاق النافذة ✕
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div id="hidden-preview-pdf-context" className="hidden">
        {selectedQuote && (
          <div id="preview-pdf-area-id" className="relative" style={{ width: selectedFormat === "thermal_80mm" ? "280px" : "794px", background: "#ffffff", padding: "0" }}>
            <div dangerouslySetInnerHTML={{ __html: getTemplateHtmlContent(selectedQuote, selectedFormat === "thermal_80mm") }} />
          </div>
        )}
      </div>

    </div>
  );
}