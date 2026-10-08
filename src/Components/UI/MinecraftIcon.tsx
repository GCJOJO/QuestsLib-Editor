import React, { useState } from "react";

interface MinecraftIconProps {
    id: string;
    registryType?: string;
    size?: number;
    className?: string;
    alt?: string;
}

export const MinecraftIcon: React.FC<MinecraftIconProps> = ({
    id,
    registryType = "items",
    size = 32,
    className = "",
    alt,
}) => {
    const [hasError, setHasError] = useState(false);

    const [namespace, rawName] = id.includes(":") ? id.split(":") : ["minecraft", id];
    const cleanName = rawName?.replace(/^#/, ""); // enlever tag # si présent

    // Tentative de chargement d'image depuis PrismarineJS minecraft-assets (Vanilla 1.21.1)
    let imageUrl: string | null = null;
    if (namespace === "minecraft" && !hasError && cleanName) {
        imageUrl = `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.1/${registryType}/${cleanName}.png`;
    }

    // Icônes procédurales SVG élégantes selon le type et le nom si l'image ne charge pas ou pour les mods/biomes/structures
    const renderFallbackSvg = () => {
        const lower = (cleanName || id).toLowerCase();

        // 1. Blocs (Cube 3D isométrique)
        if (registryType === "blocks" || lower.includes("block") || lower.includes("ore") || lower.includes("stone") || lower.includes("log")) {
            let topColor = "#8d8d8d";
            let leftColor = "#6e6e6e";
            let rightColor = "#525252";

            if (lower.includes("dirt") || lower.includes("grass")) {
                topColor = "#5b8731";
                leftColor = "#795548";
                rightColor = "#5d4037";
            } else if (lower.includes("diamond")) {
                topColor = "#55ffff";
                leftColor = "#33bbbb";
                rightColor = "#228888";
            } else if (lower.includes("gold")) {
                topColor = "#ffd700";
                leftColor = "#cca700";
                rightColor = "#997d00";
            } else if (lower.includes("iron")) {
                topColor = "#d8d8d8";
                leftColor = "#b0b0b0";
                rightColor = "#888888";
            } else if (lower.includes("wood") || lower.includes("log") || lower.includes("plank")) {
                topColor = "#b58853";
                leftColor = "#8b5a2b";
                rightColor = "#654321";
            }

            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    {/* Top Face */}
                    <polygon points="16,4 28,10 16,16 4,10" fill={topColor} stroke="#222" strokeWidth="1" />
                    {/* Left Face */}
                    <polygon points="4,10 16,16 16,28 4,22" fill={leftColor} stroke="#222" strokeWidth="1" />
                    {/* Right Face */}
                    <polygon points="16,16 28,10 28,22 16,28" fill={rightColor} stroke="#222" strokeWidth="1" />
                </svg>
            );
        }

        // 2. Armes & Épées
        if (lower.includes("sword") || lower.includes("blade")) {
            const bladeColor = lower.includes("diamond") ? "#55ffff" : lower.includes("netherite") ? "#443b44" : lower.includes("iron") ? "#ddd" : lower.includes("gold") ? "#ffd700" : "#a08050";
            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    <line x1="8" y1="24" x2="24" y2="8" stroke={bladeColor} strokeWidth="3" strokeLinecap="round" />
                    <line x1="7" y1="21" x2="11" y2="25" stroke="#8b5a2b" strokeWidth="3" />
                    <circle cx="6" cy="26" r="2" fill="#555" />
                </svg>
            );
        }

        // 3. Outils (Pioches, Haches)
        if (lower.includes("pickaxe") || lower.includes("axe") || lower.includes("shovel")) {
            const headColor = lower.includes("diamond") ? "#55ffff" : lower.includes("netherite") ? "#443b44" : lower.includes("iron") ? "#ddd" : "#a08050";
            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    <line x1="8" y1="24" x2="22" y2="10" stroke="#8b5a2b" strokeWidth="2.5" />
                    <path d="M14,6 Q24,6 26,16" stroke={headColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </svg>
            );
        }

        // 4. Biomes (Arbre / Paysage)
        if (registryType === "biomes" || lower.includes("forest") || lower.includes("plains") || lower.includes("jungle") || lower.includes("desert")) {
            const treeColor = lower.includes("desert") || lower.includes("badlands") ? "#e0b060" : "#4caf50";
            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    <path d="M4,26 Q16,20 28,26" fill="#5d4037" />
                    <polygon points="16,6 24,20 8,20" fill={treeColor} />
                    <rect x="14" y="20" width="4" height="6" fill="#795548" />
                </svg>
            );
        }

        // 5. Structures (Temple / Bâtiment)
        if (registryType === "structures" || lower.includes("village") || lower.includes("temple") || lower.includes("monument") || lower.includes("city")) {
            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="14" width="20" height="14" fill="#78909c" stroke="#37474f" strokeWidth="1.5" />
                    <polygon points="4,14 16,6 28,14" fill="#b0bec5" stroke="#37474f" strokeWidth="1.5" />
                    <rect x="13" y="20" width="6" height="8" fill="#263238" />
                </svg>
            );
        }

        // 6. Entités / Monstres
        if (registryType === "entities" || lower.includes("zombie") || lower.includes("skeleton") || lower.includes("creeper") || lower.includes("dragon")) {
            const skinColor = lower.includes("zombie") ? "#4caf50" : lower.includes("creeper") ? "#388e3c" : lower.includes("warden") ? "#00695c" : "#9e9e9e";
            return (
                <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="6" width="20" height="20" rx="3" fill={skinColor} stroke="#222" strokeWidth="1.5" />
                    <rect x="10" y="12" width="3" height="3" fill="#111" />
                    <rect x="19" y="12" width="3" height="3" fill="#111" />
                    <rect x="13" y="19" width="6" height="2" fill="#222" />
                </svg>
            );
        }

        // 7. Gemme / Objet par défaut
        return (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <polygon points="16,4 26,12 22,26 10,26 6,12" fill="#ab47bc" stroke="#4a148c" strokeWidth="1.5" />
                <polygon points="16,8 22,13 19,23 13,23 10,13" fill="#ce93d8" />
            </svg>
        );
    };

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={alt || id}
                width={size}
                height={size}
                className={className}
                onError={() => setHasError(true)}
                style={{
                    imageRendering: "pixelated",
                    objectFit: "contain",
                    display: "block",
                }}
            />
        );
    }

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {renderFallbackSvg()}
        </div>
    );
};
