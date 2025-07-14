import { useState } from "react";
import Chatbot from "./chatbot";
import Goal from "./goal";

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
        <div className="flex flex-4 flex-col h-[calc(99vh-5rem)]">
            <Chatbot
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                problemStatement={problemStatement}
                userCodeT0={userCodeT0}
                userCodeT1={userCodeT1}
                agentCodeT0={agentCodeT0}
                agentCodeT1={agentCodeT1}
                onAgentCodeUpdate={handleAgentCodeChange}
            />
            <Goal text={problemStatement}></Goal>
        </div>
    </> 
    )

}

export default LeftPanel;