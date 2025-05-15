import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Table as TableType } from "@shared/schema";
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
import { Label } from "@/components/ui/label";
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
  Loader2,
  QrCode,
  Download,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light bg-secondary-light">
            <Users className="mr-2 h-5 w-5" />
            Tables
          </Button>
        </Link>
        <Link href="/admin/menu">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Utensils className="mr-2 h-5 w-5" />
            Menu
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Schema for table form
const tableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(20, "Capacity cannot exceed 20"),
  location: z.string().min(1, "Location is required"),
  isActive: z.boolean().default(true),
});

export default function AdminTables() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isBulkQrDialogOpen, setIsBulkQrDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string, reservationUrl: string } | null>(null);
  const [bulkQrCodes, setBulkQrCodes] = useState<(TableType & {qrCode: string, reservationUrl: string})[]>([]);

  // Fetch tables
  const { data: tables, isLoading } = useQuery<TableType[]>({
    queryKey: ["/api/tables"],
  });

  // Create table form
  const addForm = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: "",
      capacity: 2,
      location: "Main",
      isActive: true,
    },
  });

  // Edit table form
  const editForm = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: "",
      capacity: 2,
      location: "Main",
      isActive: true,
    },
  });

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tableSchema>) => {
      const res = await apiRequest("POST", "/api/tables", data);
      return await res.json() as TableType;
    },
    onSuccess: () => {
      toast({
        title: "Table created",
        description: "The table has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof tableSchema> }) => {
      const res = await apiRequest("PATCH", `/api/tables/${id}`, data);
      return await res.json() as TableType;
    },
    onSuccess: () => {
      toast({
        title: "Table updated",
        description: "The table has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tables/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Table deleted",
        description: "The table has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAddSubmit = (values: z.infer<typeof tableSchema>) => {
    createTableMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof tableSchema>) => {
    if (selectedTable) {
      updateTableMutation.mutate({ id: selectedTable.id, data: values });
    }
  };

  // Handle edit button click
  const handleEditClick = (table: TableType) => {
    setSelectedTable(table);
    editForm.reset({
      name: table.name,
      capacity: table.capacity,
      location: table.location,
      isActive: table.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (table: TableType) => {
    setSelectedTable(table);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (selectedTable) {
      deleteTableMutation.mutate(selectedTable.id);
    }
  };
  
  // Handle QR code generation
  const handleQrCodeClick = async (table: TableType) => {
    try {
      setSelectedTable(table);
      const res = await apiRequest("GET", `/api/tables/${table.id}/qrcode`);
      const data = await res.json();
      setQrCodeData({
        qrCode: data.qrCode,
        reservationUrl: data.reservationUrl
      });
      setIsQrDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: "Could not generate QR code for this table.",
        variant: "destructive",
      });
      console.error("QR code generation error:", error);
    }
  };
  
  // Handle QR code download
  const handleQrCodeDownload = () => {
    if (qrCodeData?.qrCode && selectedTable) {
      const link = document.createElement('a');
      link.href = qrCodeData.qrCode;
      link.download = `table-qr-${selectedTable.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Handle bulk QR code generation
  const handleBulkQrCodeGeneration = async () => {
    try {
      const res = await apiRequest("GET", `/api/tables/qrcodes/all`);
      const data = await res.json();
      setBulkQrCodes(data);
      setIsBulkQrDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error generating QR codes",
        description: "Could not generate QR codes for all tables.",
        variant: "destructive",
      });
      console.error("Bulk QR code generation error:", error);
    }
  };
  
  // Handle bulk QR code download
  const handleBulkQrCodeDownload = (tableData: TableType & {qrCode: string}) => {
    const link = document.createElement('a');
    link.href = tableData.qrCode;
    link.download = `table-qr-${tableData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute summary stats
  const totalTables = tables?.length || 0;
  const totalSeats = tables?.reduce((sum, table) => sum + table.capacity, 0) || 0;
  const activeTables = tables?.filter(table => table.isActive).length || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      
      <div className="pl-64 pt-8 pb-16">
        <div className="container px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold">Tables Management</h1>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10" 
                onClick={handleBulkQrCodeGeneration}
              >
                <QrCode className="mr-2 h-4 w-4" /> Generate All QR Codes
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" /> Add Table
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Table</DialogTitle>
                    <DialogDescription>
                      Create a new table for reservations.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addForm}>
                    <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Table Name/Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Table 1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={20} 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Main">Main Area</SelectItem>
                                <SelectItem value="Outdoor">Outdoor/Patio</SelectItem>
                                <SelectItem value="Private">Private Room</SelectItem>
                                <SelectItem value="Bar">Bar Area</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Available for booking</FormLabel>
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

                      <DialogFooter>
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/80"
                          disabled={createTableMutation.isPending}
                        >
                          {createTableMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Table"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalTables}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSeats} seats</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeTables} of {totalTables}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tables List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="mt-2 block text-sm text-muted-foreground">Loading tables...</span>
                    </TableCell>
                  </TableRow>
                ) : tables?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground mb-2">No tables found</p>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Add your first table
                        </Button>
                      </DialogTrigger>
                    </TableCell>
                  </TableRow>
                ) : (
                  tables?.map((table) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.capacity} {table.capacity === 1 ? 'person' : 'people'}</TableCell>
                      <TableCell>{table.location}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${table.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {table.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-primary"
                            onClick={() => handleQrCodeClick(table)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => handleEditClick(table)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-destructive"
                            onClick={() => handleDeleteClick(table)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Edit Table Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Table</DialogTitle>
                <DialogDescription>
                  Update table information.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Table Name/Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={20} 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Main">Main Area</SelectItem>
                            <SelectItem value="Outdoor">Outdoor/Patio</SelectItem>
                            <SelectItem value="Private">Private Room</SelectItem>
                            <SelectItem value="Bar">Bar Area</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Available for booking</FormLabel>
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

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/80"
                      disabled={updateTableMutation.isPending}
                    >
                      {updateTableMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Table"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the table "{selectedTable?.name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteTableMutation.isPending ? (
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
          
          {/* QR Code Dialog for Single Table */}
          <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Table QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR code to make a reservation for {selectedTable?.name}
                </DialogDescription>
              </DialogHeader>
              
              {qrCodeData && (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="bg-white p-4 rounded-md shadow-md mb-4">
                    <img 
                      src={qrCodeData.qrCode} 
                      alt={`QR code for ${selectedTable?.name}`} 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    Direct reservation URL:<br />
                    <a href={qrCodeData.reservationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {qrCodeData.reservationUrl}
                    </a>
                  </p>
                  <Button
                    onClick={handleQrCodeDownload}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download QR Code
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Bulk QR Codes Dialog */}
          <Dialog open={isBulkQrDialogOpen} onOpenChange={setIsBulkQrDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>QR Codes for All Tables</DialogTitle>
                <DialogDescription>
                  Print these QR codes and place them on each table for easy customer reservations
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
                {bulkQrCodes.map((tableData) => (
                  <Card key={tableData.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tableData.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <img 
                          src={tableData.qrCode} 
                          alt={`QR code for ${tableData.name}`} 
                          className="w-48 h-48"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkQrCodeDownload(tableData)}
                        className="mt-3 w-full"
                      >
                        <Download className="mr-2 h-3 w-3" /> Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}