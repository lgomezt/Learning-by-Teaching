import { useCallback } from 'react';
import { useSession } from '../context/AppContext';

export function useSessionExport() {
  const { getSessionData } = useSession();

  /**
   * Download the session data as a JSON file
   */
  const downloadSession = useCallback(() => {
    const data = getSessionData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `protege-session-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [getSessionData]);

  /**
   * Copy session data to clipboard
   */
  const copyToClipboard = useCallback(async () => {
    const data = getSessionData();
    const json = JSON.stringify(data, null, 2);
    
    try {
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [getSessionData]);

  return {
    downloadSession,
    copyToClipboard,
    getSessionData,
  };
}
