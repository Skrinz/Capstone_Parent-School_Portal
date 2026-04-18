import { useAuthStore } from "@/lib/store/authStore";
import { PrivacyPolicyModal } from "@/components/ui/PrivacyPolicyModal";

/**
 * PrivacyPolicyGuard
 * 
 * Ensures that logged-in users must agree to the privacy policy
 * before they can interact with the rest of the application.
 */
export const PrivacyPolicyGuard = () => {
  const { isAuthenticated, hasAcceptedPrivacy, user } = useAuthStore();

  // Only show if the user is logged in but hasn't accepted the privacy policy
  if (!isAuthenticated || !user || hasAcceptedPrivacy) {
    return null;
  }

  return <PrivacyPolicyModal />;
};
