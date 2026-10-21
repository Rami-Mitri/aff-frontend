import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Catches render/effect errors in a page so one broken page shows a message instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          This page hit an error and could not be displayed.
        </div>
        <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-xs">{this.state.error.message}</pre>
        <p className="text-xs">Other pages still work. Press F12, open the Console tab and send the red error to the developer.</p>
        <Button variant="outline" size="sm" onClick={() => this.setState({ error: null })}>Try again</Button>
      </div>
    );
  }
}
