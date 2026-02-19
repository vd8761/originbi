export const BOARD_OPTIONS = [
    { value: "STATE_BOARD", label: "State Board", enabled: true },
    { value: "CBSE", label: "CBSE", enabled: true },
    { value: "ICSE", label: "ICSE", enabled: false },
    { value: "IGCSE", label: "IGCSE", enabled: false },
    { value: "IB", label: "IB", enabled: false },
    { value: "OTHER", label: "Other", enabled: false },
];

export const getEnabledBoards = () => BOARD_OPTIONS.filter((b) => b.enabled);
