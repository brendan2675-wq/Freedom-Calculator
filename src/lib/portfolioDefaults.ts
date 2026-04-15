import type { ExistingProperty } from "@/types/property";
import { defaultPurchaseDetails } from "@/types/property";

const DEFAULT_PURCHASE_PRICES_BY_ID: Record<string, number> = {
  "1": 200000,
  "2": 530000,
};

export function normalizeExistingProperties(properties: ExistingProperty[]) {
  if (!Array.isArray(properties)) {
    return { properties: [], changed: false };
  }

  let changed = false;
  const normalized = properties.map((property) => {
    const fallbackPurchasePrice = DEFAULT_PURCHASE_PRICES_BY_ID[property.id];
    const currentPurchasePrice = property.purchase?.purchasePrice ?? 0;

    if (!fallbackPurchasePrice || currentPurchasePrice > 0) {
      return property;
    }

    changed = true;
    return {
      ...property,
      purchase: {
        ...defaultPurchaseDetails,
        ...property.purchase,
        purchasePrice: fallbackPurchasePrice,
      },
    };
  });

  return {
    properties: changed ? normalized : properties,
    changed,
  };
}
