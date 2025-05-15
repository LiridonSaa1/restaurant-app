import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Get all unique categories
  const categories = menuItems ? 
    ["all", ...Array.from(new Set(menuItems.map(item => item.category.toLowerCase())))] : 
    ["all", "starters", "mains", "desserts", "drinks"];

  // Filter items by category
  const filteredItems = menuItems?.filter(item => 
    activeCategory === "all" || item.category.toLowerCase() === activeCategory
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold mb-4">Our Menu</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Explore our carefully crafted menu featuring seasonal ingredients and chef specialties.
          Our dishes are prepared with the freshest local produce and innovative techniques.
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs 
        defaultValue={activeCategory} 
        onValueChange={setActiveCategory}
        className="w-full mb-10"
      >
        <div className="flex justify-center">
          <TabsList className="mb-8 inline-flex h-auto p-1 bg-neutral-100">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="px-6 py-2 capitalize"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeCategory} className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex">
                  <Skeleton className="w-24 h-24 rounded-md mr-4" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {filteredItems.map(item => (
                <Card key={item.id} className="border-0 shadow-none">
                  <CardContent className="p-0 flex">
                    <img 
                      src={item.image || "https://via.placeholder.com/150"} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover rounded-md mr-4" 
                    />
                    <div>
                      <div className="flex justify-between">
                        <h3 className="font-accent font-medium">{item.name}</h3>
                        <span className="text-primary font-medium">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                      {item.dietary && (
                        <div className="mt-2 flex gap-2">
                          {item.dietary.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No menu items found in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Menu Legend */}
      <div className="mt-12 p-6 bg-neutral-50 rounded-lg">
        <h3 className="font-medium mb-4">Dietary Notes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm">Vegetarian</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span className="text-sm">Vegan</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <span className="text-sm">Gluten Free</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span className="text-sm">Spicy</span>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          * Please inform your server of any allergies or dietary restrictions when ordering.
        </p>
      </div>
    </div>
  );
}
