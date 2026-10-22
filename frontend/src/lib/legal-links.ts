import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { LegalPage, legalPageUrl } from "./legal-pages";

/**
 * Open a legal page in the in-app browser, falling back to the system browser.
 * Throws when the API URL is not configured so the screen can explain why.
 */
export async function openLegalPage(page: LegalPage): Promise<void> {
  const url = legalPageUrl(page);
  if (!url) {
    throw new Error(
      "Legal pages are not configured. Set EXPO_PUBLIC_API_URL and rebuild the app.",
    );
  }

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}
