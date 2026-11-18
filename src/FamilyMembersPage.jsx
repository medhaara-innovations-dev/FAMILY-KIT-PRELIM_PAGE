
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  UsersRound,
  Plus,
  ChevronRight,
  Phone,
  MessageCircle,
  RefreshCw,
  House,
} from "lucide-react";

import { getFamilyMembers } from "./api/familyMembersApi.js";
import { getFamilyKitProfile } from "./auth/authService.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";

import "./FamilyMembersPage.css";

export default function FamilyMembersPage() {
  const navigate = useNavigate();

  const [primaryUser, setPrimaryUser] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD REGISTERED USER + FAMILY MEMBERS
  // =====================================================

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const accessToken = sessionStorage.getItem(
        "familykit_access_token"
      );

      if (!accessToken) {
        navigate("/login", { replace: true });
        return;
      }

      const [profileResult, familyResult] =
        await Promise.allSettled([
          getFamilyKitProfile(accessToken),
          getFamilyMembers(),
        ]);

      // PRIMARY USER: NAME ENTERED DURING SIGNUP

      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value;

        const registeredFamilyName =
          typeof profile?.familyName === "string"
            ? profile.familyName.trim()
            : "";

        setFamilyName(registeredFamilyName);

        const registeredName =
          typeof profile?.yourName === "string"
            ? profile.yourName.trim()
            : "";

        if (registeredName) {
          setPrimaryUser({
            memberId: SELF_PROFILE_ID,
            name: registeredName,
            relationship: "Me",
          });
        } else {
          setPrimaryUser(null);
          setError(
            "Your registered name could not be retrieved."
          );
        }
      } else {
        setPrimaryUser(null);
        setFamilyName("");
        setError(
          "Unable to load your registered profile."
        );
      }

      // ADDITIONAL MEMBERS: DYNAMODB

      if (familyResult.status === "fulfilled") {
        const familyData = familyResult.value;

        setMembers(
          Array.isArray(familyData) ? familyData : []
        );
      } else {
        setMembers([]);

        setError((previous) =>
          [
            previous,
            "Unable to load additional family members.",
          ]
            .filter(Boolean)
            .join(" ")
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to load family members."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const openAddMember = () => {
    navigate("/family/add");
  };

  const openMember = (memberId) => {
    navigate(
      `/family/${encodeURIComponent(memberId)}`
    );
  };

  // =====================================================
  // PHONE
  // =====================================================

  const openPhone = (event, mobile) => {
    event.stopPropagation();

    if (!mobile) return;

    window.location.href = `tel:${mobile}`;
  };

  // =====================================================
  // WHATSAPP
  // =====================================================

  const openWhatsApp = (event, mobile) => {
    event.stopPropagation();

    if (!mobile) return;

    const number = String(mobile).replace(/\D/g, "");

    const whatsappNumber =
      number.length === 10 ? `91${number}` : number;

    window.open(
      `https://wa.me/${whatsappNumber}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // TOTAL MEMBERS
  // =====================================================

  const totalMembers =
    members.length + (primaryUser ? 1 : 0);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fk-family-page">
      {/* HEADER */}

      <header className="fk-family-header">
        <button
          type="button"
          className="fk-family-icon-button"
          onClick={() => navigate("/my-family")}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={22} />
        </button>

        <h1>My Family</h1>

        <button
          type="button"
          className="fk-family-icon-button"
          onClick={loadMembers}
          aria-label="Refresh family members"
        >
          <RefreshCw size={21} />
        </button>
      </header>

      {/* MAIN */}

      <main className="fk-family-main">
        {/* SUMMARY */}

        <section className="fk-family-summary">

          <h2>
            {familyName
              ? `${familyName} Family`
              : "My Family"}
          </h2>

          <p>
            {loading
              ? "Loading family members..."
              : `${totalMembers} family ${
                  totalMembers === 1
                    ? "member"
                    : "members"
                }`}
          </p>
        </section>

        {/* LOADING */}

        {loading ? (
          <div
            className="fk-family-state"
            role="status"
          >
            Loading your family...
          </div>
        ) : (
          <>
            {/* ERROR */}

            {error && (
              <div
                className="fk-family-state"
                role="alert"
              >
                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadMembers}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* FAMILY TREE */}

            <section className="fk-family-tree-placeholder">
              <UsersRound
                size={50}
                strokeWidth={1.2}
              />

              <p>Your Family Tree</p>
            </section>

            {/* FAMILY MEMBERS */}

            <section className="fk-family-list-section">
              <div className="fk-family-list-heading">
                <h3>Family Members</h3>

                <button
                  type="button"
                  onClick={openAddMember}
                  className="fk-family-add-small"
                >
                  <Plus size={17} />
                  Add
                </button>
              </div>

              <div className="fk-family-list">
                {/* PRIMARY REGISTERED USER */}

                {primaryUser && (
                  <article
                    className="fk-family-member-card"
                    key="primary-user"
                  >
                    <div className="fk-family-member-details">
                      <ProfileAvatar
                        memberId={SELF_PROFILE_ID}
                        name={primaryUser.name}
                        className="fk-family-avatar"
                      >
                        {primaryUser.name
                          .charAt(0)
                          .toUpperCase()}
                      </ProfileAvatar>

                      <span className="fk-family-member-info">
                        <strong>
                          {primaryUser.name}
                        </strong>

                        <small>Me</small>
                      </span>
                    </div>
                  </article>
                )}

                {/* ADDITIONAL FAMILY MEMBERS */}

                {members.map((member) => (
                  <article
                    className="fk-family-member-card"
                    key={member.memberId}
                  >
                    <button
                      type="button"
                      className="fk-family-member-details"
                      onClick={() =>
                        openMember(member.memberId)
                      }
                    >
                      <ProfileAvatar
                        memberId={member.memberId}
                        name={member.name || ""}
                        className="fk-family-avatar"
                      >
                        {member.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </ProfileAvatar>

                      <span className="fk-family-member-info">
                        <strong>
                          {member.name}
                        </strong>

                        <small>
                          {member.relationship ||
                            "Family Member"}
                        </small>
                      </span>

                      <ChevronRight size={20} />
                    </button>

                    {member.mobile && (
                      <div className="fk-family-contact-actions">
                        <button
                          type="button"
                          onClick={(event) =>
                            openPhone(
                              event,
                              member.mobile
                            )
                          }
                          aria-label={`Call ${member.name}`}
                        >
                          <Phone size={17} />
                          Call
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            openWhatsApp(
                              event,
                              member.mobile
                            )
                          }
                          aria-label={`WhatsApp ${member.name}`}
                        >
                          <MessageCircle size={17} />
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* NO ADDITIONAL MEMBERS */}

              {members.length === 0 && (
                <section className="fk-family-empty">
                  <h3>
                    Bring your family together
                  </h3>

                  <p>
                    Add your family members and keep
                    their important information
                    organized in one place.
                  </p>

                  <button
                    type="button"
                    className="fk-family-primary-button"
                    onClick={openAddMember}
                  >
                    <Plus size={20} />
                    Add Family Member
                  </button>
                </section>
              )}
            </section>
          </>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}

      <nav className="fk-family-bottom-nav">
        <button
          type="button"
          onClick={() =>
            navigate("/my-family")
          }
        >
          <House size={22} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="active"
          onClick={() =>
            navigate("/family")
          }
          aria-current="page"
        >
          <UsersRound size={22} />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className="fk-family-bottom-add"
          onClick={openAddMember}
          aria-label="Add family member"
        >
          <Plus size={25} />
        </button>
      </nav>
    </div>
  );
}
