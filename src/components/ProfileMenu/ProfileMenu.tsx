import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon/Icon";
import UserAvatar from "../UserAvatar/UserAvatar";
import { useUser } from "../../contexts/UserContext/UserContext";
import styles from "./ProfileMenu.module.css";

interface ProfileMenuProps {
  onLogout: () => void;
}

const ProfileMenu = ({ onLogout }: ProfileMenuProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const avatarUrl = user?.images?.[0]?.url;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`app-nav__avatar ${styles.avatarBtn}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar imageUrl={avatarUrl} displayName={user?.display_name} />
      </button>

      {open && (
        <>
          <div className={styles.scrim} onClick={() => setOpen(false)} />
          <div role="menu" className={styles.menu}>
            <button
              type="button"
              role="menuitem"
              className="pm-menu-item"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              <Icon name="user" size={14} />
              Profile
            </button>

            <hr role="separator" className={styles.divider} />

            <a
              role="menuitem"
              href="https://github.com/bng94/spotify-playlist-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="pm-menu-item"
              onClick={() => setOpen(false)}
            >
              <Icon name="brand-github" size={14} />
              GitHub
            </a>

            <hr role="separator" className={styles.divider} />
            <button
              type="button"
              role="menuitem"
              className="pm-menu-item"
              onClick={() => {
                setOpen(false);
                navigate("/privacy");
              }}
            >
              <Icon name="shield" size={14} />
              Privacy Policy
            </button>

            <hr role="separator" className={styles.divider} />
            <button
              type="button"
              role="menuitem"
              className="pm-menu-item"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <Icon name="logout" size={14} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileMenu;
