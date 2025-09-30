// user.tsx
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import UserOutput from "./useroutput";
import { FaUser, FaRobot } from 'react-icons/fa';

const TYPING_SPEED_MS = 15; 

const panelThemes = {
  user: {
    label: "Your Workspace",
    Icon: FaUser,
    headerClasses: "bg-slate-800 text-slate-200",
    buttonClasses: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  agent: {
    label: "Coding Peer's Workspace",
    Icon: FaRobot,
    headerClasses: "bg-slate-700 text-slate-300",
    buttonClasses: "bg-cyan-600 hover:bg-cyan-700 text-white",
  }
};

type UserProps = {
  start_code?: string;
  code?: string;
  setCode?: (code: string) => void;
  onCommit?: () => void; 
  isAgentPanel?: boolean;
};

function User({ 
  start_code = "print('Hello, world!')", 
  code, 
  setCode, 
  onCommit,
  isAgentPanel = false
}: UserProps) {

  // Select the correct theme based on the isAgentPanel prop
  const theme = isAgentPanel ? panelThemes.agent : panelThemes.user;

  const [output, setOutput] = useState<string>("");
  const [pyodide, setPyodide] = useState<any>(null);

  // Local state to control the text displayed in the editor.
  // This allows us to have an animated value that's separate from the incoming props.
  const [displayedCode, setDisplayedCode] = useState(start_code);
  const intervalRef = useRef<number | null>(null);

  // This effect handles the typing animation for the agent panel
  useEffect(() => {
    // Stop any previous animation that might be running
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }

    // If it's the user panel, we just want to show the live code they are typing.
    if (!isAgentPanel) {
        setDisplayedCode(code);
        return;
    }

    // --- Agent Panel Animation Logic ---
    // When the committed code (start_code) from the agent changes, start the animation.
    let currentIndex = 0;
    const targetCode = start_code;
    
    // Set the editor to empty to start the animation from scratch
    setDisplayedCode(""); 

    intervalRef.current = window.setInterval(() => {
      if (currentIndex < targetCode.length) {
        setDisplayedCode((prev) => prev + targetCode[currentIndex]);
        currentIndex++;
      } else {
        // Animation is complete, clear the interval
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Ensure the final code is exactly the target code
        setDisplayedCode(targetCode);
        // Also update the parent's "live" code state to match
        setCode(targetCode);
      }
    }, TYPING_SPEED_MS);

    // This is a crucial cleanup function. It runs if the component is unmounted
    // or if the effect re-runs, preventing memory leaks.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

  }, [start_code, isAgentPanel]); // This effect re-runs when start_code changes


  // useEffect(() => {
  //   setCode(start_code);
  // }, [start_code]);

  useEffect(() => {
    async function load() {
      // Import Pyodide from ESM-compatible URL
      const pyodideModule = await import("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs");
      const pyodideInstance = await pyodideModule.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });
      setPyodide(pyodideInstance);
    }
    load();
  }, []);

  // Called when the user presses "Run".
  // Before executing, it promotes the current live code to a committed version (T1),
  // which then becomes part of the tracked state used by the agent for reasoning.
  async function runCode() {
    // Update the code T1 and T0 states
    if (onCommit) onCommit(); 
    if (!pyodide) return;
    setOutput("");
    // Capture output
    pyodide.setStdout({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    pyodide.setStderr({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    try {
      // IMPORTANT: Run the committed code from the prop, not the potentially-animating displayedCode
      await pyodide.runPythonAsync(code);
    } catch (err: unknown) {
      setOutput(String(err));
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    // Update the parent's live code state immediately
    setCode(newCode);
    // If it's the user panel, also update the local display immediately
    if (!isAgentPanel) {
        setDisplayedCode(newCode);
    }
  };

  return (
    <div className="flex flex-1 border-1 min-w-0">
      <div className="flex flex-col flex-3 min-w-0">
        <div className={`flex flex-none items-center justify-between px-4 py-2 ${theme.headerClasses}`}>
          <div className="flex items-center gap-3">
            <theme.Icon className="w-5 h-5" />
            <div className="text-sm font-semibold">{theme.label}</div>
          </div>
          <button
            className="mx-5 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={runCode}
            disabled={!pyodide}
          >
            Run
          </button>
        </div>
        <Editor
          className="flex-1"
          defaultLanguage="python"
          value={displayedCode} // The editor shows our local animated state
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "monospace",
            readOnly: isAgentPanel, // Make the agent editor read-only to prevent user interference
            wordWrap: 'on',
            lineNumbers: 'on'
          }}
        />
      </div>
      <UserOutput text={output}></UserOutput>
    </div>
  );
}

export default User;