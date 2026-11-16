
import { useEffect, useState } from "react";
import { getProfilePicture } from "../api/profilePicturesApi.js";

export default function ProfileAvatar({
  memberId,
  name = "",
  className = "",
  children,
  refreshKey = 0,
}) {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let active = true;

    setPhotoUrl(null);

    if (!memberId) {
      return () => {
        active = false;
      };
    }

    async function loadProfilePicture() {
      try {
        const result = await getProfilePicture(memberId);

        if (!active) return;

        setPhotoUrl(
          result.hasPhoto ? result.photoUrl || null : null
        );
      } catch (error) {
        console.error(
          "Unable to load profile picture:",
          error
        );

        if (active) {
          setPhotoUrl(null);
        }
      }
    }

    loadProfilePicture();

    return () => {
      active = false;
    };
  }, [memberId, refreshKey]);

  return (
    <span
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        isolation: "isolate",
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name ? `${name}'s profile` : "Profile"}
          onError={() => setPhotoUrl(null)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 25%",
            borderRadius: "inherit",
            display: "block",
            opacity: 1,
            filter: "none",
            mixBlendMode: "normal",
            transform: "none",
          }}
        />
      ) : (
        children ||
        name.trim().charAt(0).toUpperCase() ||
        "?"
      )}
    </span>
  );
}
