import { FaLightbulb, FaClipboardCheck, FaCog, FaChevronLeft, FaChevronRight} from 'react-icons/fa'; // or any icons you like

type SidebarProps = {
  isOpen: boolean;
  toggle: () => void;
};

function Sidebar(props: SidebarProps) {
    const { isOpen, toggle } = props;

    if (!isOpen) return ( <div className="relative h-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-blue-500 border-t-3 border-r-3 border-b-3 border-black rounded-r-full flex items-center cursor-pointer" onClick={toggle}>
            <FaChevronRight className="text-xl h-4 w-4" />
        </div>
    </div>);

    return ( <>
        <div className="relative h-full">
            <div className="top-0 left-0 h-full w-16 bg-[#CFE5B6] rounded-r-full border-t-4 border-r-4 border-b-4 border-black flex flex-col justify-between items-center py-6">
                <div className="flex flex-col gap-8 items-center py-10">
                    <FaLightbulb className="text-xl h-8 w-8"/>
                    <FaClipboardCheck className="text-xl h-8 w-8" />
                </div>
                <div className="py-10">
                    <FaCog className="text-xl h-7 w-7"/>
                </div>
            </div>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 w-6 h-12 bg-blue-500 border-t-3 border-r-3 border-b-3 border-black rounded-r-full flex items-center cursor-pointer" onClick={toggle}>
                <FaChevronLeft className="text-xl h-4 w-4" />
            </div>
        </div>
        </> );
}

export default Sidebar;