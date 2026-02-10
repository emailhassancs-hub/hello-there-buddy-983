import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Waitlist = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-3">Thank You for Signing Up!</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-2">
          You're now on our waitlist.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-8">
          We'll notify you as soon as spots open up. Stay tuned — something exciting is on the way.
        </p>

        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default Waitlist;
