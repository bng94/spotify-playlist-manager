import { useImageFallback } from "../../hooks/useImageFallback";
import styles from "./UserAvatar.module.css";

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

interface UserAvatarProps {
  imageUrl?: string;
  displayName?: string;
}

const UserAvatar = ({ imageUrl, displayName }: UserAvatarProps) => {
  const { failed, onError } = useImageFallback(imageUrl);

  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={displayName ?? "Profile"}
      className={styles.img}
      onError={onError}
    />
  ) : (
    <>{displayName ? getInitials(displayName) : "?"}</>
  );
};

export default UserAvatar;
