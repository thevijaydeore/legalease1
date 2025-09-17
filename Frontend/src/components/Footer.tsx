const Footer = () => {
  return (
    <footer className="py-16 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold text-primary">
              LegalEase
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Simplifying legal documents with AI
            </p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              Privacy & Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;