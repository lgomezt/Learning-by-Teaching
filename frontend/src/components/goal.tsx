type GoalProps = {
  text: string;
};

function Goal({ text }: GoalProps) {
  return (
    <div className="flex flex-col flex-2 min-h-0 border rounded-2xl border-gray-300 bg-gray-50 shadow-md p-4">
      <h2 className="text-xl font-semibold text-center text-gray-800 mb-3 tracking-wide underline">GOAL</h2>
      <h3 className="text-m font-semibold text-center text-gray-800 mb-3 tracking-wide">Complete this lesson by achieving the output below:</h3>
      <pre className="text-sm font-mono whitespace-pre-wrap overflow-y-auto bg-black/90 text-green-300 p-3 rounded-md max-h-64">
        {text}
      </pre>
    </div>
  );
}

export default Goal;
