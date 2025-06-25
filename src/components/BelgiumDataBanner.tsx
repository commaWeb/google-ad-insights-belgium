
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const BelgiumDataBanner = () => {
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Belgium Data Not Available</AlertTitle>
      <AlertDescription className="text-blue-700">
        No advertising data is currently available for Belgium in Google's Political Ads transparency dataset. 
        This could be because Belgium advertisers haven't filed political advertising reports with Google, 
        or the data hasn't been made available in the public dataset yet.
      </AlertDescription>
    </Alert>
  );
};
