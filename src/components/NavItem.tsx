interface NavItemProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem = ({ label, isActive, onClick, badge }: NavItemProps) => {
  return (
    <a
      href="#"
      className={`navbar-link ${isActive ? 'active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="navbar-badge">{badge}</span>
      )}
    </a>
  );
};

export default NavItem;

