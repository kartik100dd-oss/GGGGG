import React, { useState, useEffect } from 'react';
import { 
  Cloud, Database, Download, Upload, Search, FileText, FileSpreadsheet, 
  CheckCircle2, AlertCircle, RefreshCw, Folder, ExternalLink, Lock, Check
} from 'lucide-react';
import { 
  signInWithGoogle, 
  getCachedAccessToken, 
  setCachedAccessToken,
  auth
} from '../firebase';

interface GoogleDrivePanelProps {
  userId: string;
  activeReport: any; // Currently viewed report data object
  activeProfile: any; // Student profile data object
  onImportProfile: (importedProfile: any) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
}

export default function GoogleDrivePanel({ 
  userId, 
  activeReport, 
  activeProfile, 
  onImportProfile, 
  addToast 
}: GoogleDrivePanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [importingFileId, setImportingFileId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  // Initialize and check for cached token
  useEffect(() => {
    const cached = getCachedAccessToken();
    if (cached) {
      setToken(cached);
      fetchUserInfo(cached);
    }
  }, []);

  // Fetch user info using token to confirm it's valid
  const fetchUserInfo = async (accessToken: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.email || auth.currentUser?.email || 'Authenticated User');
        // Retrieve or create 'AI Red Dragon' folder to keep things organized
        findOrCreateAppFolder(accessToken);
      } else {
        // Token might be expired
        setToken(null);
        setCachedAccessToken(null);
      }
    } catch (e) {
      console.error('Error verifying OAuth token:', e);
    }
  };

  // Connect to Google Drive (Prompting sign-in popup)
  const handleConnect = async () => {
    setLoading(true);
    try {
      // Re-trigger sign-in to capture credential/token
      await signInWithGoogle();
      const freshToken = getCachedAccessToken();
      if (freshToken) {
        setToken(freshToken);
        addToast('Successfully connected to Google Drive!', 'success');
        fetchUserInfo(freshToken);
      } else {
        throw new Error('Access token not found in credentials. Please verify scopes.');
      }
    } catch (err: any) {
      console.error('Failed to connect Google Drive:', err);
      const isIframe = window.self !== window.top;
      let msg = err?.message || 'Authentication failed. Please verify Drive permissions.';
      if (isIframe) {
        msg = 'IFrame Blocked: Browser third-party cookie restrictions are preventing Google Sign-In popups in embedded frames. Please click "Open in New Tab" at the top-right of your preview window to connect your Google Drive!';
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setCachedAccessToken(null);
    setUserEmail(null);
    setFiles([]);
    addToast('Disconnected from Google Drive.', 'info');
  };

  // Find or create 'AI Red Dragon' Folder in Drive
  const findOrCreateAppFolder = async (accessToken: string) => {
    try {
      // Query folder named 'AI Red Dragon'
      const query = encodeURIComponent("name = 'AI Red Dragon' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (listRes.ok) {
        const data = await listRes.json();
        if (data.files && data.files.length > 0) {
          setDriveFolderId(data.files[0].id);
          return data.files[0].id;
        }
      }

      // Create folder if not found
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'AI Red Dragon',
          mimeType: 'application/vnd.google-apps.folder'
        })
      });

      if (createRes.ok) {
        const folder = await createRes.json();
        setDriveFolderId(folder.id);
        return folder.id;
      }
    } catch (err) {
      console.error('Error finding/creating App folder in Google Drive:', err);
    }
    return null;
  };

  // Search/List files in Google Drive
  const handleListFiles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let q = "trashed = false";
      if (searchQuery) {
        q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      } else {
        // Filter for documents, sheets, PDFs, images, text, and JSON backups
        q += " and (mimeType = 'application/pdf' or mimeType contains 'image/' or mimeType = 'text/plain' or mimeType = 'application/json' or mimeType = 'text/markdown')";
      }

      const encodedQ = encodeURIComponent(q);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodedQ}&pageSize=20&orderBy=createdTime desc&fields=files(id,name,mimeType,size,createdTime,webViewLink)`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        const errText = await res.text();
        console.error('List files error:', errText);
        addToast('Failed to fetch file list. Connection may be stale.', 'error');
      }
    } catch (err) {
      console.error('Error listing Google Drive files:', err);
      addToast('Error listing files. Check network connectivity.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Autoload list of files when token changes or search query changes
  useEffect(() => {
    if (token) {
      handleListFiles();
    }
  }, [token]);

  // Download a file and parse it using Gemini
  const handleImportFile = async (file: DriveFile) => {
    if (!token) return;
    
    // Warn user before updating state if they have unsaved parameters
    const confirmImport = window.confirm(
      `Import file "${file.name}" from Google Drive? This will run our AI model to automatically extract academic data and populate your profile.`
    );
    if (!confirmImport) return;

    setImportingFileId(file.id);
    try {
      // 1. Download file content from Google Drive
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const fileRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!fileRes.ok) {
        throw new Error(`Failed to download file from Google Drive (Status: ${fileRes.status})`);
      }

      const blob = await fileRes.blob();

      // Check if it's a JSON profile backup first
      if (file.mimeType === 'application/json' || file.name.endsWith('.json')) {
        const text = await blob.text();
        const parsedJson = JSON.parse(text);
        if (parsedJson.stream || parsedJson.name) {
          onImportProfile(parsedJson);
          addToast(`Successfully restored profile from JSON backup "${file.name}"!`, 'success');
          return;
        }
      }

      // Convert to Base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = () => reject(new Error('Failed to convert file for processing.'));
        reader.readAsDataURL(blob);
      });

      // 2. Post to backend mark sheet parser
      const parseResponse = await fetch('/api/parse-marksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.mimeType || 'application/pdf'
        })
      });

      if (!parseResponse.ok) {
        throw new Error('AI parser failed to analyze this document type.');
      }

      const parsedData = await parseResponse.json();
      onImportProfile(parsedData);
      addToast(`Successfully analyzed academic document! Pre-populated profile fields.`, 'success');
    } catch (err: any) {
      console.error('Import/parse error:', err);
      addToast(err?.message || 'Error processing Google Drive document.', 'error');
    } finally {
      setImportingFileId(null);
    }
  };

  // Helper to format Blueprint into beautiful Markdown text
  const formatBlueprintToMarkdown = () => {
    if (!activeReport) return '';
    const r = activeReport;
    const p = activeProfile || {};

    let md = `# AI Intelligence Career & Admissions Blueprint\n`;
    md += `**Student Profile Name:** ${p.name || 'Student'}\n`;
    md += `**Academic Stream:** ${p.stream || 'N/A'}\n`;
    md += `**Generated At:** ${new Date().toLocaleString()}\n`;
    md += `**System version:** AI Red Dragon V1\n\n`;

    md += `## EXECUTIVE SUMMARY\n`;
    md += `${r.executiveSummary || 'No summary available.'}\n\n`;

    if (r.studentDna) {
      md += `## STUDENT ACADEMIC DNA CORES\n`;
      md += `${r.studentDna.analysis || ''}\n\n`;
    }

    if (r.streamEvaluation) {
      md += `## STREAM EVALUATION & RECOMMENDATIONS\n`;
      md += `**Current Suitability:** ${r.streamEvaluation.currentSuitability || ''}\n`;
      md += `**Recommendations:** ${r.streamEvaluation.recommendations || ''}\n\n`;
    }

    if (r.colleges && r.colleges.length > 0) {
      md += `## RECOMMENDED COLLEGE ADVISORY TARGETS\n`;
      r.colleges.forEach((col: any) => {
        md += `### ${col.name} (${col.tier} Choice)\n`;
        md += `- **Course:** ${col.course || ''}\n`;
        md += `- **Fees:** ${col.fees || ''} (Hostel: ${col.hostelCost || 'N/A'})\n`;
        md += `- **Accreditation:** ${col.accreditation || ''}\n`;
        md += `- **Placement Quality:** ${col.placementQuality || ''} (Average pkg: ${col.averagePackage || ''})\n`;
        md += `- **ROI:** ${col.roi || ''}\n`;
        md += `- **Strategic Advantages:** ${col.advantages || ''}\n\n`;
      });
    }

    if (r.successRoadmap && r.successRoadmap.length > 0) {
      md += `## EXCLUSIVE SUCCESS ROADMAP MILESTONES\n`;
      r.successRoadmap.forEach((step: any) => {
        md += `### ${step.year}\n`;
        md += `**Focus Area:** ${step.focus || ''}\n`;
        md += `**Core Skills:** ${(step.skills || []).join(', ')}\n`;
        md += `**Milestones & Action items:**\n`;
        (step.milestones || []).forEach((m: string) => {
          md += `- [ ] ${m}\n`;
        });
        md += `\n`;
      });
    }

    return md;
  };

  // Helper to format roadmap to CSV
  const formatRoadmapToCsv = () => {
    if (!activeReport) return '';
    const r = activeReport;
    let csv = "=== SUCCESS ROADMAP MILESTONES ===\n";
    csv += "Academic Year,Focus Area,Core Skills to Build,Milestones & Goals\n";

    if (r.successRoadmap && r.successRoadmap.length > 0) {
      r.successRoadmap.forEach((step: any) => {
        const year = `"${(step.year || '').replace(/"/g, '""')}"`;
        const focus = `"${(step.focus || '').replace(/"/g, '""')}"`;
        const skills = `"${(step.skills || []).join('; ').replace(/"/g, '""')}"`;
        const milestones = `"${(step.milestones || []).join('; ').replace(/"/g, '""')}"`;
        csv += `${year},${focus},${skills},${milestones}\n`;
      });
    }
    return csv;
  };

  // Upload file content to Google Drive (with optional Parent Folder)
  const handleExportFile = async (format: 'markdown' | 'csv' | 'json') => {
    if (!token) return;
    
    let fileName = '';
    let mimeType = '';
    let fileContent = '';

    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName = (activeProfile?.name || 'Student').replace(/\s+/g, '_');

    if (format === 'markdown') {
      fileName = `${safeName}_AI_Blueprint_${timestamp}.md`;
      mimeType = 'text/markdown';
      fileContent = formatBlueprintToMarkdown();
      if (!fileContent) {
        addToast('No generated blueprint content available to export.', 'error');
        return;
      }
    } else if (format === 'csv') {
      fileName = `${safeName}_Success_Roadmap_${timestamp}.csv`;
      mimeType = 'text/csv';
      fileContent = formatRoadmapToCsv();
      if (!activeReport?.successRoadmap) {
        addToast('No success roadmap roadmap available to export.', 'error');
        return;
      }
    } else if (format === 'json') {
      fileName = `${safeName}_Profile_Backup_${timestamp}.json`;
      mimeType = 'application/json';
      fileContent = JSON.stringify(activeProfile || {}, null, 2);
      if (!activeProfile || Object.keys(activeProfile).length === 0) {
        addToast('No active profile details found to back up.', 'error');
        return;
      }
    }

    const confirmExport = window.confirm(
      `Save and upload "${fileName}" directly to your Google Drive inside the "AI Red Dragon" folder?`
    );
    if (!confirmExport) return;

    setExporting(format);
    try {
      // Find or create parent folder
      const folderId = driveFolderId || await findOrCreateAppFolder(token);

      // Construct multipart body
      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: folderId ? [folderId] : undefined
      };

      const boundary = '---------AI_RED_DRAGON_MULTIPART_BOUNDARY---------';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
        fileContent +
        closeDelim;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (!response.ok) {
        throw new Error(`Google Drive API rejected upload with status ${response.status}`);
      }

      addToast(`"${fileName}" successfully exported to Google Drive!`, 'success');
      handleListFiles(); // Refresh file browser
    } catch (err: any) {
      console.error('Export error:', err);
      addToast(err?.message || 'Error exporting to Google Drive.', 'error');
    } finally {
      setExporting(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="text-red-500 shrink-0" size={16} />;
    if (mimeType === 'text/markdown' || mimeType === 'text/plain') return <FileText className="text-blue-400 shrink-0" size={16} />;
    if (mimeType === 'text/csv' || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="text-emerald-500 shrink-0" size={16} />;
    if (mimeType === 'application/json') return <Database className="text-amber-500 shrink-0" size={16} />;
    if (mimeType.includes('image/')) return <Cloud className="text-purple-500 shrink-0" size={16} />;
    return <Folder className="text-slate-400 shrink-0" size={16} />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-white mb-6">
      <div className="absolute top-0 right-0 w-36 h-36 bg-red-600/5 rounded-full blur-2xl"></div>
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/15 border border-red-500/20 text-red-500 rounded-xl">
            <Cloud size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">Google Drive Workspace</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Securely import records or backup career blueprints directly.</p>
          </div>
        </div>
        
        {token && userEmail ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full font-medium">
              Connected: <strong className="text-emerald-400">{userEmail}</strong>
            </span>
            <button
              onClick={handleDisconnect}
              className="text-[10px] font-bold text-red-400 hover:text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-extrabold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            {loading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.4-.81-.9-1.03-1.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Connect Google Drive</span>
          </button>
        )}
      </div>

      {!token ? (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-slate-900 border border-slate-800 text-slate-500 rounded-full flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Access Restrained</h4>
            <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Enable connection with Google Drive to directly back up career roadmap charts, export academic reports, and import transcript PDFs seamlessly.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Authorize Connection
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Section: EXPORTS */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3.5 flex items-center gap-1.5">
              <Upload size={12} className="text-red-500" />
              Export & Backup to Cloud Folder
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Export Blueprint Markdown */}
              <button
                onClick={() => handleExportFile('markdown')}
                disabled={exporting !== null || !activeReport}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl transition ${
                  activeReport 
                    ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-left hover:border-red-500/40 cursor-pointer' 
                    : 'bg-slate-900/20 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg mb-2">
                  <FileText size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Save PDF/Markdown</span>
                <span className="text-[9px] text-slate-400 mt-1 text-center leading-tight">
                  {exporting === 'markdown' ? 'Saving...' : 'Export Complete Report'}
                </span>
              </button>

              {/* Export Roadmap CSV */}
              <button
                onClick={() => handleExportFile('csv')}
                disabled={exporting !== null || !activeReport?.successRoadmap}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl transition ${
                  activeReport?.successRoadmap 
                    ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-left hover:border-emerald-500/40 cursor-pointer' 
                    : 'bg-slate-900/20 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mb-2">
                  <FileSpreadsheet size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Save Roadmap CSV</span>
                <span className="text-[9px] text-slate-400 mt-1 text-center leading-tight">
                  {exporting === 'csv' ? 'Saving...' : 'Export Excel-compatible CSV'}
                </span>
              </button>

              {/* Export Profile Backup JSON */}
              <button
                onClick={() => handleExportFile('json')}
                disabled={exporting !== null || !activeProfile}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl transition ${
                  activeProfile 
                    ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-left hover:border-amber-500/40 cursor-pointer' 
                    : 'bg-slate-900/20 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg mb-2">
                  <Database size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Backup Profile JSON</span>
                <span className="text-[9px] text-slate-400 mt-1 text-center leading-tight">
                  {exporting === 'json' ? 'Saving...' : 'Save credentials & values'}
                </span>
              </button>
            </div>
          </div>

          {/* Section: FILE IMPORTER */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/60 pb-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Download size={12} className="text-red-500 animate-bounce" />
                Import & Parse Academic Documents
              </h4>

              {/* Simple Search */}
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleListFiles()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-red-500/50 placeholder-slate-500"
                />
                <button
                  onClick={handleListFiles}
                  className="absolute top-2 right-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <Search size={12} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin text-red-500" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Querying Cloud Files...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p className="text-xs">No matching academic documents found in Google Drive.</p>
                <p className="text-[10px] mt-1 max-w-xs mx-auto leading-normal">
                  Upload Class 10/12 marksheets, transcripts, or JSON backups into your Google Drive, then refresh this view.
                </p>
                <button
                  onClick={handleListFiles}
                  className="mt-3 inline-flex items-center text-[10px] font-bold text-red-400 hover:text-white gap-1 uppercase tracking-wider"
                >
                  <RefreshCw size={10} /> Reload Files
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                      <th className="py-2 px-1">File Name</th>
                      <th className="py-2 px-1">Size</th>
                      <th className="py-2 px-1 hidden sm:table-cell">Created</th>
                      <th className="py-2 px-1 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                    {files.map((file) => {
                      const isImporting = importingFileId === file.id;
                      const isJsonBackup = file.mimeType === 'application/json' || file.name.endsWith('.json');
                      const sizeKb = file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Folder';
                      
                      return (
                        <tr key={file.id} className="hover:bg-slate-900/45 transition">
                          <td className="py-3 px-1 flex items-center gap-2 max-w-xs sm:max-w-md truncate">
                            {getFileIcon(file.mimeType)}
                            <span className="font-bold text-slate-200 truncate" title={file.name}>{file.name}</span>
                          </td>
                          <td className="py-3 px-1 text-slate-400 text-[11px] font-mono">{sizeKb}</td>
                          <td className="py-3 px-1 text-slate-400 text-[10px] hidden sm:table-cell">
                            {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-1 text-right">
                            <div className="inline-flex items-center gap-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              <button
                                onClick={() => handleImportFile(file)}
                                disabled={isImporting}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
                                  isJsonBackup
                                    ? 'bg-amber-600/25 hover:bg-amber-600 border border-amber-600/30 text-amber-300 hover:text-white'
                                    : 'bg-red-600/15 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white'
                                }`}
                              >
                                {isImporting ? (
                                  <>
                                    <RefreshCw size={10} className="animate-spin" />
                                    <span>Parsing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={10} />
                                    <span>{isJsonBackup ? 'Restore Profile' : 'AI Parse'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
