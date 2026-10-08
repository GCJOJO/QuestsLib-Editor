import type { QuestData, ExtensionPackage } from "../types/QuestTypes";

export function exportQuestsToJson(quests: QuestData[], filename = "quests.json") {
    const jsonStr = JSON.stringify(quests, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function parseAndValidateQuestsJson(rawText: string): {
    valid: boolean;
    quests?: QuestData[];
    error?: string;
} {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawText);
    } catch {
        return { valid: false, error: "Fichier JSON invalide. Veuillez vérifier la syntaxe JSON." };
    }

    if (!Array.isArray(parsed)) {
        return { valid: false, error: "Le fichier doit contenir une liste (tableau) de quêtes [ ... ]." };
    }

    for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item || typeof item !== "object") {
            return { valid: false, error: `La quête à l'index ${i} n'est pas un objet valide.` };
        }

        if (typeof item.id !== "string" || !item.id.trim()) {
            return { valid: false, error: `La quête #${i + 1} n'a pas d'identifiant 'id' valide.` };
        }

        if (typeof item.name !== "string") {
            return { valid: false, error: `La quête '${item.id}' doit posséder un champ 'name'.` };
        }

        if (item.tasks !== undefined && !Array.isArray(item.tasks)) {
            return { valid: false, error: `La quête '${item.id}' : le champ 'tasks' doit être un tableau.` };
        }

        if (item.rewards !== undefined && !Array.isArray(item.rewards)) {
            return { valid: false, error: `La quête '${item.id}' : le champ 'rewards' doit être un tableau.` };
        }
    }

    // Normalisation des quêtes
    const normalizedQuests: QuestData[] = parsed.map((item) => ({
        ...item,
        id: item.id.trim(),
        name: item.name,
        description: typeof item.description === "string" ? item.description : "",
        tasks: Array.isArray(item.tasks) ? item.tasks : [],
        rewards: Array.isArray(item.rewards) ? item.rewards : [],
    }));

    return { valid: true, quests: normalizedQuests };
}

export function exportExtensionToJson(pkg: ExtensionPackage) {
    const filename = `${pkg.id.replace(/[^a-z0-9_-]/gi, "_")}_extension.json`;
    const jsonStr = JSON.stringify(pkg, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
