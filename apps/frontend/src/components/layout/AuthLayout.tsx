import { Link, Outlet } from 'react-router-dom';
import { Flame, ShieldCheck } from 'lucide-react';

/** 4K fire extinguisher — firefighter training (6000×4000, Unsplash) */
const AUTH_IMAGE = '/images/auth-fire-safety.jpg';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 lg:block">
        <img
          src={AUTH_IMAGE}
          alt="Firefighter carrying a red fire extinguisher during safety training"
          className="h-full w-full object-cover object-[center_40%]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-blue-800/50" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-azure shadow-lg">
              <Flame className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-bold">TWZ LTD</span>
          </Link>
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Executive Operations Console
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight">Protect what matters most</h2>
            <p className="mt-4 max-w-md text-lg font-medium leading-relaxed text-white/80">
              Enterprise fire extinguisher management — inventory, compliance, service tracking, and more.
            </p>
          </div>
          <p className="font-mono text-xs text-white/50">
            © {new Date().getFullYear()} TWZ LTD
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-azure shadow-sm">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900">TWZ LTD</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
