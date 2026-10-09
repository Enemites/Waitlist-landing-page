import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="product-site min-h-screen bg-[#0D1517] text-[#EDF1EF] px-6 py-24 flex items-center justify-center">
    <div className="max-w-xl text-center">
      <p className="nova-mono text-sm mb-4">404</p>
      <h1 className="nova-display text-4xl mb-4">Page not found</h1>
      <p className="text-[#AFBAB6] mb-8">This address does not match an available page.</p>
      <div className="flex justify-center gap-6"><Link className="underline" to="/home">Enemites home</Link><Link className="underline" to="/arena">Explore Arena</Link></div>
    </div>
  </main>;
}
