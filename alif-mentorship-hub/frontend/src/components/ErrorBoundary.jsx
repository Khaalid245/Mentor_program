import { Component } from "react";

// ErrorBoundary — catches render errors in child components
// Wrap around dashboard sections so one crash doesn't blank the whole page
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-semibold">Something went wrong.</p>
          <p className="text-red-500 text-sm mt-1">
            Please refresh the page. If the problem persists, contact support.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
