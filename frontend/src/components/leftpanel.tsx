import Sidebar from "./sidebar";
import { useState } from "react";
import Chatbot from "./chatbot";


function LeftPanel() {
    const [isOpen, setIsOpen] = useState<boolean>(true);

    return ( <>
        <div className="flex flex-row flex-4 border-1 bg-[#DEECF4] border-black">
            <Sidebar isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}></Sidebar>
            <Chatbot isOpen={isOpen}></Chatbot>
        </div>
    </> )

}

export default LeftPanel;