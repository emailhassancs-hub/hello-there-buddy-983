const HeroSection = () => {
  return (
    <section className="py-8 px-6 md:px-10 max-w-6xl mx-auto" style={{ maxHeight: "120px" }}>
      <h1 className="text-2xl font-semibold text-foreground">
        What do you want to create?
      </h1>
      <p className="text-sm text-muted-foreground mt-1.5">
        Generate AI images · Edit them · Convert to 3D · All in one place
      </p>
    </section>
  );
};

export default HeroSection;
