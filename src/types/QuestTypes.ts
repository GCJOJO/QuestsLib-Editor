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

// Registry
export type FieldType = "text" | "number" | "boolean" | "select" | "taskList" | "rewardList";

export type FieldOption = { label: string; value: string };

export type FieldDefinition = {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    multiline?: boolean;
    defaultValue?: unknown;
    options?: FieldOption[];
};

export type EntityDefinition = {
    typeId: string;
    label: string;
    fields: FieldDefinition[];
};