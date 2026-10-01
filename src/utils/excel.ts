import * as XLSX from 'xlsx';
import { Product } from '../../types';

export function parseExcelFile(
  file: File
): Promise<{ products: Omit<Product, 'id'>[]; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

        if (!rows || rows.length === 0) {
          resolve({ products: [], error: 'ملف الإكسل فارغ أو ليس به بيانات صالحة' });
          return;
        }

        const keys = Object.keys(rows[0]);
        const findColumn = (aliases: string[]) => {
          for (const k of keys) {
            const lowerK = k.toLowerCase().trim();
            for (const alias of aliases) {
              if (lowerK === alias || lowerK.includes(alias) || alias.includes(lowerK)) {
                return k;
              }
            }
          }
          return null;
        };

        const nameCol = findColumn(['اسم', 'الاسم', 'name', 'المنتج', 'product']);
        const barcodeCol = findColumn(['باركود', 'barcode', 'رمز', 'code', 'الرمز', 'الباركود']);
        const priceCol = findColumn(['سعر', 'price', 'التكلفة', 'السعر', 'صافي', 'البيع']);

        if (!nameCol) {
          resolve({
            products: [],
            error: "لم نجد عمودًا يمثل اسم المنتج. يرجى التأكد من وجود رأس عامود يحتوي على 'اسم' أو 'المنتج'.",
          });
          return;
        }

        const parsedProducts: Omit<Product, 'id'>[] = [];

        rows.forEach((row, i) => {
          const name = row[nameCol] ? String(row[nameCol]).trim() : '';
          if (!name) return;

          let barcode = '';
          if (barcodeCol && row[barcodeCol] !== undefined && row[barcodeCol] !== null) {
            barcode = String(row[barcodeCol]).trim();
          } else {
            // Generate fallback barcode based on simple generation
            barcode = String(9000 + i + Math.floor(Math.random() * 999));
          }

          let price = 0;
          if (priceCol && row[priceCol] !== undefined && row[priceCol] !== null) {
            let str = String(row[priceCol])
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
            
            str = str.replace(/[٫]/g, '.');
            const rawValue = str.replace(/[^0-9.-]/g, '');
            price = parseFloat(rawValue) || 0;
          }

          parsedProducts.push({
            name,
            barcode,
            price,
          });
        });

        resolve({ products: parsedProducts });
      } catch (err: any) {
        resolve({
          products: [],
          error: `فشل تحليل ملف إكسل: ${err?.message || 'خطأ غير معروف'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({ products: [], error: 'تعذر قراءة ملف الإكسل من القرص المحلي.' });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a sample Microsoft Excel Template to guide the user
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      'اسم المنتج': 'مثال: دفتر سلك روكو جامبو A4',
      'الباركود': '628100115599',
      'السعر': 15.50,
    },
    {
      'اسم المنتج': 'مثال: علبة ألوان مائية فابر كاستل',
      'الباركود': '400540125036',
      'السعر': 22.00,
    },
    {
      'اسم المنتج': 'مثال: قلم جاف أزرق بيك صلب',
      'الباركود': '308612300060',
      'السعر': 2.25,
    }
  ];

  /* Create workbook and worksheet */
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  /* Set worksheet direction to RTL so column headers look perfect */
  ws['!views'] = [{ BookView: { RightToLeft: true } } as any];

  /* Add worksheet to workbook */
  XLSX.utils.book_append_sheet(wb, ws, 'قائمة المنتجات النموذجية');

  /* Generate Excel file and trigger download */
  XLSX.writeFile(wb, 'نموذج_قائمة_المنتجات.xlsx');
}


export function exportProductsToExcel(products: Product[]) {
  if (!products || products.length === 0) return;

  const data = products.map(p => ({
    'الباركود': p.barcode || '',
    'اسم المنتج': p.name || '',
    'وصف إضافي / الصنف': p.shipmentContent || '',
    'الوصف': p.description || '',
    'رمز التخزين SKU': p.sku || '',
    'كود الصنف Code': p.code || '',
    'السعر': p.price || 0,
    'تاريخ الإنتاج': p.prodDate || '',
    'تاريخ الانتهاء': p.expDate || '',
    'اسم المستلم': p.recipientName || '',
    'رقم الجوال': p.recipientPhone || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!views'] = [{ rightToLeft: true }];
  
  XLSX.utils.book_append_sheet(wb, ws, 'الأصناف');
  XLSX.writeFile(wb, 'تصدير_المنتجات.xlsx');
}
