import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "./components/ToastContainer";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased">
        <AppRoutes />
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
