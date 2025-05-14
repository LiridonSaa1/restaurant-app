import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Reservation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Calendar as CalendarIcon, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  SlidersHorizontal,
  LayoutDashboard,
  Utensils,
  Users,
  Loader2
} from "lucide-react";
import { format, isToday, isFuture, isPast } from "date-fns";

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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light bg-secondary-light">
            <CalendarIcon className="mr-2 h-5 w-5" />
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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Utensils className="mr-2 h-5 w-5" />
            Menu
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default function AdminReservations() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch reservations
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // Delete reservation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Reservation deleted",
        description: "The reservation has been successfully deleted.",
      });
      queryClient.invalidateQueries({queryKey: ["/api/reservations"]});
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDelete = () => {
    if (selectedReservation) {
      deleteMutation.mutate(selectedReservation.id);
    }
  };

  // Filter reservations based on search, date, and status
  const filteredReservations = reservations?.filter(reservation => {
    // Filter by date
    const reservationDate = new Date(reservation.date);
    const dateMatch = selectedDate ? 
      reservationDate.toDateString() === selectedDate.toDateString() :
      true;
    
    // Filter by search query
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = 
      searchQuery === "" ||
      reservation.name.toLowerCase().includes(searchLower) ||
      reservation.email.toLowerCase().includes(searchLower) ||
      reservation.phone.includes(searchQuery);
    
    // Filter by status
    let statusMatch = true;
    if (statusFilter) {
      const reservationTime = new Date(`${reservation.date}T${reservation.time}`);
      
      if (statusFilter === "upcoming") {
        statusMatch = isFuture(reservationTime);
      } else if (statusFilter === "today") {
        statusMatch = isToday(reservationTime);
      } else if (statusFilter === "past") {
        statusMatch = isPast(reservationTime);
      }
    }
    
    return dateMatch && searchMatch && statusMatch;
  }) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      
      <div className="pl-64 pt-8 pb-16">
        <div className="container px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold">Reservations</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-md shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select onValueChange={setStatusFilter} defaultValue={statusFilter || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Search by name, email, or phone"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Reservations Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                        No reservations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => {
                      const reservationDate = new Date(reservation.date);
                      const reservationTime = new Date(`${reservation.date}T${reservation.time}`);
                      const isPastReservation = isPast(reservationTime);
                      const isTodayReservation = isToday(reservationDate);
                      
                      return (
                        <TableRow key={reservation.id}>
                          <TableCell>
                            {format(reservationDate, "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(`2000-01-01T${reservation.time}`), "h:mm a")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {reservation.name}
                          </TableCell>
                          <TableCell>
                            {reservation.guests}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs">{reservation.email}</span>
                              <span className="text-xs text-neutral-500">{reservation.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isPastReservation ? (
                              <div className="flex items-center">
                                <XCircle className="text-neutral-500 h-4 w-4 mr-1" />
                                <span className="text-xs text-neutral-500">Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <CheckCircle2 className="text-green-500 h-4 w-4 mr-1" />
                                <span className="text-xs text-green-600">
                                  {isTodayReservation ? "Today" : "Confirmed"}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reservation Details</DialogTitle>
                                    <DialogDescription>
                                      Reservation #{reservation.id}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4 py-4">
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Date</p>
                                      <p>{format(reservationDate, "PPP")}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Time</p>
                                      <p>{format(new Date(`2000-01-01T${reservation.time}`), "h:mm a")}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Name</p>
                                      <p>{reservation.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Guests</p>
                                      <p>{reservation.guests}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Email</p>
                                      <p>{reservation.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-500">Phone</p>
                                      <p>{reservation.phone}</p>
                                    </div>
                                    {reservation.specialRequests && (
                                      <div className="col-span-2">
                                        <p className="text-sm font-medium text-neutral-500">Special Requests</p>
                                        <p>{reservation.specialRequests}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog open={deleteDialogOpen && selectedReservation?.id === reservation.id} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedReservation(reservation)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the reservation
                                      for {reservation.name} on {format(reservationDate, "PPP")} at {format(new Date(`2000-01-01T${reservation.time}`), "h:mm a")}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={handleDelete}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {deleteMutation.isPending ? (
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
