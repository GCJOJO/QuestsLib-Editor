import React, { useState } from "react";
import Modal from "../UI/Modal";
import Button from "../UI/Button";
import { useProjectStore } from "../../store/useProjectStore";

interface ProjectManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ isOpen, onClose }) => {
    const {
        projects,
        activeProjectId,
        selectProject,
        createProject,
        duplicateProject,
        updateProjectMetadata,
        deleteProject,
    } = useProjectStore();

    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectNamespace, setNewProjectNamespace] = useState("questslib");
    const [newProjectDesc, setNewProjectDesc] = useState("");
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editNamespace, setEditNamespace] = useState("questslib");
    const [editDesc, setEditDesc] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!newProjectName.trim()) {
            setErrorMsg("Le nom du projet est requis.");
            return;
        }

        try {
            await createProject(
                newProjectName.trim(),
                newProjectDesc.trim(),
                undefined,
                newProjectNamespace.trim() || "questslib"
            );
            setNewProjectName("");
            setNewProjectNamespace("questslib");
            setNewProjectDesc("");
            onClose();
        } catch (err: any) {
            setErrorMsg(err?.message || "Erreur lors de la création du projet.");
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateProject(id);
        } catch (err: any) {
            setErrorMsg(err?.message || "Erreur lors de la duplication.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le projet "${name}" ? Toutes ses quêtes seront effacées.`)) {
            const res = await deleteProject(id);
            if (!res.success) {
                setErrorMsg(res.error || "Impossible de supprimer ce projet.");
            }
        }
    };

    const startEditing = (p: { id: string; name: string; namespace?: string; description?: string }) => {
        setEditingProjectId(p.id);
        setEditName(p.name);
        setEditNamespace(p.namespace || "questslib");
        setEditDesc(p.description || "");
    };

    const saveEditing = async (id: string) => {
        if (!editName.trim()) return;
        await updateProjectMetadata(id, {
            name: editName.trim(),
            namespace: editNamespace.trim() || "questslib",
            description: editDesc.trim(),
        });
        setEditingProjectId(null);
    };

    return (
        <Modal isOpen={isOpen} title="Gestionnaire de Projets" onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#cccccc" }}>
                    Configurez vos projets et leur namespace par défaut (ex: <code>questslib</code>, <code>mon_mod</code>).
                </p>

                {errorMsg && (
                    <div style={{ padding: "8px 12px", background: "#661111", borderRadius: "4px", color: "#ffcccc", fontSize: "13px" }}>
                        {errorMsg}
                    </div>
                )}

                {/* Créer un nouveau projet */}
                <form
                    onSubmit={handleCreate}
                    style={{
                        backgroundColor: "#1e1e20",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #3c3c3c",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <strong style={{ fontSize: "13px", color: "#fff" }}>➕ Nouveau Projet</strong>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr auto", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nom du projet (ex: Aventure RPG)..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Namespace (ex: questslib)..."
                            value={newProjectNamespace}
                            onChange={(e) => setNewProjectNamespace(e.target.value)}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Description facultative..."
                            value={newProjectDesc}
                            onChange={(e) => setNewProjectDesc(e.target.value)}
                        />
                        <Button variant="primary">Créer</Button>
                    </div>
                </form>

                {/* Liste des projets existants */}
                <div>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#ffffff" }}>
                        Vos Projets ({projects.length})
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "45vh", overflowY: "auto" }}>
                        {projects.map((p) => {
                            const isActive = p.id === activeProjectId;
                            const isEditing = editingProjectId === p.id;
                            const currentNs = p.namespace || "questslib";

                            return (
                                <div
                                    key={p.id}
                                    style={{
                                        backgroundColor: isActive ? "#2c2438" : "#1e1e20",
                                        border: isActive ? "1px solid #7b46d1" : "1px solid #3c3c3c",
                                        borderRadius: "6px",
                                        padding: "10px 12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    {isEditing ? (
                                        <div style={{ display: "flex", gap: "6px", flex: 1, marginRight: "10px" }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Nom"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{ flex: 1.2 }}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Namespace"
                                                value={editNamespace}
                                                onChange={(e) => setEditNamespace(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Description"
                                                value={editDesc}
                                                onChange={(e) => setEditDesc(e.target.value)}
                                                style={{ flex: 1.5 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => saveEditing(p.id)}
                                                style={{ padding: "4px 8px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingProjectId(null)}
                                                style={{ padding: "4px 8px", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: "left", flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <strong style={{ color: "#ffffff", fontSize: "13px" }}>{p.name}</strong>
                                                <span style={{ fontSize: "10px", padding: "2px 6px", background: "#333338", borderRadius: "3px", color: "#81c784", fontFamily: "monospace" }}>
                                                    {currentNs}:
                                                </span>
                                                {isActive && (
                                                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "#7b46d1", borderRadius: "3px", color: "#fff" }}>
                                                        Actif
                                                    </span>
                                                )}
                                                <span style={{ fontSize: "11px", color: "#888888" }}>
                                                    ({p.questCount} quête{p.questCount > 1 ? "s" : ""})
                                                </span>
                                            </div>
                                            {p.description && (
                                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#aaaaaa" }}>
                                                    {p.description}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {!isActive && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectProject(p.id);
                                                    onClose();
                                                }}
                                                style={{
                                                    padding: "4px 10px",
                                                    background: "#333",
                                                    color: "#fff",
                                                    border: "1px solid #555",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                Ouvrir
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => startEditing(p)}
                                            title="Modifier le projet et son namespace"
                                            style={{
                                                padding: "4px 8px",
                                                background: "#2a2a2a",
                                                color: "#ccc",
                                                border: "1px solid #444",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicate(p.id)}
                                            title="Dupliquer le projet"
                                            style={{
                                                padding: "4px 8px",
                                                background: "#2a2a2a",
                                                color: "#ccc",
                                                border: "1px solid #444",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            📋
                                        </button>
                                        {projects.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(p.id, p.name)}
                                                title="Supprimer le projet"
                                                style={{
                                                    padding: "4px 8px",
                                                    background: "#c62828",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
