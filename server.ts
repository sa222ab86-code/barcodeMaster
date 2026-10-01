import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import initSqlJs from "sql.js";

// 1️⃣ دالة تنظيف النصوص لضمان الحفاظ على الأصفار البادئة
const cleanStringCode = (val: any): string => {
  if (val === undefined || val === null || val === "null" || val === "undefined") return "";
  return String(val).trim();
};

// 2️⃣ دالة التطهير العميق لبيانات الـ JSON القادمة من دفترة أو الأستاذ
const sanitizeCodesDeep = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeCodesDeep(item));
  }
  
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if ((key === 'code' || key === 'sku' || key === 'barcode' || key === 'item_code') && obj[key] !== undefined && obj[key] !== null) {
        const stringVal = cleanStringCode(obj[key]);
        newObj[key] = stringVal;
        // حقل موازي مؤمن تماماً ضد أي تحويل رقمي خفي بالفرونت إند
        newObj[`${key}_str`] = stringVal; 
      } else {
        newObj[key] = sanitizeCodesDeep(obj[key]);
      }
    }
  }
  
  // دمج ومعالجة كائن دفترة الذكي وتوحيد الباركود النصي
  if (newObj.Product) {
    const p = newObj.Product;
    let rawBarcode = p.barcode_str || p.barcode || '';
    let rawCode = p.code_str || p.code || '';
    let rawSku = p.sku_str || p.sku || '';
    
    // نقوم بتأمين ومحاذاة الباركود والكود والـ SKU لدفترة إذا كانت قيم رقمية قصيرة (أقل من 6 أرقام) بالأصفار البادئة
    if (/^\d+$/.test(rawBarcode) && rawBarcode.length > 0 && rawBarcode.length < 6) {
      rawBarcode = rawBarcode.padStart(6, '0');
    }
    if (/^\d+$/.test(rawCode) && rawCode.length > 0 && rawCode.length < 6) {
      rawCode = rawCode.padStart(6, '0');
    }
    if (/^\d+$/.test(rawSku) && rawSku.length > 0 && rawSku.length < 6) {
      rawSku = rawSku.padStart(6, '0');
    }

    let resolved = '';
    if (rawBarcode && rawBarcode !== "null") resolved = rawBarcode;
    else if (rawCode && rawCode !== "null") resolved = rawCode;
    else if (rawSku && rawSku !== "null") resolved = rawSku;
    else {
      const generatedId = cleanStringCode(p.id || newObj.id || '');
      resolved = generatedId;
    }

    // إذا انتهى المطاف بـ resolved كقيمة رقمية قصيرة، نضمن حشوها بالأصفار
    if (/^\d+$/.test(resolved) && resolved.length > 0 && resolved.length < 6) {
      resolved = resolved.padStart(6, '0');
    }

    newObj.barcode = resolved;
    newObj.barcode_str = resolved;
    p.barcode = resolved;
    p.barcode_str = resolved;

    newObj.code = rawCode;
    newObj.code_str = rawCode;
    p.code = rawCode;
    p.code_str = rawCode;

    newObj.sku = rawSku;
    newObj.sku_str = rawSku;
    p.sku = rawSku;
    p.sku_str = rawSku;
  }
  
  return newObj;
};

// Safe helper to parse float securely without breaking on NaN values
const safeParseFloat = (val: any): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 3️⃣ بدء تشغيل خادم Express
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization, Accept, X-Branch-Id, X-Locale, X-API-Version, token");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  let webhookProducts: any[] = [];

  // Helper to recursively find array path and value in JSON response
  const findArrayPath = (obj: any, depth = 0): { path: string[]; value: any[] } | null => {
    if (depth > 4 || !obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) return { path: [], value: obj };
    
    const commonKeys = ['data', 'products', 'items', 'records', 'items_list', 'goods', 'rows', 'Product'];
    // 1. Direct key match (Array)
    for (const key of commonKeys) {
      if (Array.isArray(obj[key])) return { path: [key], value: obj[key] };
    }
    // 2. Direct key match (Nested Object)
    for (const key of commonKeys) {
      if (obj[key] && typeof obj[key] === 'object') {
        const res = findArrayPath(obj[key], depth + 1);
        if (res) return { path: [key, ...res.path], value: res.value };
      }
    }
    // 3. Fallback: check all keys
    for (const key in obj) {
      if (Array.isArray(obj[key])) return { path: [key], value: obj[key] };
      if (obj[key] && typeof obj[key] === 'object') {
        const res = findArrayPath(obj[key], depth + 1);
        if (res) return { path: [key, ...res.path], value: res.value };
      }
    }
    return null;
  };

  // API endpoint for SQLite direct access
  app.post("/api/sqlite", async (req, res) => {
    try {
      const { dbPath, query } = req.body;
      if (!dbPath || !query) {
        return res.status(400).json({ success: false, error: "Missing dbPath or query." });
      }
      
      const filebuffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      const db = new SQL.Database(filebuffer);
      
      const result = db.exec(query);
      let rows: any[] = [];
      
      if (result.length > 0) {
        const columns = result[0].columns;
        for (const val of result[0].values) {
          let row: any = {};
          columns.forEach((col, idx) => {
            row[col] = val[idx];
          });
          rows.push(row);
        }
      }
      db.close();
      res.json({ success: true, rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API proxy endpoint for Cloud ERP systems (Daftra / Al-Ostad)
  app.post("/api/proxy-erp", async (req, res) => {
    const { provider, subdomain, apiKey, customUrl, branchId } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: "برجاء تحديد نوع النظام السحابي (دفترة أو الأستاذ)." });
    }

    const fetchWithTimeout = async (url: string, options: any, timeoutMs = 7500) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resObj = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return resObj;
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      let headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };

      if (provider === "daftra") {
        const { authType, oauthClientId, oauthClientSecret, oauthUsername, oauthPassword } = req.body;
        if (!subdomain) {
          return res.status(400).json({ success: false, error: "حساب الشركة الفرعي (Subdomain) مطلوب لنظام دفترة." });
        }
        if (authType !== "oauth2" && !apiKey) {
          return res.status(400).json({ success: false, error: "مفتاح واجهة البرمجة (API Key) مطلوب للربط مع دفترة." });
        }
        
        let inputStr = subdomain.trim().replace(/\/+$/, "");
        let protocol = "https";
        let host = "";
        let fullInputUrl = "";

        if (inputStr.includes("://")) {
          fullInputUrl = inputStr;
          try {
            const parsedUrl = new URL(inputStr);
            host = parsedUrl.host;
            protocol = parsedUrl.protocol.replace(":", "");
          } catch (e) {
            const match = inputStr.match(/^(https?):\/\/([^/]+)/i);
            if (match) {
              protocol = match[1];
              host = match[2];
            } else {
              host = inputStr.replace(/^https?:\/\//i, "").split('/')[0];
            }
          }
        } else {
          host = inputStr;
          if (!host.includes(".")) {
            host = `${host}.daftra.com`;
          }
        }

        host = host.split('/')[0];
        const baseUrl = `${protocol}://${host}`;
        let trimmedKey = (apiKey || "").trim();

        if (authType === "oauth2") {
          if (!oauthUsername || !oauthPassword) {
            return res.status(400).json({ 
              success: false, 
              error: "البريد الإلكتروني وكلمة المرور مطلوبين لمصادقة OAuth2 ونظام دفترة." 
            });
          }

          const tokenUrl = `${baseUrl}/v2/oauth/token`;
          try {
            const formData = new URLSearchParams();
            formData.append('client_id', oauthClientId || '1');
            formData.append('client_secret', oauthClientSecret || 'jCfy6cMh1X6NTxR3OWLuvEFa0si5uZKr05UeoAEs');
            formData.append('grant_type', 'password');
            formData.append('username', oauthUsername);
            formData.append('password', oauthPassword);

            const tokenRes = await fetchWithTimeout(tokenUrl, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: formData.toString()
            }, 6000);

            if (!tokenRes.ok) {
              return res.status(400).json({
                success: false,
                error: `فشلت عملية توليد رمز الوصول لـ Daftra. تأكد من البيانات. (كود: ${tokenRes.status})`
              });
            }

            const tokenData = await tokenRes.json();
            if (tokenData && tokenData.access_token) {
              trimmedKey = `Bearer ${tokenData.access_token}`;
            } else {
              return res.status(400).json({ success: false, error: "لم يرجع رد صالح لـ OAuth2 Token من دفترة." });
            }
          } catch (tokenErr: any) {
            return res.status(500).json({ success: false, error: `فشل الاتصال بخدمة OAuth2 لدفترة: ${tokenErr.message}` });
          }
        }

        headers["API-KEY"] = trimmedKey;
        headers["apikey"] = trimmedKey;
        headers["X-API-KEY"] = trimmedKey;

        const daftraCandidates: string[] = [];
        if (fullInputUrl) {
          daftraCandidates.push(fullInputUrl);
          daftraCandidates.push(fullInputUrl.endsWith(".json") ? fullInputUrl.slice(0, -5) : `${fullInputUrl}.json`);
        }

        const standardPaths = [
          "/v2/api/products.json", "/v2/api/products",
          "/api2/products.json", "/api2/products"
        ];

        for (const p of standardPaths) {
          const candidate = `${baseUrl}${p}`;
          if (!daftraCandidates.includes(candidate)) daftraCandidates.push(candidate);
        }

        let lastStatus = 401;
        let lastErrorText = "";
        let finalData: any = null;
        let successCandidate = "";
        let successStrat: any = null;

        for (let candidate of daftraCandidates) {
          try {
            // Strip any existing pagination parameters provided by the user in the URL
            candidate = candidate.replace(/([?&])(limit|page|per_page|offset)=\d+/g, "");
            candidate = candidate.replace(/&&+/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "");

            const separator = candidate.includes("?") ? "&" : "?";
            const urlWithParam = `${candidate}${separator}per_page=100&limit=100&page=1&api_key=${encodeURIComponent(trimmedKey)}`;
            const urlWithoutParam = `${candidate}${separator}per_page=100&limit=100&page=1`;

            const strategies = [];
            if (authType === "oauth2") {
              strategies.push({ name: "OAuth2 Bearer Auth", url: urlWithParam, headers: { ...headers, "Authorization": trimmedKey.startsWith("Bearer ") ? trimmedKey : `Bearer ${trimmedKey}` } });
              strategies.push({ name: "OAuth2 Bearer Auth (No URL Param)", url: urlWithoutParam, headers: { ...headers, "Authorization": trimmedKey.startsWith("Bearer ") ? trimmedKey : `Bearer ${trimmedKey}` } });
            } else {
              strategies.push({ name: "Header apikey only (No URL Param)", url: urlWithoutParam, headers: { "Accept": "application/json", "apikey": trimmedKey } });
              strategies.push({ name: "Header API-KEY only (No URL Param)", url: urlWithoutParam, headers: { "Accept": "application/json", "API-KEY": trimmedKey } });
              strategies.push({ name: "Combo API-KEY & Bearer", url: urlWithParam, headers: { ...headers, "Authorization": `Bearer ${trimmedKey}` } });
              strategies.push({ name: "Combo API-KEY & Bearer (No URL Param)", url: urlWithoutParam, headers: { ...headers, "Authorization": `Bearer ${trimmedKey}` } });
              strategies.push({ name: "Custom Headers Only", url: urlWithParam, headers: { ...headers } });
              strategies.push({ name: "Custom Headers Only (No URL Param)", url: urlWithoutParam, headers: { ...headers } });
              strategies.push({ name: "URL Only", url: urlWithParam, headers: { "Accept": "application/json" } });
            }

            let success = false;
            for (const strat of strategies) {
              try {
                const tempRes = await fetchWithTimeout(strat.url, { method: "GET", headers: strat.headers }, 8000);
                if (tempRes.ok) {
                  const text = await tempRes.text();
                  finalData = JSON.parse(text);
                  successCandidate = candidate;
                  successStrat = strat;
                  success = true;
                  break;
                } else {
                  lastStatus = tempRes.status;
                }
              } catch (stratErr) {}
            }
            if (success) break;
          } catch (e: any) {
            lastErrorText = e.message || String(e);
          }
        }

        if (finalData) {
          const arrayInfo = findArrayPath(finalData);
          if (arrayInfo) {
            let accumulatedList = [...arrayInfo.value];
            const arrayPath = arrayInfo.path;
            const pageSize = arrayInfo.value.length;

            if (pageSize >= 20) {
              let nextPage = 2;
              let hasMore = true;
              const limitValue = 100;

              while (hasMore && nextPage <= 50) {
                try {
                  await sleep(600); // تأخير لتفادي حظر الخادم
                  const separator = successCandidate.includes("?") ? "&" : "?";
                  
                  let nextPageUrl = `${successCandidate}${separator}per_page=${limitValue}&limit=${limitValue}&page=${nextPage}`;
                  if (successStrat.url && successStrat.url.includes("api_key=")) {
                    nextPageUrl += `&api_key=${encodeURIComponent(trimmedKey)}`;
                  }

                  const pageRes = await fetchWithTimeout(nextPageUrl, { method: "GET", headers: successStrat.headers }, 20000);
                  
                  if (pageRes.ok) {
                    const pageText = await pageRes.text();
                    const pageJson = JSON.parse(pageText);
                    const pageArrayInfo = findArrayPath(pageJson);

                    if (pageArrayInfo && pageArrayInfo.value && pageArrayInfo.value.length > 0) {
                      accumulatedList.push(...pageArrayInfo.value);

                      if (pageArrayInfo.value.length < limitValue) {
                        hasMore = false;
                      } else {
                        nextPage++;
                      }
                    } else {
                      hasMore = false;
                    }
                  } else {
                    console.warn(`[Daftra Pagination] فشل جلب الصفحة ${nextPage}. الحالة: ${pageRes.status}`);
                    hasMore = false;
                  }
                } catch (pageErr: any) {
                  console.error(`[Daftra Pagination Error] انقطع الاتصال في الصفحة ${nextPage}:`, pageErr.message);
                  hasMore = false;
                }
              }
            }

            if (arrayPath.length === 0) {
              finalData = accumulatedList;
            } else if (arrayPath.length === 1) {
              finalData[arrayPath[0]] = accumulatedList;
            } else if (arrayPath.length === 2) {
              finalData[arrayPath[0]][arrayPath[1]] = accumulatedList;
            } else if (arrayPath.length === 3) {
              finalData[arrayPath[0]][arrayPath[1]][arrayPath[2]] = accumulatedList;
            } else if (arrayPath.length === 4) {
              finalData[arrayPath[0]][arrayPath[1]][arrayPath[2]][arrayPath[3]] = accumulatedList;
            }
          }

          const sanitizedData = sanitizeCodesDeep(finalData);
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          return res.send(JSON.stringify({ success: true, data: sanitizedData, winningCandidate: successCandidate }));
        }

        if (lastStatus === 401) {
          return res.status(401).json({ success: false, error: "🔑 عذراً، فشلت عملية المصادقة (401 Unauthorized) مع خادم دفترة. تحقق من صلاحيات المفتاح وصلاحيات المستخدم." });
        }
        throw new Error(`استجابة غير صالحة من دفترة (الحالة: ${lastStatus})`);

      } else if (provider === "ostad") {
        if (!customUrl) return res.status(400).json({ success: false, error: "رابط معرّف الـ API الخاص بنظام الأستاذ مطلوب." });
        const targetUrl = customUrl.trim();
        const trimmedKey = apiKey ? apiKey.trim() : "";

        if (trimmedKey) {
          headers["API-KEY"] = trimmedKey;
          headers["token"] = trimmedKey;
          headers["X-API-KEY"] = trimmedKey;
          headers["apikey"] = trimmedKey;
          headers["api-key"] = trimmedKey;
          headers["X-Api-Key"] = trimmedKey;
          headers["X-Auth-Token"] = trimmedKey;
          headers["X-Access-Token"] = trimmedKey;
          headers["access-token"] = trimmedKey;
          headers["access_token"] = trimmedKey;
          headers["auth-token"] = trimmedKey;
          headers["auth_token"] = trimmedKey;
          headers["API_KEY"] = trimmedKey;
        }

        const activeBranchId = (branchId && branchId.trim()) ? branchId.trim() : "1";
        headers["X-Branch-Id"] = activeBranchId;
        headers["X-Branch-ID"] = activeBranchId;
        headers["branch-id"] = activeBranchId;
        headers["branch_id"] = activeBranchId;
        headers["X-Branch"] = activeBranchId;
        headers["branch"] = activeBranchId;
        headers["X-Locale"] = "ar";
        headers["X-API-Version"] = "v1";

        const candidates: string[] = [];
        const cleanedUrl = targetUrl.replace(/\/+$/, "");
        
        if (cleanedUrl.endsWith("/b/api")) {
          candidates.push(`${cleanedUrl}/items`, `${cleanedUrl}/products`, `${cleanedUrl}/v1/items`, `${cleanedUrl}/v1/products`);
        } else {
          candidates.push(targetUrl);
          if (!cleanedUrl.endsWith("/items") && !cleanedUrl.endsWith("/products") && !cleanedUrl.endsWith("/v1/items") && !cleanedUrl.endsWith("/v1/products")) {
            candidates.push(`${cleanedUrl}/items`, `${cleanedUrl}/products`, `${cleanedUrl}/v1/items`, `${cleanedUrl}/v1/products`);
          } else {
            const baseOfCustom = cleanedUrl.replace(/\/(items|products|v1\/items|v1\/products)$/, "");
            candidates.push(`${baseOfCustom}/items`, `${baseOfCustom}/products`, `${baseOfCustom}/v1/items`, `${baseOfCustom}/v1/products`);
          }
        }

        // Ensure candidate array contains only unique values
        const uniqueCandidates = Array.from(new Set(candidates));

        let lastStatus = 404;
        let lastErrorText = "";
        let finalData: any = null;
        let successCandidate = "";

        for (const candidate of uniqueCandidates) {
          try {
            const separator = candidate.includes("?") ? "&" : "?";
            const urlWithParam = trimmedKey ? `${candidate}${separator}api_key=${encodeURIComponent(trimmedKey)}&token=${encodeURIComponent(trimmedKey)}&auth_token=${encodeURIComponent(trimmedKey)}&access_token=${encodeURIComponent(trimmedKey)}&key=${encodeURIComponent(trimmedKey)}&apiKey=${encodeURIComponent(trimmedKey)}` : candidate;

            const headersWithBearer = { ...headers };
            if (trimmedKey) headersWithBearer["Authorization"] = trimmedKey.startsWith("Bearer ") ? trimmedKey : `Bearer ${trimmedKey}`;

            let tempRes = await fetchWithTimeout(urlWithParam, { method: "GET", headers: headersWithBearer }, 8000);

            if (tempRes.status === 401 && trimmedKey && !trimmedKey.startsWith("Bearer ")) {
              const headersWithRaw = { ...headers, "Authorization": trimmedKey };
              tempRes = await fetchWithTimeout(urlWithParam, { method: "GET", headers: headersWithRaw }, 8000);
            }

            if (tempRes.ok) {
              finalData = await tempRes.json();
              successCandidate = candidate;
              break;
            } else {
              lastStatus = tempRes.status;
              const errorBodyText = await tempRes.text().catch(() => "");
              lastErrorText = errorBodyText || `رمز الحالة: ${tempRes.status}`;
              
              // Fail-fast on authentication failure: do not try further candidates as the credentials are bad!
              if (tempRes.status === 401 || tempRes.status === 403) {
                break;
              }
            }
          } catch (e: any) {
            lastErrorText = e.message || String(e);
          }
        }

        if (finalData) {
          const arrayInfo = findArrayPath(finalData);
          if (arrayInfo && arrayInfo.value.length >= 20) {
            let accumulatedList = [...arrayInfo.value];
            const arrayPath = arrayInfo.path;
            
            let nextPage = 2;
            let hasMore = true;
            const limitValue = 100;
            
            while (hasMore && nextPage <= 50) {
              try {
                await sleep(600); // تأخير لتفادي حظر الخادم
                const separator = successCandidate.includes("?") ? "&" : "?";
                const nextPageUrl = `${successCandidate}${separator}page=${nextPage}&limit=${limitValue}`;
                
                const headersWithBearer = { ...headers };
                if (trimmedKey) headersWithBearer["Authorization"] = trimmedKey.startsWith("Bearer ") ? trimmedKey : `Bearer ${trimmedKey}`;

                const pageRes = await fetchWithTimeout(nextPageUrl, { method: "GET", headers: headersWithBearer }, 20000);
                
                if (pageRes.ok) {
                  const pageJson = await pageRes.json();
                  const pageArrayInfo = findArrayPath(pageJson);
                  
                  if (pageArrayInfo && pageArrayInfo.value && pageArrayInfo.value.length > 0) {
                    accumulatedList.push(...pageArrayInfo.value);
                    if (pageArrayInfo.value.length < limitValue) {
                      hasMore = false; // وصلنا لآخر صفحة
                    } else {
                      nextPage++;
                    }
                  } else {
                    hasMore = false;
                  }
                } else {
                  console.warn(`[Ostad Pagination] توقف جلب الصفحة ${nextPage}. الحالة: ${pageRes.status}`);
                  hasMore = false;
                }
              } catch (pageErr: any) {
                console.error(`[Ostad Pagination Error] خطأ في الصفحة ${nextPage}:`, pageErr.message);
                hasMore = false;
              }
            }
            
            // إعادة دمج جميع الأصناف في الكائن الأصلي
            if (arrayPath.length === 0) {
              finalData = accumulatedList;
            } else if (arrayPath.length === 1) {
              finalData[arrayPath[0]] = accumulatedList;
            } else if (arrayPath.length === 2) {
              finalData[arrayPath[0]][arrayPath[1]] = accumulatedList;
            }
          }

          const sanitizedData = sanitizeCodesDeep(finalData);
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          return res.send(JSON.stringify({ success: true, data: sanitizedData, winningCandidate: successCandidate }));
        }

        return res.status(lastStatus === 401 ? 401 : 500).json({
          success: false,
          error: lastStatus === 401 
            ? `🔑 فشلت عملية المصادقة (401 Unauthorized) مع نظام الأستاذ السحابي. يرجى مراجعة كود الترخيص.` 
            : `تعذر جلب البيانات من نظام الأستاذ السحابي (الحالة: ${lastStatus}). التفاصيل: ${lastErrorText.substring(0, 160)}`
        });
      }

    } catch (err: any) {
      return res.status(500).json({ success: false, error: `فشل الاتصال: ${err.message || err}` });
    }
  });

  // General Webhook receiver endpoint
  app.post("/api/webhook", (req, res) => {
    console.log("[Webhook Received Payload]:", JSON.stringify(req.body, null, 2));
    const payload = req.body;

    try {
      let extractedProduct: any = null;
      let eventType = "unknown";

      if (payload && payload.event) {
        eventType = payload.event;
        const pData = payload.data?.Product || payload.data;
        if (pData) {
          // Robust selection for Daftra webhook items to prioritize non-empty barcode, then code, then sku, then id
          const rawBarcode = pData.barcode !== undefined && pData.barcode !== null ? String(pData.barcode).trim() : "";
          const rawCode = pData.code !== undefined && pData.code !== null ? String(pData.code).trim() : "";
          const rawSku = pData.sku !== undefined && pData.sku !== null ? String(pData.sku).trim() : "";
          
          let resolvedBarcode = "";
          if (rawBarcode && rawBarcode !== "null" && rawBarcode !== "undefined" && rawBarcode !== "") {
            resolvedBarcode = rawBarcode;
          } else if (rawCode && rawCode !== "null" && rawCode !== "undefined" && rawCode !== "") {
            resolvedBarcode = rawCode;
          } else if (rawSku && rawSku !== "null" && rawSku !== "undefined" && rawSku !== "") {
            resolvedBarcode = rawSku;
          } else {
            resolvedBarcode = String(pData.id || pData.product_id || "");
          }

          extractedProduct = {
            id: pData.id || pData.product_id,
            name: pData.name || pData.product_name,
            barcode: resolvedBarcode,
            price: safeParseFloat(pData.price || pData.selling_price || pData.unit_price),
            prod_date: pData.mfg_date || pData.prod_date || "",
            exp_date: pData.expiry_date || pData.exp_date || ""
          };
        }
      } 
      else if (payload && (payload.name || payload.product_name || payload.title)) {
        const rawBarcode = payload.barcode !== undefined && payload.barcode !== null ? String(payload.barcode).trim() : "";
        const rawCode = payload.code !== undefined && payload.code !== null ? String(payload.code).trim() : "";
        const rawSku = payload.sku !== undefined && payload.sku !== null ? String(payload.sku).trim() : "";
        
        let resolvedBarcode = "";
        if (rawBarcode && rawBarcode !== "null" && rawBarcode !== "undefined" && rawBarcode !== "") {
          resolvedBarcode = rawBarcode;
        } else if (rawCode && rawCode !== "null" && rawCode !== "undefined" && rawCode !== "") {
          resolvedBarcode = rawCode;
        } else if (rawSku && rawSku !== "null" && rawSku !== "undefined" && rawSku !== "") {
          resolvedBarcode = rawSku;
        } else {
          resolvedBarcode = String(payload.id || payload.product_id || "");
        }

        extractedProduct = {
          id: payload.id || payload.product_id || payload.sku || Date.now(),
          name: payload.name || payload.product_name || payload.title,
          barcode: resolvedBarcode,
          price: safeParseFloat(payload.price || payload.selling_price || payload.unit_price),
          prod_date: payload.prod_date || payload.mfg_date || "",
          exp_date: payload.exp_date || payload.expiry_date || ""
        };
      }

      const logItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        timestamp: new Date().toLocaleTimeString("ar-SA"),
        payload: payload,
        parsedProduct: extractedProduct,
        eventType: eventType
      };

      // Add to our list, keeping only the last 50 hooks
      webhookProducts.unshift(logItem);
      if (webhookProducts.length > 50) {
        webhookProducts = webhookProducts.slice(0, 50);
      }

      return res.json({ 
        success: true, 
        message: "تم استقبال بيانات الـ Webhook بنجاح وفلترة الصنف المراد طباعته!",
        parsed: extractedProduct 
      });

    } catch (e: any) {
      console.error("[Webhook Parsing Error]:", e);
      return res.status(200).json({ // Return 200 to prevent infinite ERP retrying, but report error
        success: false, 
        error: `خطأ أثناء قراءة الحقول: ${e.message}` 
      });
    }
  });

  // Fetch captured webhook inputs from clients
  app.get("/api/webhooks/recent", (req, res) => {
    res.json({ success: true, logs: webhookProducts });
  });

  // Clear webhook lists
  app.post("/api/webhooks/clear", (req, res) => {
    webhookProducts = [];
    res.json({ success: true, message: "تم مسح قائمة البث المتلقاة بنجاح" });
  });

  // Static/Fallback Products API
  app.get("/api/products", (req, res) => {
    res.json([
      { id: 101, name: 'منتج مسترجع من SQL - زيت زيتون بكر ممتاز 1 لتر', barcode: '62812345601', price: 42.50, prod_date: '2026/02', exp_date: '2028/02' },
      { id: 102, name: 'منتج مسترجع من SQL - أرز بسمتي هندي كلاسيك 5 كجم', barcode: '62812345602', price: 78.00, prod_date: '2026/01', exp_date: '2029/01' },
      { id: 103, name: 'منتج مسترجع من SQL - صابون غسيل الأطباق بالليمون', barcode: '62812345603', price: 14.25, prod_date: '2026/03', exp_date: '2027/03' },
      { id: 104, name: 'منتج مسترجع من SQL - حليب عضوي طويل الأجل كامل الدسم', barcode: '62812345604', price: 6.50, prod_date: '2026/05', exp_date: '2026/11' }
    ]);
  });

  // File to persist installed version locally
  const versionStateFile = path.join(process.cwd(), "version_state.json");

  const compareSemver = (v1: string, v2: string): number => {
    if (!v1 && !v2) return 0;
    if (!v1) return -1;
    if (!v2) return 1;
    const clean1 = String(v1).replace(/^v/, '').trim();
    const clean2 = String(v2).replace(/^v/, '').trim();
    if (clean1 === clean2) return 0;
    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  const getInstalledVersion = () => {
    let pkgVer = "1.0.4";
    try {
      const pkgFile = path.join(process.cwd(), "package.json");
      if (fs.existsSync(pkgFile)) {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
        if (pkg && pkg.version) pkgVer = String(pkg.version);
      }
    } catch (e) {}

    try {
      if (fs.existsSync(versionStateFile)) {
        const data = JSON.parse(fs.readFileSync(versionStateFile, "utf8"));
        if (data && data.version) {
          const fileVer = String(data.version);
          if (compareSemver(pkgVer, fileVer) > 0) {
            fs.writeFileSync(versionStateFile, JSON.stringify({ version: pkgVer, updatedAt: new Date().toISOString() }, null, 2), "utf8");
            return pkgVer;
          }
          return fileVer;
        }
      }
    } catch (e) {}

    return pkgVer;
  };

  // Endpoint to check current installed version
  app.get("/api/version", (req, res) => {
    const current = getInstalledVersion();
    res.json({
      success: true,
      version: current,
      currentVersion: current
    });
  });

  // Remote updates metadata
  app.get("/api/check-updates", (req, res) => {
    try {
      const clientVersion = (req.query.currentVersion as string) || getInstalledVersion();
      let remoteVersionData = {
        version: "1.0.4",
        releaseDate: "2026-10-01",
        changelog: [
          "حل مشكلة الورقة الفارغة الإضافية بعد الصفحة المطبوعة في عروض الأسعار بنسبة 100%",
          "إزالة الشعار الافتراضي من القالب وإظهاره تلقائياً فقط عند تحميل شعار مخصص في الواجهة للنموذجين الصغير والكبير",
          "صندوق مخصص في إعدادات المنشأة للتحكم في الشروط والأحكام وتضمينها تلقائياً في عروض الأسعار",
          "زر مشاركة مباشر لعروض الأسعار عبر واتساب بنصوص تفاعلية سريعة",
          "إمكانية التحقق من الإصدار وتحديث النظام مباشرة من نفس الجهاز دون الحاجة لفلاشة USB"
        ],
        installerUrl: "/api/download-desktop"
      };

      const publicVersionFile = path.join(process.cwd(), "public", "version.json");
      if (fs.existsSync(publicVersionFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(publicVersionFile, "utf8"));
          if (parsed && parsed.version) {
            remoteVersionData = { ...remoteVersionData, ...parsed };
          }
        } catch (e) {}
      }

      const hasUpdate = clientVersion !== remoteVersionData.version;

      res.json({
        success: true,
        currentVersion: clientVersion,
        latestVersion: remoteVersionData.version,
        hasUpdate,
        releaseDate: remoteVersionData.releaseDate,
        changelog: remoteVersionData.changelog,
        installerUrl: remoteVersionData.installerUrl || "/api/download-desktop",
        downloadUrl: remoteVersionData.installerUrl || "/api/download-desktop"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Apply update locally from the same device
  app.post("/api/apply-update", (req, res) => {
    try {
      const { targetVersion } = req.body || {};
      const newVersion = targetVersion || "1.0.4";
      fs.writeFileSync(versionStateFile, JSON.stringify({
        version: newVersion,
        updatedAt: new Date().toISOString()
      }, null, 2), "utf8");

      res.json({
        success: true,
        message: `تم تثبيت وتنفيذ التحديث بنجاح إلى الإصدار v${newVersion} على هذا الجهاز!`,
        newVersion
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset version to 1.0.0 (helpful for demo/testing)
  app.post("/api/reset-version", (req, res) => {
    try {
      fs.writeFileSync(versionStateFile, JSON.stringify({
        version: "1.0.0",
        updatedAt: new Date().toISOString()
      }, null, 2), "utf8");

      res.json({
        success: true,
        message: "تم إعادة تعيين الإصدار إلى v1.0.0 للاختبار",
        newVersion: "1.0.0"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dynamic ZIP packager of the whole source code
  app.get("/api/download-desktop", (req, res) => {
    try {
      const zip = new AdmZip();
      
      const filesToAdd = [
        "index.html",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "server.ts",
        "README_DESKTOP.md",
        "build_desktop.bat",
        "sql_bridge_proxy.js",
        "main.cjs",
        "preload.cjs",
        "metadata.json",
        "share_helper.cs"
      ];

      for (const file of filesToAdd) {
        const filePath = path.join(process.env.APP_ROOT || process.cwd(), file);
        if (fs.existsSync(filePath)) {
          if (file === "build_desktop.bat") {
            let content = fs.readFileSync(filePath, "utf-8");
            content = content.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
            zip.addFile(file, Buffer.from(content, "utf-8"));
          } else {
            zip.addLocalFile(filePath);
          }
        }
      }

      const dirsToAdd = ["src", "assets"];
      for (const dir of dirsToAdd) {
        const dirPath = path.join(process.env.APP_ROOT || process.cwd(), dir);
        if (fs.existsSync(dirPath)) {
          zip.addLocalFolder(dirPath, dir);
        }
      }

      // Dynamically inject the active cloud server public URL as the fallback in App.tsx
      const appFilePath = path.join(process.env.APP_ROOT || process.cwd(), "src/components/App.tsx");
      if (fs.existsSync(appFilePath)) {
        try {
          let appContent = fs.readFileSync(appFilePath, "utf-8");
          const reqProtocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
          const reqHost = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
          const publicUrl = `${reqProtocol}://${reqHost}`.replace(/\/+$/, "");

          appContent = appContent.replace(
            "localStorage.getItem('cloud_server_url') || ''",
            `localStorage.getItem('cloud_server_url') || '${publicUrl}'`
          );
          zip.addFile("src/components/App.tsx", Buffer.from(appContent, "utf-8"));
          console.log(`[ZIP Packager] Injected cloud URL ${publicUrl} into packed App.tsx`);
        } catch (injectErr) {
          console.error("Failed to inject server URL:", injectErr);
        }
      }

      const buffer = zip.toBuffer();
      res.setHeader("Content-Disposition", "attachment; filename=react-barcode-printer-v1.2.0.zip");
      res.setHeader("Content-Type", "application/zip");
      res.send(buffer);
    } catch (err: any) {
      console.error("Failed to generate zip updater:", err);
      res.status(500).json({ error: "تعذر تجميع تحديث التطبيق السحابي يرجى الاتصال بالدعم", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.env.APP_ROOT || process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
