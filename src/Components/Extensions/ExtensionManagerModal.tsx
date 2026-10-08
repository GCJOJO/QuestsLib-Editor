import React, { useState, useRef } from "react";
import Modal from "../UI/Modal";
import Button from "../UI/Button";
import { useExtensionStore, validateExtensionPackage } from "../../extensions/useExtensionStore";
import { exportExtensionToJson } from "../../utils/fileHandler";
import type { ExtensionPackage } from "../../types/QuestTypes";

interface ExtensionManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SAMPLE_EXTENSION: ExtensionPackage = {
    id: "sample_combat",
    name: "Sample Combat Extension",
    version: "1.0.0",
    description: "Ajoute des tâches de combat de boss et des récompenses de réputation.",
    enabled: true,
    tasks: [
        {
            typeId: "sample_combat:boss_fight",
            label: "Combattre un Boss",
            fields: [
                { key: "id", label: "Task ID", type: "text", required: true },
                { key: "name", label: "Nom de la tâche", type: "text" },
                {
                    key: "boss_type",
                    label: "Boss à vaincre",
                    type: "select",
                    defaultValue: "minecraft:wither",
                    options: [
                        { label: "Wither", value: "minecraft:wither" },
                        { label: "Ender Dragon", value: "minecraft:ender_dragon" },
                        { label: "Elder Guardian", value: "minecraft:elder_guardian" },
                        { label: "Warden", value: "minecraft:warden" },
                    ],
                },
                { key: "amount", label: "Nombre", type: "number", defaultValue: 1 },
                { key: "rewards", label: "Récompenses de tâche", type: "rewardList" },
            ],
        },
    ],
    rewards: [
        {
            typeId: "sample_combat:reputation",
            label: "Points de Réputation",
            fields: [
                { key: "faction", label: "Faction", type: "text", required: true, defaultValue: "villageois" },
                { key: "points", label: "Points accordés", type: "number", required: true, defaultValue: 100 },
            ],
        },
    ],
};

export const ExtensionManagerModal: React.FC<ExtensionManagerModalProps> = ({ isOpen, onClose }) => {
    const { extensions, installExtension, uninstallExtension, toggleExtension } = useExtensionStore();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);
                const val = validateExtensionPackage(parsed);

                if (!val.valid || !val.pkg) {
                    setErrorMsg(val.error || "Extension invalide.");
                    return;
                }

                const res = await installExtension(val.pkg);
                if (res.success) {
                    setSuccessMsg(`Extension "${val.pkg.name}" installée avec succès !`);
                } else {
                    setErrorMsg(res.error || "Erreur lors de l'enregistrement de l'extension.");
                }
            } catch {
                setErrorMsg("Format de fichier JSON invalide.");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleInstallSample = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        const res = await installExtension(SAMPLE_EXTENSION);
        if (res.success) {
            setSuccessMsg(`Exemple d'extension installé avec succès !`);
        } else {
            setErrorMsg(res.error || "Erreur lors de l'installation.");
        }
    };

    return (
        <Modal isOpen={isOpen} title="Gestionnaire d'Extensions" onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#cccccc" }}>
                    Les extensions enrichissent l'éditeur avec de nouveaux types de tâches et de récompenses définis en JSON.
                </p>

                {errorMsg && (
                    <div style={{ padding: "8px 12px", background: "#661111", borderRadius: "4px", color: "#ffcccc", fontSize: "13px" }}>
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: "8px 12px", background: "#114411", borderRadius: "4px", color: "#ccffcc", fontSize: "13px" }}>
                        {successMsg}
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                    />
                    <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                        📥 Importer un fichier .json
                    </Button>
                    <Button variant="secondary" onClick={handleInstallSample}>
                        ✨ Charger un exemple
                    </Button>
                </div>

                <div style={{ borderTop: "1px solid #3c3c3c", paddingTop: "12px" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#ffffff" }}>
                        Extensions installées ({extensions.length})
                    </h4>

                    {extensions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#888888", fontSize: "13px" }}>
                            Aucune extension installée pour le moment.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "35vh", overflowY: "auto" }}>
                            {extensions.map((ext) => (
                                <div
                                    key={ext.id}
                                    style={{
                                        backgroundColor: "#1e1e1e",
                                        border: "1px solid #3c3c3c",
                                        borderRadius: "6px",
                                        padding: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        opacity: ext.enabled !== false ? 1 : 0.6,
                                    }}
                                >
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <strong style={{ color: "#ffffff" }}>{ext.name}</strong>
                                            {ext.version && (
                                                <span style={{ fontSize: "11px", color: "#888888" }}>v{ext.version}</span>
                                            )}
                                            <span style={{ fontSize: "10px", padding: "2px 6px", background: "#2a2a2a", borderRadius: "3px", color: "#aaaaaa" }}>
                                                {ext.id}
                                            </span>
                                        </div>
                                        {ext.description && (
                                            <p style={{ margin: "4px 0 6px 0", fontSize: "12px", color: "#aaaaaa" }}>
                                                {ext.description}
                                            </p>
                                        )}
                                        <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "#77bb88" }}>
                                            <span>📋 {ext.tasks?.length || 0} tâche(s)</span>
                                            <span>🎁 {ext.rewards?.length || 0} récompense(s)</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                            onClick={() => toggleExtension(ext.id)}
                                            style={{
                                                padding: "4px 8px",
                                                background: ext.enabled !== false ? "#2e7d32" : "#555555",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                            }}
                                            title={ext.enabled !== false ? "Désactiver" : "Activer"}
                                        >
                                            {ext.enabled !== false ? "Activée" : "Désactivée"}
                                        </button>
                                        <button
                                            onClick={() => exportExtensionToJson(ext)}
                                            style={{
                                                padding: "4px 8px",
                                                background: "#333333",
                                                color: "#ccc",
                                                border: "1px solid #444",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                            }}
                                            title="Exporter au format JSON"
                                        >
                                            💾
                                        </button>
                                        <button
                                            onClick={() => uninstallExtension(ext.id)}
                                            style={{
                                                padding: "4px 8px",
                                                background: "#c62828",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                            }}
                                            title="Désinstaller l'extension"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
