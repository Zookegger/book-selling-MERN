import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { ServerCrash, FileQuestion, ShieldAlert } from "lucide-react";
import ErrorPage from "./Error";

export default function RootErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();

    const handleReset = () => {
        // Navigate to home, or refresh the page if the router itself is completely fried
        navigate("/");
    };

    // 1. Handle known Routing Errors (404, 401, 503 from loaders/actions)
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return (
                <ErrorPage
                    icon={FileQuestion}
                    errorCode="404"
                    title="Dead End"
                    message="The resource you are looking for does not exist on this server."
                    onPrimaryAction={handleReset}
                />
            );
        }

        if (error.status === 401 || error.status === 403) {
            return (
                <ErrorPage
                    icon={ShieldAlert}
                    errorCode={error.status.toString()}
                    title="Access Denied"
                    message="You lack the proper clearance to access this sector."
                    onPrimaryAction={handleReset}
                />
            );
        }

        // Generic fallback for other known router errors
        return (
            <ErrorPage
                icon={ServerCrash}
                errorCode={error.status.toString()}
                title={error.statusText || "Routing Error"}
                message="We encountered an unexpected issue while fetching data for this route."
                onPrimaryAction={handleReset}
            />
        );
    }

    // 2. Handle Catastrophic System Crashes (A component threw a raw JS Error)
    // We log it to the console for debugging, but show a clean UI to the user.
    console.error("Uncaught App Error:", error);

    return (
        <ErrorPage
            icon={ServerCrash}
            errorCode="500"
            title="Catastrophic Failure"
            message="A critical system error occurred. We've logged the event and are actively ignoring it. Just kidding, we'll look into it."
            primaryActionText="Reboot System"
            onPrimaryAction={() => window.location.assign('/')} // Hard reload to clear bad state
        />
    );
}