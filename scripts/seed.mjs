import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/daleel-mihani";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["professional", "employer"] },
  },
  { timestamps: true }
);

const ProfessionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    name: String,
    photo: String,
    profession: String,
    bio: String,
    skills: [String],
    workExperience: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    location: String,
    phone: String,
    email: String,
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Professional = mongoose.models.Professional || mongoose.model("Professional", ProfessionalSchema);

const samples = [
  {
    name: "أحمد محمد",
    email: "ahmed@example.com",
    password: "123456",
    profession: "programmer",
    bio: "مطور ويب متخصص في React و Node.js بخبرة 5 سنوات",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    location: "الرياض",
    workExperience: [
      { company: "شركة التقنية", position: "مطور أول", startDate: "2021-01", endDate: "2024-06", description: "تطوير تطبيقات ويب" },
    ],
  },
  {
    name: "سارة علي",
    email: "sara@example.com",
    password: "123456",
    profession: "accountant",
    bio: "محاسبة قانونية معتمدة بخبرة في الشركات الكبرى",
    skills: ["محاسبة", "ضرائب", "Excel", "ERP"],
    location: "جدة",
    workExperience: [
      { company: "مكتب المحاسبة المتحد", position: "محاسبة رئيسية", startDate: "2019-03", description: "إدارة الحسابات المالية" },
    ],
  },
  {
    name: "د. خالد حسن",
    email: "khaled@example.com",
    password: "123456",
    profession: "doctor",
    bio: "طبيب عام متخصص في الطب الباطني",
    skills: ["طب باطني", "تشخيص", "متابعة مرضى"],
    location: "الدمام",
    workExperience: [
      { company: "مستشفى الملك فهد", position: "طبيب استشاري", startDate: "2015-01", description: "عيادة الطب الباطني" },
    ],
  },
];

async function seed() {
  console.log("جاري الاتصال بـ MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("تم الاتصال بنجاح ✓");

  await Professional.deleteMany({});
  await User.deleteMany({ email: { $in: samples.map((s) => s.email) } });

  for (const sample of samples) {
    const hashed = await bcrypt.hash(sample.password, 12);
    const user = await User.create({
      name: sample.name,
      email: sample.email,
      password: hashed,
      role: "professional",
    });

    await Professional.create({
      userId: user._id,
      name: sample.name,
      email: sample.email,
      profession: sample.profession,
      bio: sample.bio,
      skills: sample.skills,
      location: sample.location,
      workExperience: sample.workExperience,
      averageRating: 4.5,
      ratingCount: 2,
    });

    console.log(`تم إنشاء: ${sample.name}`);
  }

  console.log("\nتم تعبئة قاعدة البيانات بنجاح!");
  console.log("بيانات الدخول التجريبية: ahmed@example.com / 123456");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("فشل الاتصال بـ MongoDB:", err.message);
  console.error("\nتأكد من تشغيل MongoDB أولاً:");
  console.error("  1. ثبّت MongoDB Community Server");
  console.error("  2. شغّل الخدمة: net start MongoDB");
  process.exit(1);
});
