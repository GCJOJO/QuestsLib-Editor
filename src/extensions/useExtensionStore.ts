import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type { ExtensionPackage, EntityDefinition, FieldDefinition } from "../types/QuestTypes";
import { registry } from "../lib/Registry";

const EXTENSIONS_STORAGE_KEY = "questslib:extensions";

export function validateExtensionPackage(data: unknown): { valid: boolean; pkg?: ExtensionPackage; error?: string } {
    if (!data || typeof data !== "object") {
        return { valid: false, error: "Le paquet d'extension doit être un objet JSON valide." };
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== "string" || !obj.id.trim()) {
        return { valid: false, error: "L'extension doit avoir un champ 'id' (identifiant unique)." };
    }

    if (typeof obj.name !== "string" || !obj.name.trim()) {
        return { valid: false, error: "L'extension doit avoir un champ 'name'." };
    }

    const validateFields = (fields: unknown, context: string): { valid: boolean; error?: string } => {
        if (!Array.isArray(fields)) {
            return { valid: false, error: `${context} : 'fields' doit être une liste de champs.` };
        }
        for (const f of fields) {
            if (!f || typeof f !== "object" || typeof (f as FieldDefinition).key !== "string" || !(f as FieldDefinition).key.trim()) {
                return { valid: false, error: `${context} : chaque champ doit posséder une propriété 'key'.` };
            }
            if (typeof (f as FieldDefinition).label !== "string") {
                return { valid: false, error: `${context} : le champ '${(f as FieldDefinition).key}' doit avoir un 'label'.` };
            }
            if (typeof (f as FieldDefinition).type !== "string") {
                return { valid: false, error: `${context} : le champ '${(f as FieldDefinition).key}' doit avoir un 'type'.` };
            }
        }
        return { valid: true };
    };

    const validateEntities = (entities: unknown, typeName: string): { valid: boolean; error?: string } => {
        if (!Array.isArray(entities)) {
            return { valid: false, error: `'${typeName}' doit être une liste de définitions.` };
        }
        for (const item of entities) {
            if (!item || typeof item !== "object" || typeof (item as EntityDefinition).typeId !== "string" || !(item as EntityDefinition).typeId.trim()) {
                return { valid: false, error: `Dans '${typeName}' : chaque élément doit avoir un 'typeId' (ex: mon_mod:ma_tache).` };
            }
            if (typeof (item as EntityDefinition).label !== "string") {
                return { valid: false, error: `Dans '${typeName}' : l'élément '${(item as EntityDefinition).typeId}' doit avoir un 'label'.` };
            }
            const fieldRes = validateFields((item as EntityDefinition).fields, `Dans '${(item as EntityDefinition).typeId}'`);
            if (!fieldRes.valid) return fieldRes;
        }
        return { valid: true };
    };

    if (obj.tasks !== undefined) {
        const res = validateEntities(obj.tasks, "tasks");
        if (!res.valid) return res;
    }

    if (obj.rewards !== undefined) {
        const res = validateEntities(obj.rewards, "rewards");
        if (!res.valid) return res;
    }

    const pkg: ExtensionPackage = {
        id: obj.id.trim(),
        name: obj.name.trim(),
        version: typeof obj.version === "string" ? obj.version : undefined,
        description: typeof obj.description === "string" ? obj.description : undefined,
        enabled: obj.enabled !== false,
        tasks: (obj.tasks as EntityDefinition[]) || [],
        rewards: (obj.rewards as EntityDefinition[]) || [],
    };

    return { valid: true, pkg };
}

interface ExtensionState {
    extensions: ExtensionPackage[];
    isLoading: boolean;
    loadExtensions: () => Promise<void>;
    installExtension: (pkg: ExtensionPackage) => Promise<{ success: boolean; error?: string }>;
    uninstallExtension: (id: string) => Promise<void>;
    toggleExtension: (id: string) => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
    extensions: [],
    isLoading: true,

    loadExtensions: async () => {
        try {
            const stored = (await idbGet(EXTENSIONS_STORAGE_KEY)) as ExtensionPackage[] | undefined;
            if (Array.isArray(stored)) {
                stored.forEach((pkg) => {
                    if (pkg.enabled !== false) {
                        registry.registerExtension(pkg);
                    }
                });
                set({ extensions: stored, isLoading: false });
            } else {
                set({ extensions: [], isLoading: false });
            }
        } catch (e) {
            console.error("Erreur lors du chargement des extensions :", e);
            set({ extensions: [], isLoading: false });
        }
    },

    installExtension: async (newPkg: ExtensionPackage) => {
        const current = get().extensions;
        const existingIndex = current.findIndex((p) => p.id === newPkg.id);

        let updated: ExtensionPackage[];
        if (existingIndex >= 0) {
            registry.unregisterExtension(newPkg.id);
            updated = [...current];
            updated[existingIndex] = { ...newPkg, enabled: true };
        } else {
            updated = [...current, { ...newPkg, enabled: true }];
        }

        registry.registerExtension(newPkg);

        try {
            await idbSet(EXTENSIONS_STORAGE_KEY, updated);
            set({ extensions: updated });
            return { success: true };
        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde de l'extension :", err);
            return { success: false, error: err?.message || "Erreur de stockage IndexedDB" };
        }
    },

    uninstallExtension: async (id: string) => {
        registry.unregisterExtension(id);
        const updated = get().extensions.filter((p) => p.id !== id);
        try {
            await idbSet(EXTENSIONS_STORAGE_KEY, updated);
            set({ extensions: updated });
        } catch (err) {
            console.error("Erreur lors de la suppression de l'extension :", err);
        }
    },

    toggleExtension: async (id: string) => {
        const current = get().extensions;
        const target = current.find((p) => p.id === id);
        if (!target) return;

        const nextEnabled = !target.enabled;

        if (nextEnabled) {
            registry.registerExtension(target);
        } else {
            registry.unregisterExtension(target.id);
        }

        const updated = current.map((p) => (p.id === id ? { ...p, enabled: nextEnabled } : p));
        try {
            await idbSet(EXTENSIONS_STORAGE_KEY, updated);
            set({ extensions: updated });
        } catch (err) {
            console.error("Erreur lors de la modification du statut de l'extension :", err);
        }
    },
}));
