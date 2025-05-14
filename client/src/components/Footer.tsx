import { Link } from "wouter";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-heading font-bold mb-4">Bistro Nouveau</h2>
            <p className="text-white/80 mb-4">
              A modern dining experience featuring seasonal ingredients and innovative culinary techniques,
              all in an elegant and welcoming atmosphere.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 hover:text-white" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/80 hover:text-white">Home</Link>
              </li>
              <li>
                <Link href="/menu" className="text-white/80 hover:text-white">Menu</Link>
              </li>
              <li>
                <Link href="/reservation" className="text-white/80 hover:text-white">Reservations</Link>
              </li>
              <li>
                <Link href="/my-reservations" className="text-white/80 hover:text-white">My Reservations</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-white/80">
                <MapPin className="h-4 w-4 mr-2" /> 123 Gourmet Street, Foodville
              </li>
              <li className="flex items-center text-white/80">
                <Phone className="h-4 w-4 mr-2" /> (555) 123-4567
              </li>
              <li className="flex items-center text-white/80">
                <Mail className="h-4 w-4 mr-2" /> info@bistronouveau.com
              </li>
              <li className="flex items-center text-white/80">
                <Clock className="h-4 w-4 mr-2" /> Tue-Sun: 5:30PM-10:30PM
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            &copy; 2023 Bistro Nouveau. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-white/60 text-sm hover:text-white">Privacy Policy</a>
            <a href="#" className="text-white/60 text-sm hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
