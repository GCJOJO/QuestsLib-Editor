import React, { useEffect, useState, useRef } from "react";
import { useQuestStore } from "./store/useQuestStore";
import { useProjectStore } from "./store/useProjectStore";
import { useDatasetStore } from "./store/useDatasetStore";
import { useExtensionStore } from "./extensions/useExtensionStore";
import { registry } from "./lib/Registry";
import { DynamicForm } from "./Components/DynamicForm";
import JsonPreview from "./Components/JSONPreview";
import Button from "./Components/UI/Button";
import { ExtensionManagerModal } from "./Components/Extensions/ExtensionManagerModal";
import { ProjectManagerModal } from "./Components/Modals/ProjectManagerModal";
import { DatasetManagerModal } from "./Components/Modals/DatasetManagerModal";
import { exportQuestsToJson, parseAndValidateQuestsJson } from "./utils/fileHandler";
import "./App.css";

export const App: React.FC = () => {
    const {
        quests,
        selectedQuestId,
        saveStatus,
        setSelectedQuest,
        addQuest,
        deleteQuest,
        duplicateQuest,
        setQuests,
    } = useQuestStore();

    const {
        projects,
        activeProjectId,
        loadProjects,
        selectProject,
        createProject,
    } = useProjectStore();

    const { loadDatasets } = useDatasetStore();
    const { loadExtensions } = useExtensionStore();

    const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialisation au montage
    useEffect(() => {
        loadProjects();
        loadDatasets();
        loadExtensions();
    }, [loadProjects, loadDatasets, loadExtensions]);

    const activeProject = projects.find((p) => p.id === activeProjectId);

    const selectedQuestIndex = quests.findIndex((q) => q.id === selectedQuestId);
    const selectedQuest = selectedQuestIndex >= 0 ? quests[selectedQuestIndex] : null;

    const handleCreateQuest = () => {
        const projectNs = activeProject?.namespace?.trim() || "questslib";
        const defaultId = `${projectNs}:quest_${quests.length + 1}`;
        const inputId = prompt(`Identifiant de la nouvelle quête :`, defaultId);
        if (!inputId || !inputId.trim()) return;

        const finalId = inputId.trim().includes(":") ? inputId.trim() : `${projectNs}:${inputId.trim()}`;
        addQuest(registry.createDefaultQuest(finalId));
    };

    const handleDeleteQuest = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la quête "${name}" (${id}) ?`)) {
            deleteQuest(id);
        }
    };

    const handleDuplicateQuest = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const projectNs = activeProject?.namespace?.trim() || "questslib";
        const newId = prompt("Identifiant de la copie :", `${id}_copy`);
        if (!newId || !newId.trim()) return;

        const finalId = newId.trim().includes(":") ? newId.trim() : `${projectNs}:${newId.trim()}`;
        duplicateQuest(id, finalId);
    };

    const handleExport = () => {
        const filename = activeProject ? `${activeProject.name.toLowerCase().replace(/[^a-z0-9_-]/gi, "_")}_quests.json` : "quests.json";
        exportQuestsToJson(quests, filename);
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const res = parseAndValidateQuestsJson(content);

            if (!res.valid || !res.quests) {
                alert(`Erreur d'import : ${res.error || "Fichier JSON non conforme"}`);
                return;
            }

            const projectNameSuggestion = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            const userChoice = window.confirm(
                `Vous importez ${res.quests.length} quête(s).\n\n` +
                `Cliquez sur [OK] pour remplacer les quêtes du projet actif ("${activeProject?.name || "Actuel"}")\n` +
                `ou [Annuler] pour créer un NOUVEAU PROJET dédié nommé "${projectNameSuggestion}".`
            );

            if (userChoice) {
                await setQuests(res.quests);
            } else {
                await createProject(projectNameSuggestion, `Importé depuis ${file.name}`, res.quests);
            }
        };

        reader.readAsText(file);
        e.target.value = "";
    };

    const getStatusBadge = () => {
        switch (saveStatus) {
            case "saved":
                return <span className="status-badge status-saved">✓ Sauvegardé</span>;
            case "saving":
                return <span className="status-badge status-saving">⏳ Sauvegarde...</span>;
            case "error":
                return <span className="status-badge status-error">⚠️ Erreur</span>;
        }
    };

    return (
        <div className="app-wrapper">
            {/* Barre d'outils supérieure */}
            <header className="top-toolbar">
                <div className="brand-section">
                    <h1 className="brand-title">QuestsLib Editor</h1>

                    {/* Sélecteur de projet actif */}
                    <div className="project-switcher" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#888" }}>Projet :</span>
                        <select
                            className="form-select"
                            value={activeProjectId}
                            onChange={(e) => selectProject(e.target.value)}
                            style={{
                                padding: "4px 8px",
                                background: "#252528",
                                color: "#fff",
                                border: "1px solid #444",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                            }}
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.questCount})
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setIsProjectModalOpen(true)}
                            title="Gérer les projets"
                            style={{
                                background: "#333",
                                border: "1px solid #444",
                                color: "#fff",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            ⚙️ Projets
                        </button>
                    </div>

                    {getStatusBadge()}
                </div>

                <div className="toolbar-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        style={{ display: "none" }}
                        onChange={handleFileImport}
                    />

                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        📥 Importer JSON
                    </Button>

                    <Button variant="secondary" onClick={handleExport}>
                        📤 Exporter JSON ({quests.length})
                    </Button>

                    <Button variant="secondary" onClick={() => setIsDatasetModalOpen(true)}>
                        📦 Données Minecraft
                    </Button>

                    <Button variant="primary" onClick={() => setIsExtensionModalOpen(true)}>
                        🧩 Extensions
                    </Button>
                </div>
            </header>

            {/* Corps principal */}
            <div className="app-container">
                {/* Colonne 1 : Navigation des quêtes */}
                <div className="quest-navigation">
                    <button onClick={handleCreateQuest} className="create-quest-btn">
                        + Nouvelle Quête
                    </button>
                    <ul className="quest-list">
                        {quests.map((q) => (
                            <li
                                key={q.id}
                                onClick={() => setSelectedQuest(q.id)}
                                className={`quest-item ${q.id === selectedQuestId ? "selected" : ""}`}
                            >
                                <div className="quest-item-content">
                                    <div className="quest-item-name">{q.name || "Sans titre"}</div>
                                    <div className="quest-item-id">{q.id}</div>
                                </div>
                                <div className="quest-item-actions">
                                    <button
                                        type="button"
                                        className="quest-action-btn"
                                        title="Dupliquer la quête"
                                        onClick={(e) => handleDuplicateQuest(q.id, e)}
                                    >
                                        📋
                                    </button>
                                    <button
                                        type="button"
                                        className="quest-action-btn delete"
                                        title="Supprimer la quête"
                                        onClick={(e) => handleDeleteQuest(q.id, q.name, e)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Colonne 2 : Éditeur principal */}
                <div className="main-editor">
                    {selectedQuest ? (
                        <DynamicForm
                            key={selectedQuest.id}
                            definition={registry.questDefinition}
                            data={selectedQuest}
                            path={["quests", selectedQuestIndex]}
                        />
                    ) : (
                        <div className="empty-state">
                            <p>Sélectionnez ou créez une quête pour commencer l'édition.</p>
                            <Button onClick={handleCreateQuest}>+ Créer une quête</Button>
                        </div>
                    )}
                </div>

                {/* Colonne 3 : Aperçu JSON */}
                <JsonPreview data={selectedQuest ?? quests} />
            </div>

            {/* Modales */}
            <ProjectManagerModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
            />

            <DatasetManagerModal
                isOpen={isDatasetModalOpen}
                onClose={() => setIsDatasetModalOpen(false)}
            />

            <ExtensionManagerModal
                isOpen={isExtensionModalOpen}
                onClose={() => setIsExtensionModalOpen(false)}
            />
        </div>
    );
};

export default App;