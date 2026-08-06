// ترجمة مفاتيح رسائل التحقق (Validation) القادمة من الخادم إلى رسائل عربية واضحة
export const VALIDATION_MESSAGES: Record<string, string> = {
  // نموذج التقديم على وظيفة (JobApplication)
  nameShort: "الاسم يجب أن يكون حرفين على الأقل",
  phoneShort: "رقم الهاتف قصير جداً (6 أرقام على الأقل)",
  emailInvalid: "البريد الإلكتروني غير صالح",
  professionRequired: "المهنة مطلوبة",
  educationRequired: "المؤهل العلمي مطلوب",
  experienceRequired: "سنوات الخبرة مطلوبة",
  coverLetterShort: "الرسالة التعريفية قصيرة جداً (10 أحرف على الأقل)",
  cvRequired: "يرجى رفع السيرة الذاتية بصيغة PDF صحيحة",
  // نموذج إعلان الوظيفة (JobAdvertisement)
  jobTitleShort: "المسمى الوظيفي يجب أن يكون حرفين على الأقل",
  companyNameRequired: "اسم الشركة مطلوب",
  jobTypeRequired: "نوع الوظيفة مطلوب",
  departmentRequired: "القسم أو التخصص مطلوب",
  descriptionShort: "وصف الوظيفة قصير جداً (10 أحرف على الأقل)",
  workTypeRequired: "نوع الدوام مطلوب",
  cityRequired: "المدينة مطلوبة",
  governorateRequired: "المحافظة مطلوبة",
  countryRequired: "الدولة مطلوبة",
};

// تحويل استجابة الخطأ من الخادم إلى رسالة عربية قابلة للعرض
export function resolveErrorMessage(data: { error?: string; field?: string }): string {
  if (data.field && data.field !== "validation") {
    return VALIDATION_MESSAGES[data.field] || "تأكد من صحة البيانات ثم أعد المحاولة";
  }
  if (data.error && data.error !== "validation") {
    return data.error;
  }
  return "حدث خطأ أثناء إرسال البيانات";
}
