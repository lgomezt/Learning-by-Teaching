import { useState, useEffect, useRef} from "react";

type UserOutputProps = {
    text: string;
}

function UserOutput({ text }: UserOutputProps) {
    const [type, setType] = useState<number>(1);
    const [history, setHistory] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (text) setHistory((prev) => [...prev, text]);
    }, [text]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    function outputType(newType: number) : void {
        setType(newType);
    }

    return (
        <div className="flex flex-col flex-2 border-l border-slate-700 bg-slate-900">
            <div id="user-control" className="flex flex-1">
                <button className={`flex flex-1 ${type === 1 ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'} font-mono text-sm h-full items-center justify-center transition-colors cursor-pointer border-b border-slate-700 border-r border-slate-700`} 
                    onClick={() => outputType(1)}
                >
                    TERMINAL
                </button>
                <button className={`flex flex-1 ${type === 2 ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'} font-mono text-sm h-full items-center justify-center transition-colors cursor-pointer border-b border-slate-700`} 
                    onClick={() => outputType(2)}
                >
                    VISUAL
                </button>
            </div>
            <div className="flex flex-10">
                {type === 1 && (
                    <div className="px-4 py-4 bg-slate-950 text-slate-100 flex-1 font-mono text-sm h-[calc(10*((100vh)/2)/11)] w-[calc(2*(100vw/3)/4)] overflow-auto whitespace-pre-wrap break-words">
                        {history.length === 0 ? (
                            <div className="text-slate-500 italic">Ready to run your code...</div>
                        ) : (
                            history.map((line, idx) => (
                                <div key={idx} className="mb-3">
                                    <div className="text-emerald-400 text-xs mb-1">% python3 main.py</div>
                                    <div className="text-slate-100">{line}</div>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>
                )}
                {type === 2 && (
                    <div className="bg-slate-900 flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <p className="text-lg font-medium">Visual Output</p>
                            <p className="text-sm text-slate-500 mt-1">Graphical output will appear here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserOutput;