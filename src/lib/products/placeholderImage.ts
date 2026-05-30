import type { ProductCategory } from './types'

// Generic per-category placeholder art shown until real Higgsfield 3D renders
// exist (see docs/3D-ASSETS.md). Files live in /public/placeholders/.
export function placeholderImage(category: ProductCategory): string {
  return `/placeholders/${category}.svg`
}
