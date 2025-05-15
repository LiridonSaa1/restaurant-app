import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function RatingPage() {
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract table ID from URL parameters
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get("table");

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

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Rate Your Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">How was your dining experience at table {tableId}?</p>
          {/* Add your rating UI components here */}
        </CardContent>
      </Card>
    </div>
  );
}