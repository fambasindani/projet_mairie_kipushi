import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary a intercepté une erreur :', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleRelogin = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-slate-500">
              L'application a rencontré un problème inattendu. Vous pouvez réessayer ou vous reconnecter.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw size={16} /> Réessayer
              </button>
              <button
                onClick={this.handleRelogin}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 cursor-pointer"
              >
                <LogOut size={16} /> Se reconnecter
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
