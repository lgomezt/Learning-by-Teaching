import Sidebar from "./sidebar";
import { useState } from "react";
import Chatbot from "./chatbot";

type LeftPanelProps = {
  problemStatement: string;
  userCodeT0: string;
  userCodeT1: string;
  agentCodeT0: string;
  agentCodeT1: string;
  handleAgentCodeChange: (newCode: string) => void;
};

function LeftPanel({
    problemStatement,
    userCodeT0,
    userCodeT1,
    agentCodeT0,
    agentCodeT1,
    handleAgentCodeChange,
}: LeftPanelProps) {

    const [isOpen, setIsOpen] = useState<boolean>(true);

    return ( 
    <>
        <div className="flex flex-row flex-4 border-1 bg-[#DEECF4] border-black">
            <Sidebar isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />
            <Chatbot
                isOpen={isOpen}
                problemStatement={problemStatement}
                userCodeT0={userCodeT0}
                userCodeT1={userCodeT1}
                agentCodeT0={agentCodeT0}
                agentCodeT1={agentCodeT1}
                onAgentCodeUpdate={handleAgentCodeChange}
            />
        </div>
    </> 
    )

}

export default LeftPanel;