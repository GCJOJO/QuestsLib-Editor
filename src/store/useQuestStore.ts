import { create } from "zustand";
import { produce } from "immer";
import type { QuestData, TaskData, Translations } from "../types/QuestTypes";
import { useProjectStore } from "./useProjectStore";

type Path = (string | number)[];

export type SaveStatus = "saved" | "saving" | "error";

const DEFAULT_QUESTS: QuestData[] = [
    {
        id: "questslib:quest_1",
        name: "my first quest",
        description: "this is my first quest",
        tasks: [
            {
                task: "questslib:stat",
                id: "questslib:quest_1_collect_dirt",
                name: "Collect 10 dirt",
                stat_type: "item",
                target: "minecraft:dirt",
                amount: 10,
            },
        ],
        rewards: [
            {
                reward: "questslib:item",
                item: "minecraft:diamond",
                amount: 1,
            },
        ],
    },
];

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function persistQuests(quests: QuestData[], onStatusChange: (status: SaveStatus) => void) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

    onStatusChange("saving");
    saveDebounceTimer = setTimeout(async () => {
        try {
            await useProjectStore.getState().saveActiveProjectQuests(quests);
            onStatusChange("saved");
        } catch (err) {
            console.error("Failed to save project quests:", err);
            onStatusChange("error");
        }
    }, 400);
}

const PREVIEW_LOCALE_KEY = "questslib-editor.preview-locale";

function readPreviewLocale(): string {
    try {
        return localStorage.getItem(PREVIEW_LOCALE_KEY) || "en_us";
    } catch {
        return "en_us";
    }
}

interface QuestStore {
    currentProjectId: string | null;
    quests: QuestData[];
    /** locale -> clé -> texte, enregistré avec le projet. */
    translations: Translations;
    /** Langue dans laquelle les clés de traduction sont affichées. */
    previewLocale: string;
    selectedQuestId: string | null;
    isLoading: boolean;
    saveStatus: SaveStatus;

    initFromProject: (projectId: string, quests: QuestData[], translations?: Translations) => void;
    setPreviewLocale: (locale: string) => void;
    setTranslation: (locale: string, key: string, value: string) => void;
    setTranslations: (translations: Translations) => void;
    addLocale: (locale: string) => void;
    removeLocale: (locale: string) => void;
    renameKey: (oldKey: string, newKey: string) => void;
    deleteKey: (key: string) => void;
    moveQuest: (from: number, to: number) => void;
    setSelectedQuest: (id: string | null) => void;
    addQuest: (quest: QuestData) => void;
    deleteQuest: (questId: string) => void;
    updateValueAt: (path: Path, value: unknown) => void;
    duplicateQuest: (questId: string, newQuestId: string) => void;
    setQuests: (quests: QuestData[]) => Promise<void>;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
    currentProjectId: "project_default",
    quests: DEFAULT_QUESTS,
    translations: {},
    previewLocale: readPreviewLocale(),
    selectedQuestId: "questslib:quest_1",
    isLoading: false,
    saveStatus: "saved",

    initFromProject: (projectId, loadedQuests, translations) => {
        const nextQuests = loadedQuests && loadedQuests.length > 0 ? loadedQuests : DEFAULT_QUESTS;
        set({
            currentProjectId: projectId,
            quests: nextQuests,
            translations: translations ?? {},
            selectedQuestId: nextQuests[0]?.id || null,
            isLoading: false,
            saveStatus: "saved",
        });
    },

    setSelectedQuest: (id) => set({ selectedQuestId: id }),

    setPreviewLocale: (locale) => {
        try {
            localStorage.setItem(PREVIEW_LOCALE_KEY, locale);
        } catch {
            // Valable pour cette session seulement.
        }
        set({ previewLocale: locale });
    },

    setTranslation: (locale, key, value) => {
        const next = produce(get().translations, (draft) => {
            draft[locale] ??= {};
            if (value === "") delete draft[locale][key];
            else draft[locale][key] = value;
        });
        set({ translations: next });
        persistQuests(get().quests, (status) => set({ saveStatus: status }));
    },

    setTranslations: (translations) => {
        set({ translations });
        persistQuests(get().quests, (status) => set({ saveStatus: status }));
    },

    addLocale: (locale) => {
        if (get().translations[locale]) return;
        get().setTranslations({ ...get().translations, [locale]: {} });
    },

    removeLocale: (locale) => {
        const next = { ...get().translations };
        delete next[locale];
        get().setTranslations(next);
    },

    renameKey: (oldKey, newKey) => {
        if (!newKey || oldKey === newKey) return;
        const next = produce(get().translations, (draft) => {
            for (const table of Object.values(draft)) {
                if (oldKey in table) {
                    table[newKey] = table[oldKey];
                    delete table[oldKey];
                }
            }
        });
        // Les quêtes qui utilisaient l'ancienne clé suivent le renommage.
        const rename = (obj: any) => {
            if (!obj || typeof obj !== "object") return;
            for (const field of ["name", "description"]) if (obj[field] === oldKey) obj[field] = newKey;
            for (const list of ["tasks", "subtasks"]) if (Array.isArray(obj[list])) obj[list].forEach(rename);
        };
        const nextQuests = produce(get().quests, (draft) => {
            draft.forEach(rename);
        });
        set({ translations: next, quests: nextQuests });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    deleteKey: (key) => {
        const next = produce(get().translations, (draft) => {
            for (const table of Object.values(draft)) delete table[key];
        });
        get().setTranslations(next);
    },

    moveQuest: (from, to) => {
        const quests = get().quests;
        if (to < 0 || to >= quests.length) return;
        const nextQuests = produce(quests, (draft) => {
            const [q] = draft.splice(from, 1);
            draft.splice(to, 0, q);
        });
        set({ quests: nextQuests });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    addQuest: (quest) => {
        const nextQuests = produce(get().quests, (draft) => {
            draft.push(quest);
        });
        set({
            quests: nextQuests,
            selectedQuestId: quest.id,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    deleteQuest: (questId) => {
        const currentQuests = get().quests;
        const nextQuests = currentQuests.filter((q) => q.id !== questId);
        const nextSelected = nextQuests.length > 0 ? nextQuests[0].id : null;

        set({
            quests: nextQuests,
            selectedQuestId: nextSelected,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    updateValueAt: (path, value) => {
        const nextQuests = produce(get().quests, (draft: any) => {
            const adjustedPath = path[0] === "quests" ? path.slice(1) : path;
            let current = draft;
            for (let i = 0; i < adjustedPath.length - 1; i++) {
                current = current[adjustedPath[i]];
            }
            current[adjustedPath[adjustedPath.length - 1]] = value;
        });

        set({ quests: nextQuests });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    duplicateQuest: (questId, newQuestId) => {
        const nextQuests = produce(get().quests, (draft) => {
            const originalIndex = draft.findIndex((q) => q.id === questId);
            if (originalIndex === -1) return;

            const copy = JSON.parse(JSON.stringify(draft[originalIndex])) as QuestData;
            copy.id = newQuestId;
            

            const regenerateTaskIds = (tasks: TaskData[]) => {
                tasks.forEach((task) => {
                    task.id = `${task.id}_copy`;
                    if (task.subtasks) regenerateTaskIds(task.subtasks);
                });
            };

            if (copy.tasks) regenerateTaskIds(copy.tasks);
            draft.push(copy);
        });

        set({
            quests: nextQuests,
            selectedQuestId: newQuestId,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    setQuests: async (newQuests) => {
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

        set({
            quests: newQuests,
            selectedQuestId: newQuests.length > 0 ? newQuests[0].id : null,
            saveStatus: "saving",
        });

        try {
            await useProjectStore.getState().saveActiveProjectQuests(newQuests);
            set({ saveStatus: "saved" });
        } catch (err) {
            console.error("Failed to save imported quests to project:", err);
            set({ saveStatus: "error" });
        }
    },
}));