import type { QuestData, TaskData, Translations } from "../types/QuestTypes";

export type KeyUsage = { key: string; questId: string; where: "name" | "description" | "task"; label: string };

/** Les champs name/description des quêtes et des tâches sont des clés de traduction côté mod. */
export function collectKeyUsages(quests: QuestData[]): KeyUsage[] {
    const out: KeyUsage[] = [];
    const walkTasks = (questId: string, tasks: TaskData[] | undefined) => {
        tasks?.forEach((task) => {
            if (typeof task.name === "string" && task.name) out.push({ key: task.name, questId, where: "task", label: task.id });
            if (typeof task.description === "string" && task.description)
                out.push({ key: task.description, questId, where: "task", label: task.id });
            walkTasks(questId, task.subtasks);
        });
    };
    quests.forEach((q) => {
        if (q.name) out.push({ key: q.name, questId: q.id, where: "name", label: q.id });
        if (q.description) out.push({ key: q.description, questId: q.id, where: "description", label: q.id });
        walkTasks(q.id, q.tasks);
    });
    return out;
}

/** Comme Minecraft : une clé sans traduction s'affiche telle quelle. */
export function resolveText(translations: Translations, locale: string, key: string | undefined): { text: string; translated: boolean } {
    if (!key) return { text: "", translated: false };
    const value = translations[locale]?.[key] ?? translations.en_us?.[key];
    return value !== undefined ? { text: value, translated: translations[locale]?.[key] !== undefined } : { text: key, translated: false };
}

/** Ressemble à une clé (pas d'espace, au moins un point) plutôt qu'à un texte en clair. */
export const looksLikeKey = (value: string) => /^[a-z0-9_.\-:]+$/i.test(value) && value.includes(".");

/** quest.<namespace>.<chemin>.<champ>, à partir d'un identifiant namespace:chemin. */
export function suggestKey(id: string, field: string, prefix = "quest"): string {
    const [ns, path] = id.includes(":") ? id.split(":", 2) : ["questslib", id];
    return `${prefix}.${ns}.${path.replace(/[/:]/g, ".")}.${field}`;
}

export function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Trie les clés pour un fichier de langue stable d'un export à l'autre. */
export function sortedTable(table: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b)));
}
