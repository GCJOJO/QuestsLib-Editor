import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type { GameDataset, GameRegistryItem } from "../types/QuestTypes";
import { DEFAULT_VANILLA_DATASET } from "../data/defaultVanillaDataset";

const DATASETS_STORAGE_KEY = "questslib:custom_datasets";
const ACTIVE_DATASET_KEY = "questslib:active_dataset_id";

export function validateDatasetJson(data: unknown): {
    valid: boolean;
    dataset?: GameDataset;
    error?: string;
} {
    if (!data || typeof data !== "object") {
        return { valid: false, error: "Le fichier doit être un objet JSON valide." };
    }

    const obj = data as Record<string, any>;

    // Support flexible : soit format complet { id, name, registries: { ... } },
    // soit format direct de dump { items: [...], blocks: [...], ... }
    const registriesObj = obj.registries && typeof obj.registries === "object" ? obj.registries : obj;

    const normalizedRegistries: Record<string, GameRegistryItem[]> = {};

    let totalEntries = 0;

    for (const [key, value] of Object.entries(registriesObj)) {
        if (key === "id" || key === "name" || key === "version" || key === "registries") continue;

        if (Array.isArray(value)) {
            const items: GameRegistryItem[] = [];
            for (const item of value) {
                if (typeof item === "string") {
                    const id = item.trim();
                    if (id) {
                        const name = id.split(":").pop()?.replace(/_/g, " ") || id;
                        items.push({ id, name, namespace: id.includes(":") ? id.split(":")[0] : "minecraft" });
                    }
                } else if (item && typeof item === "object" && typeof item.id === "string") {
                    const id = item.id.trim();
                    const name = typeof item.name === "string" ? item.name : id.split(":").pop()?.replace(/_/g, " ") || id;
                    items.push({
                        id,
                        name,
                        namespace: typeof item.namespace === "string" ? item.namespace : (id.includes(":") ? id.split(":")[0] : "minecraft"),
                    });
                }
            }
            if (items.length > 0) {
                normalizedRegistries[key] = items;
                totalEntries += items.length;
            }
        }
    }

    if (totalEntries === 0) {
        return {
            valid: false,
            error: "Aucun registre valide trouvé. Le fichier doit contenir des listes (ex: 'items', 'blocks', 'biomes', 'structures'...).",
        };
    }

    const id = typeof obj.id === "string" && obj.id.trim() ? obj.id.trim() : `custom_data_${Date.now()}`;
    const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : `Données importées (${new Date().toLocaleDateString()})`;
    const version = typeof obj.version === "string" ? obj.version : undefined;

    const dataset: GameDataset = {
        id,
        name,
        version,
        isDefault: false,
        registries: normalizedRegistries,
    };

    return { valid: true, dataset };
}

interface DatasetState {
    datasets: GameDataset[];
    activeDatasetId: string;
    isLoading: boolean;

    loadDatasets: () => Promise<void>;
    importDataset: (dataset: GameDataset) => Promise<{ success: boolean; error?: string }>;
    deleteDataset: (id: string) => Promise<void>;
    setActiveDataset: (id: string) => Promise<void>;
    getRegistryItems: (registryType: string, specificDatasetId?: string) => GameRegistryItem[];
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
    datasets: [DEFAULT_VANILLA_DATASET],
    activeDatasetId: DEFAULT_VANILLA_DATASET.id,
    isLoading: true,

    loadDatasets: async () => {
        try {
            const custom = ((await idbGet(DATASETS_STORAGE_KEY)) as GameDataset[]) || [];
            const savedActiveId = (await idbGet(ACTIVE_DATASET_KEY)) as string | undefined;

            const merged = [DEFAULT_VANILLA_DATASET, ...custom.filter((d) => d.id !== DEFAULT_VANILLA_DATASET.id)];
            const activeId = savedActiveId && merged.some((d) => d.id === savedActiveId)
                ? savedActiveId
                : DEFAULT_VANILLA_DATASET.id;

            set({
                datasets: merged,
                activeDatasetId: activeId,
                isLoading: false,
            });
        } catch (e) {
            console.error("Erreur chargement datasets:", e);
            set({ datasets: [DEFAULT_VANILLA_DATASET], activeDatasetId: DEFAULT_VANILLA_DATASET.id, isLoading: false });
        }
    },

    importDataset: async (dataset: GameDataset) => {
        const { datasets } = get();
        const existingIdx = datasets.findIndex((d) => d.id === dataset.id);

        let updated: GameDataset[];
        if (existingIdx >= 0) {
            updated = [...datasets];
            updated[existingIdx] = dataset;
        } else {
            updated = [...datasets, dataset];
        }

        const customOnly = updated.filter((d) => !d.isDefault);

        try {
            await idbSet(DATASETS_STORAGE_KEY, customOnly);
            await idbSet(ACTIVE_DATASET_KEY, dataset.id);
            set({ datasets: updated, activeDatasetId: dataset.id });
            return { success: true };
        } catch (err: any) {
            console.error("Erreur sauvegarde dataset:", err);
            return { success: false, error: err?.message || "Erreur de stockage IndexedDB" };
        }
    },

    deleteDataset: async (id: string) => {
        if (id === DEFAULT_VANILLA_DATASET.id) return; // Ne supprime pas le dataset de base

        const { datasets, activeDatasetId } = get();
        const updated = datasets.filter((d) => d.id !== id);
        const customOnly = updated.filter((d) => !d.isDefault);

        const nextActiveId = activeDatasetId === id ? DEFAULT_VANILLA_DATASET.id : activeDatasetId;

        try {
            await idbSet(DATASETS_STORAGE_KEY, customOnly);
            await idbSet(ACTIVE_DATASET_KEY, nextActiveId);
            set({ datasets: updated, activeDatasetId: nextActiveId });
        } catch (err) {
            console.error("Erreur suppression dataset:", err);
        }
    },

    setActiveDataset: async (id: string) => {
        const { datasets } = get();
        if (datasets.some((d) => d.id === id)) {
            try {
                await idbSet(ACTIVE_DATASET_KEY, id);
                set({ activeDatasetId: id });
            } catch (err) {
                console.error("Erreur set active dataset:", err);
            }
        }
    },

    getRegistryItems: (registryType: string, specificDatasetId?: string) => {
        const { datasets, activeDatasetId } = get();
        const targetId = specificDatasetId || activeDatasetId;
        const currentDataset = datasets.find((d) => d.id === targetId) || datasets.find((d) => d.id === DEFAULT_VANILLA_DATASET.id);

        if (!currentDataset) return [];

        // Correspondance directe ou fallback
        if (currentDataset.registries[registryType]) {
            return currentDataset.registries[registryType];
        }

        // Essayer aussi dans le Vanilla de base si non trouvé dans un dataset custom partiel
        if (currentDataset.id !== DEFAULT_VANILLA_DATASET.id && DEFAULT_VANILLA_DATASET.registries[registryType]) {
            return DEFAULT_VANILLA_DATASET.registries[registryType];
        }

        return [];
    },
}));
