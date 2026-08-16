/**
 * سكربت إنشاء أول مدير نظام (Admin) بأمان.
 * التشغيل:
 *   npm run create-admin
 * المتغيرات المطلوبة في .env.local:
 *   ADMIN_EMAIL            بريد المدير
 *   ADMIN_PASSWORD         كلمة مرور المدير (يُخزَّن بصيغة bcrypt)
 *   (اختياري) ADMIN_PASSWORD_HASH  بديل: هاش bcrypt جاهز لكلمة المرور
 * ملاحظة أمنية: لا يتم إنشاء Admin من أي Endpoint عام أبداً.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // لا يوجد .env.local — سنعتمد على متغيرات البيئة الموجودة
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daleel-mihani";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const passwordHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();

if (!email || !email.includes("@")) {
  console.error("خطأ: عيّن ADMIN_EMAIL في .env.local");
  process.exit(1);
}

let finalHash = passwordHash;
if (!finalHash) {
  if (!password || password.length < 8) {
    console.error("خطأ: عيّن ADMIN_PASSWORD (8 أحرف على الأقل) أو ADMIN_PASSWORD_HASH");
    process.exit(1);
  }
  finalHash = await bcrypt.hash(password, 12);
}

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log("تم الاتصال بقاعدة البيانات");

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));

const existing = await User.findOne({ email }).lean();

if (existing) {
  if (existing.role !== "admin") {
    console.error(
      `خطأ: البريد ${email} مسجّل مسبقاً بدور "${existing.role}". لا يمكن ترقية حساب عادي إلى مدير بهذه الطريقة.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  if (password) {
    await User.updateOne({ _id: existing._id }, { $set: { password: finalHash } });
    console.log(`تم تحديث كلمة مرور المدير الموجود: ${email}`);
  } else {
    console.log(`المدير موجود بالفعل: ${email} (لم يتم تغيير شيء)`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

const admin = await User.create({
  name: "مدير النظام",
  email,
  password: finalHash,
  role: "admin",
  status: "active",
  hasProfile: false,
});

console.log("تم إنشاء المدير بنجاح:");
console.log(`  البريد: ${admin.email}`);
console.log("  الدور: admin");
await mongoose.disconnect();
process.exit(0);
