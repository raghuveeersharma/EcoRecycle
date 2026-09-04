import { Component } from "react";

/** Stops a render error in any page from blanking the entire app. */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <h1 className="text-3xl font-bold text-[#1D4C6C]">
          Something went wrong
        </h1>
        <p className="max-w-md text-gray-600">
          The page ran into an unexpected error. Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#1D4C6C] px-6 py-3 text-white transition-colors duration-300 hover:bg-[#163A53]"
        >
          Reload the page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
