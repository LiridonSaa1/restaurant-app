import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Users,
  Utensils,
  LayoutDashboard,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarRange
} from "lucide-react";
import { Reservation, Table, MenuItem } from "@shared/schema";
import { format, isToday, isAfter, startOfDay, endOfDay, addDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Utensils className="mr-2 h-5 w-5" />
            Menu
          </Button>
        </Link>
        <Link href="/admin/ratings">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-secondary-light">
            <Star className="mr-2 h-5 w-5" />
            Ratings
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  // Fetch reservations
  const { data: reservations, isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // Fetch tables
  const { data: tables, isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Calculate today's reservations
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const todayReservations = reservations?.filter(res => {
    const resDate = new Date(res.date);
    return isToday(resDate);
  }) || [];

  // Calculate upcoming reservations (next 7 days)
  const upcomingReservations = reservations?.filter(res => {
    const resDate = new Date(res.date);
    return isAfter(resDate, today) && isAfter(resDate, startOfDay(addDays(today, 7)));
  }) || [];

  // Total tables
  const totalTables = tables?.length || 0;

  // Total menu items
  const totalMenuItems = menuItems?.length || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      
      <div className="pl-64 pt-8 pb-16">
        <div className="container px-6">
          <h1 className="text-3xl font-heading font-bold mb-8">Admin Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Today's Reservations</CardTitle>
                <CardDescription>
                  {format(today, 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">{todayReservations.length}</span>
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Upcoming Reservations</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">{upcomingReservations.length}</span>
                  <CalendarRange className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Tables</CardTitle>
                <CardDescription>Available for booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">{totalTables}</span>
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Menu Items</CardTitle>
                <CardDescription>All categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">{totalMenuItems}</span>
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Reservations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Today's Reservations</CardTitle>
                  <Link href="/admin/reservations">
                    <Button variant="ghost" className="flex items-center text-primary hover:text-primary/80">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {reservationsLoading ? (
                  <div className="text-center py-8 text-neutral-500">Loading reservations...</div>
                ) : todayReservations.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">No reservations for today</div>
                ) : (
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-4">
                      {todayReservations
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map(reservation => (
                          <div key={reservation.id} className="flex items-start p-3 rounded-md bg-neutral-50 hover:bg-neutral-100">
                            <div className="bg-white p-2 rounded-md border mr-3 text-center">
                              <span className="text-lg font-medium text-primary">
                                {format(new Date(`2000-01-01T${reservation.time}`), 'h:mm')}
                              </span>
                              <p className="text-xs text-neutral-500">
                                {format(new Date(`2000-01-01T${reservation.time}`), 'a')}
                              </p>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{reservation.name}</h4>
                              <p className="text-sm text-neutral-600">
                                {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {reservation.phone}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className="text-green-500 h-5 w-5 mr-2" />
                              <span className="text-sm font-medium text-green-600">Confirmed</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/reservations">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/80">
                    <Calendar className="mr-2 h-5 w-5" />
                    Manage Reservations
                  </Button>
                </Link>
                <Link href="/admin/tables">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/80">
                    <Users className="mr-2 h-5 w-5" />
                    Manage Tables
                  </Button>
                </Link>
                <Link href="/admin/menu">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/80">
                    <Utensils className="mr-2 h-5 w-5" />
                    Manage Menu
                  </Button>
                </Link>
                
                <Separator className="my-4" />
                
                <div className="p-4 bg-secondary/10 rounded-md">
                  <h3 className="font-medium mb-2">Need Help?</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    If you need assistance with the admin panel, check out the documentation or contact support.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
