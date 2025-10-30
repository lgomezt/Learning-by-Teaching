import LoginButton from "./loginButton";

// type HomePageProps = {
//   autoscroll: (page: string) => void;
// };

// export default function HomePage({ autoscroll } : HomePageProps) {
export default function HomePage() {
  return ( <>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-green-100"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-50/60 to-emerald-50/70"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-gray-50/50 via-transparent to-green-50/60"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-green-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-slate-200/30 to-emerald-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-20"></div>
      
      {/* Content */}
      <div className="text-center relative z-10">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-700 via-green-600 to-blue-600 bg-clip-text text-transparent mb-6 pb-2">
          Teaching the Agent
      </h1>
      {/* <p className="text-xl md:text-2xl text-gray-600 mb-8">
          Redefine Learning
      </p> */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* <button 
          onClick={() => autoscroll("upload")}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
          Upload Lesson Plan
          </button> */}

          <LoginButton />
       
          {/* <button onClick={() => autoscroll("lessons")}
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/30">
              Enter IDE
          </button> */}
      </div>
      </div>
    </>
  )
}
