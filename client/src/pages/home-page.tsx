import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Utensils, 
  Clock, 
  MapPin,
  ArrowRight 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MenuItem } from "@shared/schema";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("starters");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });
  
  const filteredItems = menuItems?.filter(item => item.category.toLowerCase() === activeTab) || [];
  
  // Gallery images
  const galleryImages = [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
    "https://pixabay.com/get/g7de128586c802cb14c444248f4c4d577f1195596961922b1f52494e1a9b09cf1ae1fff8f7f00d41c646b1bbef2b0e326d55e606eb525018f070f103ad571ec23_1280.jpg",
    "https://pixabay.com/get/gb1bcd3cbcd53f5850f353a529150599b8ba632cf0efbb0e462f0c18d992bdea8591383efe956e1d5c0833f349db340904c1c1763f35df6ef405988314032c2fb_1280.jpg",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
    "https://pixabay.com/get/g0072750ff1e78cc30c26f03f97966c1130a6cecfa05a667cf7c8d416d4e2750521dd403f3ad78d6a673050983ce3e619bb43bd34db45f37a7c2856f0c0fc9eaa_1280.jpg",
    "https://pixabay.com/get/ge87574a87b64ba914d1a237a0ee04738458bfce8d6a42c6ec1ee0d5ae1a818285cf25cb89d73dccb05180d9915fee3187a27e99b161bbade3a06927b77dc4656_1280.jpg",
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
    "https://images.unsplash.com/photo-1519690889869-e705e59f72e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
  ];
  
  useEffect(() => {
    // Close lightbox on escape key
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="h-[500px] md:h-[600px] bg-neutral-800 hero-section"></div>
        <div className="absolute inset-0 hero-overlay flex items-center">
          <div className="container mx-auto px-6 py-12 md:py-24">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white leading-tight mb-4">
              Fine Dining <br/><span className="text-primary">Experience</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8">
              Enjoy exquisite cuisine in an elegant atmosphere. Our chef creates seasonal dishes using the finest local ingredients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/80 flex items-center">
                <Link href="/reservation">
                  <CalendarDays className="mr-2 h-5 w-5" /> Reserve Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-white/20">
                <Link href="/menu">
                  <Utensils className="mr-2 h-5 w-5" /> View Menu
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Chef preparing food" 
                className="rounded-lg shadow-xl w-full h-auto object-cover" 
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-heading font-bold mb-6">Our Culinary Story</h2>
              <p className="text-neutral-600 mb-4">
                Founded in 2010, Bistro Nouveau has established itself as a premier dining destination. 
                Our philosophy centers around sustainable, locally-sourced ingredients and innovative cooking techniques.
              </p>
              <p className="text-neutral-600 mb-6">
                Chef Marco Bellucci brings over 20 years of experience from renowned kitchens across Europe, 
                creating seasonal menus that showcase the best local produce while incorporating global influences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <Clock className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Hours</h3>
                    <p className="text-sm text-neutral-500">Tue-Sun: 5:30PM-10:30PM</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-sm text-neutral-500">123 Gourmet Street, Foodville</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16 bg-neutral-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Our Menu</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Explore our carefully crafted menu featuring seasonal ingredients and chef specialties.
            </p>
          </div>

          {/* Menu Tabs */}
          <div className="mb-10">
            <div className="flex flex-wrap justify-center border-b border-neutral-200 mb-8">
              <button 
                onClick={() => setActiveTab("starters")} 
                className={`px-4 py-2 font-medium border-b-2 transition-colors mx-1 md:mx-4 ${
                  activeTab === "starters" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-primary"
                }`}
              >
                Starters
              </button>
              <button 
                onClick={() => setActiveTab("mains")} 
                className={`px-4 py-2 font-medium border-b-2 transition-colors mx-1 md:mx-4 ${
                  activeTab === "mains" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-primary"
                }`}
              >
                Main Courses
              </button>
              <button 
                onClick={() => setActiveTab("desserts")} 
                className={`px-4 py-2 font-medium border-b-2 transition-colors mx-1 md:mx-4 ${
                  activeTab === "desserts" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-primary"
                }`}
              >
                Desserts
              </button>
              <button 
                onClick={() => setActiveTab("drinks")} 
                className={`px-4 py-2 font-medium border-b-2 transition-colors mx-1 md:mx-4 ${
                  activeTab === "drinks" ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-primary"
                }`}
              >
                Drinks
              </button>
            </div>

            {/* Menu Content */}
            <div className="transition-all duration-300 ease-in-out">
              <div className="grid md:grid-cols-2 gap-8">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div key={item.id} className="flex">
                      <img 
                        src={item.image || 'https://via.placeholder.com/150'} 
                        alt={item.name} 
                        className="w-24 h-24 object-cover rounded-md mr-4" 
                      />
                      <div>
                        <div className="flex justify-between">
                          <h3 className="font-accent font-medium">{item.name}</h3>
                          <span className="text-primary font-medium">${item.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback content if no menu items are available
                  <>
                    <div className="flex">
                      <div className="w-24 h-24 bg-neutral-200 rounded-md mr-4"></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="h-6 bg-neutral-200 rounded w-32"></div>
                          <div className="h-6 bg-neutral-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-neutral-200 rounded w-full mt-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mt-1"></div>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-24 h-24 bg-neutral-200 rounded-md mr-4"></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="h-6 bg-neutral-200 rounded w-32"></div>
                          <div className="h-6 bg-neutral-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-neutral-200 rounded w-full mt-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mt-1"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button asChild variant="link" className="text-primary hover:text-primary/80">
              <Link href="/menu" className="inline-flex items-center">
                View Full Menu <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Gallery</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Take a glimpse into our restaurant atmosphere and culinary creations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index}
                className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setActiveImage(image)}
              >
                <img 
                  src={image} 
                  alt={`Gallery image ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Image Lightbox */}
          {activeImage && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setActiveImage(null)}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(null);
                }} 
                className="absolute top-4 right-4 text-white text-3xl"
                aria-label="Close"
              >
                <X className="h-8 w-8" />
              </button>
              <img 
                src={activeImage} 
                alt="Enlarged gallery image" 
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Ready to Experience Our Cuisine?</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Reserve your table now and enjoy an unforgettable dining experience at Bistro Nouveau.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href="/reservation">
              <CalendarDays className="mr-2 h-5 w-5" /> Reserve a Table
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
