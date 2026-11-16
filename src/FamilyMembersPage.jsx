
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
import "./FamilyMembersPage.css";

export default function FamilyMembersPage() {
  const navigate = useNavigate();

  const [primaryUser, setPrimaryUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      // Fetch the registered user and additional family members.
      const [profileResult, familyResult] = await Promise.allSettled([
        getFamilyKitProfile(accessToken),
        getFamilyMembers(),
      ]);

      if (profileResult.status === "fulfilled") {
        const response = profileResult.value;

        const profile =
          response?.profile ??
          response?.user ??
          response?.data?.profile ??
          response?.data?.user ??
          response?.data ??
          response;

        const registeredName =
          profile?.name ||
          profile?.fullName ||
          profile?.full_name ||
          profile?.displayName ||
          profile?.given_name ||
          "";

        setPrimaryUser({
          name: String(registeredName).trim(),
          relationship: "Me",
        });
      } else {
        setPrimaryUser(null);
      }

      if (familyResult.status === "fulfilled") {
        setMembers(
          Array.isArray(familyResult.value)
            ? familyResult.value
            : []
        );
      } else {
        setMembers([]);
      }

      if (
        profileResult.status === "rejected" ||
        familyResult.status === "rejected"
      ) {
        const errors = [];

        if (profileResult.status === "rejected") {
          errors.push("Unable to load your registered profile.");
        }

        if (familyResult.status === "rejected") {
          errors.push("Unable to load additional family members.");
        }

        setError(errors.join(" "));
      }
    } catch (err) {
      setError(err.message || "Unable to load family members.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const openAddMember = () => {
    navigate("/family/add");
  };

  const openMember = (memberId) => {
    navigate(`/family/${encodeURIComponent(memberId)}`);
  };

  const openPhone = (event, mobile) => {
    event.stopPropagation();
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  };

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

  // The primary user is counted only when their profile is loaded.
  const totalMembers = members.length + (primaryUser ? 1 : 0);

  return (
    <div className="fk-family-page">
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

      <main className="fk-family-main">
        <section className="fk-family-summary">
          <div className="fk-family-summary-icon">
            <UsersRound size={32} />
          </div>

          <h2>My Family</h2>

          <p>
            {loading
              ? "Loading family members..."
              : `${totalMembers} family ${
                  totalMembers === 1 ? "member" : "members"
                }`}
          </p>
        </section>

        {loading ? (
          <div className="fk-family-state" role="status">
            Loading your family...
          </div>
        ) : (
          <>
            {error && (
              <div className="fk-family-state" role="alert">
                <p>{error}</p>
                <button type="button" onClick={loadMembers}>
                  Try Again
                </button>
              </div>
            )}

            <section className="fk-family-tree-placeholder">
              <UsersRound size={50} strokeWidth={1.2} />
              <p>Your Family Tree</p>
            </section>

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
                {/* Primary registered user always comes first. */}
                {primaryUser && (
                  <article
                    className="fk-family-member-card"
                    key="primary-user"
                  >
                    <div className="fk-family-member-details">
                      <span className="fk-family-avatar">
                        {primaryUser.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </span>

                      <span className="fk-family-member-info">
                        <strong>
                          {primaryUser.name || "Registered User"}
                        </strong>
                        <small>Me · Primary Profile</small>
                      </span>
                    </div>
                  </article>
                )}

                {/* Additional members are loaded from DynamoDB. */}
                {members.map((member) => (
                  <article
                    className="fk-family-member-card"
                    key={member.memberId}
                  >
                    <button
                      type="button"
                      className="fk-family-member-details"
                      onClick={() => openMember(member.memberId)}
                    >
                      <span className="fk-family-avatar">
                        {member.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </span>

                      <span className="fk-family-member-info">
                        <strong>{member.name}</strong>
                        <small>
                          {member.relationship || "Family Member"}
                        </small>
                      </span>

                      <ChevronRight size={20} />
                    </button>

                    {member.mobile && (
                      <div className="fk-family-contact-actions">
                        <button
                          type="button"
                          onClick={(event) =>
                            openPhone(event, member.mobile)
                          }
                          aria-label={`Call ${member.name}`}
                        >
                          <Phone size={17} />
                          Call
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            openWhatsApp(event, member.mobile)
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

              {members.length === 0 && (
                <section className="fk-family-empty">
                  <h3>Bring your family together</h3>

                  <p>
                    Add your family members and keep their
                    important information organized in one place.
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

      <nav className="fk-family-bottom-nav">
        <button
          type="button"
          onClick={() => navigate("/my-family")}
        >
          <House size={22} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="active"
          onClick={() => navigate("/family")}
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
