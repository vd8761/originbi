export declare class RegisterCorporateDto {
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    email: string;
    countryCode: string;
    mobile: string;
    companyName: string;
    jobTitle?: string;
    employeeCode?: string;
    linkedinUrl?: string;
    sector: string;
    password: string;
    businessLocations: string;
}
