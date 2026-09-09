// src/utils/webStyles.ts
import { Platform } from 'react-native';

export const webStyles = `
  html, body, #root {
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  div[style*="flex: 1"] {
    height: 100% !important;
    min-height: 100vh !important;
  }

  div[style*="position: absolute"] {
    height: 100% !important;
    min-height: 100vh !important;
  }

  div[class*="ScrollView"] {
    height: 100% !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  div[class*="KeyboardAvoidingView"] {
    height: 100% !important;
  }

  [data-rnw-root] {
    height: 100vh !important;
    min-height: 100vh !important;
  }
`;

// Function to inject styles on web
export const injectWebStyles = () => {
  if (Platform.OS === 'web') {
    const styleTag = document.createElement('style');
    styleTag.textContent = webStyles;
    document.head.appendChild(styleTag);
  }
};