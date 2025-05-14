import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar, Clock, Users, AlertCircle, Loader2 } from "lucide-react";
import { format, isPast, addHours } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyReservationsPage() {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Fetch user's reservations
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/user/reservations"],
  });

  // Cancel reservation mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Reservation cancelled",
        description: "Your reservation has been successfully cancelled.",
      });
      queryClient.invalidateQueries({queryKey: ["/api/user/reservations"]});
      setCancelDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle cancel button click
  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  // Handle confirmation of cancellation
  const confirmCancel = () => {
    if (selectedReservation) {
      cancelMutation.mutate(selectedReservation.id);
    }
  };

  // Filter reservations by status
  const upcomingReservations = reservations?.filter(
    res => !isPast(new Date(res.date + 'T' + res.time))
  ) || [];
  
  const pastReservations = reservations?.filter(
    res => isPast(new Date(res.date + 'T' + res.time))
  ) || [];

  // Check if a reservation can be cancelled (if it's more than 2 hours away)
  const canCancel = (reservation: Reservation) => {
    const reservationTime = new Date(reservation.date + 'T' + reservation.time);
    const now = new Date();
    return reservationTime > addHours(now, 2);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold mb-4">My Reservations</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          View and manage your upcoming and past reservations at Bistro Nouveau.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : upcomingReservations.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100">
                <Calendar className="h-8 w-8 text-neutral-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Upcoming Reservations</h3>
              <p className="text-neutral-600 mb-6">You don't have any upcoming reservations.</p>
              <Button asChild className="bg-primary hover:bg-primary/80">
                <a href="/reservation">Make a Reservation</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingReservations.map(reservation => (
                <Card key={reservation.id}>
                  <CardHeader>
                    <CardTitle>
                      Reservation on {format(new Date(reservation.date), 'MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      Confirmation #{reservation.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        <span>
                          {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        <span>{reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                      {reservation.specialRequests && (
                        <div className="md:col-span-2 mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">
                          <strong>Special Requests:</strong> {reservation.specialRequests}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">View Details</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reservation Details</DialogTitle>
                          <DialogDescription>
                            Confirmation #{reservation.id}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-neutral-500">Date</p>
                              <p>{format(new Date(reservation.date), 'MMMM d, yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-500">Time</p>
                              <p>{format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-500">Guests</p>
                              <p>{reservation.guests}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-500">Status</p>
                              <p className="text-green-600">Confirmed</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-500">Contact Information</p>
                            <p>{reservation.name}</p>
                            <p>{reservation.email}</p>
                            <p>{reservation.phone}</p>
                          </div>
                          {reservation.specialRequests && (
                            <div>
                              <p className="text-sm font-medium text-neutral-500">Special Requests</p>
                              <p>{reservation.specialRequests}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {canCancel(reservation) ? (
                      <AlertDialog open={cancelDialogOpen && selectedReservation?.id === reservation.id} onOpenChange={setCancelDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelClick(reservation)}
                          >
                            Cancel Reservation
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel your reservation on {format(new Date(reservation.date), 'MMMM d, yyyy')} at {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={confirmCancel}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={cancelMutation.isPending}
                            >
                              {cancelMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                                </>
                              ) : (
                                "Yes, Cancel Reservation"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="text-neutral-500 border-neutral-300"
                        disabled
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Cannot Cancel
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pastReservations.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100">
                <Calendar className="h-8 w-8 text-neutral-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Past Reservations</h3>
              <p className="text-neutral-600">You don't have any past reservations with us.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pastReservations.map(reservation => (
                <Card key={reservation.id}>
                  <CardHeader>
                    <CardTitle>
                      Reservation on {format(new Date(reservation.date), 'MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      Confirmation #{reservation.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        <span>
                          {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        <span>{reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
