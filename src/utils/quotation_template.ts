import { Quotation } from '../../types';
import { 
  formatDateArabic, 
  convertNumberToArabicWords, 
  riyalSvgRaw, 
  companyLogoSvg 
} from './quotation_utils';

const T = (text: string): string => text;

const formatSAR = (amount: number, color = '#000000', size = '11px'): string => {
  return `<span style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 3px; vertical-align: middle;">
    <span style="font-family: monospace;">${amount.toFixed(2)}</span>
    ${riyalSvgRaw(color, size)}
  </span>`;
};

export const getTemplateHtmlContent = (quote: Quotation, is80mm: boolean): string => {
  const activeItems = (quote.items || []).filter(it => it && it.name && it.name.trim() !== "");
  const formattedDate = formatDateArabic(quote.date);
  const enableTax = quote.enableTax !== false && (quote.taxRate > 0 || quote.taxAmount > 0);
  const showTaxInInvoice = quote.showTaxInInvoice !== false;
  const taxRate = enableTax ? (quote.taxRate ?? 15) : 0;
  const subtotal = quote.subtotal;
  const taxAmount = enableTax ? quote.taxAmount : 0;
  const grandTotal = quote.grandTotal;
  const arabicWords = convertNumberToArabicWords(grandTotal);

  if (is80mm) {
    return `
      <div style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 2mm 3mm; background: #ffffff; color: #000; width: 74mm; margin: 0 auto; line-height: 1.8; font-size: 12px; box-sizing: border-box;">
        <center style="margin-bottom: 8px; padding-top: 0px;">
          <div style="margin-top: 0; padding-top: 0; outline: none; border: none;">${companyLogoSvg}</div>
          <h3 style="margin: 4px 0 2px 0; font-size: 15px; font-weight: 900; line-height: 1.4;">${T(quote.companyName)}</h3>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #333333; font-weight: bold; line-height: 1.4;">${T(quote.logoText)}</p>
          <span style="font-size: 11px; font-weight: bold; display: block; color: #111111; margin-top: 2px;">${T('الهاتف / Phone:')} <span style="font-family: monospace; font-size: 12px;">${T(quote.companyPhone)}</span></span>
        </center>
        
        <table style="width: 100%; border-top: 1.5px dashed #000000; border-collapse: collapse; margin: 10px 0; padding-top: 8px; font-size: 12px; line-height: 1.8; color: #000000;">
          <tr>
            <td style="text-align: right; padding: 5px 0; font-weight: bold; color: #374151;">${T('رقم العرض / Doc No:')}</td>
            <td style="text-align: left; padding: 5px 0; font-family: monospace; font-weight: bold; font-size: 13px; color: #000000; padding-left: 6px;">${T(quote.quotationNumber)}</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 5px 0; font-weight: bold; color: #374151;">${T('التاريخ / Date:')}</td>
            <td style="text-align: left; padding: 5px 0; font-weight: bold; color: #000000; padding-left: 6px;">${T(formattedDate)}</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 5px 0; font-weight: bold; color: #374151;">${T('العميل / Client:')}</td>
            <td style="text-align: left; padding: 5px 0; font-weight: 900; font-size: 12.5px; color: #000000; padding-left: 6px;">${T(quote.customerName)}</td>
          </tr>
          ${quote.customerPhone ? `
          <tr>
            <td style="text-align: right; padding: 5px 0; font-size: 11.5px; color: #4b5563;">${T('الهاتف / Phone:')}</td>
            <td style="text-align: left; padding: 5px 0; font-size: 11.5px; font-family: monospace; color: #4b5563; padding-left: 6px;">${T(quote.customerPhone)}</td>
          </tr>` : ''}
        </table>
        
        <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 10px; text-align: right; line-height: 1.7;">
          <thead>
            <tr style="border-bottom: 2px solid #000000; font-weight: 900; background-color: #f3f4f6; color: #000000;">
              <th style="padding: 8px 4px; font-size: 12px; text-align: right; vertical-align: middle;">${T('الصنف')}</th>
              <th style="padding: 8px 4px; text-align: center; width: 12%; font-size: 12px; vertical-align: middle;">${T('ك')}</th>
              ${enableTax && showTaxInInvoice ? `
              <th style="padding: 8px 4px; text-align: left; width: 22%; font-size: 12px; padding-left: 6px; vertical-align: middle;">${T(`ضريبة ${taxRate}%`)}</th>
              ` : ''}
              <th style="padding: 8px 4px; text-align: left; width: ${enableTax && showTaxInInvoice ? '26%' : '38%'}; font-size: 12px; padding-left: 12px; vertical-align: middle;">${T('الإجمالي')}</th>
            </tr>
          </thead>
          <tbody>
            ${activeItems.map(it => {
              const itemTotal = it.price * it.quantity;
              const itemTax = enableTax ? (quote.isTaxInclusive ? (itemTotal * (taxRate / (100 + taxRate))) : (itemTotal * (taxRate / 100))) : 0;
              return `
                <tr style="border-bottom: 1px dashed #d1d5db;">
                  <td style="padding: 10px 4px; font-weight: bold; line-height: 1.6; font-size: 12px; vertical-align: middle;">
                    ${T(it.name)}
                    <div style="font-size: 10px; color: #4b5563; font-weight: normal; margin-top: 4px;">${T('بسعر:')} ${formatSAR(it.price, '#4b5563', '10px')}</div>
                  </td>
                  <td style="padding: 10px 4px; text-align: center; font-weight: bold; font-size: 13px; vertical-align: middle;">${it.quantity}</td>
                  ${enableTax && showTaxInInvoice ? `
                  <td style="padding: 10px 4px; text-align: left; font-size: 12px; vertical-align: middle; padding-left: 6px;">${formatSAR(itemTax, '#374151', '10.5px')}</td>
                  ` : ''}
                  <td style="padding: 10px 4px; text-align: left; font-weight: 950; font-size: 12.5px; vertical-align: middle; padding-left: 12px;">${formatSAR(itemTotal, '#000000', '11.5px')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <table style="width: 100%; border-top: 1.5px solid #000000; border-collapse: collapse; margin-top: 10px; font-size: 12.5px; line-height: 1.8; color: #000000;">
          <tr>
            <td style="text-align: right; padding: 8px 4px; color: #222222; padding-right: 2px;">${T('المجموع الفرعي / Subtotal:')}</td>
            <td style="text-align: left; padding: 8px 4px; font-weight: bold; padding-left: 12px;">${formatSAR(subtotal, '#000000', '12.5px')}</td>
          </tr>
          ${enableTax && showTaxInInvoice ? `
          <tr>
            <td style="text-align: right; padding: 8px 4px; color: #222222; padding-right: 2px;">${T(`الضريبة (${taxRate}%) / VAT:`)}</td>
            <td style="text-align: left; padding: 8px 4px; font-weight: bold; padding-left: 12px;">${formatSAR(taxAmount, '#000000', '12.5px')}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 1.5px dashed #000000;">
            <td style="text-align: right; padding: 12px 4px; font-size: 13.5px; font-weight: 950; color: #000000; padding-right: 2px;">${T('الإجمالي المستحق / TOTAL:')}</td>
            <td style="text-align: left; padding: 12px 4px; font-size: 13.5px; font-weight: 950; padding-left: 12px;">${formatSAR(grandTotal, '#000000', '13.5px')}</td>
          </tr>
        </table>
        
        <div style="font-size: 11px; font-weight: bold; background: #f9fafb; border: 1.2px dashed #9ca3af; padding: 6px; border-radius: 4px; margin-top: 8px; text-align: center; line-height: 1.5; color: #111111;">
          ${T('فقط:')} ${T(arabicWords)}
        </div>
      </div>
    `;
  } else {
    return `
      <div style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 6mm 8mm; background: #ffffff; color: #1e293b; box-sizing: border-box; width: 794px; min-height: 1120px; line-height: 1.6;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="vertical-align: top; text-align: right;">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${companyLogoSvg}
                <div>
                  <h2 style="margin: 0; color: #4c3cc2; font-size: 19px; font-weight: 950; line-height: 1.3;">${T(quote.companyName)}</h2>
                  <span style="font-size: 10px; color: #64748b; font-weight: bold;">${T(quote.logoText)}</span>
                </div>
              </div>
              <div style="margin-top: 8px; font-size: 10px; color: #475569; line-height: 1.5;">
                <div>${T('السجل التجاري / CR:')} <b>${T(quote.companyCr)}</b></div>
                <div>${T('الرقم الضريبي / VAT ID:')} <b>${T(quote.companyTaxId)}</b></div>
                <div>${T('الهاتف / Phone:')} <b>${T(quote.companyPhone)}</b></div>
                <div>${T('العنوان / Address:')} <b>${T(quote.companyAddress)}</b></div>
              </div>
            </td>
            <td style="vertical-align: top; text-align: left; width: 42%;">
              <h1 style="margin: 0 0 4px 0; color: #4c3cc2; font-size: 22px; font-weight: 950;">${enableTax ? T('عرض سعر ضريبي / Tax Quotation') : T('عرض سعر مالي / Quotation')}</h1>
              <div style="font-size: 12px; color: #475569; line-height: 1.5;">
                <div>${T('رقم المستند / Doc No:')} <b style="font-size: 14px; color: #4c3cc2; font-family: monospace;">${T(quote.quotationNumber)}</b></div>
                <div>${T('التاريخ / Date:')} <b>${T(formattedDate)}</b></div>
                <div>${T('المدينة / City: جدة - Jeddah')}</div>
              </div>
            </td>
          </tr>
        </table>
        
        <div style="width: 100%; height: 2px; background: linear-gradient(to left, #4c3cc2, #7c3aed); margin: 8px 0 12px 0;"></div>
        
        <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 11px; line-height: 1.6; color: #000000;">
          <tr>
            <td style="font-weight: 900; color: #4c3cc2; font-size: 13px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;" colspan="2">👤 ${T('بيانات العميل والمستفيد / CUSTOMER DETAILS:')}</td>
          </tr>
          <tr>
            <td style="width: 50%; padding-top: 6px; font-size: 11px;">${T('اسم العميل / Name:')} <b>${T(quote.customerName)}</b></td>
            <td style="width: 50%; padding-top: 6px; font-size: 11px;">${T('رقم الجوال / Mobile:')} <b style="font-family: monospace;">${T(quote.customerPhone || 'N/A')}</b></td>
          </tr>
          <tr>
            <td style="font-size: 11px;">${T('الرقم الضريبي / VAT ID:')} <b style="font-family: monospace;">${T(quote.customerTaxId || 'N/A')}</b></td>
            <td style="font-size: 11px;">${T('رقم السجل / CR No:')} <b style="font-family: monospace;">${T(quote.customerCr || 'N/A')}</b></td>
          </tr>
          <tr>
            <td colspan="2" style="font-size: 11px;">${T('العنوان الجغرافي / Address:')} <b>${T(quote.customerAddress || 'N/A')}</b></td>
          </tr>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; color: #000000;">
          <thead>
            <tr style="background-color: #4c3cc2; color: #ffffff; text-align: right; line-height: 1.7; font-weight: bold;">
              <th style="padding: 12px 6px 14px 6px; text-align: center; width: 5%; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T('ت / No.')}</th>
              <th style="padding: 12px 6px 14px 6px; width: ${enableTax && showTaxInInvoice ? '43%' : '53%'}; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T('بيان الأصناف والخدمات / ITEMS DESCRIPTION')}</th>
              <th style="padding: 12px 6px 14px 6px; text-align: center; width: 10%; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T('الكمية / Qty')}</th>
              <th style="padding: 12px 6px 14px 6px; text-align: left; width: 14%; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T('سعر الوحدة / Unit Price')}</th>
              ${enableTax && showTaxInInvoice ? `
              <th style="padding: 12px 6px 14px 6px; text-align: left; width: 14%; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T(`الضريبة ${taxRate}% / VAT ${taxRate}%`)}</th>
              ` : ''}
              <th style="padding: 12px 6px 14px 6px; text-align: left; width: ${enableTax && showTaxInInvoice ? '14%' : '18%'}; vertical-align: middle; box-sizing: border-box; font-size: 12px;">${T('المجموع / Total')}</th>
            </tr>
          </thead>
          <tbody>
            ${activeItems.map((it, idx) => {
              const itemTotal = it.price * it.quantity;
              const itemTax = enableTax ? (quote.isTaxInclusive ? (itemTotal * (taxRate / (100 + taxRate))) : (itemTotal * (taxRate / 100))) : 0;
              return `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #cbd5e1;">
                  <td align="center" style="padding: 10px 6px; font-weight: bold; color: #64748b; border-left: 1px solid #cbd5e1; font-size: 12px;">${idx + 1}</td>
                  <td style="padding: 10px 6px; font-weight: 900; color: #000000; border-left: 1px solid #cbd5e1; font-size: 12px;">
                    <div>${T(it.name)}</div>
                    ${it.description ? `<div style="font-size: 9.5px; color: #4b5563; margin-top: 2px; font-weight: normal; font-style: italic;">${T('الوصف / Description:')} ${T(it.description)}</div>` : ""}
                  </td>
                  <td align="center" style="padding: 10px 6px; font-weight: 900; border-left: 1px solid #cbd5e1; font-size: 12px;">${it.quantity}</td>
                  <td align="left" style="padding: 10px 6px; border-left: 1px solid #cbd5e1; font-weight: bold; font-family: monospace; font-size: 12px;">${formatSAR(it.price, '#000000', '12px')}</td>
                  ${enableTax && showTaxInInvoice ? `
                  <td align="left" style="padding: 10px 6px; border-left: 1px solid #cbd5e1; font-weight: bold; color: #475569; font-family: monospace; font-size: 12px;">${formatSAR(itemTax, '#475569', '12px')}</td>
                  ` : ''}
                  <td align="left" style="padding: 10px 6px; font-weight: 900; color: #4c3cc2; font-family: monospace; font-size: 12px;">${formatSAR(itemTotal, '#4c3cc2', '12px')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div style="width: 52%; font-size: 11px; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #fafbfc; line-height: 1.7;">
            <b style="color: #4c3cc2; display: block; margin-bottom: 4px; font-size: 12px;">📋 ${T('شروط وأحكام عرض السعر / Terms:')}</b>
            ${quote.notes ? T(quote.notes) : T("لا يوجد شروط إضافية مسجلة. / No additional terms recorded.")}
          </div>

          <table style="width: 44%; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; font-size: 12px; font-weight: bold; border-collapse: separate; border-spacing: 0; color: #000000; overflow: hidden;">
            <tr>
              <td style="padding: 10px 10px; vertical-align: middle; line-height: 1.6; border-bottom: 1px solid #cbd5e1; font-size: 12px;">${T('المجموع الفرعي / Subtotal:')}</td>
              <td align="left" style="padding: 10px 10px; vertical-align: middle; line-height: 1.6; border-bottom: 1px solid #cbd5e1; font-family: monospace; font-size: 12px;">
                ${formatSAR(subtotal, '#475569', '12px')}
              </td>
            </tr>
            ${enableTax && showTaxInInvoice ? `
            <tr>
              <td style="padding: 10px 10px; vertical-align: middle; line-height: 1.6; border-bottom: 1px solid #cbd5e1; font-size: 12px;">${T(`الضريبة (${taxRate}%) / VAT (${taxRate}%):`)}</td>
              <td align="left" style="padding: 10px 10px; vertical-align: middle; line-height: 1.6; border-bottom: 1px solid #cbd5e1; font-family: monospace; font-size: 12px;">
                ${formatSAR(taxAmount, '#475569', '12px')}
              </td>
            </tr>
            ` : ''}
            <tr style="background-color: #4c3cc2; color: #ffffff; font-size: 13.5px;">
              <td style="padding: 12px 10px; vertical-align: middle; line-height: 1.6; font-weight: 900; font-size: 13px;">${T('الصافي النهائي / GRAND TOTAL:')}</td>
              <td align="left" style="padding: 12px 10px; vertical-align: middle; line-height: 1.6; font-weight: 900; font-family: monospace; font-size: 13px;">
                ${formatSAR(grandTotal, '#ffffff', '13.5px')}
              </td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fafbfc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-top: 12px; font-size: 12px; font-weight: bold; color: #000000; line-height: 1.6;">
          <span>${T('المبلغ الإجمالي بالأحرف / Total Amount in Words:')}</span>
          <span style="color: #4c3cc2; font-size: 12.5px; margin-right: 4px;">${T(arabicWords)}</span>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-size: 11px; line-height: 1.6; margin-top: 12px; color: #000000;">
          <b style="color: #4c3cc2; display: block; margin-bottom: 4px; font-size: 12px;">📂 ${T('تفاصيل الحساب البنكي المعتمد / Approved Bank Details:')}</b>
          <span style="font-size: 11px;">${T('اسم البنك / Bank Name:')} <b>${T(quote.bankName)}</b></span> | <span style="font-size: 11px;">${T('الحساب / Account No:')} <b style="font-family: monospace;">${T(quote.bankAccount)}</b></span> <br/>
          <div style="margin-top: 4px; font-size: 11px;">${T('الآيبان / IBAN:')} <b style="color: #4c3cc2; font-family: monospace; font-size: 12.5px;">${T(quote.bankIban)}</b></div>
        </div>
      </div>
    `;
  }
};
