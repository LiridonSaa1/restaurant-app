import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation, isAdmin } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Reservation", path: "/reservation" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-primary text-2xl font-heading font-bold">Bistro Nouveau</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              href={link.path}
              className={`text-neutral-700 hover:text-primary font-medium transition-colors ${
                location === link.path ? "text-primary" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Account Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1">
                  <span>{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link href="/my-reservations" className="w-full">My Reservations</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/admin" className="w-full">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth" className="text-neutral-700 hover:text-primary font-medium transition-colors">
              Sign In
            </Link>
          )}
          
          {/* Reservation Button */}
          <Link href="/reservation">
            <Button className="bg-primary text-white hover:bg-primary/80">
              Reserve a Table
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-neutral-700 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden pt-16">
          <div className="flex justify-between items-center p-4 border-b absolute top-0 left-0 right-0">
            <span className="text-primary text-xl font-heading font-bold">Bistro Nouveau</span>
            <button onClick={closeMenu} className="text-neutral-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4 flex flex-col space-y-4 mt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-neutral-700 hover:text-primary py-2 font-medium transition-colors ${
                  location === link.path ? "text-primary" : ""
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link
                  href="/my-reservations"
                  className="text-neutral-700 hover:text-primary py-2 font-medium transition-colors"
                  onClick={closeMenu}
                >
                  My Reservations
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-neutral-700 hover:text-primary py-2 font-medium transition-colors"
                    onClick={closeMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="text-neutral-700 hover:text-primary py-2 font-medium transition-colors text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-neutral-700 hover:text-primary py-2 font-medium transition-colors"
                onClick={closeMenu}
              >
                Sign In
              </Link>
            )}
            
            <Link
              href="/reservation"
              className="bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/80 transition-colors font-medium text-center"
              onClick={closeMenu}
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
