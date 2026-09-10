const DB_NAME = "eps-dz-pro";
const DB_VERSION = 1;
const STORE_CACHE = "cache"; // لقطات بيانات للعرض دون اتصال (مفتاح -> قيمة)
const STORE_QUEUE = "pending_writes"; // عمليات كتابة مؤجلة بانتظار الاتصال

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB غير متاح في هذه البيئة"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** يحفظ لقطة بيانات (مثل قائمة تلاميذ قسم) للعرض لاحقًا دون اتصال. */
export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readwrite");
      tx.objectStore(STORE_CACHE).put({ key, value, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // فشل صامت: التخزين المؤقت تحسين وليس أساسيًا لعمل التطبيق
  }
}

/** يسترجع لقطة بيانات محفوظة مسبقًا (أو null إن لم توجد). */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readonly");
      const req = tx.objectStore(STORE_CACHE).get(key);
      req.onsuccess = () => resolve(req.result ? (req.result.value as T) : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export type PendingWrite = {
  id?: number;
  type: "attendance_session";
  payload: unknown;
  createdAt: number;
};

/** يضيف عملية كتابة إلى قائمة الانتظار لتُنفَّذ عند عودة الاتصال. */
export async function queueWrite(write: Omit<PendingWrite, "id" | "createdAt">): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    tx.objectStore(STORE_QUEUE).add({ ...write, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** يعيد كل العمليات المعلّقة بانتظار المزامنة. */
export async function getPendingWrites(): Promise<PendingWrite[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readonly");
    const req = tx.objectStore(STORE_QUEUE).getAll();
    req.onsuccess = () => resolve(req.result as PendingWrite[]);
    req.onerror = () => reject(req.error);
  });
}

/** يحذف عملية من قائمة الانتظار بعد مزامنتها بنجاح. */
export async function removePendingWrite(id: number): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    tx.objectStore(STORE_QUEUE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** عدد العمليات المعلّقة حاليًا (لعرضها في شريط الحالة). */
export async function countPendingWrites(): Promise<number> {
  const writes = await getPendingWrites().catch(() => []);
  return writes.length;
}
