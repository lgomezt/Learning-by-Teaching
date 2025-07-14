import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import HomePage from "./homepage";
import UploadPage from "./uploadpage";

export default function LandingPage() {
    const navigate = useNavigate();
    
    const navigateToIDE = () => {
        navigate('/ide');
    };

    const autoscroll = (id: string) => {
        const uploadSection = document.getElementById(id);
        uploadSection?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
    <div className="font-sans">
        {/* Navbar */}
        <Navbar autoscroll={autoscroll}></Navbar>

        {/* First Page */}
        <section id="home" className="h-screen relative overflow-hidden flex items-center justify-center">
            <HomePage autoscroll={autoscroll} navigateToIDE={navigateToIDE}></HomePage>
        </section>

        {/* Second Page */}
        <section id="upload" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center py-20">
          <UploadPage navigateToIDE={navigateToIDE}></UploadPage>
        </section>

        {/* Third Page */}
        <section id="about" className="h-screen bg-white flex items-center justify-center">
            <div>
                About Us
            </div>
        </section>
    </div>
    );
}