import LoginButton from "./loginButton";

export default function HomePage() {
  return (
    <>
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-full h-full object-cover"
            >
            <source
                src="https://res.cloudinary.com/dnxxtodgb/video/upload/A_photorealistic_cinematic_202510311800_fsh6i1.webm"
                type="video/webm"
            />
            <source
                src="https://res.cloudinary.com/dnxxtodgb/video/upload/A_photorealistic_cinematic_202510311800_fsh6i1.mp4"
                type="video/mp4"
            />
        </video>

        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-green-100 opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-50/60 to-emerald-50/70"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-gray-50/50 via-transparent to-green-50/60"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-slate-200/30 to-emerald-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-20"></div>
        </div>

        <div className="text-center relative z-20">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-700 via-green-600 to-blue-600 bg-clip-text text-transparent mb-6 pb-2">
            Teaching the Agent
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <LoginButton />
          </div>
        </div>
      </div>
    </>
  );
}