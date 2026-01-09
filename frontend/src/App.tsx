import { Layout } from './components/Layout';
import { FileUploader } from './components/Library/FileUploader';
import { SourceList } from './components/Library/SourceList';
import { ChatWindow } from './components/Chat/ChatWindow';
import { StrategySidebar } from './components/Pedagogy/StrategySidebar';
import { useTeachableAgent } from './hooks/useTeachableAgent';
import { useSessionExport } from './hooks/useSessionExport';
import { useChat } from './context/AppContext';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

function AppContent() {
  const { sendMessage } = useTeachableAgent();
  const { downloadSession } = useSessionExport();
  const { messages } = useChat();

  const hasMessages = messages.length > 0;

  return (
    <div className="relative h-screen">
      <Layout
        library={
          <div className="space-y-6">
            <FileUploader />
            <SourceList />
          </div>
        }
        chat={<ChatWindow onSendMessage={sendMessage} />}
        pedagogy={<StrategySidebar />}
        exportButton={
          hasMessages ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={downloadSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                backgroundColor: '#2d5a4d',
                color: '#ffffff',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3d7a65';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2d5a4d';
              }}
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export Session</span>
            </motion.button>
          ) : undefined
        }
      />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
