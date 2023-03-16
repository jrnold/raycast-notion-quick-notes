import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  apiKey: string;
  databaseId: string;
  appendPageId: string;
}

export const getPreferences = () => {
  return getPreferenceValues<Preferences>();
};
