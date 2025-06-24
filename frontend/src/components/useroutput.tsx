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
        <div className="flex flex-col flex-2 border-l-2 border-black">
            <div id="user-control" className="flex flex-1">
                <button className={`flex flex-1 ${type === 1 ? 'bg-gray-300' : 'bg-white'} font-['Space_Mono'] h-full items-center justify-center hover:bg-gray-200 cursor-pointer border-b-2 border-r-2`} onClick={() => outputType(1)}>TERMINAL</button>
                <button className={`flex flex-1 ${type === 2 ? 'bg-gray-300' : 'bg-white'} font-['Space_Mono'] h-full items-center justify-center hover:bg-gray-200 cursor-pointer border-b-2`} onClick={() => outputType(2)}>VISUAL</button>
            </div>
            <div className="flex flex-10">
        {type === 1 && (
            <div className="px-4 py-4 bg-[#242121] text-white flex-1 font-['Menlo'] text-xs h-[calc(10*((100vh-5rem)/2)/11)] w-[calc(2*(100vw/3)/4)] overflow-auto whitespace-pre-wrap break-words">
                {history.map((line, idx) => (<div key={idx}>% python3 main.py <br/>{line}</div>))}<div ref={scrollRef} />
            </div>
        )}
                {type === 2 && <div className="bg-amber-300 flex-1"></div>}
            </div>
        </div>
    )
}

export default UserOutput;