import { useState, useEffect } from "react";

import './App.css';
import Header from './components/header';
import LeftPanel from './components/leftpanel';
//import Goal from './components/goal';
import User from './components/user.tsx';

import { fetchProblem } from './utils/api';

function App() {
    const [agentCode, setAgentCode] = useState<string>("");
    const [userCode, setUserCode] = useState<string>("");

    useEffect(() => {
        async function loadProblem() {
            const problem = await fetchProblem("0_template");
            console.log("Loaded problem:", problem);
            setAgentCode(problem.agent_code || "");
        }
        loadProblem();
    }, []);

    return ( 
    <>
        <Header></Header>
        <div className="flex h-[calc(100vh-5rem)]">
            <div id="container-left" className="flex flex-col flex-1">
                <LeftPanel userCode={userCode} setUserCode={setUserCode} agentCode={agentCode} setAgentCode={setAgentCode}></LeftPanel>
                {/* <Goal></Goal> */}
            </div>
            <div className="flex flex-2 flex-col">
                <User start_code='print("Hello, world!")' code={userCode} setCode={setUserCode}></User>
                <User start_code={agentCode} code={agentCode} setCode={setAgentCode}></User>
            </div>
        </div>
    </> )
}

export default App;
