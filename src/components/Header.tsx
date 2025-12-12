import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Services", href: "/services" },
  { label: "Request Inspection", href: "/request-inspection" },
  { label: "Track Order", href: "/track" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow">
              <img src="/images/white.svg" alt="Stazama Logo" className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">Stazama</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <Button asChild size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {!loading && (
                  user ? (
                    <Button asChild>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/auth" onClick={() => setIsOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/auth" onClick={() => setIsOpen(false)}>Get Started</Link>
                      </Button>
                    </>
                  )
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
