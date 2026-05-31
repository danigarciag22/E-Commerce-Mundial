// Sanitizes a user query and builds the Supabase `.or` filter string for an
// ilike search across name, sku, description. Strips chars that break .or syntax.
export function buildSearchOr(query: string): string {
  const term = query.trim().toLowerCase().replace(/[,()%]/g, '')
  if (!term) return ''
  return `name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`
}
