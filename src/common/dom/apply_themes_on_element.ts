import { derivedStyles } from "../../resources/styles";
import { HomeAssistant, Theme } from "../../types";

const hexToRgb = (hex: string): string | null => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const checkHex = hex.replace(shorthandRegex, (_m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(checkHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
};

/**
 * Apply a theme to an element by setting the CSS variables on it.
 *
 * element: Element to apply theme on.
 * themes: HASS Theme information
 * localTheme: selected theme.
 * mainElement: boolean if it is the top element of the page.
 */
export const applyThemesOnElement = (
  element,
  themes: HomeAssistant["themes"],
  localTheme?: string | null,
  mainElement = false
) => {
  // We only set styles if the element has an theme itself or on the main element, otherwise it will inherit the styles from it's parent
  let newTheme: Theme | undefined;
  if (localTheme && themes.themes[localTheme]) {
    newTheme = themes.themes[localTheme];
  } else if (mainElement && localTheme !== "default") {
    newTheme = themes.themes[themes.default_theme];
  }

  // Styles that need to be reset from the previous theme
  if (!element._themes) {
    if (!newTheme) {
      // No styles to reset, and no styles to set
      return;
    }
    element._themes = {};
  }

  // Add previous set keys to reset them
  const styles = { ...element._themes };
  if (newTheme) {
    const theme = {
      ...derivedStyles,
      ...newTheme,
    };
    Object.keys(theme).forEach((key) => {
      const prefixedKey = `--${key}`;
      // Save key so we can reset it later if needed
      element._themes[prefixedKey] = "";
      styles[prefixedKey] = theme[key];
      if (key.startsWith("rgb")) {
        return;
      }
      const rgbKey = `rgb-${key}`;
      if (theme[rgbKey] !== undefined) {
        return;
      }
      const prefixedRgbKey = `--${rgbKey}`;
      // Save key so we can reset it later if needed
      element._themes[prefixedRgbKey] = "";
      const rgbValue = hexToRgb(theme[key]);
      if (rgbValue !== null) {
        styles[prefixedRgbKey] = rgbValue;
      }
    });
  }
  // Set and/or reset styles
  if (element.updateStyles) {
    element.updateStyles(styles);
  } else if (window.ShadyCSS) {
    // Implement updateStyles() method of Polymer elements
    window.ShadyCSS.styleSubtree(/** @type {!HTMLElement} */ element, styles);
  }
};
