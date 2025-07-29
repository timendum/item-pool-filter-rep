import { initModFeatures } from "isaacscript-common";
import { ItemPoolFilter } from "./itemPoolFilter";
import { mod } from "./mod";

const MOD_FEATURES = [ItemPoolFilter] as const;

export function main(): void {
  initModFeatures(mod, MOD_FEATURES);
}
