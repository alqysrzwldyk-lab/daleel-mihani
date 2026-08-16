// أنواع مشتركة لنظام التوظيف تُستخدم في الواجهة والمكونات

export type JobStatus = "open" | "closed";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type JobItem = {
  _id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  jobType: string;
  department: string;
  description: string;
  skills: string[];
  education: string;
  experienceYears: string;
  gender?: string;
  ageFrom?: number;
  ageTo?: number;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType: string;
  workType: string;
  city: string;
  governorate: string;
  country: string;
  vacancies: number;
  deadline: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  benefits: string;
  banner?: string;
  status: JobStatus;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationItem = {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  companyId: string;
  professionalId: string;
  fullName: string;
  phone: string;
  email: string;
  profession: string;
  education: string;
  experience: string;
  coverLetter: string;
  cvFile?: string;
  photo?: string;
  status: ApplicationStatus;
  companyNote?: string;
  createdAt: string;
};
