import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreditHistory } from "@/hooks/use-credit-history";
import { CreditHistoryTab } from "@/components/credit-usage/CreditHistoryTab";
import { CreditPricingTab } from "@/components/credit-usage/CreditPricingTab";

export default function CreditUsageHistoryPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("history");
    const [limit] = useState(10);
    const { error } = useCreditHistory(limit, 0);

    if (error) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/studio")}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to App
                    </Button>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-destructive">Failed to load credit history</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {error instanceof Error ? error.message : "Unknown error"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/studio")}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to App
                    </Button>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-foreground" />
                        <h1 className="text-2xl font-semibold text-foreground">Usage History</h1>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-6">
                        <CreditHistoryTab limit={limit} />
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing" className="mt-6">
                        <CreditPricingTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
