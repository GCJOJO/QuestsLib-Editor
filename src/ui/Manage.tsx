import { useRef, useState } from "react";
import { Check, Copy, Database, Download, FileUp, FolderOpen, Pencil, Power, Puzzle, Trash2, Wand2 } from "lucide-react";
import { useProjectStore } from "../store/useProjectStore";
import { useDatasetStore, validateDatasetJson } from "../store/useDatasetStore";
import { useExtensionStore, validateExtensionPackage } from "../extensions/useExtensionStore";
import type { ExtensionPackage, ProjectMetadata } from "../types/QuestTypes";
import { downloadJson } from "../lib/translations";
import { exportExtensionToJson } from "../utils/fileHandler";
import { getLang, t } from "../i18n";
import { Modal, askConfirm, toast } from "./Modal";
import { registryName } from "./RegistryField";

function readJsonFile(file: File): Promise<unknown> {
    return file.text().then((text) => JSON.parse(text));
}

function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString(getLang(), { day: "numeric", month: "short", year: "numeric" });
}

// --- Projets ------------------------------------------------------------------------------------

export function ProjectsView() {
    const { projects, activeProjectId, selectProject, createProject, duplicateProject, deleteProject } = useProjectStore();
    const [editing, setEditing] = useState<ProjectMetadata | "new" | null>(null);

    return (
        <div className="manage">
            <header className="manage-head">
                <div>
                    <h1>{t("Projets")}</h1>
                    <p className="muted">{t("Chaque projet a ses quêtes, son namespace et ses traductions. Tout est enregistré dans ce navigateur.")}</p>
                </div>
                <button className="btn primary" onClick={() => setEditing("new")}>
                    <FolderOpen size={15} /> {t("Nouveau projet")}
                </button>
            </header>
            <div className="tiles">
                {projects.map((p) => {
                    const active = p.id === activeProjectId;
                    return (
                        <article key={p.id} className={active ? "tile active" : "tile"}>
                            <div className="tile-head">
                                <h3>{p.name}</h3>
                                {active && <span className="chip accent-chip">{t("Actif")}</span>}
                            </div>
                            {p.description && <p className="muted">{p.description}</p>}
                            <div className="tile-meta">
                                <span className="chip mono">{p.namespace || "questslib"}</span>
                                <span className="chip">{t("{n} quête(s)", { n: p.questCount })}</span>
                                <span className="muted small">{t("Modifié le {date}", { date: formatDate(p.updatedAt) })}</span>
                            </div>
                            <div className="tile-actions">
                                {!active && (
                                    <button className="btn small primary" onClick={() => selectProject(p.id)}>
                                        <Check size={13} /> {t("Ouvrir")}
                                    </button>
                                )}
                                <button className="btn small" onClick={() => setEditing(p)}>
                                    <Pencil size={13} /> {t("Modifier")}
                                </button>
                                <button className="btn small" onClick={() => duplicateProject(p.id, `${p.name} (${t("copie")})`)}>
                                    <Copy size={13} /> {t("Dupliquer")}
                                </button>
                                <button
                                    className="icon-btn danger"
                                    title={t("Supprimer")}
                                    disabled={projects.length <= 1}
                                    onClick={async () => {
                                        if (await askConfirm(t("Supprimer le projet"), t("Supprimer « {name} » et toutes ses quêtes ? Cette action est définitive.", { name: p.name }), { danger: true, confirmLabel: t("Supprimer") })) {
                                            const res = await deleteProject(p.id);
                                            if (!res.success) toast(res.error ?? "", "error");
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
            {editing && (
                <ProjectForm
                    project={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onCreate={(name, desc, ns) => createProject(name, desc, undefined, ns)}
                />
            )}
        </div>
    );
}

function ProjectForm({ project, onClose, onCreate }: { project: ProjectMetadata | null; onClose: () => void; onCreate: (name: string, desc: string, ns: string) => Promise<string> }) {
    const update = useProjectStore((s) => s.updateProjectMetadata);
    const [name, setName] = useState(project?.name ?? "");
    const [ns, setNs] = useState(project?.namespace ?? "questslib");
    const [desc, setDesc] = useState(project?.description ?? "");
    const cleanNs = ns.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");

    const submit = async () => {
        if (!name.trim()) return;
        if (project) await update(project.id, { name: name.trim(), namespace: cleanNs || "questslib", description: desc.trim() });
        else await onCreate(name.trim(), desc.trim(), cleanNs || "questslib");
        onClose();
    };

    return (
        <Modal
            title={project ? t("Modifier le projet") : t("Nouveau projet")}
            onClose={onClose}
            footer={
                <>
                    <button className="btn" onClick={onClose}>
                        {t("Annuler")}
                    </button>
                    <button className="btn primary" disabled={!name.trim()} onClick={submit}>
                        {project ? t("Enregistrer") : t("Créer")}
                    </button>
                </>
            }
        >
            <div className="stack">
                <label className="field">
                    <span className="field-label">{t("Nom")}</span>
                    <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
                </label>
                <label className="field">
                    <span className="field-label">{t("Namespace")}</span>
                    <input className="mono" value={ns} onChange={(e) => setNs(e.target.value)} />
                    <span className="field-hint">{t("Préfixe des identifiants de quêtes et de tâches (namespace:chemin).")}</span>
                </label>
                <label className="field">
                    <span className="field-label">{t("Description")}</span>
                    <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
                </label>
            </div>
        </Modal>
    );
}

// --- Données Minecraft --------------------------------------------------------------------------

export function DataView() {
    const { datasets, activeDatasetId, importDataset, deleteDataset, setActiveDataset } = useDatasetStore();
    const input = useRef<HTMLInputElement>(null);

    const onFile = async (file: File) => {
        try {
            const res = validateDatasetJson(await readJsonFile(file));
            if (!res.valid || !res.dataset) return toast(res.error ?? t("Format invalide."), "error");
            const saved = await importDataset(res.dataset);
            toast(saved.success ? t("« {name} » importé.", { name: res.dataset.name }) : (saved.error ?? ""), saved.success ? "ok" : "error");
        } catch {
            toast(t("Fichier JSON invalide."), "error");
        }
    };

    const template = () =>
        downloadJson(
            {
                id: "my_modpack_dump",
                name: "My modpack",
                version: "1.21.1",
                registries: {
                    items: [{ id: "create:wrench", name: "Wrench" }],
                    blocks: [{ id: "create:cogwheel", name: "Cogwheel" }],
                    biomes: [{ id: "biomesoplenty:origin_valley", name: "Origin Valley" }],
                },
            },
            "dataset_template.json",
        );

    return (
        <div className="manage">
            <header className="manage-head">
                <div>
                    <h1>{t("Données Minecraft")}</h1>
                    <p className="muted">{t("Listes d'objets, blocs, entités, biomes et structures proposées dans les sélecteurs. Importez celles de votre modpack.")}</p>
                </div>
                <div className="row">
                    <input ref={input} type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0]).finally(() => (e.target.value = ""))} />
                    <button className="btn" onClick={template}>
                        <Download size={15} /> {t("Modèle")}
                    </button>
                    <button className="btn primary" onClick={() => input.current?.click()}>
                        <FileUp size={15} /> {t("Importer")}
                    </button>
                </div>
            </header>
            <div className="tiles">
                {datasets.map((d) => {
                    const active = d.id === activeDatasetId;
                    return (
                        <article key={d.id} className={active ? "tile active" : "tile"}>
                            <div className="tile-head">
                                <Database size={16} className="accent" />
                                <h3>{d.name}</h3>
                                {active && <span className="chip accent-chip">{t("Actif")}</span>}
                            </div>
                            <div className="tile-meta">
                                {d.version && <span className="chip">{d.version}</span>}
                                {d.isDefault && <span className="chip">{t("Intégré")}</span>}
                            </div>
                            <div className="tile-meta">
                                {Object.entries(d.registries).map(([k, v]) => (
                                    <span key={k} className="muted small">
                                        {registryName(k)} : {v.length}
                                    </span>
                                ))}
                            </div>
                            <div className="tile-actions">
                                {!active && (
                                    <button className="btn small primary" onClick={() => setActiveDataset(d.id)}>
                                        <Check size={13} /> {t("Utiliser")}
                                    </button>
                                )}
                                {!d.isDefault && (
                                    <button className="icon-btn danger" title={t("Supprimer")} onClick={() => deleteDataset(d.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

// --- Extensions ---------------------------------------------------------------------------------

const SAMPLE_EXTENSION: ExtensionPackage = {
    id: "sample_combat",
    name: "Sample Combat Extension",
    version: "1.0.0",
    description: "Boss fight tasks and reputation rewards.",
    enabled: true,
    tasks: [
        {
            typeId: "sample_combat:boss_fight",
            label: "Boss Fight",
            fields: [
                { key: "id", label: "Task ID", type: "text", required: true },
                { key: "name", label: "Name", type: "text", translatable: true },
                {
                    key: "boss_type",
                    label: "Boss",
                    type: "select",
                    defaultValue: "minecraft:wither",
                    options: [
                        { label: "Wither", value: "minecraft:wither" },
                        { label: "Ender Dragon", value: "minecraft:ender_dragon" },
                        { label: "Elder Guardian", value: "minecraft:elder_guardian" },
                        { label: "Warden", value: "minecraft:warden" },
                    ],
                },
                { key: "amount", label: "Amount", type: "number", defaultValue: 1 },
                { key: "rewards", label: "Task Rewards", type: "rewardList" },
            ],
        },
    ],
    rewards: [
        {
            typeId: "sample_combat:reputation",
            label: "Reputation",
            fields: [
                { key: "faction", label: "Faction", type: "text", required: true, defaultValue: "villagers" },
                { key: "points", label: "Points", type: "number", required: true, defaultValue: 100 },
            ],
        },
    ],
};

export function ExtensionsView() {
    const { extensions, installExtension, uninstallExtension, toggleExtension } = useExtensionStore();
    const input = useRef<HTMLInputElement>(null);

    const install = async (pkg: ExtensionPackage) => {
        const res = await installExtension(pkg);
        toast(res.success ? t("Extension « {name} » installée.", { name: pkg.name }) : (res.error ?? ""), res.success ? "ok" : "error");
    };

    const onFile = async (file: File) => {
        try {
            const res = validateExtensionPackage(await readJsonFile(file));
            if (!res.valid || !res.pkg) return toast(res.error ?? t("Extension invalide."), "error");
            await install(res.pkg);
        } catch {
            toast(t("Fichier JSON invalide."), "error");
        }
    };

    return (
        <div className="manage">
            <header className="manage-head">
                <div>
                    <h1>{t("Extensions")}</h1>
                    <p className="muted">{t("Ajoutent des types de tâches et de récompenses décrits en JSON, pour les mods qui étendent QuestsLib.")}</p>
                </div>
                <div className="row">
                    <input ref={input} type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0]).finally(() => (e.target.value = ""))} />
                    <button className="btn" onClick={() => install(SAMPLE_EXTENSION)}>
                        <Wand2 size={15} /> {t("Installer l'exemple")}
                    </button>
                    <button className="btn primary" onClick={() => input.current?.click()}>
                        <FileUp size={15} /> {t("Importer")}
                    </button>
                </div>
            </header>
            {extensions.length === 0 ? (
                <div className="empty">
                    <Puzzle size={32} />
                    <p>{t("Aucune extension installée.")}</p>
                </div>
            ) : (
                <div className="tiles">
                    {extensions.map((ext) => (
                        <article key={ext.id} className={ext.enabled === false ? "tile disabled" : "tile"}>
                            <div className="tile-head">
                                <Puzzle size={16} className="accent" />
                                <h3>{ext.name}</h3>
                                {ext.version && <span className="chip">v{ext.version}</span>}
                            </div>
                            {ext.description && <p className="muted">{ext.description}</p>}
                            <div className="tile-meta">
                                <span className="chip mono">{ext.id}</span>
                                <span className="muted small">{t("{n} tâche(s)", { n: ext.tasks?.length ?? 0 })}</span>
                                <span className="muted small">{t("{n} récompense(s)", { n: ext.rewards?.length ?? 0 })}</span>
                            </div>
                            <div className="tile-actions">
                                <button className={ext.enabled === false ? "btn small" : "btn small toggled"} onClick={() => toggleExtension(ext.id)}>
                                    <Power size={13} /> {ext.enabled === false ? t("Désactivée") : t("Activée")}
                                </button>
                                <button className="btn small" onClick={() => exportExtensionToJson(ext)}>
                                    <Download size={13} /> {t("Exporter")}
                                </button>
                                <button
                                    className="icon-btn danger"
                                    title={t("Désinstaller")}
                                    onClick={async () => {
                                        if (await askConfirm(t("Désinstaller"), ext.name, { danger: true, confirmLabel: t("Désinstaller") })) uninstallExtension(ext.id);
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
