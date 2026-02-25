import { useState, useEffect } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Loader2, FileText, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreditHistory } from "@/hooks/use-credit-history";
import { useUserProfile } from "@/hooks/use-user-profile";
import { CreditPurchaseModal } from "@/components/billing/credit-purchase-modal";
import { format } from "date-fns";

interface CreditHistoryTabProps {
    limit?: number;
}

export function CreditHistoryTab({ limit = 10 }: CreditHistoryTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const offset = (currentPage - 1) * limit;
    const { data: creditHistoryData, isLoading } = useCreditHistory(limit, offset);
    const { data: userProfile } = useUserProfile();

    // Update total pages when data loads
    useEffect(() => {
        if (creditHistoryData) {
            setTotalPages(Math.ceil(creditHistoryData.total / limit));
        }
    }, [creditHistoryData, limit]);

    const creditHistory = creditHistoryData?.transactions || [];

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "yyyy-MM-dd HH:mm:ss");
        } catch {
            return dateString;
        }
    };

    const getActionTypeLabel = (action: string) => {
        const actionMap: Record<string, string> = {
            // Image Generation Actions
            IMAGE_GENERATION_MODEL_HIDEREAM: "Image Generation (HideReam)",
            IMAGE_GENERATION_QWEN: "Image Generation (Qwen)",
            IMAGE_GENERATION_SEEDREAM4: "Image Generation (Seedream4)",
            PROMPT_ENHANCEMENT: "Prompt Enhancement",
            PROMPT_EXTRACTION: "Prompt Extraction",

            // Image Editing Actions
            IMAGE_EDIT_FLUX_KONTEXT: "Image Edit (Flux Kontext)",
            IMAGE_EDIT_QWEN_PLUS: "Image Edit (Qwen Plus)",
            IMAGE_EDIT_NANO_BANANA: "Image Edit (Nano Banana)",
            IMAGE_EDIT_SEEDREAM4: "Image Edit (Seedream4)",
            IMAGE_EDIT_BACKGROUND_REMOVE: "Background Remove",
            IMAGE_EDIT_BACKGROUND_REMOVE_RECRAFT: "Background Remove (Recraft)",
            IMAGE_EDIT_SEGMENT: "Image Segmentation",
            IMAGE_EDIT_EXPRESSION: "Expression Change",
            IMAGE_EDIT_UPSCALE: "Image Upscale",

            // 3D Model Generation Actions
            MODEL_3D_TEXT_TO_3D: "3D Model (Text to 3D)",
            MODEL_3D_IMAGE_TO_3D: "3D Model (Image to 3D)",
            MODEL_3D_POST_PROCESS: "3D Model Post Process",
            MODEL_3D_TEXTURE_MODEL: "3D Model Texture",
            MODEL_3D_TEXTURE_GENERATION: "Texture Generation",

            // Model Optimization Actions
            MODEL_OPTIMIZATION: "Model Optimization",
            MODEL_UPLOAD: "Model Upload",

            // Rigging (if exists)
            RIGGING: "Rigging",
            SINGLE_IMAGE_TO_MODEL: "Single Image to Model",

            // Other Actions
            MANUAL_ADJUSTMENT: "Manual Adjustment",
            SIGNUP_BONUS: "Signup Bonus",
        };
        return actionMap[action] || action.replace(/_/g, " ");
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <>
            {/* My Credits Section */}
            <div className="mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">My Credits</h3>
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-6 w-6 text-yellow-500" />
                                        <span className="text-3xl font-bold text-foreground">
                                            {userProfile?.credits?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            { import.meta.env.VITE_APP_ENV !=='production'&&<div className="flex items-center gap-2">
                                <div className="pt-1">
                                    <Gift className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <Button
                                    onClick={() => setIsPurchaseModalOpen(true)}
                                    className="bg-black hover:bg-black/90 text-white font-medium px-6"
                                >
                                    Purchase
                                </Button>
                            </div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isLoading && (!creditHistory || creditHistory.length === 0) ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading credit history...</p>
                    </CardContent>
                </Card>
            ) : !creditHistory || creditHistory.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Credit History
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            You haven't used any credits yet. Your credit usage will appear here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Date & Time</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right w-[140px]">Credits Used</TableHead>
                                        <TableHead className="text-right w-[140px]">Balance</TableHead>
                                        <TableHead className="text-center w-[120px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditHistory.map((transaction, index) => {
                                        const isDeduction = transaction.type === "DEDUCT";
                                        const amount = Math.abs(Number(transaction.amount));
                                        const remainingBalance = transaction.balanceAfter !== undefined
                                            ? Number(transaction.balanceAfter).toFixed(3)
                                            : "N/A";

                                        return (
                                            <TableRow key={transaction.id || index}>
                                                <TableCell className="font-mono text-sm">
                                                    {formatDateTime(transaction.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {getActionTypeLabel(transaction.action)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    <span className={isDeduction ? "text-destructive" : "text-green-500"}>
                                                        {isDeduction ? "-" : "+"}{amount.toFixed(3)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    <span className="text-foreground">
                                                        {remainingBalance}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-sm text-muted-foreground">Fulfilled</span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <div className="text-sm text-muted-foreground">
                                    Pages {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8"
                                    >
                                        <ChevronFirst className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {getPageNumbers().map((page, index) => {
                                        if (page === "...") {
                                            return (
                                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                                    ...
                                                </span>
                                            );
                                        }
                                        const pageNum = page as number;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`h-8 w-8 ${currentPage === pageNum
                                                        ? "bg-primary text-primary-foreground"
                                                        : ""
                                                    }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8"
                                    >
                                        <ChevronLast className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Credit Purchase Modal */}
            <CreditPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />
        </>
    );
}

