// JSON
export type RewardData = {
    reward: string;
    [key: string]: unknown;
};

export type TaskData = {
    task: string;
    id: string;
    name?: string;
    subtasks?: TaskData[];
    rewards?: RewardData[];
    [key: string]: unknown;
};

export type QuestData = {
    id: string;
    name: string;
    description?: string;
    tasks: TaskData[];
    rewards?: RewardData[];
    [key: string]: unknown;
};

// Registry & Fields
export type FieldType =
    | "text"
    | "number"
    | "boolean"
    | "select"
    | "taskList"
    | "rewardList"
    | "registrySelector";

export type FieldOption = { label: string; value: string };

export type FieldDefinition = {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    multiline?: boolean;
    defaultValue?: unknown;
    options?: FieldOption[];
    registryType?: string; // e.g. "items", "blocks", "biomes", "structures", "entities"
    registryTypeResolver?: (data: Record<string, any>) => string;
};

export type EntityDefinition = {
    typeId: string;
    label: string;
    fields: FieldDefinition[];
};

export type ExtensionPackage = {
    id: string;
    name: string;
    version?: string;
    description?: string;
    enabled?: boolean;
    tasks?: EntityDefinition[];
    rewards?: EntityDefinition[];
};

// Minecraft & Game Registries
export type GameRegistryItem = {
    id: string;
    name?: string;
    namespace?: string;
};

export type GameDataset = {
    id: string;
    name: string;
    version?: string;
    isDefault?: boolean;
    registries: Record<string, GameRegistryItem[]>;
};

// Multi-Projects
export type ProjectMetadata = {
    id: string;
    name: string;
    namespace?: string;
    description?: string;
    datasetId?: string;
    createdAt: number;
    updatedAt: number;
    questCount: number;
};

export type ProjectData = {
    metadata: ProjectMetadata;
    quests: QuestData[];
};