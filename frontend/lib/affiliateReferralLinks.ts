export type AffiliateReferralAudience = "school" | "college" | "employee";

export interface AffiliateReferralDestination {
    key: AffiliateReferralAudience;
    label: string;
    host: string;
}

export const AFFILIATE_DEFAULT_REFERRAL_AUDIENCE: AffiliateReferralAudience = "college";

export const AFFILIATE_REFERRAL_DESTINATIONS: AffiliateReferralDestination[] = [
    { key: "school", label: "School", host: "pickmycareer.originbi.com" },
    { key: "college", label: "College", host: "discover.originbi.com" },
    { key: "employee", label: "Employee", host: "grow.originbi.com" },
];

const DEFAULT_REGISTER_URLS: Record<AffiliateReferralAudience, string> = {
    school: "https://pickmycareer.originbi.com/register",
    college: "https://discover.originbi.com/register",
    employee: "https://grow.originbi.com/register",
};

const parseAsRegisterUrl = (rawUrl: string | undefined, fallback: string): string => {
    const normalizedRawUrl = rawUrl?.trim();

    if (!normalizedRawUrl) {
        return fallback;
    }

    try {
        const url = new URL(normalizedRawUrl);

        // For affiliate destination links we always want the register entry point.
        url.pathname = "/register";

        url.search = "";
        url.hash = "";
        return url.toString();
    } catch {
        return fallback;
    }
};

const getLegacyBaseUrl = (): string | undefined => {
    return process.env.NEXT_PUBLIC_REFERRAL_BASE_URL || process.env.NEXT_PUBLIC_REFERAL_BASE_URL;
};

export const getAffiliateLoginUrl = (audience: AffiliateReferralAudience): string => {
    const fallback = DEFAULT_REGISTER_URLS[audience];

    if (audience === "school") {
        return parseAsRegisterUrl(
            process.env.NEXT_PUBLIC_AFFILIATE_SCHOOL_REGISTER_URL || process.env.NEXT_PUBLIC_AFFILIATE_SCHOOL_LOGIN_URL,
            fallback,
        );
    }

    if (audience === "employee") {
        return parseAsRegisterUrl(
            process.env.NEXT_PUBLIC_AFFILIATE_EMPLOYEE_REGISTER_URL || process.env.NEXT_PUBLIC_AFFILIATE_EMPLOYEE_LOGIN_URL,
            fallback,
        );
    }

    return parseAsRegisterUrl(
        process.env.NEXT_PUBLIC_AFFILIATE_COLLEGE_REGISTER_URL ||
        process.env.NEXT_PUBLIC_AFFILIATE_COLLEGE_LOGIN_URL ||
        getLegacyBaseUrl(),
        fallback,
    );
};

export const buildAffiliateReferralLink = (
    audience: AffiliateReferralAudience,
    referralCode: string,
): string => {
    const loginUrl = getAffiliateLoginUrl(audience);

    try {
        const url = new URL(loginUrl);
        const normalizedCode = (referralCode || "").trim();

        if (normalizedCode) {
            url.searchParams.set("ref", normalizedCode);
        }

        return url.toString();
    } catch {
        const encoded = encodeURIComponent((referralCode || "").trim());
        return encoded ? `${loginUrl}?ref=${encoded}` : loginUrl;
    }
};
