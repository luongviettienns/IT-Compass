import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/sections/Header";
import { Footer } from "./components/sections/Footer";
import { BottomNav } from "./components/sections/BottomNav";
import { LandingPage } from "./pages/LandingPage";
import { MajorsPage } from "./pages/MajorsPage";
import { BlogPage } from "./pages/BlogPage";
import { JobsPage } from "./pages/JobsPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { TestPage } from "./pages/TestPage";
import { MentorPage } from "./pages/MentorPage";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ScrollToTop } from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-background font-sans selection:bg-secondary/30 pb-16 md:pb-0">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/majors" element={<MajorsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/mentors" element={<MentorPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
        <Footer />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
