const footerLinks = [
  { label: "About", href: "https://momo-portfolio.zxkpg.uk/#about" },
  { label: "Projects", href: "https://momo-portfolio.zxkpg.uk/#projects" },
  { label: "Contact", href: "https://momo-portfolio.zxkpg.uk/#contact" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Product Builder · AI Explorer · Lifelong Learner</p>
      <p>
        Crafted by Momo ：
        <a href="https://momo-portfolio.zxkpg.uk" target="_blank" rel="noreferrer">momo-portfolio.zxkpg.uk</a>
      </p>
      <nav aria-label="Momo portfolio links">
        {footerLinks.map((link, index) => (
          <span key={link.href}>
            <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
            {index < footerLinks.length - 1 && <b aria-hidden="true">·</b>}
          </span>
        ))}
      </nav>
    </footer>
  );
}
