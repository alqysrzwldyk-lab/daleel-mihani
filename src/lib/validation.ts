import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "nameShort"),
  email: z.string().trim().email("emailInvalid"),
  password: z.string().min(6, "passwordShort"),
  role: z.enum(["professional", "employer"]),
});

export const loginSchema = z.object({
  email: z.string().trim().email("emailInvalid"),
  password: z.string().min(1, "invalidCredentials"),
});

export function validationMessageKey(error: z.ZodError): string {
  return error.errors[0]?.message || "validation";
}

// رابط مقبول: فارغ، مسار نسبي يبدأ بـ "/" (مثل روابط رفع الملفات)، أو رابط مطلق http/https
const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "invalidUrl");

// Schema لإنشاء وتحديث إعلان وظيفي
export const jobAdvertisementSchema = z.object({
  jobTitle: z.string().trim().min(2, "jobTitleShort"),
  companyName: z.string().trim().min(1, "companyNameRequired"),
  companyLogo: urlOrEmpty.optional(),
  jobType: z.string().trim().min(1, "jobTypeRequired"),
  department: z.string().trim().min(1, "departmentRequired"),
  description: z.string().trim().min(10, "descriptionShort"),
  skills: z.array(z.string().trim().min(1)).optional().default([]),
  education: z.string().trim().min(1, "educationRequired"),
  experienceYears: z.string().trim().min(1, "experienceRequired"),
  gender: z.string().trim().optional().or(z.literal("")),
  ageFrom: z.coerce.number().int().min(16).max(80).optional().nullable(),
  ageTo: z.coerce.number().int().min(16).max(80).optional().nullable(),
  salary: z.string().trim().optional().or(z.literal("")),
  salaryType: z.string().trim().optional().or(z.literal("")),
  workType: z.string().trim().min(1, "workTypeRequired"),
  city: z.string().trim().min(1, "cityRequired"),
  governorate: z.string().trim().min(1, "governorateRequired"),
  country: z.string().trim().min(1, "countryRequired"),
  vacancies: z.coerce.number().int().positive().default(1),
  deadline: z.string().trim().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(6, "phoneShort"),
  contactEmail: z.string().trim().email("emailInvalid"),
  website: z.string().trim().optional().or(z.literal("")),
  benefits: z.string().trim().optional().or(z.literal("")),
  banner: urlOrEmpty.optional(),
  status: z.enum(["open", "closed"]).default("open"),
});

// Schema لتحديث إعلان وظيفي (جميع الحقول اختيارية)
export const jobAdvertisementUpdateSchema = jobAdvertisementSchema.partial();

// Schema لتقديم طلب وظيفة من مهني
export const jobApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "nameShort"),
  phone: z.string().trim().min(6, "phoneShort"),
  email: z.string().trim().email("emailInvalid"),
  profession: z.string().trim().min(1, "professionRequired"),
  education: z.string().trim().min(1, "educationRequired"),
  experience: z.string().trim().min(1, "experienceRequired"),
  coverLetter: z.string().trim().min(10, "coverLetterShort"),
  cvFile: urlOrEmpty.optional(),
  photo: urlOrEmpty.optional(),
});
