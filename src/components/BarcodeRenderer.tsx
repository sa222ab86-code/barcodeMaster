import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width: number;
  height: number;
  numberFontSize: number;
  lineColor?: string;
  showCode?: boolean;
  fontFamily?: string;
  fontWeight?: string;
}

export default function BarcodeRenderer({ value, width, height, numberFontSize, lineColor = '#000000', showCode = true, fontFamily = 'monospace', fontWeight = 'bold' }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      // Clear previous barcode content to prevent visual glitches on redraw
      svgRef.current.innerHTML = '';
      
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: false, // Custom styled text underneath is handled manually below
          margin: 0,
          background: "transparent",
          lineColor: lineColor,
        });
      } catch (error) {
        console.error("Barcode rendering error:", error);
      }
    }
  }, [value, width, height, lineColor]); // stable primitives safely tracked in dependencies

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', overflow: 'hidden' }}
    >
      <svg ref={svgRef} style={{ maxWidth: '100%', maxHeight: `${height * 1.5}px`, display: 'block', margin: '0 auto' }} />
      {showCode && (
        <div 
          className="text-center"
          style={{ fontFamily: fontFamily, fontWeight: fontWeight, fontSize: `${numberFontSize}px`, color: lineColor, textAlign: 'center', width: '100%', display: 'block', marginTop: '2px', lineHeight: '1.2' }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
