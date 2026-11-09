import { useState } from "react";
import { Braces, Copy, ScrollText, Trash2 } from "lucide-react";
import type { QuestData, TaskData } from "../types/QuestTypes";
import { registry } from "../lib/Registry";
import { useQuestStore } from "../store/useQuestStore";
import { resolveText } from "../lib/translations";
import { localeInfo } from "../data/mcLocales";
import { t } from "../i18n";
import { ItemIcon } from "./ItemIcon";
import { DynamicForm } from "./Form";
import { Modal } from "./Modal";

/** Premier objet trouvé dans la quête, pour l'illustrer. */
export function questIcon(q: QuestData): { id: string; type: string } | null {
    const reward = q.rewards?.find((r) => r.reward === "questslib:item" && typeof r.item === "string");
    if (reward) return { id: reward.item as string, type: "items" };
    const walk = (tasks: TaskData[] = []): { id: string; type: string } | null => {
        for (const task of tasks) {
            if (task.task === "questslib:stat" && typeof task.target === "string") {
                const type = task.stat_type === "killed_mobs" ? "entities" : task.stat_type?.toString().includes("blocks") ? "blocks" : "items";
                return { id: task.target, type };
            }
            const sub = walk(task.subtasks);
            if (sub) return sub;
        }
        return null;
    };
    return walk(q.tasks);
}

function countTasks(tasks: TaskData[] = []): number {
    return tasks.reduce((n, task) => n + 1 + countTasks(task.subtasks), 0);
}

type Props = { quest: QuestData; index: number; onDuplicate: () => void; onDelete: () => void };

export function QuestEditor({ quest, index, onDuplicate, onDelete }: Props) {
    const update = useQuestStore((s) => s.updateValueAt);
    const select = useQuestStore((s) => s.setSelectedQuest);
    const quests = useQuestStore((s) => s.quests);
    const translations = useQuestStore((s) => s.translations);
    const locale = useQuestStore((s) => s.previewLocale);
    const [showJson, setShowJson] = useState(false);

    const title = resolveText(translations, locale, quest.name);
    const desc = resolveText(translations, locale, quest.description);
    const icon = questIcon(quest);
    const idTaken = quests.some((q, i) => i !== index && q.id === quest.id);

    return (
        <div className="quest-editor">
            <section className="hero">
                <div className="hero-icon">{icon ? <ItemIcon id={icon.id} registryType={icon.type} size={48} /> : <ScrollText size={30} />}</div>
                <div className="hero-text">
                    <h1 className={title.translated ? "" : "untranslated"} title={title.translated ? undefined : t("Clé non traduite en {lang}", { lang: localeInfo(locale).name })}>
                        {title.text || t("Sans titre")}
                    </h1>
                    {desc.text && <p className={desc.translated ? "" : "untranslated"}>{desc.text}</p>}
                    <div className="hero-meta">
                        <span className="chip">{t("{n} tâche(s)", { n: countTasks(quest.tasks) })}</span>
                        <span className="chip">{t("{n} récompense(s)", { n: quest.rewards?.length ?? 0 })}</span>
                        <span className="chip locale">{locale}</span>
                    </div>
                </div>
                <div className="hero-actions">
                    <button className="btn icon" title={t("Voir le JSON")} onClick={() => setShowJson(true)}>
                        <Braces size={15} />
                    </button>
                    <button className="btn icon" title={t("Dupliquer")} onClick={onDuplicate}>
                        <Copy size={15} />
                    </button>
                    <button className="btn icon danger" title={t("Supprimer")} onClick={onDelete}>
                        <Trash2 size={15} />
                    </button>
                </div>
            </section>

            <div className="field-grid">
                <div className="field wide">
                    <span className="field-label">
                        {t("Identifiant de la quête")}
                        <span className="required">*</span>
                    </span>
                    <input
                        className={idTaken ? "mono invalid" : "mono"}
                        value={quest.id}
                        onChange={(e) => {
                            update(["quests", index, "id"], e.target.value);
                            select(e.target.value);
                        }}
                    />
                    {idTaken && <span className="field-error">{t("Une autre quête utilise déjà cet identifiant.")}</span>}
                </div>
            </div>

            <DynamicForm definition={registry.questDefinition} data={quest} path={["quests", index]} skip={["id"]} />

            {showJson && (
                <Modal title={quest.id} onClose={() => setShowJson(false)} wide>
                    <pre className="json">{JSON.stringify(quest, null, 2)}</pre>
                </Modal>
            )}
        </div>
    );
}
