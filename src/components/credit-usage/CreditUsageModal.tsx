import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditHistoryTab } from "./CreditHistoryTab";
import { CreditPricingTab } from "./CreditPricingTab";

interface CreditUsageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreditUsageModal({ isOpen, onClose }: CreditUsageModalProps) {
    const [activeTab, setActiveTab] = useState("history");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col [&>button]:hidden">
                <div className="px-6 pt-6 pb-4 border-b shrink-0 flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-6 w-6"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="px-6 pb-6 flex-1 overflow-y-auto">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2 mt-4">
                            <TabsTrigger value="history">History</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        </TabsList>

                        {/* History Tab */}
                        <TabsContent value="history" className="mt-6">
                            <CreditHistoryTab />
                        </TabsContent>

                        {/* Pricing Tab */}
                        <TabsContent value="pricing" className="mt-6">
                            <CreditPricingTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

