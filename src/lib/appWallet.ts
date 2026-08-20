import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Wallet } from "@/models/Wallet";

// محفظة التطبيق: هي محفظة حساب مدير النظام التي تستقبل كل المدفوعات
// من المهنيين والشركات (اشتراكات، تعزيز، شحن المحفظة)

export async function getAppAdminUser() {
  await connectDB();
  return User.findOne({ role: "admin", status: "active" })
    .select("_id email name")
    .lean<{ _id: mongoose.Types.ObjectId; email: string; name: string } | null>();
}

export async function getAppWallet() {
  await connectDB();
  const admin = await getAppAdminUser();
  if (!admin) {
    throw new Error("App admin user not found");
  }
  let wallet = await Wallet.findOne({ userId: admin._id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: admin._id, balance: 0 });
  }
  return { adminId: String(admin._id), wallet };
}
