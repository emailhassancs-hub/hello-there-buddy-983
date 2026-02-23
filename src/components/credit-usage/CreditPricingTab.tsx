import { Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useModelPrices, PriceCategory } from "@/hooks/use-model-prices";

export function CreditPricingTab() {
    const { data: modelPrices, isLoading: isLoadingPrices } = useModelPrices();

    // Transform pricing data from API
    const getPricingData = () => {
        if (!modelPrices || modelPrices.length === 0) {
            return [];
        }

        const categoryDescriptions: Record<PriceCategory, string> = {
            [PriceCategory.IMAGE_GENERATION]: "This table lists the costs associated with the Image Generation MCP tools.",
            [PriceCategory.IMAGE_EDITING]: "This table lists the costs associated with the Image Editing MCP tools. Costs may vary based on image resolution and the complexity of the operation.",
            [PriceCategory.MODEL_GENERATION_3D]: "This table lists the costs associated with the 3D Model Generation MCP tools. These are generally higher due to the significant computational resources required.",
            [PriceCategory.MODEL_OPTIMIZATION]: "This table lists the costs associated with the 3D Model Optimization MCP tools, which are primarily focused on preparing models for game engines and other real-time applications.",
        };

        const categoryLabels: Record<PriceCategory, string> = {
            [PriceCategory.IMAGE_GENERATION]: "Image Generation",
            [PriceCategory.IMAGE_EDITING]: "Image Editing",
            [PriceCategory.MODEL_GENERATION_3D]: "3D Model Generation",
            [PriceCategory.MODEL_OPTIMIZATION]: "3D Model Optimization",
        };

        // Group prices by category
        const pricesByCategory = modelPrices.reduce((acc, price) => {
            if (!acc[price.category]) {
                acc[price.category] = [];
            }
            acc[price.category].push(price);
            return acc;
        }, {} as Record<PriceCategory, typeof modelPrices>);

        // Transform to display format
        return Object.entries(pricesByCategory).map(([category, prices]) => {
            // For 3D Model Generation, group base features with their add-ons
            if (category === PriceCategory.MODEL_GENERATION_3D) {
                // Static add-ons configuration for 3D model generation
                const staticAddons: Record<string, Array<{ label: string; additionalCredits: number }>> = {
                    "Text To Model": [
                        { label: "Quad Topology", additionalCredits: 0.05 },
                        { label: "HD Textures", additionalCredits: 0.10 },
                    ],
                    "Image To Model": [
                        { label: "Quad Topology", additionalCredits: 0.05 },
                        { label: "HD Textures", additionalCredits: 0.10 },
                    ],
                    "Post Process": [
                        { label: "Quad Topology", additionalCredits: 0.05 },
                    ],
                };

                // Find base features
                const textTo3D = prices.find(p => p.key === "TEXT_TO_3D" || (p.name || "").toLowerCase().includes("text to 3d"));
                const imageTo3D = prices.find(p => p.key === "IMAGE_TO_3D" || (p.name || "").toLowerCase().includes("image to 3d"));
                const postProcess = prices.find(p => p.key === "POST_PROCESS" || (p.name || "").toLowerCase().includes("post process"));

                const groupedItems: Array<{ feature: string; credits: string; addons: string }> = [];

                // Process Text To Model
                if (textTo3D) {
                    const baseName = textTo3D.name || "Text To Model";
                    const baseCredits = Number(textTo3D.credits);
                    const addons = staticAddons["Text To Model"]?.map(addon => 
                        `${addon.label} (+${addon.additionalCredits.toFixed(2)})`
                    ).join(", ") || textTo3D.description || "";

                    groupedItems.push({
                        feature: baseName,
                        credits: baseCredits.toFixed(3),
                        addons: addons,
                    });
                }

                // Process Image To Model
                if (imageTo3D) {
                    const baseName = imageTo3D.name || "Image To Model";
                    const baseCredits = Number(imageTo3D.credits);
                    const addons = staticAddons["Image To Model"]?.map(addon => 
                        `${addon.label} (+${addon.additionalCredits.toFixed(2)})`
                    ).join(", ") || imageTo3D.description || "";

                    groupedItems.push({
                        feature: baseName,
                        credits: baseCredits.toFixed(3),
                        addons: addons,
                    });
                }

                // Process Post Process
                if (postProcess) {
                    const baseName = postProcess.name || "Post Process";
                    const baseCredits = Number(postProcess.credits);
                    const addons = staticAddons["Post Process"]?.map(addon => 
                        `${addon.label} (+${addon.additionalCredits.toFixed(2)})`
                    ).join(", ") || postProcess.description || "";

                    groupedItems.push({
                        feature: baseName,
                        credits: baseCredits.toFixed(3),
                        addons: addons,
                    });
                }

                // Add other features (TEXTURE_MODEL, etc.)
                const otherFeatures = prices
                    .filter(p => p.key !== "TEXT_TO_3D" && p.key !== "IMAGE_TO_3D" && p.key !== "POST_PROCESS")
                    .map(price => ({
                        feature: price.name || price.key,
                        credits: Number(price.credits).toFixed(3),
                        addons: price.description || "",
                    }));

                return {
                    category: categoryLabels[category as PriceCategory],
                    description: categoryDescriptions[category as PriceCategory],
                    items: [...groupedItems, ...otherFeatures],
                };
            }

            // For other categories, use simple mapping
            return {
                category: categoryLabels[category as PriceCategory],
                description: categoryDescriptions[category as PriceCategory],
                items: prices.map((price) => ({
                    feature: price.name || price.key,
                    credits: Number(price.credits).toFixed(3),
                    addons: price.description || "",
                })),
            };
        });
    };

    const pricingData = getPricingData();

    if (isLoadingPrices) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading pricing information...</p>
                </CardContent>
            </Card>
        );
    }

    if (pricingData.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Pricing Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Pricing information is not available at the moment.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {pricingData.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                    <CardContent className="p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {category.category} Pricing
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {category.description}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Feature</TableHead>
                                        <TableHead className="text-right w-[120px]">Credits</TableHead>
                                        <TableHead>Add-ons (Optional)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {category.items.map((item, itemIndex) => (
                                        <TableRow key={itemIndex}>
                                            <TableCell className="font-medium">
                                                {item.feature}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.credits}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.addons}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

