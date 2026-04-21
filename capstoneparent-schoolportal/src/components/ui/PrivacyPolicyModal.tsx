import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/authStore";
import { Lock, Eye, FileText } from "lucide-react";

export const PrivacyPolicyModal = () => {
  const { hasAcceptedPrivacy, acceptPrivacy } = useAuthStore();

  return (
    <Dialog open={!hasAcceptedPrivacy} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 border-2 border-gray-900 bg-(--signin-bg) rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-8 pb-4 relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative h-14 w-14 shrink-0">
               <img
                 src="/Logo.png"
                 alt="Bayog Elementary National School Logo"
                 className="object-contain h-full w-full"
               />
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight text-gray-900">Privacy Policy</DialogTitle>
              <DialogDescription className="text-lg font-medium text-gray-700">
                Agreement & Terms of Use
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          <div className="space-y-6 pb-6">
            <section className="p-5 rounded-2xl bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold uppercase tracking-wider text-sm">
                <Lock className="size-5 text-(--button-green)" />
                <h3>Data Protection</h3>
              </div>
              <p className="text-base text-gray-800 leading-relaxed">
                We safeguard your information with high-level encryption. Your personal contact details and student academic records are strictly confidential and only accessible by authorized school personnel.
              </p>
            </section>

            <section className="p-5 rounded-2xl bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold uppercase tracking-wider text-sm">
                <Eye className="size-5 text-gray-700" />
                <h3>Collected Information</h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-semibold text-gray-700 ml-2">
                <li className="flex items-center gap-2">
                  <div className="size-2 bg-(--button-green) rounded-full" />
                  Full Legal Names
                </li>
                <li className="flex items-center gap-2">
                  <div className="size-2 bg-(--button-green) rounded-full" />
                  Contact Details
                </li>
                <li className="flex items-center gap-2">
                  <div className="size-2 bg-(--button-green) rounded-full" />
                  Student Performance
                </li>
                <li className="flex items-center gap-2">
                  <div className="size-2 bg-(--button-green) rounded-full" />
                  Trusted Device IDs
                </li>
              </ul>
            </section>

            <section className="p-5 rounded-2xl bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold uppercase tracking-wider text-sm">
                <FileText className="size-5 text-gray-700" />
                <h3>Official Usage</h3>
              </div>
              <p className="text-base text-gray-800 leading-relaxed">
                By clicking "Agree and Continue", you acknowledge that this portal is for official academic purposes. Correct and truthful information is required for all registrations and interactions.
              </p>
            </section>
          </div>
        </div>

        <DialogFooter className="p-8 pt-6 border-t border-gray-900/10 bg-white/30">
          <Button 
            onClick={acceptPrivacy}
            className="w-full h-16 rounded-full bg-(--button-green) hover:bg-(--button-hover-green) text-white text-2xl font-bold transition-all duration-300 border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Agree and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
