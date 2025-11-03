import HomePage from "./homepage";

export default function LandingPage() {

    return (
    <div className="font-sans">
        {/* First Page */}
        <section id="home" className="h-screen relative overflow-hidden flex items-center justify-center">
            <HomePage></HomePage>
        </section>
        
        <section id="about" className="h-screen bg-white flex items-center justify-center">
            <div>
                About Us
            </div>
        </section>
    </div>
    );
}