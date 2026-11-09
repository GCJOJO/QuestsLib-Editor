import { useState } from "react";
import { Castle, Ghost, Package, Trees, type LucideIcon } from "lucide-react";

const RENDERS = `${import.meta.env.BASE_URL}renders/`;

const FALLBACK: Record<string, LucideIcon> = {
    biomes: Trees,
    structures: Castle,
    entities: Ghost,
};

/** Chemin du rendu d'un objet vanilla dans public/renders, ou null si on ne peut pas en avoir. */
export function renderUrl(id: string, registryType = "items"): string | null {
    const [ns, raw] = id.includes(":") ? id.split(":", 2) : ["minecraft", id];
    if (ns !== "minecraft" || !raw || raw.startsWith("#")) return null;
    if (registryType === "biomes" || registryType === "structures") return null;
    // Les entités sont représentées par leur œuf d'apparition.
    if (registryType === "entities") return `${RENDERS}${raw}_spawn_egg.png`;
    return `${RENDERS}${raw}.png`;
}

type Props = { id: string; registryType?: string; size?: number; className?: string };

export function ItemIcon({ id, registryType = "items", size = 32, className = "" }: Props) {
    const url = renderUrl(id, registryType);
    const [failed, setFailed] = useState<string | null>(null);

    if (url && failed !== url) {
        return (
            <img
                className={`item-icon ${className}`}
                src={url}
                alt=""
                width={size}
                height={size}
                loading="lazy"
                draggable={false}
                onError={() => setFailed(url)}
            />
        );
    }
    const Icon = FALLBACK[registryType] ?? Package;
    return (
        <span className={`item-icon fallback ${className}`} style={{ width: size, height: size }} aria-hidden>
            <Icon size={Math.round(size * 0.6)} />
        </span>
    );
}
