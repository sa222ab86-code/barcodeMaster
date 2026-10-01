import React from 'react';
import { Product, LabelSettings } from '../../types';
import BarcodeRenderer from './BarcodeRenderer';
import SaudiRiyalIcon from './SaudiRiyalIcon';
import { Scale } from 'lucide-react';

interface LabelCardProps {
  product: Product;
  settings: LabelSettings;
  companyName: string;
  zoom?: number; // Zoom level (e.g., 2 for 200%)
  borderStyle?: string; // fallback e.g. 'solid' or 'none'
  storeLogoUrl?: string;
}

const LabelCard = React.memo(function LabelCard({
  product,
  settings,
  companyName,
  zoom = 1,
  borderStyle = 'solid',
  storeLogoUrl,
}: LabelCardProps) {
  // Determine font family
  let fontFamily = '"Cairo", "Segoe UI", sans-serif';
  if (settings.fontFamilyPreset === 'amiri') {
    fontFamily = '"Amiri", Georgia, serif';
  } else if (settings.fontFamilyPreset === 'mono') {
    fontFamily = '"JetBrains Mono", monospace';
  } else if (settings.fontFamilyPreset === 'system') {
    fontFamily = '"Tajawal", sans-serif';
  }

  // Determine showing components
  const showBrand = settings.showBrand !== false;
  const showPrice = settings.showPrice !== false;
  const showBarcode = settings.showBarcode !== false;
  const showTaxInclusive = settings.showTaxInclusive === true;
  
  // Custom colors and borders
  const accent = settings.accentColor || '#000000'; // Still used for borders/decorations
  const bgColor = settings.backgroundColor || '#ffffff';
  const radius = settings.borderRadius !== undefined ? `${settings.borderRadius}px` : '2px';
  const actualBorderStyle = settings.borderStyle || borderStyle;

  // Base scale calculation dynamically based on actual width vs standard 45mm width
  const baseWidth = 45;
  const currentWidth = settings.labelWidth || baseWidth;
  const fontScale = Math.max(0.55, Math.min(2.2, currentWidth / baseWidth));
  const dynamicPadding = `${Math.max(0.6, 1.5 * fontScale)}mm ${Math.max(0.6, 1.5 * fontScale)}mm`;

  const isContinuousRoll = settings.printMode === 'roll';

  // Outer Label Card Style
  const labelStyle: React.CSSProperties = {
    width: `${settings.labelWidth}mm`,
    height: isContinuousRoll ? 'auto' : `${settings.labelHeight}mm`,
    minHeight: isContinuousRoll ? `${settings.labelHeight}mm` : undefined,
    borderWidth: actualBorderStyle === 'none' ? '0px' : '0.4px',
    borderColor: actualBorderStyle === 'none' ? 'transparent' : accent,
    borderStyle: actualBorderStyle as React.CSSProperties['borderStyle'],
    borderRadius: radius,
    padding: dynamicPadding,
    backgroundColor: bgColor,
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: isContinuousRoll ? 'flex-start' : 'space-between',
    gap: isContinuousRoll ? `${Math.max(1, 2 * fontScale)}mm` : undefined,
    alignItems: 'center',
    boxSizing: 'border-box',
    overflow: isContinuousRoll ? 'visible' : 'hidden',
    direction: 'rtl',
    fontFamily: fontFamily,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: zoom !== 1 ? (isContinuousRoll ? 'top center' : 'center') : undefined,
    flexShrink: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: `${Math.max(6, settings.nameFontSize * fontScale)}px`,
    fontWeight: settings.nameFontWeight || '800',
    color: '#000000',
    display: '-webkit-box',
    WebkitLineClamp: settings.nameLines || 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textAlign: 'center',
    width: '100%',
    lineHeight: '1.25',
    fontFamily: fontFamily,
  };

  const companyStyle: React.CSSProperties = {
    fontSize: `${Math.max(6, settings.companyFontSize * fontScale)}px`,
    fontWeight: settings.companyFontWeight || '700',
    color: '#000000', // تم التوحيد للون الأسود بدلاً من accent
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    textAlign: 'center',
    marginBottom: '1px',
    lineHeight: '1.1',
    fontFamily: fontFamily,
  };

  const priceStyle: React.CSSProperties = {
    fontSize: `${Math.max(8, settings.priceFontSize * fontScale)}px`,
    fontWeight: settings.priceFontWeight || '800',
    color: '#000000',
    display: 'inline-block',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    lineHeight: '1.1',
    marginTop: '1px',
  };

  const renderCurrency = (size: string, color: string = '#000000') => {
    const symbolCode = settings.currencySymbol || 'sar-monogram';
    switch (symbolCode) {
      case 'sar-monogram':
        return <SaudiRiyalIcon size={size} style={{ color }} />;
      case 'sar-text':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5">ر.س</span>;
      case 'sar-en':
        return <span style={{ fontSize: `calc(${size} * 0.9)`, color, fontWeight: 'bold' }} className="font-mono ml-0.5">SAR</span>;
      case 'usd':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="font-mono ml-0.5">$</span>;
      case 'eur':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="font-mono ml-0.5">€</span>;
      case 'gbp':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="font-mono ml-0.5">£</span>;
      case 'kwd':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">د.ك</span>;
      case 'aed':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">د.إ</span>;
      case 'bhd':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">د.ب</span>;
      case 'qar':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">ر.ق</span>;
      case 'omr':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">ر.ع</span>;
      case 'egp':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5 whitespace-nowrap">ج.م</span>;
      case 'try':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="font-mono ml-0.5">₺</span>;
      case 'jpy':
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="font-mono ml-0.5">¥</span>;
      default:
        return <span style={{ fontSize: size, color, fontWeight: 'bold' }} className="ml-0.5">{symbolCode}</span>;
    }
  };

  const renderDates = () => {
    if (!settings.showDates) return null;
    
    const prodDateToShow = product.prodDate || settings.globalProdDate;
    const expDateToShow = product.expDate || settings.globalExpDate;
    
    if (!prodDateToShow && !expDateToShow) return null;

    const dateFontSize = (settings.dateFontSize || (settings.nameFontSize * 0.82)) * fontScale;

    return (
      <div 
        style={{ 
          fontSize: `${dateFontSize}px`, 
          fontFamily: fontFamily, 
          color: '#000000',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '6px', 
          width: '100%',
          marginTop: '1px',
          marginBottom: '1.5px',
          whiteSpace: 'nowrap',
          direction: 'rtl',
          borderBottom: `0.5px dashed ${accent}90`,
          borderTop: `0.5px dashed ${accent}90`,
          padding: '1.5px 0px',
          lineHeight: '1.1'
        }}
        className="w-full justify-center flex-wrap"
      >
        {prodDateToShow && (
          <div className="flex gap-0.5 items-center inline-flex" style={{ color: '#000000' }}>
            <span style={{ fontWeight: 900, color: '#000000', display: 'inline-block' }}>{settings.prodDateLabel || 'إنتاج'}:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#000000', display: 'inline-block', marginRight: '2px' }}>{prodDateToShow}</span>
          </div>
        )}
        {expDateToShow && (
          <div className="flex gap-0.5 items-center inline-flex" style={{ color: '#000000' }}>
            <span style={{ fontWeight: 900, color: '#000000', display: 'inline-block' }}>{settings.expDateLabel || 'انتهاء'}:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#000000', display: 'inline-block', marginRight: '2px' }}>{expDateToShow}</span>
          </div>
        )}
      </div>
    );
  };

  const renderDescription = () => {
    if (!product.description) return null;
    return (
      <div style={{
        fontSize: `${(settings.descriptionFontSize || 8) * fontScale}px`,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
        marginTop: '0px',
        marginBottom: '2px',
        lineHeight: '1.2',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {product.description}
      </div>
    );
  };
  const renderCalories = () => {
    if (!product.calories && !product.weight) return null;
    const rawWeight = product.weight?.trim() || '';
    const formattedWeight = rawWeight
      ? (rawWeight.toLowerCase().endsWith('g') || rawWeight.includes('جم') || rawWeight.includes('جرام')
          ? rawWeight 
          : `${rawWeight} جم`)
      : '';
    const iconSize = Math.max(8.5, (settings.caloriesFontSize || settings.nameFontSize * 0.85) * fontScale);

    return (
      <div style={{
        fontSize: `${(settings.caloriesFontSize || settings.nameFontSize * 0.85) * fontScale}px`,
        fontWeight: settings.caloriesFontWeight || '900',
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${4 * fontScale}px`,
        flexWrap: 'wrap',
        marginBottom: '2px',
        lineHeight: '1.2'
      }}>
        {product.calories && <span>{product.calories} سعرة حرارية</span>}
        {product.calories && product.weight && <span style={{ margin: '0 2px' }}>•</span>}
        {product.weight && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${2.5 * fontScale}px`, fontWeight: '900', color: '#000000' }}>
            <Scale style={{ width: `${iconSize}px`, height: `${iconSize}px`, strokeWidth: 2.6, verticalAlign: 'middle', display: 'inline-block' }} />
            <span>{formattedWeight}</span>
          </span>
        )}
      </div>
    );
  };

  const renderShipmentContent = () => {
    if (!product.shipmentContent) return null;
    return (
      <div 
        style={{ 
          fontSize: `${(settings.descriptionFontSize || 8) * fontScale}px`, 
          color: '#000000',
          fontWeight: settings.descriptionFontWeight || '600',
          marginTop: '2px',
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.2',
          width: '100%',
          fontFamily: fontFamily
        }}
      >
        {product.shipmentContent}
      </div>
    );
  };

  const renderContent = () => {
    const arrangement = settings.arrangement || 'standard';
    const safePrice = (product.price || 0).toFixed(2);
    const fallbackCompanyName = companyName?.trim() || 'اسم الشركة';
    const displayName = product.name?.trim() || 'اسم المنتج الجديد';

    switch (arrangement) {
      case 'shipment_150x100': {
        const senderName = product.senderName || fallbackCompanyName;
        const senderPhone = product.senderPhone || '';
        const senderAddress = product.senderAddress || '';
        const senderCity = product.senderCity || '';
        
        const recName = product.recipientName || 'اسم المستلم';
        const recPhone = product.recipientPhone || 'رقم الجوال';
        const recAddress = product.recipientAddress || '';
        const recCity = product.recipientCity || '';
        const shipCompany = product.shippingCompany || '';
        const isFragile = product.isFragile;
        const shipContent = product.shipmentContent || displayName;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '4px', textAlign: 'right', flex: '1', boxSizing: 'border-box' }} dir="rtl">
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {storeLogoUrl !== '/icon.png' && storeLogoUrl && (
                  <img src={storeLogoUrl} alt="Logo" style={{ maxHeight: '20mm', maxWidth: '30mm', objectFit: 'contain', filter: 'grayscale(100%) contrast(200%)' }} />
                )}
                {isFragile && (
                  <div style={{ padding: '2px 6px', border: '2px solid #000', borderRadius: '4px', fontWeight: '900', fontSize: '14px', letterSpacing: '1px' }}>
                    🍷 قابل للكسر FRAGILE
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ padding: '4px', border: '1px solid #000', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', borderBottom: '1px solid #ccc', marginBottom: '2px', paddingBottom: '2px' }}>المرسل SENDER:</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{senderName}</div>
                {senderPhone && <div style={{ fontSize: '11px' }}>هاتف: <span dir="ltr" className="font-mono">{senderPhone}</span></div>}
                {senderAddress && <div style={{ fontSize: '11px' }}>{senderAddress}</div>}
                {senderCity && <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{senderCity}</div>}
              </div>

              <div style={{ padding: '6px', border: '2px solid #000', borderRadius: '4px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', borderBottom: '1px solid #000', marginBottom: '4px', paddingBottom: '2px' }}>المستلم RECEIVER:</div>
                <div style={{ fontSize: '16px', fontWeight: '900' }}>{recName}</div>
                {recPhone && <div style={{ fontSize: '14px', fontWeight: 'bold' }}>هاتف: <span dir="ltr" className="font-mono">{recPhone}</span></div>}
                {recAddress && <div style={{ fontSize: '12px', marginTop: '2px' }}>{recAddress}</div>}
                {recCity && <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '2px' }}>{recCity}</div>}
                
                <div style={{ marginTop: 'auto', paddingTop: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <div><strong>المحتوى:</strong> {shipContent}</div>
                  {product.weight && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 'bold' }}>
                      <Scale style={{ width: '12px', height: '12px', strokeWidth: 2.5 }} />
                      <span>الوزن: {product.weight.toLowerCase().endsWith('g') || product.weight.includes('جم') || product.weight.includes('جرام') ? product.weight : `${product.weight} جم`}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {shipCompany && (
                <div style={{ padding: '4px', border: '1px solid #000', borderRadius: '4px', textAlign: 'center', fontSize: '14px', fontWeight: '900', backgroundColor: '#f8fafc' }}>
                  {shipCompany}
                </div>
              )}
            </div>

            {showBarcode && (
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', borderTop: '2px dashed #000', paddingTop: '4px' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  showCode={settings.showCode}
                  numberFontSize={settings.numberFontSize * fontScale}
                />
              </div>
            )}
          </div>
        );
      }

      case 'shipment': {
        const recName = product.recipientName || 'اسم المستلم';
        const recPhone = product.recipientPhone || 'رقم الجوال';
        const shipContent = product.shipmentContent || displayName;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'stretch', textAlign: 'right', flex: '1', padding: '0 2px' }}>
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px', fontSize: `${8 * fontScale}px` }}>
              <span style={{ fontWeight: 900 }} className="text-slate-800 shrink-0">📦</span>
              {showBrand && (
                <span style={{ fontWeight: 900, color: '#000000', textAlign: 'right', whiteSpace: 'normal', overflow: 'hidden' }}>
                  المرسل: {fallbackCompanyName}
                </span>
              )}
            </div>

            <div 
              style={{ 
                borderColor: accent,
                borderWidth: '0.8px',
                borderStyle: 'solid',
                backgroundColor: '#ffffff',
                padding: `${2 * fontScale}px ${4 * fontScale}px`,
                borderRadius: '3px',
                margin: '1px 0px',
                display: 'flex',
                flexDirection: 'column',
                gap: `${1.5 * fontScale}px`,
                textAlign: 'right'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: `${4 * fontScale}px` }} dir="rtl">
                <span style={{ minWidth: `${40 * fontScale}px`, color: '#000000', fontWeight: '900', fontSize: `${10 * fontScale}px` }}>المستلم:</span>
                <span style={{ color: '#000000', fontWeight: '950', fontSize: `${11 * fontScale}px` }}>{recName}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: `${4 * fontScale}px` }} dir="rtl">
                <span style={{ minWidth: `${40 * fontScale}px`, color: '#000000', fontWeight: '905', fontSize: `${9 * fontScale}px` }}>جوال:</span>
                <span style={{ color: '#000000', fontWeight: '950', fontSize: `${11 * fontScale}px`, direction: 'ltr' }} className="font-mono">{recPhone}</span>
              </div>
            </div>

            <div style={{ margin: `${4 * fontScale}px 0`, textAlign: 'right', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: `${8 * fontScale}px`, fontWeight: 900 }} className="text-slate-700">وصف محتوى الشحنة:</span>
              <span style={{ ...nameStyle, fontSize: `${settings.nameFontSize * 0.9 * fontScale}px`, textAlign: 'right', WebkitLineClamp: settings.nameLines || 6, whiteSpace: 'normal', display: '-webkit-box' }} className="font-bold text-slate-900 break-words">
                {shipContent}
              </span>
              {product.weight && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: `${8.5 * fontScale}px`, fontWeight: '900', color: '#000000', marginTop: '2px' }}>
                  <Scale style={{ width: `${10 * fontScale}px`, height: `${10 * fontScale}px`, strokeWidth: 2.5 }} />
                  <span>الوزن: {product.weight.toLowerCase().endsWith('g') || product.weight.includes('جم') || product.weight.includes('جرام') ? product.weight : `${product.weight} جم`}</span>
                </div>
              )}
            </div>

            {renderDates()}

            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', gap: `${4 * fontScale}px`, width: '100%', borderTop: '0.5px dashed #cbd5e1', paddingTop: `${4 * fontScale}px`, marginTop: 'auto' }}>
              {showBarcode && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', maxWidth: '65%' }}>
                  <BarcodeRenderer
                    value={product.barcode || '00000000'}
                    width={settings.barcodeWidth * 0.9 * fontScale}
                    height={settings.barcodeHeight * 0.8 * fontScale}
                    numberFontSize={settings.numberFontSize * 0.8 * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                    lineColor="#000000"
                    showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                  />
                </div>
              )}
              {showPrice && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, paddingLeft: `${4 * fontScale}px`, color: '#000000' }}>
                  <span style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: '900', color: '#000000', display: 'block' }}>قيمة الـ COD:</span>
                  <div style={{ ...priceStyle, fontSize: `${settings.priceFontSize * 0.82 * fontScale}px`, color: '#000000', fontWeight: '900', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1px' }} className="font-mono">
                    <span>{safePrice}</span>
                    {renderCurrency('0.65em', '#000000')}
                  </div>
                  {showTaxInclusive && (
                    <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.38, 5.5)}px`, fontWeight: 900, color: '#000000', marginTop: '-1px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                      شامل الضريبة
                    </span>
                  )}
                </div>
              )}
            {renderShipmentContent()}
            </div>
          </div>
        );
      }

      case 'compact':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'center', flex: '1' }}>
            <div style={nameStyle} className="mt-0.5" title={displayName}>
              {displayName}
            </div>
            {renderDescription()}
            {renderCalories()}
            {renderDates()}
            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '4px 0' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}
            {showPrice && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ ...priceStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px', justifyContent: 'center' }} className="font-mono">
                  <span>{safePrice}</span>
                  {renderCurrency('0.72em')}
                </div>
                {showTaxInclusive && (
                  <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, marginTop: '-1.5px', display: 'block', whiteSpace: 'nowrap', textAlign: 'center' }} className="font-sans font-black">
                    شامل الضريبة
                  </span>
                )}
              </div>
            )}
            {renderShipmentContent()}
          </div>
        );

      case 'price-top':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'center', flex: '1' }}>
            {showPrice && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div 
                  style={{ 
                    ...priceStyle, 
                    fontSize: `${settings.priceFontSize * 1.15}px`,
                    borderBottom: showTaxInclusive ? 'none' : `1px dashed ${accent}33`,
                    paddingBottom: showTaxInclusive ? '0px' : '2px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px'
                  }} 
                  className="font-mono font-black"
                >
                  <span>{safePrice}</span>
                  {renderCurrency('0.65em')}
                </div>
                {showTaxInclusive && (
                  <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, borderBottom: `1px dashed ${accent}80`, paddingBottom: '2px', width: '100%', textAlign: 'center', marginTop: '-1px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                    شامل الضريبة
                  </span>
                )}
              </div>
            )}
            {renderShipmentContent()}
            <div style={{ ...nameStyle, fontSize: `${settings.nameFontSize * 0.95}px` }} className="my-1" title={displayName}>
              {displayName}
            </div>
            {renderDescription()}
            {renderCalories()}
            {renderDates()}
            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}
          </div>
        );

      case 'horizontal-split':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'center', flex: '1' }}>
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '0.5px dashed #cbd5e1', paddingBottom: '4px', marginBottom: '4px' }}>
              {showBrand && (
                <div style={{ ...companyStyle, width: 'auto', textAlign: 'right', marginBottom: 0 }}>
                  {fallbackCompanyName}
                </div>
              )}
              {showPrice && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div 
                    style={{ 
                      ...priceStyle, 
                      width: 'auto', 
                      textAlign: 'left', 
                      marginTop: 0,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '2px'
                    }} 
                    className="font-mono"
                  >
                    <span>{safePrice}</span>
                    {renderCurrency('0.75em')}
                  </div>
                  {showTaxInclusive && (
                    <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, marginTop: '-1.5px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                      شامل الضريبة
                    </span>
                  )}
                </div>
              )}
            {renderShipmentContent()}
            </div>
            
            <div style={nameStyle} className="my-0.5" title={displayName}>
              {displayName}
            </div>
            {renderDescription()}
            {renderCalories()}
            {renderDates()}

            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}
          </div>
        );

      case 'sides':
        return (
          <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px', flex: '1' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'right', height: '100%', padding: '2px 0', flex: '1', minWidth: '50%' }}>
              {showBrand && (
                <div style={{ ...companyStyle, textAlign: 'right', fontSize: `${settings.companyFontSize * 0.9}px`, width: '100%' }} className="truncate">
                  {fallbackCompanyName}
                </div>
              )}
              <div style={{ ...nameStyle, textAlign: 'right', WebkitLineClamp: 2 }} className="my-1 flex-1">
                {displayName}
              </div>
              {renderDescription()}
            {renderCalories()}
              {renderDates()}
              {showPrice && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div 
                    style={{ 
                      ...priceStyle, 
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '2px'
                    }} 
                    className="font-mono"
                  >
                    <span>{safePrice}</span>
                    {renderCurrency('0.7em')}
                  </div>
                  {showTaxInclusive && (
                    <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, marginTop: '-1.5px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                      شامل الضريبة
                    </span>
                  )}
                </div>
              )}
            {renderShipmentContent()}
            </div>

            {showBarcode && (
              <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #cbd5e1', paddingRight: '4px' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * 0.85 * fontScale}
                  height={settings.barcodeHeight * 1.3 * fontScale}
                  numberFontSize={settings.numberFontSize * 0.9 * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}
          </div>
        );

      case 'calories':
        return (
          <React.Fragment>
            {showBrand && (
              <div style={companyStyle}>
                {fallbackCompanyName}
              </div>
            )}

            <div style={{ ...nameStyle, marginBottom: (product.calories || product.weight) ? '0' : '2px' }} className="mt-0.5" title={displayName}>
              {displayName}
            </div>
            {renderDescription()}
            {renderCalories()}
            


            {renderDates()}

            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}

            {showPrice && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ ...priceStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px', justifyContent: 'center' }} className="font-mono">
                  <span>{safePrice}</span>
                  {renderCurrency('0.8em')}
                </div>
                {showTaxInclusive && (
                  <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, marginTop: '-1.5px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                    شامل الضريبة
                  </span>
                )}
              </div>
            )}
            {renderShipmentContent()}
          </React.Fragment>
        );

            case 'nutrition_advanced':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: 'space-between', padding: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              {showBrand ? (
                <div style={{...companyStyle, textAlign: 'right', flex: 1, whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{fallbackCompanyName}</div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
              {storeLogoUrl !== '/icon.png' && storeLogoUrl && (
                <div className="w-[35mm] h-[12mm] overflow-hidden relative flex items-center justify-center bg-white ml-1 shrink-0">
                  <img 
                    src={storeLogoUrl} 
                    alt="Logo" 
                    className="absolute max-w-none grayscale contrast-200" 
                    style={{ 
                      width: `${settings.logoSize || 200}%`,
                      transform: `translate(${settings.logoOffsetX || 0}px, ${settings.logoOffsetY || 0}px)`
                    }}
                  />
                </div>
              )}
            </div>
            
            <div style={{...nameStyle, textAlign: 'center', margin: '4px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {displayName}
            </div>
            {renderDescription()}
            {renderDates()}
            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}
            {showPrice && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '2px' }}>
                <div style={{ ...priceStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px', justifyContent: 'center' }} className="font-mono">
                  <span>{safePrice}</span>
                  {renderCurrency('0.8em')}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '4px', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold' }}>السعرات</span>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', fontFamily: 'monospace' }}>{product.calories || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold' }}>البروتين</span>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', fontFamily: 'monospace' }}>{product.protein ? (product.protein.toLowerCase().endsWith('g') ? product.protein : product.protein + 'g') : '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold' }}>الكارب</span>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', fontFamily: 'monospace' }}>{product.carbs ? (product.carbs.toLowerCase().endsWith('g') ? product.carbs : product.carbs + 'g') : '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold' }}>الدهون</span>
                <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', fontFamily: 'monospace' }}>{product.fats ? (product.fats.toLowerCase().endsWith('g') ? product.fats : product.fats + 'g') : '-'}</span>
              </div>
              {product.weight && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <Scale style={{ width: `${(settings.caloriesFontSize || 8) * fontScale * 0.9}px`, height: `${(settings.caloriesFontSize || 8) * fontScale * 0.9}px` }} />
                    <span>الوزن</span>
                  </span>
                  <span style={{ fontSize: `${(settings.caloriesFontSize || 8) * fontScale}px`, fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {product.weight ? (product.weight.toLowerCase().endsWith('g') || product.weight.includes('جم') ? product.weight : `${product.weight} جم`) : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'standard':
      default:
        return (
          <React.Fragment>
            {showBrand && (
              <div style={companyStyle}>
                {fallbackCompanyName}
              </div>
            )}

            <div style={nameStyle} className="my-0.5" title={displayName}>
              {displayName}
            </div>
            {renderDescription()}
            {renderCalories()}

            {renderDates()}

            {showBarcode && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                <BarcodeRenderer
                  value={product.barcode || '00000000'}
                  width={settings.barcodeWidth * fontScale}
                  height={settings.barcodeHeight * fontScale}
                  numberFontSize={settings.numberFontSize * fontScale}
                  fontWeight={settings.numberFontWeight || "700"}
                  lineColor="#000000"
                  showCode={settings.showCode !== false}
                  fontFamily={fontFamily}
                />
              </div>
            )}

            {showPrice && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ ...priceStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px', justifyContent: 'center' }} className="font-mono">
                  <span>{safePrice}</span>
                  {renderCurrency('0.8em')}
                </div>
                {showTaxInclusive && (
                  <span style={{ fontSize: `${Math.max(settings.priceFontSize * 0.45, 6)}px`, fontWeight: 900, color: '#000000', opacity: 1, marginTop: '-1.5px', display: 'block', whiteSpace: 'nowrap' }} className="font-sans font-black">
                    شامل الضريبة
                  </span>
                )}
              </div>
            )}
            {renderShipmentContent()}
          </React.Fragment>
        );
    }
  };

  return (
    <div style={labelStyle} className="select-none shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {renderContent()}
    </div>
  );
});

export default LabelCard;