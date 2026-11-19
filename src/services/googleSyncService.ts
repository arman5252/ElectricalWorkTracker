import { AppState } from '../types';

const STORAGE_KEY = 'volttrack_electrical_tracker_state_v1';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  driveUrl?: string;
  error?: string;
}

/**
 * Ping / Test connection with the Google Apps Script Web App
 */
export async function testGoogleAppsScriptConnection(webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'Google Apps Script Web App URL is not provided.' };
  }

  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'ping');

    const res = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} (${res.statusText})`);
    }

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        message: 'Successfully connected to Google Apps Script backend!',
        data: json,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: json.error || 'Connected but API returned failure',
        error: json.error
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect: ${err.message}. Please verify the Web App deployment has 'Who has access' set to 'Anyone'.`,
      error: err.message
    };
  }
}

/**
 * Fetch all electrical tables from Google Sheets via Google Apps Script
 */
export async function fetchAllFromGoogleSheets(webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'Web App URL missing.' };
  }

  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'getAll');

    const res = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`HTTP status: ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        message: 'Data pulled successfully from Google Sheets.',
        data: json.data,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      message: json.error || 'Empty or invalid response from Google Sheets',
      error: json.error
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error fetching from Google Sheets: ${err.message}`,
      error: err.message
    };
  }
}

/**
 * Push all local tables to Google Sheets
 */
export async function pushAllToGoogleSheets(webAppUrl: string, state: AppState): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'Web App URL missing.' };
  }

  try {
    const payload = {
      action: 'syncAll',
      workOrders: state.workOrders,
      equipment: state.equipment,
      dailyLogs: state.dailyLogs,
      safetyLoto: state.safetyLoto,
      spares: state.spares,
      settings: state.settings
    };

    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Use text/plain to avoid CORS pre-flight triggers in Google Apps Script
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        message: 'All records pushed and synchronized with Google Sheets!',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: json.error || 'Push failed on Google Apps Script server',
        error: json.error
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to push to Google Sheets: ${err.message}`,
      error: err.message
    };
  }
}

/**
 * Upload an image/file directly to the user's Google Drive folder
 * Returns direct CDN preview URL & Google Drive link!
 */
export async function uploadFileToGoogleDrive(
  webAppUrl: string,
  file: File
): Promise<UploadResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is required to upload directly to Google Drive.'
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const payload = {
          action: 'uploadImage',
          fileName: `EWT_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          mimeType: file.type || 'image/jpeg',
          base64Data: base64String
        };

        const res = await fetch(webAppUrl.trim(), {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
          resolve({
            success: true,
            fileId: json.fileId,
            fileName: json.fileName,
            url: json.url,
            driveUrl: json.driveUrl
          });
        } else {
          resolve({
            success: false,
            error: json.error || 'Failed to upload to Google Drive'
          });
        }
      } catch (err: any) {
        resolve({
          success: false,
          error: `Upload exception: ${err.message}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read local file into base64.'
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Local storage load
 */
export function loadLocalState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return null;
}

/**
 * Local storage save & dev server backup
 */
export function saveLocalState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Also save to dev server sync endpoint if available
    fetch('/api/local-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(() => {});
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}
