const LoadingComponent = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
      <p className="text-lg text-slate-300">{message}</p>
    </div>
  </div>
);

export default LoadingComponent;