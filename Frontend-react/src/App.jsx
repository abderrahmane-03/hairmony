
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UploadImage from "./components/FaceDetection/FaceDetection";
import LiveFaceShape from "./components/FaceDetection/LiveFaceShape"; 
import NavBar from "./components/Nav/Navbar";
const Home = () => (
  <div>
    
    <h1>Welcome</h1>
    <Link to="/upload">
      <button>Go to Face Shape Detector</button>
    </Link>
    <Link to="/live"></Link>
  </div>
);



function App() {
  return (
   
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadImage />} />
        <Route path="/live" element={<LiveFaceShape />} />
      </Routes>
    </Router>
    
  );
}

export default App;
