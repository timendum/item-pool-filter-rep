import type {
  CollectibleType,
  TrinketType,
} from "isaac-typescript-definitions";
import {
  ModCallback,
  ModConfigMenuOptionType,
} from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import type { CollItem, TrinketItem } from "./utils";
import { getItemsList, getTrinketsList } from "./utils";

interface PlayerFilter {
  itemsBanned: CollectibleType[];
  trinketBanned: TrinketType[];
}

interface VariableData {
  persistent: {
    ALL: PlayerFilter;
    PLAYERS: Record<string, PlayerFilter>;
  };
}

const v: VariableData = {
  persistent: {
    ALL: {
      itemsBanned: [],
      trinketBanned: [],
    } as PlayerFilter,
    PLAYERS: {},
  },
};

const INFO_MENU = "Info";
const ITEMS_MENU = "Items";
const TRINKETS_MENU = "Trinkets";
const MOD_MENU = "Item Pools Filter";

export class ItemPoolFilter extends ModFeature {
  v = v;
  collectibles: readonly CollItem[] = [];
  trinkets: readonly TrinketItem[] = [];

  @Callback(ModCallback.POST_PLAYER_INIT)
  postPlayerInit(): void {
    Isaac.DebugString("Callback fired: POST_PLAYER_INIT");
    this.collectibles = getItemsList();
    this.trinkets = getTrinketsList();

    this.generateMenu();
    this.applyFilter();
  }

  applyFilter(): void {
    const itemPool = Game().GetItemPool();
    const playerName = Isaac.GetPlayer(0).GetName();
    // ALL characters.
    for (const itemId of this.v.persistent.ALL.itemsBanned) {
      itemPool.RemoveCollectible(itemId);
    }
    for (const itemId of this.v.persistent.ALL.trinketBanned) {
      itemPool.RemoveTrinket(itemId);
    }
    // EACH character.
    if (
      playerName in this.v.persistent.PLAYERS
      && this.v.persistent.PLAYERS[playerName]
    ) {
      const itemsFiltered = this.v.persistent.PLAYERS[playerName];
      for (const itemId of itemsFiltered.itemsBanned) {
        itemPool.RemoveCollectible(itemId);
      }
      for (const itemId of itemsFiltered.trinketBanned) {
        itemPool.RemoveTrinket(itemId);
      }
    }
  }

  /**
   * Determines whether a specific item is currently enabled or filtered out for a given player or
   * globally.
   *
   * @param filter If `true`, checks the player's specific item filter; if `false`, checks the
   *               global item filter.
   * @param name The name of the player whose item filter should be checked.
   * @param id The unique identifier of the collectible item to check.
   * @returns `true` if the item is enabled for the specified context (default); `false` if banned.
   */
  private getCurrentSetting(
    filter: boolean,
    name: string,
    id: CollectibleType | TrinketType,
    bannedKey: keyof PlayerFilter,
  ): boolean {
    if (!filter) {
      return !(
        this.v.persistent.ALL[bannedKey] as Array<CollectibleType | TrinketType>
      ).includes(id);
    }
    if (name in this.v.persistent.PLAYERS && this.v.persistent.PLAYERS[name]) {
      return !(
        this.v.persistent.PLAYERS[name][bannedKey] as Array<
          CollectibleType | TrinketType
        >
      ).includes(id);
    }
    return true;
  }

  getCurrentItemSetting(
    filter: boolean,
    name: string,
    id: CollectibleType,
  ): boolean {
    return this.getCurrentSetting(filter, name, id, "itemsBanned");
  }

  /**
   * Determines whether a specific item is currently enabled or filtered out for a given player or
   * globally.
   *
   * @param filter If `true`, checks the player's specific item filter; if `false`, checks the
   *               global item filter.
   * @param name The name of the player whose item filter should be checked.
   * @param id The unique identifier of the collectible item to check.
   * @returns `true` if the item is enabled for the specified context (default); `false` if banned.
   */
  getCurrentTrinketSetting(
    filter: boolean,
    name: string,
    id: TrinketType,
  ): boolean {
    return this.getCurrentSetting(filter, name, id, "trinketBanned");
  }

  generateMenu(): void {
    if (typeof ModConfigMenu !== "undefined") {
      // --------------------------------------- INFO MENU ---------------------------------------.
      ModConfigMenu.AddText(MOD_MENU, INFO_MENU, "Ban an item to remove it");
      ModConfigMenu.AddText(
        MOD_MENU,
        INFO_MENU,
        "from the pool for every character",
      );
      // Warning: no useful mod found.
      if (!("EID" in _G) && !("XMLData" in _G) && !("Encyclopedia" in _G)) {
        ModConfigMenu.AddSpace(MOD_MENU, ITEMS_MENU);
        ModConfigMenu.AddText(
          MOD_MENU,
          INFO_MENU,
          "Install EID or Encyclopedia,",
        );
        ModConfigMenu.AddText(MOD_MENU, INFO_MENU, "Repentogon for item names");
        ModConfigMenu.AddSpace(MOD_MENU, ITEMS_MENU);
      }
      // Warning: restart to apply.
      ModConfigMenu.AddText(MOD_MENU, INFO_MENU, "Quit and Resume the run");
      ModConfigMenu.AddText(MOD_MENU, INFO_MENU, "to apply the changes");
      // --------------------------------------- ITEMS MENU ---------------------------------------.
      // Menu for Character vs Generic filters.
      let filterOnPlayer = false;
      const playerName = Isaac.GetPlayer(0).GetName();
      ModConfigMenu.AddSetting(MOD_MENU, ITEMS_MENU, {
        CurrentSetting: () => filterOnPlayer,
        Display: () => {
          let status = "ALL characters";
          if (filterOnPlayer) {
            status = `only ${playerName}`;
          }
          return `Filter on ${status}`;
        },
        OnChange: (newValue) => {
          if (newValue !== undefined) {
            filterOnPlayer = newValue as boolean;
          }
        },
        Info: [
          "Settings for ALL characters or one specific",
          `character: ${playerName} (based on the current one)`,
        ],
        Type: ModConfigMenuOptionType.BOOLEAN,
      });
      ModConfigMenu.AddSpace(MOD_MENU, ITEMS_MENU);
      // List of items.
      for (const item of this.collectibles) {
        ModConfigMenu.AddSetting(MOD_MENU, ITEMS_MENU, {
          CurrentSetting: () =>
            this.getCurrentItemSetting(filterOnPlayer, playerName, item.ID),
          Display: () => {
            let status = "active";
            if (
              !this.getCurrentItemSetting(filterOnPlayer, playerName, item.ID)
            ) {
              status = "banned";
            }
            return `${item.Name} [${item.ID}]: ${status}`;
          },
          OnChange: (newValue) => {
            if (newValue === undefined) {
              return;
            }
            let target = this.v.persistent.ALL.itemsBanned;
            if (filterOnPlayer) {
              if (!(playerName in this.v.persistent.PLAYERS)) {
                this.v.persistent.PLAYERS[playerName] = {
                  itemsBanned: [],
                  trinketBanned: [],
                };
              }
              if (this.v.persistent.PLAYERS[playerName]) {
                target = this.v.persistent.PLAYERS[playerName].itemsBanned;
              }
            }
            if (newValue === false) {
              target.push(item.ID);
            } else if (newValue === true) {
              const index = target.indexOf(item.ID);
              if (index !== -1) {
                target.splice(index, 1);
              }
            }
          },
          Info: [`Ban or keep active "${item.Name}" item (id: ${item.ID})`],
          Type: ModConfigMenuOptionType.BOOLEAN,
        });
      }
      // ------------------------------------- TRINKETS MENU -------------------------------------.
      // Menu for Character vs Generic filters.
      ModConfigMenu.AddSetting(MOD_MENU, TRINKETS_MENU, {
        CurrentSetting: () => filterOnPlayer,
        Display: () => {
          let status = "ALL characters";
          if (filterOnPlayer) {
            status = `only ${playerName}`;
          }
          return `Filter on ${status}`;
        },
        OnChange: (newValue) => {
          if (newValue !== undefined) {
            filterOnPlayer = newValue as boolean;
          }
        },
        Info: [
          "Settings for ALL characters or one specific",
          `character: ${playerName} (based on the current one)`,
        ],
        Type: ModConfigMenuOptionType.BOOLEAN,
      });
      ModConfigMenu.AddSpace(MOD_MENU, TRINKETS_MENU);
      // List of items.
      for (const item of this.trinkets) {
        ModConfigMenu.AddSetting(MOD_MENU, TRINKETS_MENU, {
          CurrentSetting: () =>
            this.getCurrentTrinketSetting(filterOnPlayer, playerName, item.ID),
          Display: () => {
            let status = "active";
            if (
              !this.getCurrentTrinketSetting(
                filterOnPlayer,
                playerName,
                item.ID,
              )
            ) {
              status = "banned";
            }
            return `${item.Name} [${item.ID}]: ${status}`;
          },
          OnChange: (newValue) => {
            if (newValue === undefined) {
              return;
            }
            let target = this.v.persistent.ALL.trinketBanned;
            if (filterOnPlayer) {
              if (!(playerName in this.v.persistent.PLAYERS)) {
                this.v.persistent.PLAYERS[playerName] = {
                  itemsBanned: [],
                  trinketBanned: [],
                };
              }
              if (this.v.persistent.PLAYERS[playerName]) {
                target = this.v.persistent.PLAYERS[playerName].trinketBanned;
              }
            }
            if (newValue === false) {
              target.push(item.ID);
            } else if (newValue === true) {
              const index = target.indexOf(item.ID);
              if (index !== -1) {
                target.splice(index, 1);
              }
            }
          },
          Info: [`Ban or keep active "${item.Name}" item (id: ${item.ID})`],
          Type: ModConfigMenuOptionType.BOOLEAN,
        });
      }
    }
  }
}
