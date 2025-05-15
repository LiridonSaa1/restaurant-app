
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RatingPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  // Extract table ID from URL parameters
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get("table");

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Choose between 1 to 5 stars",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically send the rating to your backend
      // await fetch('/api/ratings', { method: 'POST', body: JSON.stringify({ tableId, rating, feedback }) });
      
      setSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error submitting rating",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (!tableId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">No table ID provided. Please scan a valid QR code to rate your experience.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Thank You!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Your feedback helps us improve our service.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Rate Your Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center mb-4">How was your dining experience at table {tableId}?</p>
          
          <div className="flex justify-center gap-2">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Feedback</label>
            <Textarea
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
          >
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
