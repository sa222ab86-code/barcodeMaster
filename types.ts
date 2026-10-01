export interface Product {
  id: number;
  name: string;
  barcode: string;
  sku?: string;
  code?: string; // Optional SKU/Code from ERP/SQL
  price: number;
  prodDate?: string; // Optional production date (e.g. 2026/05)
  expDate?: string;  // Optional expiry date (e.g. 2027/05)
  recipientName?: string; // Name of shipment recipient
  recipientPhone?: string; // Phone number of shipment recipient
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderCity?: string;
  recipientAddress?: string;
  recipientCity?: string;
  shippingCompany?: string;
  isFragile?: boolean;
  shipmentContent?: string; // Custom shipment content description
  calories?: string; // Number of calories
  protein?: string; // Protein in grams
  carbs?: string; // Carbs in grams
  fats?: string; // Fats in grams
  weight?: string; // Weight in grams
  description?: string; // Product description
  isManual?: boolean; // Flag indicating manually added product
}

export interface LabelSettings {
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginBottom: number;
  marginRight: number;
  marginLeft: number;
  labelGap: number;
  labelWidth: number;
  labelHeight: number;
  companyFontSize: number;
  logoSize?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  companyFontWeight: string;
  nameFontWeight?: string;
  numberFontWeight?: string;
  dateFontWeight?: string;
  caloriesFontWeight?: string;
  descriptionFontWeight?: string;
  nameFontSize: number;
  nameLines: number;
  priceFontSize: number;
  priceFontWeight: string;
  barcodeHeight: number;
  barcodeWidth: number;
  numberFontSize: number;

  // Custom production and expiry date rendering
  showDates?: boolean;
  prodDateLabel?: string; // custom translation (e.g. "إنتاج" or "PROD")
  expDateLabel?: string;  // custom translation (e.g. "انتهاء" or "EXP")
  dateFontSize?: number;  // date font size in px
  caloriesFontSize?: number; // calories font size in px
  descriptionFontSize?: number; // description font size in px
  currencySymbol?: string; // Currency symbol code (e.g. 'sar-monogram', 'sar-text', 'usd', etc)
  globalProdDate?: string; // global production date for all items
  globalExpDate?: string;  // global expiry date for all items

  // New customizable layout, font style & element arrangement fields
  arrangement?: 'standard' | 'compact' | 'price-top' | 'horizontal-split' | 'sides' | 'shipment' | 'calories' | 'product' | 'nutrition_advanced' | 'shipment_150x100';
  fontFamilyPreset?: 'cairo' | 'amiri' | 'mono' | 'system';
  showBrand?: boolean;
  showPrice?: boolean;
  showBarcode?: boolean;
  showCode?: boolean; // Show or hide the barcode number/SKU
  showTaxInclusive?: boolean;
  borderRadius?: number; // border radius in px
  borderStyle?: 'solid' | 'dotted' | 'dashed' | 'none';
  accentColor?: string; // Color code for text and barcodes (e.g. #000000, #1e3a8a, etc)
  backgroundColor?: string; // Color code for background (e.g. #ffffff, #fffbeb, etc)
  printMode?: 'roll' | 'sheet' | 'roll_gap' | 'continuous' | string; // 'roll' handles single thermal sticker printer rolls, 'sheet' handles multi-label sheet layouts
  printOrientation?: 'auto' | 'portrait' | 'landscape';
  printRotation?: 0 | 90 | 180 | 270;
  printScale?: number; // scale percent e.g. 95 (for 95%)
  printOffsetX?: number; // X axis offset in mm
  printOffsetY?: number; // Y axis offset in mm
}

export interface LabelTemplate {
  id: string; // Unique string identifier
  name: string; // Dynamic template label chosen by user (e.g., 'قرطاسية رفيعة')
  companyName: string; // Custom company stored within this layout template
  settings: LabelSettings;
  isSystem?: boolean; // Label standard system pre-constructed templates
}

export interface QuotationItem {
  id: string;
  productId?: number;
  name: string;
  description?: string; // Additional product description/specifications
  barcode: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerTaxId?: string;
  customerCr?: string;
  customerAddress?: string;
  notes?: string;
  items: QuotationItem[];
  discountValue: number; // static amount of discounts
  taxRate: number; // custom tax rate percentage (e.g. 15, 5, or user-defined %)
  isTaxInclusive: boolean;
  enableTax?: boolean; // whether tax is enabled or disabled
  showTaxInInvoice?: boolean; // whether to display or hide the tax value in the final invoice
  companyName: string;
  logoText?: string;
  companyTaxId?: string;
  companyCr?: string;
  companyAddress?: string;
  companyPhone?: string;
  bankName?: string;
  bankAccount?: string;
  bankIban?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
}

