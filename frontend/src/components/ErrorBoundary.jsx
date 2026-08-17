import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.mini) {
        return (
          <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center flex flex-col items-center justify-center space-y-2 animate-fadeIn h-full min-h-[120px]">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Widget Failed</span>
            <button
              onClick={this.handleReset}
              className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Reset
            </button>
          </div>
        );
      }

      return (
        <div className="glass-card p-8 rounded-[24px] border border-rose-500/25 bg-rose-500/5 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-12 animate-fadeIn">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Component Render Crash</h3>
            <p className="text-xs text-[#B8BCC8]/70 font-medium leading-relaxed">
              This dashboard section encountered an unexpected React rendering error.
            </p>
            {this.state.error && (
              <pre className="text-[9px] text-rose-300 bg-black/40 border border-white/[0.06] rounded-lg p-2.5 text-left max-w-xs overflow-x-auto font-mono max-h-24 leading-normal mt-2">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-bold text-[10px] rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
