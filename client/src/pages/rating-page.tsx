import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RatingPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const tableId = params.get("table");
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  if (!tableId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Invalid Table</h1>
        <p>No table ID provided.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the rating to your backend
    console.log(`Submitted rating ${rating} for table ${tableId}`);
    setSubmitted(true);
    toast({
      title: "Thank you for your feedback!",
      description: "Your rating has been submitted.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Rate Your Experience
          </h1>
          {!submitted ? (
            <>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-10 h-10 cursor-pointer transition-colors ${
                      value <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(value)}
                  />
                ))}
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Submit Rating
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-xl mb-2">Thank you for your feedback!</p>
              <p className="text-neutral-600">
                Your rating helps us improve our service.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
