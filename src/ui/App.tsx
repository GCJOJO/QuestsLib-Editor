import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Check,
    Copy,
    Database,
    Download,
    FileUp,
    FolderOpen,
    Languages,
    Loader2,
    Plus,
    Puzzle,
    ScrollText,
    Search,
    Trash2,
} from "lucide-react";
import { useQuestStore } from "../store/useQuestStore";
import { useProjectStore } from "../store/useProjectStore";
import { useDatasetStore } from "../store/useDatasetStore";
import { useExtensionStore } from "../extensions/useExtensionStore";
import { registry } from "../lib/Registry";
import { resolveText } from "../lib/translations";
import { exportQuestsToJson, parseAndValidateQuestsJson } from "../utils/fileHandler";
import type { QuestData } from "../types/QuestTypes";
import { localeInfo } from "../data/mcLocales";
import { t, useLang } from "../i18n";
import { DialogHost, Modal, ToastHost, askConfirm, askText, toast } from "./Modal";
import { OptionsMenu } from "./OptionsMenu";
import { QuestEditor, questIcon } from "./QuestEditor";
import { TranslationsView, LocalePicker } from "./TranslationsView";
import { DataView, ExtensionsView, ProjectsView } from "./Manage";
import { ItemIcon } from "./ItemIcon";

type View = "quests" | "translations" | "projects" | "data" | "extensions";

const VIEWS: { id: View; label: string; icon: typeof ScrollText }[] = [
    { id: "quests", label: "Quêtes", icon: ScrollText },
    { id: "translations", label: "Traductions", icon: Languages },
    { id: "projects", label: "Projets", icon: FolderOpen },
    { id: "data", label: "Données Minecraft", icon: Database },
    { id: "extensions", label: "Extensions", icon: Puzzle },
];

export function App() {
    useLang(); // re-rendu de toute l'interface quand la langue change
    const { quests, selectedQuestId, saveStatus, setSelectedQuest, addQuest, deleteQuest, duplicateQuest, setQuests, translations, previewLocale, setPreviewLocale } =
        useQuestStore();
    const { projects, activeProjectId, loadProjects, selectProject, createProject, getActiveNamespace } = useProjectStore();
    const loadDatasets = useDatasetStore((s) => s.loadDatasets);
    const loadExtensions = useExtensionStore((s) => s.loadExtensions);

    const [view, setView] = useState<View>("quests");
    const [query, setQuery] = useState("");
    const [pickLocale, setPickLocale] = useState(false);
    const [pendingImport, setPendingImport] = useState<{ quests: QuestData[]; name: string } | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProjects();
        loadDatasets();
        loadExtensions();
    }, [loadProjects, loadDatasets, loadExtensions]);

    const activeProject = projects.find((p) => p.id === activeProjectId);
    const selectedIndex = quests.findIndex((q) => q.id === selectedQuestId);
    const selected = selectedIndex >= 0 ? quests[selectedIndex] : null;

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return quests
            .map((quest, index) => ({ quest, index, title: resolveText(translations, previewLocale, quest.name) }))
            .filter(({ quest, title }) => !q || quest.id.toLowerCase().includes(q) || title.text.toLowerCase().includes(q));
    }, [quests, query, translations, previewLocale]);

    const toId = (raw: string) => (raw.includes(":") ? raw : `${getActiveNamespace()}:${raw}`);

    const createQuest = async () => {
        const id = await askText(t("Nouvelle quête"), `${getActiveNamespace()}:quest_${quests.length + 1}`, t("Identifiant de la quête (namespace:chemin)"));
        if (!id) return;
        if (quests.some((q) => q.id === toId(id))) return toast(t("Une autre quête utilise déjà cet identifiant."), "error");
        addQuest(registry.createDefaultQuest(toId(id)));
        setView("quests");
    };

    const duplicate = async (id: string) => {
        const next = await askText(t("Dupliquer la quête"), `${id}_copy`, t("Identifiant de la copie"));
        if (next) duplicateQuest(id, toId(next));
    };

    const remove = async (quest: QuestData) => {
        const title = resolveText(translations, previewLocale, quest.name).text;
        if (await askConfirm(t("Supprimer la quête"), t("Supprimer « {name} » ({id}) ?", { name: title, id: quest.id }), { danger: true, confirmLabel: t("Supprimer") })) deleteQuest(quest.id);
    };

    const onImport = async (file: File) => {
        const res = parseAndValidateQuestsJson(await file.text());
        if (!res.valid || !res.quests) return toast(res.error || t("Fichier JSON non conforme."), "error");
        setPendingImport({ quests: res.quests, name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ") });
    };

    const exportQuests = () => {
        const filename = activeProject ? `${activeProject.name.toLowerCase().replace(/[^a-z0-9_-]/gi, "_")}_quests.json` : "quests.json";
        exportQuestsToJson(quests, filename);
    };

    const projectLocales = Object.keys(translations).sort();
    const localeOptions = [...new Set([...projectLocales, previewLocale])];

    return (
        <div className="app">
            <header className="topbar">
                <div className="brand">
                    <ScrollText size={18} />
                    QuestsLib <span>Editor</span>
                </div>
                <select className="project-select" value={activeProjectId} onChange={(e) => selectProject(e.target.value)} title={t("Projet actif")}>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <SaveBadge status={saveStatus} />
                <span className="spacer" />
                <label className="locale-select" title={t("Langue de prévisualisation des quêtes")}>
                    <Languages size={14} />
                    <select
                        value={previewLocale}
                        onChange={(e) => (e.target.value === "__other" ? setPickLocale(true) : setPreviewLocale(e.target.value))}
                    >
                        {localeOptions.map((code) => (
                            <option key={code} value={code}>
                                {code} — {localeInfo(code).name}
                            </option>
                        ))}
                        <option value="__other">{t("Autre langue…")}</option>
                    </select>
                </label>
                <div className="top-group">
                    <input ref={fileInput} type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0]).finally(() => (e.target.value = ""))} />
                    <button className="btn" onClick={() => fileInput.current?.click()} title={t("Importer un fichier de quêtes JSON")}>
                        <FileUp size={15} /> <span className="hide-sm">{t("Importer")}</span>
                    </button>
                    <button className="btn primary" onClick={exportQuests} title={t("Télécharger les quêtes en JSON")}>
                        <Download size={15} /> <span className="hide-sm">{t("Exporter")}</span>
                    </button>
                </div>
                <OptionsMenu />
            </header>

            <div className={view === "quests" ? "workspace" : "workspace no-list"}>
                <nav className="sidebar">
                    <div className="side-tabs">
                        {VIEWS.map(({ id, label, icon: Icon }) => (
                            <button key={id} className={view === id ? "on" : ""} onClick={() => setView(id)} title={t(label)}>
                                <Icon size={16} />
                                <span className="tab-label">{t(label)}</span>
                                {id === "quests" && <span className="count-pill">{quests.length}</span>}
                                {id === "translations" && projectLocales.length > 0 && <span className="count-pill">{projectLocales.length}</span>}
                            </button>
                        ))}
                    </div>
                    {view === "quests" && (
                        <>
                            <div className="side-actions">
                                <label className="search">
                                    <Search size={14} />
                                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Rechercher une quête")} />
                                </label>
                                <button className="btn icon primary" onClick={createQuest} title={t("Nouvelle quête")} aria-label={t("Nouvelle quête")}>
                                    <Plus size={16} />
                                </button>
                            </div>
                            <ul className="quest-list">
                                {filtered.map(({ quest, title }) => {
                                    const icon = questIcon(quest);
                                    return (
                                        <li key={quest.id} className={quest.id === selectedQuestId ? "quest-row selected" : "quest-row"}>
                                            <button className="quest-link" onClick={() => setSelectedQuest(quest.id)}>
                                                <span className="quest-icon">{icon ? <ItemIcon id={icon.id} registryType={icon.type} size={24} /> : <ScrollText size={16} />}</span>
                                                <span className="quest-text">
                                                    <span className={title.translated ? "quest-name" : "quest-name untranslated"}>{title.text || t("Sans titre")}</span>
                                                    <span className="quest-id mono">{quest.id}</span>
                                                </span>
                                            </button>
                                            <span className="row-tools">
                                                <button className="icon-btn" title={t("Dupliquer")} onClick={() => duplicate(quest.id)}>
                                                    <Copy size={14} />
                                                </button>
                                                <button className="icon-btn danger" title={t("Supprimer")} onClick={() => remove(quest)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </span>
                                        </li>
                                    );
                                })}
                                {filtered.length === 0 && <li className="muted pad">{quests.length ? t("Aucune quête ne correspond.") : t("Aucune quête.")}</li>}
                            </ul>
                        </>
                    )}
                </nav>

                <main className="main">
                    {view === "quests" &&
                        (selected ? (
                            <QuestEditor key={selectedIndex} quest={selected} index={selectedIndex} onDuplicate={() => duplicate(selected.id)} onDelete={() => remove(selected)} />
                        ) : (
                            <div className="empty">
                                <ScrollText size={36} />
                                <p>{t("Sélectionnez une quête à gauche, ou créez-en une.")}</p>
                                <button className="btn primary" onClick={createQuest}>
                                    <Plus size={15} /> {t("Nouvelle quête")}
                                </button>
                            </div>
                        ))}
                    {view === "translations" && <TranslationsView key={activeProjectId} />}
                    {view === "projects" && <ProjectsView />}
                    {view === "data" && <DataView />}
                    {view === "extensions" && <ExtensionsView />}
                </main>
            </div>

            {pickLocale && (
                <LocalePicker
                    title={t("Langue de prévisualisation")}
                    existing={projectLocales}
                    onClose={() => setPickLocale(false)}
                    onPick={(code) => {
                        setPreviewLocale(code);
                        setPickLocale(false);
                    }}
                />
            )}

            {pendingImport && (
                <Modal
                    title={t("Importer {n} quête(s)", { n: pendingImport.quests.length })}
                    onClose={() => setPendingImport(null)}
                    footer={
                        <>
                            <button className="btn" onClick={() => setPendingImport(null)}>
                                {t("Annuler")}
                            </button>
                            <button
                                className="btn"
                                onClick={async () => {
                                    await createProject(pendingImport.name, "", pendingImport.quests);
                                    setPendingImport(null);
                                    toast(t("Projet « {name} » créé.", { name: pendingImport.name }));
                                }}
                            >
                                {t("Nouveau projet")}
                            </button>
                            <button
                                className="btn danger"
                                onClick={async () => {
                                    await setQuests(pendingImport.quests);
                                    setPendingImport(null);
                                }}
                            >
                                {t("Remplacer")}
                            </button>
                        </>
                    }
                >
                    <p className="dialog-message">
                        {t("Remplacer les quêtes du projet « {project} », ou créer un nouveau projet « {name} » ?", {
                            project: activeProject?.name ?? "",
                            name: pendingImport.name,
                        })}
                    </p>
                </Modal>
            )}

            <DialogHost />
            <ToastHost />
        </div>
    );
}

function SaveBadge({ status }: { status: "saved" | "saving" | "error" }) {
    if (status === "saving")
        return (
            <span className="save-badge saving">
                <Loader2 size={13} className="spin" /> {t("Enregistrement…")}
            </span>
        );
    if (status === "error")
        return (
            <span className="save-badge error">
                <AlertTriangle size={13} /> {t("Erreur d'enregistrement")}
            </span>
        );
    return (
        <span className="save-badge">
            <Check size={13} /> {t("Enregistré")}
        </span>
    );
}

export default App;
