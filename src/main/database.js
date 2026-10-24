// src/main/database.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let dbInstance = null;

/**
 * دالة لتحديد مسار ملف قاعدة البيانات
 * متوافقة مع بيئة Electron وكذلك بيئات الاختبار المستقلة
 */
function getDatabasePath() {
  let userDataPath;
  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      userDataPath = app.getPath('userData');
    }
  } catch (err) {
    // خارج بيئة Electron (مثلاً أثناء الاختبار)
  }

  if (!userDataPath) {
    userDataPath = path.join(process.cwd(), '.data');
  }

  const dbDir = path.join(userDataPath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'history.db');
}

/**
 * تهيئة قاعدة البيانات وإنشاء الجداول والفهارس وفقاً لمواصفات PRD القسم 10
 */
function initDatabase(customPath = null) {
  if (dbInstance) return dbInstance;

  const dbPath = customPath || getDatabasePath();
  const db = new Database(dbPath);

  // تفعيل نمط WAL والمزامنة المتوازنة لرفع الأداء
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // جدول سجل التحويل
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversion_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_uid TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      original_path TEXT NOT NULL,
      original_size INTEGER NOT NULL,
      input_format TEXT NOT NULL,
      output_format TEXT NOT NULL,
      final_size INTEGER DEFAULT 0,
      file_path TEXT NOT NULL,
      duration REAL DEFAULT 0.0,
      conversion_time_ms INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')) NOT NULL DEFAULT 'PENDING',
      error_message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON conversion_history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_history_status ON conversion_history(status);
    CREATE INDEX IF NOT EXISTS idx_history_format ON conversion_history(output_format);
  `);

  dbInstance = db;
  return dbInstance;
}

/**
 * الحصول على كائن قاعدة البيانات مع التهيئة التلقائية إن لم يكن مهيئاً
 */
function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * إدراج مهمة جديدة في السجل بحالة PENDING
 */
function insertTask(taskData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO conversion_history (
      task_uid,
      original_name,
      original_path,
      original_size,
      input_format,
      output_format,
      final_size,
      file_path,
      duration,
      conversion_time_ms,
      status,
      error_message
    ) VALUES (
      @task_uid,
      @original_name,
      @original_path,
      @original_size,
      @input_format,
      @output_format,
      @final_size,
      @file_path,
      @duration,
      @conversion_time_ms,
      @status,
      @error_message
    )
  `);

  const payload = {
    task_uid: taskData.task_uid,
    original_name: taskData.original_name,
    original_path: taskData.original_path,
    original_size: Number(taskData.original_size) || 0,
    input_format: (taskData.input_format || '').toLowerCase().replace(/^\./, ''),
    output_format: (taskData.output_format || '').toLowerCase().replace(/^\./, ''),
    final_size: Number(taskData.final_size) || 0,
    file_path: taskData.file_path || '',
    duration: Number(taskData.duration) || 0.0,
    conversion_time_ms: Number(taskData.conversion_time_ms) || 0,
    status: taskData.status || 'PENDING',
    error_message: taskData.error_message || null
  };

  const info = stmt.run(payload);
  return { id: info.lastInsertRowid, ...payload };
}

/**
 * تحديث حالة المهمة ومسارها وزمنها
 */
function updateTaskProgress(task_uid, updates = {}) {
  const db = getDb();
  const allowedFields = ['status', 'conversion_time_ms', 'final_size', 'file_path', 'error_message'];
  const fields = [];
  const params = { task_uid };

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = @${key}`);
      params[key] = value;
    }
  }

  if (fields.length === 0) return { changes: 0 };

  const stmt = db.prepare(`
    UPDATE conversion_history
    SET ${fields.join(', ')}
    WHERE task_uid = @task_uid
  `);

  return stmt.run(params);
}

/**
 * توثيق اكتمال المهمة بنجاح
 */
function completeTask(task_uid, { final_size = 0, file_path = '', conversion_time_ms = 0, duration = null } = {}) {
  const db = getDb();
  let query = `
    UPDATE conversion_history
    SET status = 'COMPLETED',
        final_size = @final_size,
        file_path = CASE WHEN @file_path != '' THEN @file_path ELSE file_path END,
        conversion_time_ms = @conversion_time_ms
  `;

  const params = {
    task_uid,
    final_size: Number(final_size) || 0,
    file_path: file_path || '',
    conversion_time_ms: Number(conversion_time_ms) || 0
  };

  if (duration !== null && duration !== undefined) {
    query += `, duration = @duration`;
    params.duration = Number(duration) || 0.0;
  }

  query += ` WHERE task_uid = @task_uid`;

  const stmt = db.prepare(query);
  return stmt.run(params);
}

/**
 * تسجيل فشل المهمة مع رسالة الخطأ
 */
function failTask(task_uid, error_message = '') {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE conversion_history
    SET status = 'FAILED',
        error_message = @error_message
    WHERE task_uid = @task_uid
  `);
  return stmt.run({ task_uid, error_message: String(error_message || 'Unknown error') });
}

/**
 * تسجيل إلغاء المهمة
 */
function cancelTask(task_uid) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE conversion_history
    SET status = 'CANCELLED'
    WHERE task_uid = @task_uid
  `);
  return stmt.run({ task_uid });
}

/**
 * جلب سجل العمليات مع التصفية والتقسيم الصفحي
 */
function fetchHistory({ limit = 50, offset = 0, status = null, format = null } = {}) {
  const db = getDb();
  let whereClauses = [];
  const params = {
    limit: Math.max(1, Math.min(500, Number(limit) || 50)),
    offset: Math.max(0, Number(offset) || 0)
  };

  if (status) {
    whereClauses.push('status = @status');
    params.status = status;
  }

  if (format) {
    whereClauses.push('output_format = @format');
    params.format = format.toLowerCase();
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM conversion_history ${whereSql}`);
  const total = totalStmt.get(params).count;

  const recordsStmt = db.prepare(`
    SELECT * FROM conversion_history
    ${whereSql}
    ORDER BY timestamp DESC
    LIMIT @limit OFFSET @offset
  `);

  const records = recordsStmt.all(params);
  return { records, total };
}

/**
 * حذف سجل محدد أو مسح السجل كاملاً
 */
function deleteHistory({ id = null, clearAll = false } = {}) {
  const db = getDb();
  if (clearAll) {
    const info = db.prepare('DELETE FROM conversion_history').run();
    return { success: true, affectedRows: info.changes };
  }

  if (id !== null && id !== undefined) {
    const stmt = db.prepare('DELETE FROM conversion_history WHERE id = ?');
    const info = stmt.run(id);
    return { success: true, affectedRows: info.changes };
  }

  return { success: false, affectedRows: 0 };
}

/**
 * إغلاق قاعدة البيانات بأمان
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // تجاهل أخطاء الإغلاق
    }
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDb,
  insertTask,
  updateTaskProgress,
  completeTask,
  failTask,
  cancelTask,
  fetchHistory,
  deleteHistory,
  closeDatabase
};
