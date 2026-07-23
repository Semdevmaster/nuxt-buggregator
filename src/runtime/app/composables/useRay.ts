import { useNuxtApp } from '#imports'

/**
 * Returns the configured `ray` function (client / SSR).
 * Full Spatie Ray Reference API: ray(...), ray().json(), chain modifiers, etc.
 */
export function useRay() {
  return useNuxtApp().$ray
}
