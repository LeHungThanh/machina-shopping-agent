import type { CatalogueEntry } from '@machina/database';
import { getApprovedFacts } from '@machina/database';
import { loadOntology } from '@machina/schemas';

// Always reflects true current state for ANY candidate, across any merchant — whatever is
// approved right now gets included, regardless of visibility tier (embedding-based
// retrieval is a ranking signal, not a disclosure surface; CONTROL is enforced later, at
// the response boundary). This dataset's own title already includes the brand, so no
// display-title reconstruction is needed here.
export function renderProductText(product: CatalogueEntry, vertical: string): string {
  const approved = getApprovedFacts(product.id);
  const attrLines = loadOntology(vertical)
    .attributes.map((a) => {
      const entry = approved[a.key];
      if (!entry || entry.value === null) return null;
      return `${a.label}: ${entry.value}`;
    })
    .filter((line): line is string => line !== null);
  const attrText = attrLines.length > 0 ? ` ${attrLines.join('. ')}.` : '';
  return `${product.title}. ${product.long_description}${attrText}`;
}
