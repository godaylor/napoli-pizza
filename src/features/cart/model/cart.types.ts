export interface ModifierSelection {
  groupId: string;
  modifierIds: string[];
}

export interface CartConfiguration {
  productId: string;
  variantId: string;
  removedIngredientIds: string[];
  modifierSelections: ModifierSelection[];
}

export interface CartLine {
  configuration: CartConfiguration;
  fingerprint: string;
  quantity: number;
}

export interface CartUndoSnapshot {
  kind: 'remove' | 'clear';
  lines: CartLine[];
  message: string;
}

export interface CartState {
  lines: CartLine[];
  pendingUndo: CartUndoSnapshot | null;
  persistenceWarning: string | null;
}