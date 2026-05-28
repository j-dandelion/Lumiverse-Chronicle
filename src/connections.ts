/**
 * Chronicle — Connection Profile types and persistence.
 * Connection profiles are fetched from the backend via Spindle API.
 * The selected profile ID is persisted in localStorage for cross-session use.
 */

export interface ConnectionProfile {
  id: string
  name: string
  provider: string
  api_url: string
  model: string
}

export const CONNECTION_STORAGE_KEY = 'chronicle_selected_connection'

/** Pseudo-ID meaning "use Lumiverse's default connection" */
export const DEFAULT_CONNECTION_ID = '__default__'

/** Load the persisted connection profile ID, returning the default if none saved. */
export function loadSelectedConnectionId(): string {
  try {
    return localStorage.getItem(CONNECTION_STORAGE_KEY) || DEFAULT_CONNECTION_ID
  } catch {
    return DEFAULT_CONNECTION_ID
  }
}

/** Persist the selected connection profile ID. */
export function saveSelectedConnectionId(id: string): void {
  try {
    if (id === DEFAULT_CONNECTION_ID) {
      localStorage.removeItem(CONNECTION_STORAGE_KEY)
    } else {
      localStorage.setItem(CONNECTION_STORAGE_KEY, id)
    }
  } catch (err) {
    console.error('[Chronicle] Failed to save connection selection:', err)
  }
}
