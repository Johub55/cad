import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CAD MDT Onverwachte fout:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('emh_cad_session');
    } catch {
      // Ignored
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
              MDT Systeem Herstel
            </span>
            <h1 className="text-xl font-black text-white mt-1 mb-2">
              Systeemfout Opgelopen
            </h1>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Er is een onverwachte fout opgetreden in de browser sessie. Klik hieronder om het Emergency Hamburg CAD systeem opnieuw op te starten.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 text-left mb-4 overflow-x-auto max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Herlaad CAD Systeem
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
