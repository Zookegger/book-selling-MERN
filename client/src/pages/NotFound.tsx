import { FileQuestion } from "lucide-react";
import ErrorPage from "./Error";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    const handleMoveBack = () => {
        // -1 tells React Router to go back one step in the stack
        // If the stack is empty (direct hit), this might do nothing or exit.
        // A safer pattern is to check if we can go back, or just use a 
        // logical redirect.
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/"); // Safety fallback to Home
        }
    };

    return (
        <ErrorPage
            icon={FileQuestion}
            errorCode="404"
            title="Page Not Found"
            message="We scoured the servers, but the page you're looking for has either vanished into the void or never existed in the first place."
            onPrimaryAction={handleMoveBack}
        />
    );
};