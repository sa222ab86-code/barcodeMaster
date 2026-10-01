// Helper: Normalize Arabic search terms
export const normalizeArabic = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "")
    .toLowerCase();
};

// Helper: Arabic number to words translation (Tafqeet)
export const convertNumberToArabicWords = (num: number): string => {
  if (!num || num <= 0) return "صفر ريال سعودي لا غير";
  const t = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const r = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const n = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  
  const s = (h: number): string => {
    let g = "";
    const v = Math.floor(h / 100);
    const x = Math.floor((h % 100) / 10);
    const y = h % 10;
    if (v > 0) g += n[v];
    if (x > 0 || y > 0) {
      if (g !== "") g += " و ";
      if (x === 0) g += t[y];
      else if (x === 1) g += t[10 + y];
      else if (y > 0) g += t[y] + " و " + r[x];
      else g += r[x];
    }
    return g;
  };
  
  const c = (h: number): string => h === 0 ? "" : h === 1 ? "ألف" : h === 2 ? "ألفان" : h >= 3 && h <= 10 ? s(h) + " آلاف" : s(h) + " ألف";
  const f = (h: number): string => h === 0 ? "" : h === 1 ? "مليون" : h === 2 ? "مليونان" : h >= 3 && h <= 10 ? s(h) + " ملايين" : s(h) + " مليون";
  
  const d = Math.floor(num);
  const i = Math.round((num - d) * 100);
  let l = "";
  
  if (d > 0) {
    const g = Math.floor((d % 1e9) / 1e6);
    const v = Math.floor((d % 1e6) / 1e3);
    const x = d % 1e3;
    const y = [];
    if (g > 0) y.push(f(g));
    if (v > 0) y.push(c(v));
    if (x > 0) y.push(s(x));
    l = y.join(" و ");
  } else {
    l = "صفر";
  }
  
  let p = "فقط " + l;
  if (d === 1) p += " ريال سعودي واحد";
  else if (d === 2) p += " ريالان سعوديان";
  else if (d >= 3 && d <= 10) p += " ريالات سعودية";
  else p += " ريال سعودي";
  
  if (i > 0) {
    p += " و " + s(i) + (i === 1 ? " هللة واحدة" : i === 2 ? " هللتان" : " هللة");
  }
  return p + " لا غير";
};

// Embed Riyal icon directly for dynamic templates
export const riyalSvgRaw = (color = '#4c3cc2', size = '11px') => `
  <svg id="Layer_1" data-name="Layer 1" viewBox="0 0 1124.14 1256.39" width="${size}" height="${size}" fill="${color}" style="display: inline-block; vertical-align: middle; margin: 0 1px;">
    <defs>
      <style>
        .cls-r-${color.replace('#', '')} {
          fill: ${color};
        }
      </style>
    </defs>
    <path class="cls-r-${color.replace('#', '')}" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
    <path class="cls-r-${color.replace('#', '')}" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
  </svg>
`;

export const companyLogoSvg = `
  <svg id="Layer_1" data-name="Layer 1" viewBox="0 0 1124.14 1256.39" style="width: 44px; height: 44px; display: inline-block;">
    <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" fill="#4c3cc2"/>
    <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" fill="#ff9900"/>
  </svg>
`;

export const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateArabic = (dStr: string) => {
  if (!dStr) return "";
  try {
    const parts = dStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
  } catch {
    return dStr;
  }
};
