import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import IntroductionPage from "@/pages/IntroductionPage";
import AboutUsPage from "@/pages/AboutUsPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import HomePage from "@/pages/HomePage";

const Placeholder = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
    <h1 className="text-3xl font-bold">{title}</h1>
  </div>
);

const NotAvailablePage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <div className="text-center">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">{title}</h1>
      <p className="text-white/70 text-base sm:text-lg">Not available yet.</p>
    </div>
  </div>
);

const ScrollToTop = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // Instantly jump to top on page change without animation
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [hash, pathname]);

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/arena" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/arena" element={<IntroductionPage />} />
        <Route path="/arena/how-it-works" element={<HowItWorksPage />} />
        <Route path="/arena/about-us" element={<AboutUsPage />} />
        <Route path="/arena/contact" element={<NotAvailablePage title="Contact" />} />
        <Route path="/arena/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/arena/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/arena/login" element={<Placeholder title="Login" />} />
        <Route path="/arena/pricing" element={<Placeholder title="Pricing" />} />
      </Routes>
    </BrowserRouter>
  );
}
