import React from 'react';

export interface InvoiceItem {
  id?: string | number;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
  description?: string;
}

export interface InvoiceTemplateData {
  quoteNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerTaxId?: string;
  customerCr?: string;
  customerAddress?: string;
  date?: string;
  validUntil?: string;
  items?: InvoiceItem[];
  products?: InvoiceItem[];
  notes?: string;
  taxRate?: number;
  discountValue?: number;
  isTaxInclusive?: boolean;
  enableTax?: boolean;
  showTaxInInvoice?: boolean;

  // Company Information override
  companyName?: string;
  companyTaxId?: string;
  companyCr?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export const InvoiceTemplate: React.FC<{ data: InvoiceTemplateData }> = ({ data }) => {
  // Safe default mappers for full responsiveness to whichever prop format gets passed
  const itemsList = data.items || data.products || [];
  
  // Normalized calculation metrics
  const discount = data.discountValue ?? 0;
  const enableTax = data.enableTax !== false && (data.taxRate === undefined || data.taxRate > 0);
  const showTaxInInvoice = data.showTaxInInvoice !== false;
  const rawTaxRate = enableTax ? (data.taxRate ?? 0.15) : 0; // default to 15% standard if enabled
  const taxRate = rawTaxRate > 1 ? rawTaxRate / 100 : rawTaxRate;
  
  const subTotal = itemsList.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const totalAfterDiscount = Math.max(0, subTotal - discount);
  
  const isTaxInclusive = data.isTaxInclusive !== false; // true by default
  
  let taxAmount = 0;
  let grandTotal = totalAfterDiscount;
  
  if (enableTax) {
    if (isTaxInclusive) {
      taxAmount = totalAfterDiscount * (taxRate / (1 + taxRate));
      grandTotal = totalAfterDiscount;
    } else {
      taxAmount = totalAfterDiscount * taxRate;
      grandTotal = totalAfterDiscount + taxAmount;
    }
  }

  // Currency utility
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
  };

  // Helper to format date
  const displayDate = data.date || new Date().toLocaleDateString('ar-SA');

  return (
    <div className="w-full max-w-[210mm] bg-white p-6 sm:p-10 font-sans text-gray-800 relative flex flex-col justify-between min-h-[297mm]" style={{ direction: 'rtl' }}>
      
      {/* الجزء العلوي (فوق الخط) */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 text-right">
          
          {/* اليمين: معلومات الجهة المصدرة */}
          <div className="flex flex-col gap-0.5 max-w-sm">
            <h2 className="font-sans font-black text-lg text-slate-900 border-r-4 border-indigo-600 pr-2 leading-tight">
              {data.companyName || 'مؤسسة الحلول الرقمية للتجارة'}
            </h2>
            <div className="text-xs font-bold text-slate-500 mt-1.5 space-y-0.5">
              <p>📍 الرقم الضريبي للمنشأة: <span className="font-mono text-slate-700">{data.companyTaxId || '300000000000003'}</span></p>
              <p>📇 السجل التجاري الرئيسي: <span className="font-mono text-slate-700">{data.companyCr || '1010654321'}</span></p>
              <p>🏠 المقر الرئيسي الإقليمي: <span className="text-slate-700">{data.companyAddress || 'الرياض، المملكة العربية السعودية'}</span></p>
              <p>📞 قنوات الاتصال الرسمية: <span className="font-mono text-slate-700">{data.companyPhone || '0500000000'}</span></p>
            </div>
          </div>

          {/* اليسار (الجهة المقابلة): التوصيف القانوني للمستند */}
          <div className="sm:text-left text-right flex flex-col justify-between sm:items-end items-start h-full shrink-0">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-center flex flex-col gap-0.5 min-w-[220px]">
              <h1 className="text-[#3b82f6] text-xl font-black m-0 leading-tight">عرض مالي وفني</h1>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-widest leading-none font-mono">COMMERCIAL QUOTATION</p>
            </div>
            <div className="text-xs font-extrabold text-slate-500 mt-4 leading-relaxed sm:text-left text-right">
              <p>📅 تاريخ إصدار الوثيقة: <span className="font-mono text-slate-800">{displayDate}</span></p>
              <p>⏱️ فترة صلاحية العرض: <span className="text-slate-800 font-bold">{data.validUntil || '15 يوماً من تاريخ الإصدار'}</span></p>
              <p>🛡️ الرقم المرجعي الموحد: <span className="font-mono text-sky-700 font-bold">#{data.quoteNumber || 'QT-2026-884'}</span></p>
            </div>
          </div>
        </div>
{/* الخط الفاصل الفاخر */}
<div className="w-full h-1 bg-indigo-600 rounded-full mb-6"></div>

{/* بيانات الشريك المستفيد */}
<div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-right">
  <div className="w-full border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
    <h3 className="font-black text-xs text-indigo-900">📄 المعلومات الاعتبارية والتعاقدية للطرف المستفيد:</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold text-slate-600">
    <div>
      👤 اسم العميل: <span className="text-slate-900 font-bold text-sm mr-1">{data.customerName || 'شركة العميل الموقر / شركة التجارة الذكية'}</span>
    </div>
    <div>
      📞 قنوات التواصل المعتمدة: <span className="font-mono text-slate-800 mr-1">{data.customerPhone || 'N/A'}</span>
    </div>
    <div>
      📍 الرقم الضريبي للطرف المستفيد: <span className="font-mono text-slate-800 mr-1">{data.customerTaxId || 'N/A'}</span>
    </div>
    <div>
      📇 السجل التجاري للمستفيد: <span className="font-mono text-slate-800 mr-1">{data.customerCr || 'N/A'}</span>
    </div>
    <div className="md:col-span-2">
      🏠 عنوان الموقّع ومقر التسليم المعتمد: <span className="text-slate-800 mr-1">{data.customerAddress || 'المملكة العربية السعودية، مدينة العميل المحددة'}</span>
    </div>
  </div>
</div>
        {/* جدول البنود والتسعير الهندسي */}
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm mt-4">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white text-xs sm:text-sm font-bold">
                <th className="py-3 px-3 text-center w-10">م</th>
                <th className="py-3 px-3 text-right">بيان البنود والخدمات</th>
                <th className="py-3 px-3 text-right">التوصيف الفني والهندسي للمشروع</th>
                <th className="py-3 px-3 text-center w-24">الفئة السعرية</th>
                <th className="py-3 px-2 text-center w-16">الكمية</th>
                {enableTax && showTaxInInvoice && (
                  <th className="py-3 px-3 text-center w-24">العبء الضريبي ({Math.round(taxRate * 100)}%)</th>
                )}
                <th className="py-3 px-3 text-left bg-indigo-600 w-32">الصافي الإجمالي</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {itemsList.length > 0 ? (
                itemsList.map((item, index) => {
                  const rawLineTotal = (item.price || 0) * (item.quantity || 1);
                  
                  let lineTax = 0;
                  let lineTotalWithTaxContext = rawLineTotal;

                  if (enableTax) {
                    if (isTaxInclusive) {
                      lineTax = rawLineTotal * (taxRate / (1 + taxRate));
                      lineTotalWithTaxContext = rawLineTotal;
                    } else {
                      lineTax = rawLineTotal * taxRate;
                      lineTotalWithTaxContext = rawLineTotal + lineTax;
                    }
                  }

                  const itemDesc = item.description || (item.barcode ? `كود التتبع الرقمي: ${item.barcode}` : 'توريد وخدمة تقنية مخصصة تتبع الاتفاقية الإطارية للشروط المرجعية');

                  return (
                    <tr 
                      key={item.id || index} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-0`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-bold font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-semibold leading-relaxed max-w-[220px] truncate">
                        {itemDesc}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 px-2 text-center font-black text-slate-800 font-mono">
                        {item.quantity}
                      </td>
                      {enableTax && showTaxInInvoice && (
                        <td className="py-3 px-3 text-center font-semibold font-mono text-slate-500 text-[11px]">
                          {formatCurrency(lineTax)}
                          <span className="block text-[8px] text-slate-400 font-normal">
                            (بمعدل {Math.round(taxRate * 100)}%)
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3 text-left font-extrabold text-indigo-600 font-mono">
                        {formatCurrency(lineTotalWithTaxContext)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={enableTax && showTaxInInvoice ? 7 : 6} className="py-12 text-center text-slate-400 font-bold">
                    📋 لم يتم إدراج بنود تعاقدية ضمن هذا الملحق المالي بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* الشروط العامة والتحليلات المالية */}
        <div className="flex flex-col md:flex-row justify-between items-start mt-6 gap-6 font-sans">
          
          {/* الملاحظات الفنية والشروط القانونية */}
          <div className="w-full md:flex-1 text-xs text-slate-500 leading-relaxed max-w-full md:max-w-[55%] text-right">
            {data.notes ? (
              <>
                <h4 className="font-extrabold text-slate-700 mb-1.5 text-xs">📝 الاشتراطات الخاصة والأحكام الفنية:</h4>
                <div className="whitespace-pre-line bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-600 leading-relaxed">
                  {data.notes}
                </div>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-slate-700 mb-1.5 text-xs">📋 البنود التنظيمية والأحكام التعاقدية العامة:</h4>
                <ol className="list-decimal list-inside pr-1 text-slate-500 space-y-1 font-semibold">
                  <li>تُصنف هذه الوثيقة كمسودة عرض مالي وفني تقديري ولا يترتب عليها أي التزام مالي أو مطالبة نهائية قبل التوقيع.</li>
                  <li>حوكمة الدفع: يتم استحقاق 50% كدفعة مقدمة لبدء التجهيز والجدولة الفنية، و 50% فور التسليم والتشغيل التجريبي.</li>
                  <li>تخضع الأسعار والمدد الزمنية المذكورة لشروط هذا العرض وتعتبر نافذة لمدة 15 يوماً فقط من تاريخ الإصدار المعتمد.</li>
                </ol>
              </>
            )}
          </div>

          {/* الخلاصة والتحليل المالي النهائي */}
          <div className="w-full md:w-1/3 min-w-[260px] bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <table className="w-full text-xs sm:text-sm font-bold text-slate-600 border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-right font-bold text-slate-500">المجموع الأساسي الصافي:</td>
                  <td className="py-2 text-left font-mono text-slate-800">{formatCurrency(subTotal)}</td>
                </tr>
                {discount > 0 && (
                  <tr className="border-b border-slate-200 text-red-600 font-bold">
                    <td className="py-2 text-right">إجمالي الخصم الممنوح:</td>
                    <td className="py-2 text-left font-mono">-{formatCurrency(discount)}</td>
                  </tr>
                )}
                {enableTax && showTaxInInvoice && (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-right font-bold text-slate-500">
                      ضريبة القيمة المضافة ({Math.round(taxRate * 100)}%):
                    </td>
                    <td className="py-2 text-left font-mono text-slate-800">
                      {formatCurrency(taxAmount)}
                      <span className="block text-[8px] text-slate-400 font-normal mt-0.5 leading-none">
                        ({isTaxInclusive ? 'شاملة ضمن القيمة التعاقدية للبنود' : 'مضافة منفصلة للقيمة الأساسية الصافية'})
                      </span>
                    </td>
                  </tr>
                )}
                <tr className="border-t border-slate-200 text-indigo-600 font-black text-sm sm:text-base">
                  <td className="py-3.5 text-right">الاستحقاق المالي الإجمالي النهائي:</td>
                  <td className="py-3.5 text-left font-mono text-base sm:text-lg">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* حوكمة الاعتماد والتوقيعات والاتساق الرقمي */}
      <div className="border-t border-dashed border-slate-200 pt-6 mt-10 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 text-xs sm:text-sm text-slate-500">
          <div className="text-center w-full sm:w-48 border-t border-dashed border-slate-300 pt-2 font-bold text-slate-600">
            مصادقة وختم الجهة المصدرة
          </div>
          
          <div className="text-center shrink-0">
            <div className="font-mono text-xl sm:text-2xl tracking-[4px] text-slate-900 select-none">
              |||| ||||  ||| ||| |||
            </div>
            <div className="text-[9px] text-slate-400 mt-1 font-bold">
              رمز التتبع الرقمي للوثيقة المعتمدة: <span className="font-mono text-slate-600">*{data.quoteNumber || 'QT-2026-884'}*</span>
            </div>
          </div>

          <div className="text-center w-full sm:w-48 border-t border-dashed border-slate-300 pt-2 font-bold text-slate-600">
            الاعتماد والقبول من الممثل المخوّل
          </div>
        </div>
      </div>

    </div>
  );
};