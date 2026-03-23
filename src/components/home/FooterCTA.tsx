import { useNavigate } from "react-router-dom";

const FooterCTA = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden text-center"
      style={{
        borderTop: "1px solid #3D3D4D",
        padding: "80px 64px",
      }}
    >
      {/* Transparent — background image shows through */}
      <div className="relative z-10 max-w-2xl mx-auto rounded-2xl p-8 lg:p-12" style={{ background: "rgba(13,13,16,0.65)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(61,61,77,0.4)" }}>
        <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#7C5AF6" }}>
          GET STARTED
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">
          Build your first game asset today
        </h2>
        <p className="text-base mt-3" style={{ color: "#9CA3AF" }}>
          No design experience needed. Just type a prompt.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={() => navigate("/studio")}
            className="text-[15px] font-semibold px-7 py-3 rounded-lg transition-colors duration-150"
            style={{ background: "#7C5AF6", color: "white" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#6D4AE8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#7C5AF6"; }}
          >
            ✦ Start with Assist →
          </button>
          <button
            onClick={() => navigate("/image")}
            className="text-[15px] font-semibold px-7 py-3 rounded-lg transition-all duration-150"
            style={{ background: "transparent", border: "1px solid #3D3D4D", color: "#E5E7EB" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7C5AF6";
              e.currentTarget.style.color = "#A78BFA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3D3D4D";
              e.currentTarget.style.color = "#E5E7EB";
            }}
          >
            Generate Images →
          </button>
          <button
            onClick={() => navigate("/3d")}
            className="text-[15px] font-semibold px-7 py-3 rounded-lg transition-all duration-150"
            style={{ background: "transparent", border: "1px solid #3D3D4D", color: "#E5E7EB" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7C5AF6";
              e.currentTarget.style.color = "#A78BFA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3D3D4D";
              e.currentTarget.style.color = "#E5E7EB";
            }}
          >
            Create 3D Models →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;
