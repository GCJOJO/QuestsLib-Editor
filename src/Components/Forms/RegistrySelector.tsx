import React, { useState, useMemo, useRef, useEffect } from "react";
import { useDatasetStore } from "../../store/useDatasetStore";
import { ResourcePickerModal } from "../Modals/ResourcePickerModal";
import { MinecraftIcon } from "../UI/MinecraftIcon";

interface RegistrySelectorProps {
    registryType: string;
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
}

export const RegistrySelector: React.FC<RegistrySelectorProps> = ({
    registryType,
    value,
    onChange,
    placeholder,
}) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getRegistryItems = useDatasetStore((state) => state.getRegistryItems);
    const allItems = useMemo(() => getRegistryItems(registryType), [getRegistryItems, registryType]);

    // Trouver l'item sélectionné pour afficher son nom
    const selectedItem = useMemo(
        () => allItems.find((item) => item.id === value),
        [allItems, value]
    );

    // Filtrer les suggestions les plus pertinentes
    const suggestions = useMemo(() => {
        const query = (value || "").toLowerCase().trim();
        if (!query) return allItems.slice(0, 8);

        return allItems
            .filter(
                (item) =>
                    item.id.toLowerCase().includes(query) ||
                    (item.name && item.name.toLowerCase().includes(query))
            )
            .slice(0, 8);
    }, [allItems, value]);

    // Fermer le dropdown au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSuggestion = (id: string) => {
        onChange(id);
        setIsDropdownOpen(false);
    };

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                {/* Bouton Slot d'inventaire avec Icône Minecraft */}
                <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    title="Cliquer pour ouvrir la grille de sélection Minecraft"
                    style={{
                        width: "42px",
                        height: "42px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#222225",
                        border: "2px solid #3c3c3c",
                        borderRadius: "6px",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: 0,
                        boxShadow: "inset -2px -2px 0px rgba(0,0,0,0.5), inset 2px 2px 0px rgba(255,255,255,0.08)",
                        transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#4caf50";
                        e.currentTarget.style.backgroundColor = "#2a2a2e";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#3c3c3c";
                        e.currentTarget.style.backgroundColor = "#222225";
                    }}
                >
                    {value ? (
                        <MinecraftIcon id={value} registryType={registryType} size={30} />
                    ) : (
                        <span style={{ fontSize: "16px", color: "#888" }}>＋</span>
                    )}
                </button>

                {/* Champ texte avec autocomplétion */}
                <div style={{ position: "relative", flex: 1 }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <input
                            type="text"
                            className="form-input"
                            value={value || ""}
                            placeholder={placeholder || (selectedItem ? `${selectedItem.name} (${value})` : `Sélectionner (${registryType})...`)}
                            onChange={(e) => {
                                onChange(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen(true)}
                            title="Ouvrir la grille de sélection"
                            style={{
                                padding: "0 12px",
                                backgroundColor: "#2e7d32",
                                border: "1px solid #3c3c3c",
                                borderRadius: "4px",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            ▦ Grille
                        </button>
                    </div>

                    {/* Dropdown d'autocomplétion avec icônes */}
                    {isDropdownOpen && suggestions.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 100,
                                backgroundColor: "#1e1e20",
                                border: "1px solid #3c3c3c",
                                borderRadius: "4px",
                                marginTop: "2px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                maxHeight: "240px",
                                overflowY: "auto",
                            }}
                        >
                            {suggestions.map((item) => (
                                <div
                                    key={item.id}
                                    onMouseDown={() => handleSelectSuggestion(item.id)}
                                    style={{
                                        padding: "6px 10px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        borderBottom: "1px solid #2a2a2d",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#2a2a2e";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <MinecraftIcon id={item.id} registryType={registryType} size={22} />
                                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                        <div style={{ fontSize: "12px", color: "#ffffff", fontWeight: 600 }}>
                                            {item.name || item.id}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#888888", fontFamily: "monospace" }}>
                                            {item.id}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de sélection en grille */}
            <ResourcePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                registryType={registryType}
                currentValue={value}
                onSelect={onChange}
            />
        </div>
    );
};
