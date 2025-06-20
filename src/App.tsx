import './App.css';
import Header from './components/header';
import LeftPanel from './components/leftpanel';
//import Goal from './components/goal';
import User from './components/user.tsx';

function App() {
    return ( <>
        <Header></Header>
        <div className="flex h-[calc(100vh-5rem)]">
            <div id="container-left" className="flex flex-col flex-1">
                <LeftPanel></LeftPanel>
                {/* <Goal></Goal> */}
            </div>
            <div className="flex flex-2 flex-col">
                <User></User>
                <User></User>
            </div>
        </div>
    </> )
}

export default App;
