import type { CollectibleType } from "isaac-typescript-definitions";
import { ITEMS } from "./collectibles";

interface CollItem {
  ID: CollectibleType;
  Name: string;
}

function getItemList(): readonly CollItem[] {
  const collectibles: CollItem[] = [];
  const itemConfig = Isaac.GetItemConfig();
  const maxID = itemConfig.GetCollectibles().Size;
  for (let i = 0; i < maxID; i++) {
    const item = itemConfig.GetCollectible(i as CollectibleType);
    if (!item || item.IsNull() || item.Name === "") {
      continue;
    }
    let name = item.Name;
    if (item.ID in ITEMS && ITEMS[item.ID] !== undefined) {
      name = ITEMS[item.ID] ?? name;
    } else if (name.startsWith("#")) {
      name = `Unknown Item ${item.ID}`;
    }
    const collItem = {
      ID: item.ID,
      Name: name,
    };
    collectibles.push(collItem);
  }
  return collectibles;
}

export { getItemList, type CollItem };
