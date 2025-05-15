
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Users,
  Utensils,
  LayoutDashboard,
  Star
} from "lucide-react";

export const AdminSidebar = () => {
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
