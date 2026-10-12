import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import IntroductionPage from "@/pages/IntroductionPage";
import AboutUsPage from "@/pages/AboutUsPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import HomePage from "@/pages/HomePage";
import PublicFormPage from "@/pages/PublicFormPage";
import ParentWaitlistPage from "@/pages/ParentWaitlistPage";
import SeoMetadata from "@/components/SeoMetadata";
import NotFoundPage from "@/pages/NotFoundPage";
import BlogsPage from "@/pages/BlogsPage";
import BlogPostPage from "@/pages/BlogPostPage";

const Placeholder = ({ title }: { title: string }) => (
  <div className="product-site product-state min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
    <h1 className="text-3xl font-bold">{title}</h1>
  </div>
);

const NotAvailablePage = ({ title }: { title: string }) => (
  <div className="product-site product-state min-h-screen bg-black text-white flex items-center justify-center px-4">
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

function LegacyProductRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${pathname.replace(/^\/arena(?=\/|$)/, "/realms")}${search}${hash}`} replace />;
}

function LegacyBlogRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/realms/blogs/what-is-enemites-realms${search}${hash}`} replace />;
}

export function SiteRoutes() {
  return (
    <>
      <SeoMetadata />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/arena/*" element={<LegacyProductRedirect />} />
        <Route path="/realms" element={<IntroductionPage />} />
        <Route path="/realms/how-it-works" element={<HowItWorksPage />} />
        <Route path="/realms/about-us" element={<AboutUsPage />} />
        <Route path="/realms/blogs" element={<BlogsPage />} />
        <Route path="/realms/blogs/apa-itu-enemites-realms" element={<LegacyBlogRedirect />} />
        <Route path="/realms/blogs/:slug" element={<BlogPostPage />} />
        <Route path="/realms/contact" element={<NotAvailablePage title="Contact" />} />
        <Route path="/realms/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/realms/parent-waitlist" element={<ParentWaitlistPage />} />
        <Route path="/realms/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/realms/login" element={<Placeholder title="Login" />} />
        <Route path="/realms/pricing" element={<Placeholder title="Pricing" />} />
        
        {/* Dynamic Questionnaire Form Route */}
        <Route path="/form/:slug" element={<PublicFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <BrowserRouter><SiteRoutes /></BrowserRouter>;
}
