import type {
  CollectibleType,
  TrinketType,
} from "isaac-typescript-definitions";

interface CollItem {
  ID: CollectibleType;
  Name: string;
}
interface TrinketItem {
  ID: TrinketType;
  Name: string;
}

interface EIDCustomT {
  getDescriptionEntry: (
    type: string,
    id: CollectibleType | TrinketType,
  ) => [string, string, string] | undefined;
}
interface XMLItemItem {
  name: string | undefined;
}
interface XmlDataType {
  GetEntryById: (node: int, id: number) => XMLItemItem | undefined;
  ITEM: int;
}
interface Encyclopedia {
  NameMaps?: {
    Collectibles?: Record<CollectibleType, string | undefined>;
    Trinkets?: Record<TrinketType, string | undefined>;
  };
}

declare const _G: {
  XMLNode?: {
    ITEM: int;
    TRINKET: int;
  };
  XMLData?: XmlDataType;
  EID?: EIDCustomT;
  Encyclopedia?: Encyclopedia;
};

const XML_NODE_ITEM = _G.XMLNode?.ITEM ?? -1;
const XML_NODE_TRINKET = _G.XMLNode?.TRINKET ?? -1;
const { EID, Encyclopedia, XMLData: XML_DATA } = _G;

function getItemName(item: Readonly<ItemConfigItemCollectible>) {
  let name: string | undefined;
  // Isaac.DebugString(`Item ${item.ID}: ${name}`);
  if (name === undefined && EID) {
    // EID is installed, pcall for safety.
    const [r, eidItem] = pcall(
      EID.getDescriptionEntry,
      EID,
      "collectibles",
      item.ID,
    );
    if (r && eidItem) {
      name = eidItem[1];
      // Isaac.DebugString(`Item ${item.ID} EID: ${name}`);
    }
  }
  if (name === undefined && XML_DATA) {
    // REPENTOGON is installed, pcall for safety. If REPENTOGON is installed, XML_DATA and
    // XML_NODE_ITEM are defined.
    const [r, xmlItem] = pcall(XML_DATA.GetEntryById, XML_NODE_ITEM, item.ID);
    if (r && xmlItem) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      name = xmlItem.name;
      // Isaac.DebugString(`Item ${item.ID} XML: ${xmlItem.name}`);
    }
  }
  if (name === undefined && Encyclopedia) {
    // Encyclopedia is installed.
    const encItem =
      Encyclopedia.NameMaps?.Collectibles
      && Encyclopedia.NameMaps.Collectibles[item.ID];
    if (encItem !== undefined) {
      name = encItem;
      // Isaac.DebugString(`Item ${item.ID} Encyclopedia: ${encItem}`);
    }
  }
  if (name === undefined) {
    // Nothing else worked, use the item from the standard API and clean it up.
    name = item.Name;
    // Isaac.DebugString(`Item ${item.ID}: ${encItem}`);
    name = name.replace("#", "").replace("_NAME", "");
  }
  return name;
}
function getTrinketName(item: Readonly<ItemConfigItemTrinket>) {
  let name: string | undefined;
  // Isaac.DebugString(`Item ${item.ID}: ${name}`);
  if (name === undefined && EID) {
    // EID is installed, pcall for safety.
    const [r, eidItem] = pcall(
      EID.getDescriptionEntry,
      EID,
      "trinkets",
      item.ID,
    );
    if (r && eidItem) {
      name = eidItem[1];
      // Isaac.DebugString(`Item ${item.ID} EID: ${name}`);
    }
  }
  if (name === undefined && XML_DATA) {
    // REPENTOGON is installed, pcall for safety. If REPENTOGON is installed, XML_DATA and
    // XML_NODE_ITEM are defined.
    const [r, xmlItem] = pcall(
      XML_DATA.GetEntryById,
      XML_NODE_TRINKET,
      item.ID,
    );
    if (r && xmlItem) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      name = xmlItem.name;
      // Isaac.DebugString(`Item ${item.ID} XML: ${xmlItem.name}`);
    }
  }
  if (name === undefined && Encyclopedia) {
    // Encyclopedia is installed.
    const encItem =
      Encyclopedia.NameMaps?.Trinkets
      && Encyclopedia.NameMaps.Trinkets[item.ID];
    if (encItem !== undefined) {
      name = encItem;
      // Isaac.DebugString(`Item ${item.ID} Encyclopedia: ${encItem}`);
    }
  }
  if (name === undefined) {
    // Nothing else worked, use the item from the standard API and clean it up.
    name = item.Name;
    // Isaac.DebugString(`Item ${item.ID}: ${encItem}`);
    name = name.replace("#", "").replace("_NAME", "");
  }
  return name;
}

function getItemsList(): readonly CollItem[] {
  const collectibles: CollItem[] = [];
  const itemConfig = Isaac.GetItemConfig();
  const maxID = itemConfig.GetCollectibles().Size;
  for (let i = 0; i < maxID; i++) {
    const item = itemConfig.GetCollectible(i as CollectibleType);
    if (!item || item.IsNull() || item.Name === "") {
      continue;
    }
    const collItem = {
      ID: item.ID,
      Name: getItemName(item),
    };
    collectibles.push(collItem);
  }
  return collectibles;
}

function getTrinketsList(): readonly TrinketItem[] {
  const collectibles: TrinketItem[] = [];
  const itemConfig = Isaac.GetItemConfig();
  const maxID = itemConfig.GetTrinkets().Size;
  for (let i = 0; i < maxID; i++) {
    const item = itemConfig.GetTrinket(i as TrinketType);
    if (!item || item.IsNull() || item.Name === "") {
      continue;
    }
    const collItem = {
      ID: item.ID,
      Name: getTrinketName(item),
    };
    collectibles.push(collItem);
  }
  return collectibles;
}

export { getItemsList, getTrinketsList, type CollItem, type TrinketItem };
