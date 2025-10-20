import Navbar from "./navbar";
import HomePage from "./homepage";
import UploadPage from "./Deprecated/uploadpage";
import FileTable from "./Deprecated/filetable";

export default function LandingPage() {

    const autoscroll = (id: string) => {
        const uploadSection = document.getElementById(id);
        uploadSection?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
    <div className="font-sans">
        {/* Navbar */}
        {/* <Navbar autoscroll={autoscroll}></Navbar> */}

        {/* First Page */}
        <section id="home" className="h-screen relative overflow-hidden flex items-center justify-center">
            <HomePage autoscroll={autoscroll}></HomePage>
        </section>

        {/* Second Page */}
        {/* <section id="upload" className="min-h-screen bg-gradient-to-b from-slate-200 via-white to-slate-200 flex items-center justify-center py-20">
          <UploadPage autoscroll={autoscroll}></UploadPage>
        </section> */}

        {/* Third Page */}
        {/* <section id="lessons" className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 flex items-center justify-center py-20">
          <FileTable></FileTable>
        </section> */}

        {/* Fourth Page */}
        <section id="about" className="h-screen bg-white flex items-center justify-center">
            <div>
                About Us
            </div>
        </section>
    </div>
    );
}