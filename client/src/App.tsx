import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "next-themes";

import HomePage from "@/pages/home-page";
import MenuPage from "@/pages/menu-page";
import ReservationPage from "@/pages/reservation-page";
import MyReservationsPage from "@/pages/my-reservations-page";
import AuthPage from "@/pages/auth-page";
import RatingPage from "@/pages/rating-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminReservations from "@/pages/admin/reservations";
import AdminTables from "@/pages/admin/tables";
import AdminMenu from "@/pages/admin/menu";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import Header from "./components/Header";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/menu" component={MenuPage} />
          <Route path="/reservation" component={ReservationPage} />
          <Route path="/rating/:table?" component={RatingPage} />
          <ProtectedRoute path="/my-reservations" component={MyReservationsPage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/admin/reservations" component={AdminReservations} />
          <ProtectedRoute path="/admin/tables" component={AdminTables} />
          <ProtectedRoute path="/admin/menu" component={AdminMenu} />
          <ProtectedRoute path="/admin/ratings" component={AdminRatings} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
