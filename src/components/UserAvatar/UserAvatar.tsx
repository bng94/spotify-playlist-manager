import { useState } from "react";
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
  const [failed, setFailed] = useState(false);

  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={displayName ?? "Profile"}
      className={styles.img}
      onError={() => setFailed(true)}
    />
  ) : (
    <>{displayName ? getInitials(displayName) : "?"}</>
  );
};

export default UserAvatar;
