import { useEffect, useRef, useState } from "react";
import {
    Archive,
    ArrowDown,
    ArrowUp,
    BarChart3,
    ChevronDown,
    ChevronRight,
    Copy,
    Gem,
    GitBranch,
    Languages,
    ListChecks,
    MapPin,
    Plus,
    Puzzle,
    Sparkles,
    Trash2,
    Wand2,
    type LucideIcon,
} from "lucide-react";
import type { EntityDefinition, FieldDefinition, RewardData, TaskData } from "../types/QuestTypes";
import { registry } from "../lib/Registry";
import { useQuestStore } from "../store/useQuestStore";
import { useProjectStore } from "../store/useProjectStore";
import { useExtensionStore } from "../extensions/useExtensionStore";
import { looksLikeKey, resolveText, suggestKey } from "../lib/translations";
import { isRtl, localeInfo } from "../data/mcLocales";
import { t } from "../i18n";
import { tl } from "../i18n/labels";
import { ItemIcon } from "./ItemIcon";
import { RegistryField } from "./RegistryField";
import { askText } from "./Modal";

type Path = (string | number)[];
type Data = Record<string, any>;

const TYPE_ICONS: Record<string, LucideIcon> = {
    "questslib:stat": BarChart3,
    "questslib:location": MapPin,
    "questslib:any": GitBranch,
    "questslib:all": ListChecks,
    "questslib:item": Gem,
    "questslib:loot_table": Archive,
    "questslib:experience": Sparkles,
};
export const typeIcon = (typeId: string): LucideIcon => TYPE_ICONS[typeId] ?? Puzzle;

/** Formulaire généré à partir d'une définition du registre. */
export function DynamicForm({ definition, data, path, depth = 0, skip = [] }: { definition: EntityDefinition; data: Data; path: Path; depth?: number; skip?: string[] }) {
    const update = useQuestStore((s) => s.updateValueAt);
    const simple = definition.fields.filter((f) => f.type !== "taskList" && f.type !== "rewardList" && !skip.includes(f.key));
    const lists = definition.fields.filter((f) => f.type === "taskList" || f.type === "rewardList");

    return (
        <div className="form">
            {simple.length > 0 && (
                <div className="field-grid">
                    {simple.map((field) => (
                        <Field key={field.key} field={field} value={data[field.key]} parent={data} onChange={(v) => update([...path, field.key], v)} />
                    ))}
                </div>
            )}
            {lists.map((field) =>
                field.type === "taskList" ? (
                    <EntityList key={field.key} kind="task" label={tl(field.label)} items={data[field.key] || []} path={[...path, field.key]} depth={depth} />
                ) : (
                    <EntityList key={field.key} kind="reward" label={tl(field.label)} items={data[field.key] || []} path={[...path, field.key]} depth={depth} />
                ),
            )}
        </div>
    );
}

function Field({ field, value, parent, onChange }: { field: FieldDefinition; value: any; parent: Data; onChange: (v: any) => void }) {
    const wide = field.multiline || field.type === "registrySelector" || field.translatable;
    const registryType = field.registryTypeResolver ? field.registryTypeResolver(parent) : field.registryType || "items";

    let control;
    if (field.translatable) {
        control = <TranslatableInput field={field} value={value ?? ""} ownerId={parent.id ?? ""} onChange={onChange} />;
    } else if (field.type === "text") {
        control = field.multiline ? (
            <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        ) : (
            <input className={field.key === "id" || field.key.endsWith("table") ? "mono" : ""} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        );
    } else if (field.type === "number") {
        control = (
            <input
                type="number"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            />
        );
    } else if (field.type === "boolean") {
        control = (
            <label className="switch">
                <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
                <span />
            </label>
        );
    } else if (field.type === "select") {
        control = (
            <div className="segmented" role="radiogroup">
                {field.options?.map((o) => (
                    <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
                        {tl(o.label)}
                    </button>
                ))}
            </div>
        );
    } else if (field.type === "registrySelector") {
        control = <RegistryField registryType={registryType} value={value ?? ""} onChange={onChange} />;
    }

    return (
        <div className={wide ? "field wide" : "field"}>
            <span className="field-label">
                {tl(field.label)}
                {field.required && <span className="required">*</span>}
            </span>
            {control}
        </div>
    );
}

/** Champ dont la valeur est une clé de traduction : on édite la clé et sa traduction dans la langue de prévisualisation. */
function TranslatableInput({ field, value, ownerId, onChange }: { field: FieldDefinition; value: string; ownerId: string; onChange: (v: string) => void }) {
    const locale = useQuestStore((s) => s.previewLocale);
    const translations = useQuestStore((s) => s.translations);
    const setTranslation = useQuestStore((s) => s.setTranslation);
    const translated = translations[locale]?.[value];
    const fallback = resolveText(translations, locale, value);
    const isPlainText = value !== "" && !looksLikeKey(value);

    const convert = () => {
        const key = suggestKey(ownerId || "questslib:quest", field.key);
        setTranslation(locale, key, value);
        onChange(key);
    };

    return (
        <div className="translatable">
            <div className="key-row">
                <input className="mono" value={value} placeholder={t("clé.de.traduction")} onChange={(e) => onChange(e.target.value)} />
                {isPlainText && (
                    <button type="button" className="btn small" onClick={convert} title={t("Remplace ce texte par une clé et le range dans la langue {lang}", { lang: locale })}>
                        <Wand2 size={13} /> {t("En faire une clé")}
                    </button>
                )}
            </div>
            {value !== "" && !isPlainText && (
                <div className="translation-row">
                    <span className="locale-chip" title={localeInfo(locale).name}>
                        <Languages size={12} /> {locale}
                    </span>
                    {field.multiline ? (
                        <textarea
                            rows={2}
                            dir={isRtl(locale) ? "rtl" : "ltr"}
                            value={translated ?? ""}
                            placeholder={fallback.text !== value ? fallback.text : t("Pas encore traduit")}
                            onChange={(e) => setTranslation(locale, value, e.target.value)}
                        />
                    ) : (
                        <input
                            dir={isRtl(locale) ? "rtl" : "ltr"}
                            value={translated ?? ""}
                            placeholder={fallback.text !== value ? fallback.text : t("Pas encore traduit")}
                            onChange={(e) => setTranslation(locale, value, e.target.value)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

/** Liste de tâches ou de récompenses, avec cartes repliables. */
function EntityList({ kind, label, items, path, depth }: { kind: "task" | "reward"; label: string; items: (TaskData | RewardData)[]; path: Path; depth: number }) {
    useExtensionStore((s) => s.extensions); // re-rendu quand les extensions changent
    const update = useQuestStore((s) => s.updateValueAt);
    const translations = useQuestStore((s) => s.translations);
    const locale = useQuestStore((s) => s.previewLocale);
    const getNs = useProjectStore((s) => s.getActiveNamespace);
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const types = kind === "task" ? registry.getTaskTypes() : registry.getRewardTypes();
    const getDef = (it: any) => (kind === "task" ? registry.getTaskDef(it.task) : registry.getRewardDef(it.reward));

    const add = async (typeId: string) => {
        if (kind === "task") {
            const ns = getNs();
            const id = await askText(t("Nouvelle tâche"), `${ns}:task_${items.length + 1}`, t("Identifiant de la tâche (namespace:chemin)"));
            if (!id) return;
            update(path, [...items, registry.createDefaultTask(typeId, id.includes(":") ? id : `${ns}:${id}`)]);
        } else {
            update(path, [...items, registry.createDefaultReward(typeId)]);
        }
    };

    const move = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        update(path, next);
    };

    const duplicate = (i: number) => {
        const copy = JSON.parse(JSON.stringify(items[i]));
        if (kind === "task") {
            const bump = (task: TaskData) => {
                task.id = `${task.id}_copy`;
                task.subtasks?.forEach(bump);
            };
            bump(copy);
        }
        const next = [...items];
        next.splice(i + 1, 0, copy);
        update(path, next);
    };

    return (
        <section className={`entity-list ${kind}`} style={{ ["--depth" as string]: depth }}>
            <header className="entity-list-head">
                <h3>
                    {label} <span className="count-pill">{items.length}</span>
                </h3>
                <TypeMenu kind={kind} types={types} onPick={add} />
            </header>
            {items.length === 0 && <p className="empty-inline muted">{kind === "task" ? t("Aucune tâche.") : t("Aucune récompense.")}</p>}
            {items.map((it: any, i) => {
                const typeId = kind === "task" ? it.task : it.reward;
                const def = getDef(it);
                const Icon = typeIcon(typeId);
                const isCollapsed = collapsed[i];
                const target = it.target ?? it.item ?? it.location;
                const targetType = def?.fields.find((f) => f.type === "registrySelector");
                const regType = targetType ? (targetType.registryTypeResolver ? targetType.registryTypeResolver(it) : targetType.registryType || "items") : "items";
                const title = kind === "task" ? resolveText(translations, locale, it.name).text || it.id : summaryOf(it);

                return (
                    <article key={i} className={isCollapsed ? "card collapsed" : "card"}>
                        <header className="card-head" onClick={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}>
                            <span className="chevron">{isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</span>
                            <span className={`type-badge ${kind}`}>
                                <Icon size={13} /> {def ? tl(def.label) : typeId}
                            </span>
                            {typeof target === "string" && target && <ItemIcon id={target} registryType={regType} size={20} />}
                            <span className="card-title">{title}</span>
                            {kind === "task" && <span className="card-sub mono">{it.id}</span>}
                            <span className="row-tools" onClick={(e) => e.stopPropagation()}>
                                <button className="icon-btn" title={t("Monter")} disabled={i === 0} onClick={() => move(i, -1)}>
                                    <ArrowUp size={14} />
                                </button>
                                <button className="icon-btn" title={t("Descendre")} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                                    <ArrowDown size={14} />
                                </button>
                                <button className="icon-btn" title={t("Dupliquer")} onClick={() => duplicate(i)}>
                                    <Copy size={14} />
                                </button>
                                <button className="icon-btn danger" title={t("Supprimer")} onClick={() => update(path, items.filter((_, j) => j !== i))}>
                                    <Trash2 size={14} />
                                </button>
                            </span>
                        </header>
                        {!isCollapsed && (
                            <div className="card-body">
                                {def ? (
                                    <DynamicForm definition={def} data={it} path={[...path, i]} depth={depth + 1} />
                                ) : (
                                    <p className="warn-text">{t("Type inconnu : {type}. Installez l'extension qui le définit.", { type: typeId })}</p>
                                )}
                            </div>
                        )}
                    </article>
                );
            })}
        </section>
    );
}

function summaryOf(reward: any): string {
    if (reward.reward === "questslib:item") return `${reward.amount ?? 1} × ${reward.item ?? "?"}`;
    if (reward.reward === "questslib:experience") {
        const parts = [];
        if (reward.levels) parts.push(t("{n} niveau(x)", { n: reward.levels }));
        if (reward.points) parts.push(t("{n} point(s)", { n: reward.points }));
        return parts.join(" + ") || t("Expérience");
    }
    if (reward.reward === "questslib:loot_table") return reward.loot_table ?? "";
    return "";
}

function TypeMenu({ kind, types, onPick }: { kind: "task" | "reward"; types: { typeId: string; label: string }[]; onPick: (typeId: string) => void }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
        const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("pointerdown", close);
        window.addEventListener("keydown", key);
        return () => {
            window.removeEventListener("pointerdown", close);
            window.removeEventListener("keydown", key);
        };
    }, [open]);

    return (
        <div className="menu-anchor" ref={root}>
            <button className="btn small" onClick={() => setOpen(!open)} aria-expanded={open}>
                <Plus size={13} /> {kind === "task" ? t("Ajouter une tâche") : t("Ajouter une récompense")}
            </button>
            {open && (
                <div className="menu" role="menu">
                    {types.map((ty) => {
                        const Icon = typeIcon(ty.typeId);
                        return (
                            <button
                                key={ty.typeId}
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    onPick(ty.typeId);
                                }}
                            >
                                <Icon size={15} />
                                <span>{tl(ty.label)}</span>
                                <span className="mono muted small">{ty.typeId}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
