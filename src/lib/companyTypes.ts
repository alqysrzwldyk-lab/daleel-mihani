import type { JobItem } from "@/lib/jobTypes";

// أنواع مشتركة لنظام ملف الشركة تُستخدم في الواجهة والمكونات

export type CompanySocial = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  telegram?: string;
  twitter?: string;
};

export type CompanyPublic = {
  _id: string;
  userId: string;
  name: string;
  logo?: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  cover?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  values: string[];
  specializations: string[];
  businessActivities: string[];
  services: string[];
  foundedYear?: number;
  employeesCount?: number;
  companySize?: string;
  address?: string;
  country?: string;
  workingHours?: string;
  gallery: string[];
  latitude?: number;
  longitude?: number;
  social: CompanySocial;
  views: number;
  createdAt: string;
};

export type CompanyReview = {
  _id: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type CompanyStats = {
  jobsCount: number;
  applicationsCount: number;
  views: number;
  hiredCount: number;
  averageRating: number;
  reviewsCount: number;
};

export type SimilarCompany = {
  _id: string;
  name: string;
  logo?: string;
  industry?: string;
  city?: string;
  country?: string;
  averageRating: number;
  reviewsCount: number;
  openJobs: number;
};

export type CompanyProfileData = {
  company: CompanyPublic;
  jobs: JobItem[];
  stats: CompanyStats;
  reviews: CompanyReview[];
  userRating?: number;
  isOwner: boolean;
  ratingDistribution: Record<number, number>;
  similarCompanies: SimilarCompany[];
};
