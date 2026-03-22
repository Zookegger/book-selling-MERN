import { ShieldAlert } from "lucide-react";
import ErrorPage from "./Error";

export default function UnauthorizedPage() {
    const handleHomeClick = () => {
        window.location.href = '/';
    };

    return (
        <ErrorPage
            icon={ShieldAlert}
            errorCode="401"
            title="Access Denied"
            message="Hold up. You don't have the necessary clearance to view this sector. Verify your credentials and try again."
            primaryActionText="Return to Safety"
            onPrimaryAction={handleHomeClick}
        />
    );
};