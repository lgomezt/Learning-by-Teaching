import teacher from "../assets/teacher.svg";

type HeaderProps = {
    title: string;
}

function Header({title} : HeaderProps) {
    
    return ( <>
        <header className="bg-[#81B29A] border-b-2 border-black w-full px-20 py-3">
            <div className="flex items-center gap-10 w-fit">
                <img src={teacher} alt="teacher.svg" className="h-14 w-14" />
                <h1 className="text-3xl text-black font-bold underline underline-offset-8 font-['Space_Mono'] tracking-tight cursor-default shrink-0">{title}</h1>
            </div>
        </header>
        </> );
}

export default Header;