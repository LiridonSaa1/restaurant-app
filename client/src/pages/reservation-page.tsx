import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Clock, Info, MapPin, Phone, Loader2, Minus, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Table, Reservation } from "@shared/schema";
import { useLocation } from "wouter";

// Schema for reservations
const reservationSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time",
  }),
  guests: z.number().min(1).max(12),
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter your phone number"),
  specialRequests: z.string().optional(),
});

export default function ReservationPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Get all tables
  const { data: tables } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });
  
  // Form
  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guests: 2,
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      specialRequests: "",
    },
  });
  
  // Watch for date and guest count changes
  const selectedDate = form.watch("date");
  const guestCount = form.watch("guests");
  
  // Query available time slots when date or guest count changes
  const { data: availableTimeSlots, isLoading: isLoadingTimeSlots } = useQuery<string[]>({
    queryKey: ["/api/available-times", selectedDate?.toISOString(), guestCount],
    enabled: !!selectedDate && !!guestCount,
  });
  
  // Update available times when new data arrives
  useEffect(() => {
    if (availableTimeSlots) {
      setAvailableTimes(availableTimeSlots);
    }
  }, [availableTimeSlots]);
  
  // Reservation mutation
  const reservationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reservationSchema>) => {
      const res = await apiRequest("POST", "/api/reservations", data);
      return await res.json() as Reservation;
    },
    onSuccess: () => {
      toast({
        title: "Reservation confirmed!",
        description: "You'll receive a confirmation email shortly.",
      });
      queryClient.invalidateQueries({queryKey: ["/api/reservations"]});
      queryClient.invalidateQueries({queryKey: ["/api/available-times"]});
      
      // Redirect to My Reservations if logged in
      if (user) {
        navigate("/my-reservations");
      } else {
        form.reset();
      }
    },
    onError: (error) => {
      toast({
        title: "Reservation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // When no date is selected or the form is reset, populate with default times
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes(["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]);
    }
  }, [selectedDate]);
  
  // Prepopulate user data when user logs in
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
      form.setValue("phone", user.phone || "");
    }
  }, [user, form]);
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof reservationSchema>) => {
    reservationMutation.mutate(values);
  };
  
  // Decrement guest count
  const decrementGuests = () => {
    const currentGuests = form.getValues("guests");
    if (currentGuests > 1) {
      form.setValue("guests", currentGuests - 1);
    }
  };
  
  // Increment guest count
  const incrementGuests = () => {
    const currentGuests = form.getValues("guests");
    if (currentGuests < 12) {
      form.setValue("guests", currentGuests + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold mb-4">Reserve a Table</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Book your dining experience at Bistro Nouveau. For parties larger than 12, please call us directly.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedDate || isLoadingTimeSlots}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTimeSlots ? (
                            <div className="flex items-center justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading times...</span>
                            </div>
                          ) : availableTimes.length > 0 ? (
                            availableTimes.map(time => (
                              <SelectItem key={time} value={time}>
                                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-3 text-center text-sm">
                              No available times for this date
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Guests */}
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <div className="flex items-center">
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={decrementGuests}
                        disabled={field.value <= 1}
                        className="h-10 w-10 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          type="number"
                          min={1}
                          max={12}
                          className="w-16 mx-2 text-center"
                        />
                      </FormControl>
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={incrementGuests}
                        disabled={field.value >= 12}
                        className="h-10 w-10 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-4">Up to 12 guests per online reservation</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Allergies, special occasions, seating preferences..." 
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/80"
                disabled={reservationMutation.isPending}
              >
                {reservationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processing...
                  </>
                ) : (
                  "Reserve Now"
                )}
              </Button>
              
              <p className="text-sm text-neutral-500 text-center">
                By making a reservation, you agree to our reservation policy.
              </p>
            </form>
          </Form>
        </div>

        <div className="md:w-1/2 mt-8 md:mt-0">
          {/* Restaurant image */}
          <div 
            className="h-64 md:h-[300px] bg-cover bg-center rounded-lg shadow-lg mb-6" 
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&h=600')"}}
          ></div>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-medium text-xl mb-4">Reservation Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <Clock className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Hours of Operation</h4>
                    <p className="text-neutral-600">Tuesday - Thursday: 5:30 PM - 9:30 PM</p>
                    <p className="text-neutral-600">Friday - Saturday: 5:30 PM - 10:30 PM</p>
                    <p className="text-neutral-600">Sunday: 5:30 PM - 9:00 PM</p>
                    <p className="text-neutral-600">Monday: Closed</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <Info className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Reservation Policy</h4>
                    <p className="text-neutral-600">We hold reservations for 15 minutes past the scheduled time. Please contact us if you're running late.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <Phone className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Need Help?</h4>
                    <p className="text-neutral-600">For parties over 12 or special events, please call us directly at (555) 123-4567.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-3">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Location</h4>
                    <p className="text-neutral-600">123 Gourmet Street, Foodville, CA 94158</p>
                    <a 
                      href="https://maps.google.com" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline text-sm mt-1 inline-block"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
