// lib/sectors.ts

// Canonical codes you store in DB / API
export type SectorCode =
  | "IT_SOFTWARE"
  | "MANUFACTURING"
  | "HEALTHCARE_HOSPITALS"
  | "BANKING_FINANCIAL"
  | "EDUCATION_TRAINING"
  | "RETAIL_ECOM"
  | "AUTOMOTIVE"
  | "CONSTRUCTION_INFRA"
  | "TELECOM"
  | "HOSPITALITY_TOURISM"
  | "LOGISTICS_SUPPLY_CHAIN"
  | "AGRI_AGRIBUSINESS"
  | "PHARMA_BIOTECH"
  | "MEDIA_ENTERTAINMENT"
  | "GOVT_PUBLIC"
  | "ENERGY_UTILITIES"
  | "AEROSPACE_DEFENCE"
  | "INSURANCE"
  | "CONSULTING_PROF_SERVICES"
  | "REAL_ESTATE"
  | "FMCG"
  | "CHEMICALS_PETROCHEM"
  | "NONPROFIT_NGO"
  | "LEGAL"
  | "SPORTS_RECREATION"
  | "MINING_METALS"
  | "MARITIME_SHIPPING"
  | "ELECTRONICS_SEMI"
  | "ENVIRONMENTAL"
  | "ANIMATION_VFX_GAMING"
  | "TEXTILES_APPAREL"
  | "FOOD_PROCESSING"
  | "LUXURY_PREMIUM"
  | "PRINTING_PACKAGING"
  | "EVENT_MANAGEMENT"
  | "BEAUTY_WELLNESS"
  | "SECURITY_SERVICES"
  | "RESEARCH_DEVELOPMENT"
  | "TRANSPORTATION"
  | "FISHERIES_AQUA"
  | "OTHER";

// UI options – friendly labels
export const SECTOR_OPTIONS: { value: SectorCode; label: string }[] = [
  { value: "IT_SOFTWARE", label: "IT & Software" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "HEALTHCARE_HOSPITALS", label: "Healthcare & Hospitals" },
  { value: "BANKING_FINANCIAL", label: "Banking & Financial Services" },
  { value: "EDUCATION_TRAINING", label: "Education & Training" },
  { value: "RETAIL_ECOM", label: "Retail & E-commerce" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "CONSTRUCTION_INFRA", label: "Construction & Infrastructure" },
  { value: "TELECOM", label: "Telecom" },
  { value: "HOSPITALITY_TOURISM", label: "Hospitality & Tourism" },
  { value: "LOGISTICS_SUPPLY_CHAIN", label: "Logistics & Supply Chain" },
  { value: "AGRI_AGRIBUSINESS", label: "Agriculture & Agribusiness" },
  { value: "PHARMA_BIOTECH", label: "Pharma & Biotech" },
  { value: "MEDIA_ENTERTAINMENT", label: "Media & Entertainment" },
  { value: "GOVT_PUBLIC", label: "Government & Public Sector" },
  { value: "ENERGY_UTILITIES", label: "Energy & Utilities" },
  { value: "AEROSPACE_DEFENCE", label: "Aerospace & Defence" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "CONSULTING_PROF_SERVICES", label: "Consulting & Professional Services" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "FMCG", label: "FMCG (Fast-Moving Consumer Goods)" },
  { value: "CHEMICALS_PETROCHEM", label: "Chemicals & Petrochemicals" },
  { value: "NONPROFIT_NGO", label: "Non-profit & NGOs" },
  { value: "LEGAL", label: "Legal Services" },
  { value: "SPORTS_RECREATION", label: "Sports & Recreation" },
  { value: "MINING_METALS", label: "Mining & Metals" },
  { value: "MARITIME_SHIPPING", label: "Maritime & Shipping" },
  { value: "ELECTRONICS_SEMI", label: "Electronics & Semiconductors" },
  { value: "ENVIRONMENTAL", label: "Environmental Services" },
  { value: "ANIMATION_VFX_GAMING", label: "Animation, VFX & Gaming" },
  { value: "TEXTILES_APPAREL", label: "Textiles & Apparel" },
  { value: "FOOD_PROCESSING", label: "Food Processing" },
  { value: "LUXURY_PREMIUM", label: "Luxury & Premium Goods" },
  { value: "PRINTING_PACKAGING", label: "Printing & Packaging" },
  { value: "EVENT_MANAGEMENT", label: "Event Management" },
  { value: "BEAUTY_WELLNESS", label: "Beauty, Wellness & Personal Care" },
  { value: "SECURITY_SERVICES", label: "Security Services" },
  { value: "RESEARCH_DEVELOPMENT", label: "Research & Development" },
  { value: "TRANSPORTATION", label: "Transportation Services" },
  { value: "FISHERIES_AQUA", label: "Fisheries & Aquaculture" },
  { value: "OTHER", label: "Other / Miscellaneous" },
];
