type NavbarProps = {
  autoscroll?: (code: string) => void;
};
export default function Navbar({ autoscroll } : NavbarProps) {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl rounded-full px-15 py-5">
          <ul className="flex space-x-20 items-center text-gray-700 text-base font-medium">
            <li onClick={() => autoscroll("home")} className="hover:text-green-600 transition-all duration-300 cursor-pointer hover:scale-105">Home</li>
            <li onClick={() => autoscroll("upload")} className="hover:text-green-600 transition-all duration-300 cursor-pointer hover:scale-105">Upload</li>
            <li onClick={() => autoscroll("about")} className="hover:text-green-600 transition-all duration-300 cursor-pointer hover:scale-105">About Us</li>
          </ul>
    </nav>
  )
}
