import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { MenuItem } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Utensils,
  Plus,
  Trash2,
  Edit,
  Image,
  Loader2,
  Tag,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

// Admin Sidebar Component
const AdminSidebar = () => {
  return (
    <div className="w-64 bg-secondary text-white h-screen fixed left-0 top-0 pt-24 px-4">
      <div className="space-y-1">
        <Link href="/admin">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Dashboard
          </Button>
        </Link>
        <Link href="/admin/reservations">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Calendar className="mr-2 h-5 w-5" />
            Reservations
          </Button>
        </Link>
        <Link href="/admin/tables">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Users className="mr-2 h-5 w-5" />
            Tables
          </Button>
        </Link>
        <Link href="/admin/menu">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light bg-secondary-light">
            <Utensils className="mr-2 h-5 w-5" />
            Menu
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Schema for menu item form
const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
  dietary: z.array(z.string()).optional(),
  isAvailable: z.boolean().default(true),
  featuredItem: z.boolean().default(false)
});

// Dietary options
const dietaryOptions = [
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Gluten Free", value: "gluten-free" },
  { label: "Dairy Free", value: "dairy-free" },
  { label: "Nut Free", value: "nut-free" },
  { label: "Spicy", value: "spicy" }
];

export default function AdminMenu() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Get unique categories from menu items
  const categories = menuItems 
    ? ["all", ...new Set(menuItems.map(item => item.category.toLowerCase()))]
    : ["all", "starters", "mains", "desserts", "drinks"];

  // Filter items by category
  const filteredItems = menuItems?.filter(item => 
    activeCategory === "all" || item.category.toLowerCase() === activeCategory
  ) || [];

  // Create menu item form
  const addForm = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "starters",
      image: "",
      dietary: [],
      isAvailable: true,
      featuredItem: false
    },
  });

  // Edit menu item form
  const editForm = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      dietary: [],
      isAvailable: true,
      featuredItem: false
    },
  });

  // Create menu item mutation
  const createMenuItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof menuItemSchema>) => {
      const res = await apiRequest("POST", "/api/menu-items", data);
      return await res.json() as MenuItem;
    },
    onSuccess: () => {
      toast({
        title: "Menu item created",
        description: "The menu item has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update menu item mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof menuItemSchema> }) => {
      const res = await apiRequest("PATCH", `/api/menu-items/${id}`, data);
      return await res.json() as MenuItem;
    },
    onSuccess: () => {
      toast({
        title: "Menu item updated",
        description: "The menu item has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Menu item deleted",
        description: "The menu item has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAddSubmit = (values: z.infer<typeof menuItemSchema>) => {
    createMenuItemMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof menuItemSchema>) => {
    if (selectedMenuItem) {
      updateMenuItemMutation.mutate({ id: selectedMenuItem.id, data: values });
    }
  };

  // Handle edit button click
  const handleEditClick = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    editForm.reset({
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: menuItem.category,
      image: menuItem.image || "",
      dietary: menuItem.dietary || [],
      isAvailable: menuItem.isAvailable,
      featuredItem: menuItem.featuredItem || false
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (selectedMenuItem) {
      deleteMenuItemMutation.mutate(selectedMenuItem.id);
    }
  };

  // Compute summary stats
  const totalItems = menuItems?.length || 0;
  const availableItems = menuItems?.filter(item => item.isAvailable).length || 0;
  const featuredItems = menuItems?.filter(item => item.featuredItem).length || 0;

  // Render dietary tags
  const renderDietaryTags = (dietary: string[] | undefined) => {
    if (!dietary || dietary.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {dietary.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      
      <div className="pl-64 pt-8 pb-16">
        <div className="container px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold">Menu Management</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/80">
                  <Plus className="mr-2 h-4 w-4" /> Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Menu Item</DialogTitle>
                  <DialogDescription>
                    Create a new item for your restaurant menu.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Truffle Risotto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0.01} 
                                step={0.01}
                                placeholder="19.99"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the menu item..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="starters">Starters</SelectItem>
                                <SelectItem value="mains">Main Courses</SelectItem>
                                <SelectItem value="desserts">Desserts</SelectItem>
                                <SelectItem value="drinks">Drinks</SelectItem>
                                <SelectItem value="sides">Side Dishes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Input 
                                  placeholder="https://example.com/image.jpg"
                                  {...field}
                                />
                                <div className="bg-neutral-100 p-2 rounded-r-md border border-l-0">
                                  <Image className="h-5 w-5 text-neutral-500" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="dietary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dietary Information (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2 border rounded-md p-3">
                              {dietaryOptions.map(option => (
                                <div key={option.value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`add-${option.value}`}
                                    value={option.value}
                                    checked={field.value?.includes(option.value)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const value = e.target.value;
                                      const newValues = checked
                                        ? [...(field.value || []), value]
                                        : (field.value || []).filter(v => v !== value);
                                      field.onChange(newValues);
                                    }}
                                    className="accent-primary h-4 w-4 mr-1.5"
                                  />
                                  <label htmlFor={`add-${option.value}`} className="text-sm mr-3">
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="isAvailable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Available on Menu</FormLabel>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="accent-primary h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="featuredItem"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Featured Item</FormLabel>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="accent-primary h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/80"
                        disabled={createMenuItemMutation.isPending}
                      >
                        {createMenuItemMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Menu Item"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalItems}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Available Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{availableItems}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Featured Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{featuredItems}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Category Tabs */}
          <Tabs 
            defaultValue={activeCategory} 
            onValueChange={setActiveCategory}
            className="w-full mb-6"
          >
            <div className="flex justify-start overflow-x-auto pb-2">
              <TabsList className="h-auto">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          
          {/* Menu Items List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                        No menu items found in this category. Create your first item to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 object-cover rounded-md" 
                            />
                          ) : (
                            <div className="w-16 h-16 bg-neutral-100 rounded-md flex items-center justify-center">
                              <Utensils className="h-6 w-6 text-neutral-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {item.name}
                            {item.featuredItem && (
                              <Badge className="ml-2 bg-accent text-white">Featured</Badge>
                            )}
                          </div>
                          {renderDietaryTags(item.dietary)}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="line-clamp-2 text-sm">{item.description}</div>
                        </TableCell>
                        <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClick(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog open={deleteDialogOpen && selectedMenuItem?.id === item.id} onOpenChange={setDeleteDialogOpen}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteClick(item)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the menu item
                                    "{item.name}" from your restaurant menu.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={confirmDelete}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {deleteMenuItemMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Edit Menu Item Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>
                  Update the details for this menu item.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0.01} 
                              step={0.01}
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="starters">Starters</SelectItem>
                              <SelectItem value="mains">Main Courses</SelectItem>
                              <SelectItem value="desserts">Desserts</SelectItem>
                              <SelectItem value="drinks">Drinks</SelectItem>
                              <SelectItem value="sides">Side Dishes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input {...field} />
                              <div className="bg-neutral-100 p-2 rounded-r-md border border-l-0">
                                <Image className="h-5 w-5 text-neutral-500" />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="dietary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Information (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2 border rounded-md p-3">
                            {dietaryOptions.map(option => (
                              <div key={option.value} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`edit-${option.value}`}
                                  value={option.value}
                                  checked={field.value?.includes(option.value)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const value = e.target.value;
                                    const newValues = checked
                                      ? [...(field.value || []), value]
                                      : (field.value || []).filter(v => v !== value);
                                    field.onChange(newValues);
                                  }}
                                  className="accent-primary h-4 w-4 mr-1.5"
                                />
                                <label htmlFor={`edit-${option.value}`} className="text-sm mr-3">
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Available on Menu</FormLabel>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="accent-primary h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="featuredItem"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Featured Item</FormLabel>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="accent-primary h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/80"
                      disabled={updateMenuItemMutation.isPending}
                    >
                      {updateMenuItemMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Menu Item"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
