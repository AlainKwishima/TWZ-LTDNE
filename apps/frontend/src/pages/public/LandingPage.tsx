import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Bell, Flame, Package, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Shield,
    title: 'Compliance Tracking',
    description: 'Monitor expiration dates, inspections, and regulatory compliance across all assets.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time KPIs, revenue trends, and inventory insights at a glance.',
  },
  {
    icon: Package,
    title: 'Asset Lifecycle',
    description: 'Track purchased extinguishers, expiry dates, and renewal alerts in one place.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Automated notifications for low stock, expiring assets, and escalations.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-azure shadow-sm">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-slate-900">TWZ LTD</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Executive Operations Console
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Manage fire extinguishers
            <span className="text-gradient-azure"> with confidence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
            End-to-end platform for inventory, orders, asset tracking, and compliance reporting.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/signup">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in to dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="px-4 sm:px-8">
            <h2 className="text-center font-display text-3xl font-bold text-slate-900">Everything you need</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm font-medium text-slate-500">
              Built for admins, staff, technicians, and customers.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="relative overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600 opacity-0 transition-opacity hover:opacity-100" />
                  <CardHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl gradient-azure px-8 py-16 text-center text-white shadow-elevated">
          <h2 className="font-display text-3xl font-bold">Ready to streamline your fire safety operations?</h2>
          <p className="mt-4 font-medium text-white/80">
            Join organizations managing thousands of extinguishers with TWZ LTD.
          </p>
          <Button size="lg" variant="secondary" className="mt-8 border-white/30 bg-white text-blue-700 hover:bg-blue-50" asChild>
            <Link to="/signup">Create your account</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm font-medium text-slate-500">
        © {new Date().getFullYear()} TWZ LTD — Fire Extinguisher Management System
      </footer>
    </div>
  );
}
