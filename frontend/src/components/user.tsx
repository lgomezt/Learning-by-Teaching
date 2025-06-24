import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import UserOutput from "./useroutput";

type UserProps = {
  start_code?: string;
};

function User({ start_code = "print('Hello, world!')" }: UserProps) {
  const [code, setCode] = useState<string>(start_code);
  const [output, setOutput] = useState<string>("");
  const [pyodide, setPyodide] = useState<any>(null);

  useEffect(() => {
    setCode(start_code);
  }, [start_code]);

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

  async function runCode() {
    if (!pyodide) return;
    setOutput("");
    // Capture output
    pyodide.setStdout({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    pyodide.setStderr({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    try {
      await pyodide.runPythonAsync(code);
    } catch (err: unknown) {
      setOutput(String(err));
    }
  }

  return (
    <div className="flex flex-1 border-1">
      <div className="flex flex-col flex-3">
        <div className="flex flex-1 items-center justify-between px-10 py-1">
          <div className="text-sm font-semibold text-gray-700">Main.py</div>
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
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "monospace",
          }}
        />
      </div>
      <UserOutput text={output}></UserOutput>
    </div>
  );
}

export default User;