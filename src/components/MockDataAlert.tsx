
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MockDataAlertProps {
  isUsingMockData: boolean;
  errorMessage?: string;
}

export const MockDataAlert = ({ isUsingMockData, errorMessage }: MockDataAlertProps) => {
  if (!isUsingMockData) return null;

  const getErrorDetails = () => {
    if (!errorMessage) {
      return "Unable to fetch real data from BigQuery. Displaying sample data for demonstration purposes.";
    }

    if (errorMessage.includes('NOT_AUTHENTICATED') || errorMessage.includes('AUTHENTICATION_FAILED')) {
      return "⚠️ Authentication required: Please sign in with Google to access real BigQuery data. Currently showing sample data.";
    }

    if (errorMessage.includes('PROJECT_SETUP_ERROR')) {
      return "⚠️ Google Cloud Project Setup Required: You need to create your own Google Cloud Project and replace 'your-project-id-here' in the code with your actual project ID. The public dataset requires you to run queries from your own project.";
    }

    if (errorMessage.includes('BILLING_ERROR')) {
      return `⚠️ BigQuery Billing Error: ${errorMessage.replace('BILLING_ERROR: ', '')}. Showing sample data.`;
    }

    if (errorMessage.includes('PERMISSION_ERROR')) {
      return `⚠️ BigQuery Permission Error: ${errorMessage.replace('PERMISSION_ERROR: ', '')}. Showing sample data.`;
    }

    if (errorMessage.includes('API_ERROR')) {
      return `⚠️ BigQuery API Error: ${errorMessage.replace('API_ERROR: ', '')}. Showing sample data.`;
    }

    return `⚠️ BigQuery Error: ${errorMessage}. Displaying sample data for demonstration purposes.`;
  };

  return (
    <Alert variant="destructive" className="mb-6 border-red-600 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        {getErrorDetails()}
        <br />
        <span className="text-sm text-red-600 mt-1">
          The actual data may differ from what is shown here.
        </span>
      </AlertDescription>
    </Alert>
  );
};
