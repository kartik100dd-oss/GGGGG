import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message || 'Unknown Error'}
Stack: ${error?.stack || ''}
Component Stack: ${errorInfo?.componentStack || ''}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || '';
      
      // Determine if error is likely related to API downtime or parsing
      const isApiDowntime = 
        errorMsg.includes('503') || 
        errorMsg.toLowerCase().includes('unavailable') || 
        errorMsg.toLowerCase().includes('high demand') ||
        errorMsg.toLowerCase().includes('rate limit');
        
      const isJsonParsing = 
        errorMsg.toLowerCase().includes('unexpected token') || 
        errorMsg.toLowerCase().includes('json') || 
        errorMsg.toLowerCase().includes('doctype');

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Application Interface Encountered an Issue</h1>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">AI Red Dragon Runtime Monitor</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 mb-6 text-sm">
              <h2 className="font-bold text-slate-200 mb-2">What went wrong?</h2>
              
              {isApiDowntime ? (
                <p className="text-xs text-gray-400 leading-relaxed">
                  The backend server reported high demand or service unavailability from the Gemini AI model. This is typically a transient surge in web traffic. Please wait a few seconds and try refreshing the application.
                </p>
              ) : isJsonParsing ? (
                <p className="text-xs text-gray-400 leading-relaxed">
                  The client received an invalid raw document format (typically an HTML gateway page or cloud timeout notice) instead of structured JSON data. This usually indicates an active server-side upgrade or timeout.
                </p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  The application encountered an unexpected client-side runtime exception. Our system integrity controls have captured the event details.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <span className="text-[9px] uppercase font-extrabold text-red-400 tracking-wider block mb-1">Diagnostic Signature</span>
                <code className="text-xs text-rose-300 font-mono break-all">{errorMsg || 'Runtime error: Render cycle interrupted.'}</code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw size={14} className="mr-2 animate-spin-slow" />
                Reload Application
              </button>
              
              <button
                onClick={this.handleCopyError}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check size={14} className="mr-2 text-emerald-400" />
                    Diagnostics Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-2" />
                    Copy Error Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
