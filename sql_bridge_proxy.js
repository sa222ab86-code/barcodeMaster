/**
 * نظام طباعة الملصقات - جسر قاعدة البيانات المحلي (SQL Database API Bridge)
 * 🔌 تم تعديله ليرتبط مباشرة ببيانات Aronium (pos.db) وتجنب أخطاء المزامنة.
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 4000;

app.use(cors()); 
app.use(express.json());

// 📍 مسار قاعدة بيانات Aronium الفعلي على جهازك بناءً على لقطة الشاشة
const dbPath = 'C:\\Users\\Admin\\AppData\\Local\\Aronium\\Data\\pos.db'; 

// ==========================================
// 🚀 نقطة النهاية (Endpoint API) المستهدفة للتطبيق
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] 📥 استلام طلب مزامنة للمنتجات من نظام طباعة الملصقات...`);
    
    // فتح الاتصال بقاعدة البيانات
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('❌ خطأ في فتح ملف قاعدة البيانات pos.db:', err.message);
      }
    });

    // جلب البيانات بالاستعلام المتوافق مع جداولك الفلكية
    const fetchSqliteData = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT 
              p.Name AS name, 
              COALESCE(b.Value, p.Code, '') AS barcode, 
              p.Price AS price
          FROM 
              Product p
          LEFT JOIN 
              Barcode b ON p.Id = b.ProductId
          WHERE 
              p.IsEnabled = 1
        `;
        
        db.all(query, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    try {
      const rows = await fetchSqliteData();
      db.close();
      
      console.log(`[${new Date().toLocaleTimeString()}] ✅ تم جلب ومزامنة عدد ${rows.length} منتجاً بنجاح من pos.db.`);
      return res.json(rows);

    } catch (queryError) {
      db.close();
      throw queryError;
    }

  } catch (error) {
    console.error('❌ عطل أثناء جلب المنتجات من SQLite:', error);
    res.status(500).json({ error: 'تعذر معالجة طلب المزامنة لقاعدة البيانات', details: error.message });
  }
});

// تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log(`🔌 جسر قاعدة البيانات المحلي (Aronium SQLite Bridge) يعمل بنجاح!`);
  console.log(`📍 رابط الربط النشط: http://localhost:${PORT}/api/products`);
  console.log(`📁 متصل حالياً بملف: ${dbPath}`);
  console.log('=============================================================\n');
});