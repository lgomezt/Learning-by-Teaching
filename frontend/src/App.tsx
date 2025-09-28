import { useState, useEffect } from "react";

import './App.css';
import Header from './components/header';
import LeftPanel from './components/leftpanel';
//import Goal from './components/goal';
import User from './components/user.tsx';
import { fetchProblem } from './utils/api';
import { useFiles } from "../context/filecontext.tsx";

function App() {
    const { selectedFile } = useFiles();

    const [ title, setTitle ] = useState<string>("");

    const [problemStatement, setProblemStatement] = useState<string>("");

    // Committed code states (used for backend context tracking).
    // T0 = previous version, T1 = current version.
    // These are only updated when the user signals intent (e.g. by clicking Run or interacting with the chatbot).
    const [userCodeT0, setUserCodeT0] = useState<string>("");
    const [userCodeT1, setUserCodeT1] = useState<string>("");

    const [agentCodeT0, setAgentCodeT0] = useState<string>("");
    const [agentCodeT1, setAgentCodeT1] = useState<string>("");

    const [userOutput, setUserOutput] = useState<string>("");
    const [agentOutput, setAgentOutput] = useState<string>("");

    const [lessonGoals, setLessonGoals] = useState([]);
    const [commonMistakes, setCommonMistakes] = useState([]);

    // Live-in-editor code states.
    // These store what the user or agent is *currently typing or editing* in real-time.
    // They update on every keystroke but do NOT count as meaningful code revisions
    // until the user explicitly submits the code (e.g., by pressing "Run" or sending a message).
    const [liveUserCode, setLiveUserCode] = useState<string>("");
    const [liveAgentCode, setLiveAgentCode] = useState<string>("");

    const [difficulty, setDifficulty] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);

    const [description, setDescription] = useState<string>("");
    const [milestones, setMilestones] = useState<{ number: number; content: string }[]>([]);
    const [goal, setGoal] = useState<string>("");

    // We should move this to utils later
    // This function handles the change in code for both user and agent.
    // It shifts the previous code (t0) to the current code (t1)
    // and updates the current code (t1) with the new code.
    // This is used to track the evolution of code over time.
    function handleCodeChange(
        newCode: string,
        codeT1: string,
        setCodeT0: (v: string) => void,
        setCodeT1: (v: string) => void,
        ) {
            if (newCode !== codeT1) {
                setCodeT0(codeT1); // shift current to previous
                setCodeT1(newCode); // update current
            }
        }

    function commitUserCode() {
        handleCodeChange(liveUserCode, userCodeT1, setUserCodeT0, setUserCodeT1);
    }

    function commitAgentCode(newCode?: string) {
        const codeToCommit = newCode || liveAgentCode;
        if (newCode) {
            setLiveAgentCode(newCode);
        }
        handleCodeChange(codeToCommit, agentCodeT1, setAgentCodeT0, setAgentCodeT1);
    }

    // Executed when the user press Load Lesson 1 button
    useEffect(() => {
        async function loadProblem() {
            if (selectedFile != null) {
                const problem = await fetchProblem(selectedFile);
                console.log("Loaded problem:", problem);
                
                // Load initial coding state
                const agentInit = problem.agent_code || "";
                const userInit = problem.user_code || "";

                setTitle(problem.title || "");

                // Initialize both t0 and t1
                setAgentCodeT0("");
                setUserCodeT0("");
                setAgentCodeT1(agentInit);
                setUserCodeT1(userInit);

                setDifficulty(problem.difficulty || "");
                
                setTags(problem.tags || []);

                // Retrieve the problem statement
                setProblemStatement(problem.problem_statement || "");
               
                setDescription(problem.description_block || "");
                setMilestones(problem.milestones || []);
                setGoal(problem.example_output || "");

                setCommonMistakes(problem.common_mistakes || []);
                setLessonGoals(problem.lesson_goals || []);
            }
        }
        
        loadProblem();
    }, [selectedFile]);

    return ( 
    <>
        {/*<Header title={title}/>*/}
        <div className="flex h-[calc(100vh)]">
            <div id="container-left" className="flex flex-col">
                <LeftPanel
                    title={title}
                    difficulty={difficulty}
                    tags={tags}
                    problemStatement={problemStatement}
                    description={description}
                    milestones={milestones}
                    goal={goal}
                    userCodeT0={userCodeT0}
                    userCodeT1={userCodeT1}
                    agentCodeT0={agentCodeT0}
                    agentCodeT1={agentCodeT1}
                    handleAgentCodeChange={commitAgentCode}
                    lessonGoals={lessonGoals}
                    commonMistakes={commonMistakes}
                />
            </div>
            <div className="flex flex-1 flex-col">
                <User start_code={userCodeT1} code={liveUserCode} setCode={setLiveUserCode} onCommit={commitUserCode} />
                <User start_code={agentCodeT1} code={liveAgentCode} setCode={setLiveAgentCode} onCommit={commitAgentCode} />
            </div>
        </div>
    </> )
}

export default App;
