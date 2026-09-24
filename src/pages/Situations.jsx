import { AlertTriangle } from "lucide-react";
import PlaceholderPage from "../components/PlaceholderPage.jsx";

export default function Situations() {
  return (
    <PlaceholderPage
      icon={AlertTriangle}
      title="Situations"
      message="Detected city situations will appear here."
      accent="attention"
    />
  );
}
