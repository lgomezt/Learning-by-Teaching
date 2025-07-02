import Sidebar from "./sidebar";
import { useState } from "react";
import Chatbot from "./chatbot";

type LeftPanelProps = {
  userCode?: string;
  setUserCode?: any;
  agentCode?: string;
  setAgentCode?: any;
};

function LeftPanel({ userCode, setUserCode, agentCode, setAgentCode } : LeftPanelProps){
    const [isOpen, setIsOpen] = useState<boolean>(true);

    return ( <>
        <div className="flex flex-row flex-4 border-1 bg-[#DEECF4] border-black">
            <Sidebar isOpen={isOpen} toggle={() => setIsOpen(!isOpen)}></Sidebar>
            <Chatbot isOpen={isOpen} userCode={userCode} setUserCode={setUserCode} agentCode={agentCode} setAgentCode={setAgentCode}></Chatbot>
        </div>
    </> )

}

export default LeftPanel;