import React, { useEffect, useRef } from 'react';
import { loadJsBarcode } from '@/utils/jsBarcode';

export default function Barcode({
  value,
  height = 40,
  displayValue = true,
  lineColor = '#0f172a',
  className = '',
}) {
  const svgRef = useRef(null);
  const code = String(value || '').trim() || 'AMZ';

  useEffect(() => {
    let cancelled = false;
    loadJsBarcode()
      .then((JsBarcode) => {
        if (cancelled || !svgRef.current) return;
        try {
          JsBarcode(svgRef.current, code, {
            format: 'CODE128',
            width: 1.25,
            height,
            displayValue,
            fontSize: 11,
            margin: 0,
            background: 'transparent',
            lineColor,
          });
        } catch {
          /* invalid charset — leave empty svg */
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code, height, displayValue, lineColor]);

  return <svg ref={svgRef} className={className} role="img" aria-label={`Barcode ${code}`} />;
}
