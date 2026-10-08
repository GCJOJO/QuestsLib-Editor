const NESTING_COLORS = [
    "#2b5c8f", // Profondeur 0 (Quête / Tâche racine - Bleu)
    "#6b3ba7", // Profondeur 1 (Violet)
    "#9c27b0", // Profondeur 2 (Magenta / Pink)
    "#2e7d32", // Profondeur 3 (Vert)
    "#d84315", // Profondeur 4 (Orange)
];

export function getDepthColor(depth: number): string {
    return NESTING_COLORS[depth % NESTING_COLORS.length];
}