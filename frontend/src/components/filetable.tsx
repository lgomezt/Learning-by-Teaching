import { useFiles } from "../../context/filecontext";
import { useNavigate } from "react-router-dom";

function FileTable() {
  const { files, setSelectedFile } = useFiles();
  const navigate = useNavigate();

  const handleLoadFile = (index: number) => {
    setSelectedFile(files[index])
    navigate("/ide");
  };

  return (
    <div className="min-h-screen bg-gray-50 shadow-2xl py-10 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Uploaded Problems</h1>
        <p className="text-gray-600 mb-6">
          Below is a list of the Markdown files you've uploaded. You can load any lesson into the IDE by clicking the "Load" button.
        </p>

        <div className="overflow-x-auto border border-gray-200 shadow-md rounded-lg bg-white">
          {files.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No files uploaded yet. Upload a `.md` file to get started.</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold">Filename</th>
                  <th className="px-6 py-3 text-sm font-semibold">Size</th>
                  <th className="px-6 py-3 text-sm font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{file.name}</td>
                    <td className="px-6 py-4">{(file.size / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleLoadFile(index)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                      >
                        Load Lesson {index+1}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTable;
