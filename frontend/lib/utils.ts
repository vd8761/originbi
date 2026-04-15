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
