type GoalProps = {
  text: string;
};

function Goal({ text }: GoalProps) {
  return (
    <div className="flex flex-col flex-2 min-h-0 border-2 border-black">
      <h2 className="text-xl font-bold text-center text-gray-800 mb-2 tracking-wide"> GOAL </h2>
      <p className="text-base text-gray-700 whitespace-pre-line overflow-y-auto">{text}</p>
    </div>
  );
}

export default Goal;
