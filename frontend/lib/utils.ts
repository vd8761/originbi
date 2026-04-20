export const capitalizeWords = (str: string | undefined | null) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return past.toLocaleDateString();
};

const normalizeComparableWord = (word: string) =>
    word.toLowerCase().replace(/[.,;:!?-]+$/g, "");

const getDuplicatePrefixWordCount = (words: string[]) => {
    const maxPrefixWordCount = Math.min(Math.floor(words.length / 2), 6);

    for (let prefixWordCount = maxPrefixWordCount; prefixWordCount >= 1; prefixWordCount--) {
        const firstPrefix = words
            .slice(0, prefixWordCount)
            .map(normalizeComparableWord);
        const repeatedPrefix = words
            .slice(prefixWordCount, prefixWordCount * 2)
            .map(normalizeComparableWord);

        const isDuplicate = firstPrefix.every(
            (word, index) => word !== "" && word === repeatedPrefix[index]
        );

        if (isDuplicate) return prefixWordCount;
    }

    return 0;
};

export const normalizeDepartmentDisplayName = (label: string | undefined | null) => {
    if (!label) return "";

    let normalized = label.replace(/\s+/g, " ").trim();

    while (true) {
        const words = normalized.split(" ");
        const duplicatePrefixWordCount = getDuplicatePrefixWordCount(words);

        if (!duplicatePrefixWordCount) break;

        words.splice(duplicatePrefixWordCount, duplicatePrefixWordCount);
        normalized = words.join(" ");
    }

    return normalized;
};

// Generate a unique but consistent color based on the name
// Using HSL allows us to keep the colors vibrant and readable (consistent saturation/lightness)
export const getAvatarColor = (name: string) => {
    if (!name) return "1ED36A"; // Default green if no name
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash) % 360;    // Full hue spectrum
    const s = 55 + (Math.abs(hash) % 20); // Saturation 55-75% (Vibrant but not neon)
    const l = 45 + (Math.abs(hash) % 10); // Lightness 45-55% (Dark formatting for white text)

    // HSL to Hex conversion
    const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `${f(0)}${f(8)}${f(4)}`;
    };

    return hslToHex(h, s, l);
};

export const getInitials = (name: string | undefined | null) => {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
};
