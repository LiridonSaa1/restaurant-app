
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function AdminRatings() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);

  const { data: ratings, isLoading } = useQuery({
    queryKey: ["/api/ratings", weekStart, weekEnd],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`);
      return res.json();
    },
  });

  const averageRating = ratings?.reduce((acc: number, curr: any) => acc + curr.rating, 0) / (ratings?.length || 1);

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      
      <div className="pl-64 pt-8 pb-16">
        <div className="container px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold">Customer Ratings</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-3xl font-bold mr-2">{averageRating?.toFixed(1) || "0.0"}</span>
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">{ratings?.length || 0}</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div>Loading...</div>
            ) : ratings?.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No ratings for this week</div>
            ) : (
              ratings?.map((rating: any) => (
                <Card key={rating.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>Table {rating.tableId}</Badge>
                          <span className="text-sm text-neutral-500">
                            {format(new Date(rating.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < rating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {rating.feedback && (
                          <p className="text-neutral-600">{rating.feedback}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
