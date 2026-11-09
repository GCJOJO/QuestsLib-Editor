// Les libellés du registre (types de tâches, champs…) sont écrits en anglais, comme dans le mod.
// En français, on les traduit ici ; les libellés venant d'extensions restent tels quels.
import { getLang } from "./index";

const FR: Record<string, string> = {
    "Quest": "Quête",
    "Quest ID": "Identifiant de la quête",
    "Task ID": "Identifiant de la tâche",
    "Name": "Nom",
    "Description": "Description",
    "Tasks": "Tâches",
    "Rewards": "Récompenses",
    "Task Rewards": "Récompenses de la tâche",
    "Subtasks": "Sous-tâches",
    "Stat Task": "Statistique",
    "Location Task": "Lieu",
    "Any of...": "L'une de…",
    "All of...": "Toutes…",
    "Type": "Type",
    "Item": "Objet",
    "Craft": "Fabrication",
    "Placed Blocks": "Blocs posés",
    "Broken Blocks": "Blocs cassés",
    "Killed Mobs": "Créatures tuées",
    "Target": "Cible",
    "Amount": "Quantité",
    "Biome": "Biome",
    "Structure": "Structure",
    "Location": "Lieu",
    "Loot Table": "Table de butin",
    "Experience": "Expérience",
    "Points": "Points",
    "Levels": "Niveaux",
};

export function tl(label: string): string {
    return getLang() === "fr" ? (FR[label] ?? label) : label;
}
