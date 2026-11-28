import FamilyInvitationForm from "./components/FamilyInvitationForm.jsx";
import { CONNECTED_PROFILE_ID, connectionsEnabled, familyConnection, linkConnectionProfile } from "./api/familyConnectionsApi.js";
import { CircleCheck, Send } from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  Plus,
  ChevronRight,
  Phone,
  RefreshCw,
  UserRoundPlus,
  Link2,
  X,
} from "lucide-react";
import { WhatsAppLogo } from "./components/ReferenceIcons.jsx";

import { getFamilyMembers } from "./api/familyMembersApi.js";
import { getFamilyKitProfile } from "./auth/authService.js";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getValidAccessToken,
} from "./auth/sessionManager.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import { getWhatsAppUrl } from "./components/whatsAppUrl.js";
import { familyRelationshipLabel } from "./familyMemberOptions.js";

import "./FamilyMembersPage.css";

export default function FamilyMembersPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [primaryUser, setPrimaryUser] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const actionsDialog = useRef(null);
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [connectionState, setConnectionState] = useState(null);
  const refreshConnection = useCallback(() => {
    if (connectionsEnabled) familyConnection().then(setConnectionState).catch(() => setConnectionState(null));
  }, []);
  useEffect(() => {
    if (!connectionsEnabled) return;
    refreshConnection();
    const timer = window.setInterval(refreshConnection, 30000);
    window.addEventListener("focus", refreshConnection);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshConnection);
    };
  }, [refreshConnection]);

  // =====================================================
  // LOAD REGISTERED USER + FAMILY MEMBERS
  // =====================================================

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!getStoredAccessToken() && !getStoredRefreshToken()) {
        navigate("/login", { replace: true });
        return;
      }

      const accessToken = await getValidAccessToken();

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
    navigate("/family/add", { state: { returnToLauncher: true } });
  };

  function openFamilyActions() {
    setShowInviteInfo(false);
    actionsDialog.current?.showModal();
  }

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

    const whatsappUrl = getWhatsAppUrl(mobile);
    if (!whatsappUrl) return;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // TOTAL MEMBERS
  // =====================================================

  const totalMembers =
    members.length + (primaryUser ? 1 : 0) + (connectionState?.connection ? 1 : 0);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fk-family-page">
      {/* HEADER — existing navigation and refresh behavior preserved */}
      <header className="fk-family-header fk-glass-header">
        <div className="fk-family-header-left">
          <button type="button" className="fk-family-icon-button fk-family-back"
            onClick={() => navigate("/my-family")} aria-label="Back to dashboard">
            <ChevronLeft size={22} />
          </button>
          <h1>My Family</h1>
        </div>
        <div className="fk-family-header-right">
          <button type="button" className="fk-family-icon-button fk-family-refresh"
            onClick={loadMembers} aria-label="Refresh family members">
            <RefreshCw size={19} />
          </button>
          <button type="button" className="fk-family-icon-button fk-family-header-add"
            onClick={openFamilyActions} aria-label="Add or invite a family member" aria-haspopup="dialog">
            <UserRoundPlus size={21} />
          </button>
        </div>
      </header>

      <dialog ref={actionsDialog} className="fk-family-actions-dialog" aria-labelledby="fk-family-actions-title">
        <header>
          <h2 id="fk-family-actions-title">Add to My Family</h2>
          <button type="button" onClick={() => actionsDialog.current?.close()} aria-label="Close"><X size={20} /></button>
        </header>
        <button type="button" className="fk-family-action-choice" onClick={() => {
          actionsDialog.current?.close();
          openAddMember();
        }}>
          <UserRoundPlus size={20} aria-hidden="true" />
          <span><strong>Add Family Member</strong><small>Create a profile you manage.</small></span>
        </button>
        <button type="button" className="fk-family-action-choice" onClick={() => setShowInviteInfo((shown) => !shown)}
          aria-expanded={showInviteInfo} aria-controls="fk-family-invite-info">
          <Link2 size={20} aria-hidden="true" />
          <span><strong>Invite Family Member</strong><small>Connect someone who manages their own account.</small></span>
        </button>
        {showInviteInfo && (connectionsEnabled
          ? <FamilyInvitationForm canInvite={connectionState?.canInvite} existingInvitation={connectionState?.invitation} onChange={refreshConnection} />
          : <p id="fk-family-invite-info">Invitations are currently unavailable.</p>)}
      </dialog>

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

        {state?.memberAdded && (
          <p className="fk-family-state" role="status">
            {state.photoUploadFailed
              ? "Family member added. The photo couldn’t be uploaded. You can add it from their profile."
              : "Family member added successfully."}
          </p>
        )}

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

            <section className="fk-family-tree-placeholder" aria-label="Family tree display area" />

            {/* FAMILY MEMBERS */}

            <section className="fk-family-list-section">
              <div className="fk-family-list-heading">
                <h3>Family members</h3>
                <button type="button" onClick={() =>
                  document.getElementById("fk-family-member-list")?.scrollIntoView({ behavior: "smooth", block: "start" })
                } className="fk-family-view-all">View all</button>
              </div>

              <div className="fk-family-list" id="fk-family-member-list">
                {/* PRIMARY REGISTERED USER */}

                {primaryUser && (
                  <article className="fk-family-member-card" key="primary-user">
                    <button type="button" className="fk-family-member-details"
                      onClick={() => navigate("/my-profile", { state: { fromFamily: true } })} aria-label="Open my profile">
                      <ProfileAvatar memberId={SELF_PROFILE_ID} name={primaryUser.name}
                        className="fk-family-avatar">
                        {primaryUser.name.charAt(0).toUpperCase()}
                      </ProfileAvatar>
                      <span className="fk-family-member-info">
                        <strong>{primaryUser.name}</strong>
                        <small>Me</small>
                      </span>
                      <ChevronRight className="fk-family-chevron" size={20} />
                    </button>
                  </article>
                )}

                {connectionState?.connection && (
                  <article className="fk-family-member-card">
                    <button type="button" className="fk-family-member-details"
                      onClick={() => openMember(connectionState.connection.linkedMemberId || CONNECTED_PROFILE_ID)} aria-label={`Open ${connectionState.connection.name} profile`}>
                      <ProfileAvatar connectedPhotoUrl={connectionState.connection.photoUrl || null}
                        name={connectionState.connection.name} className="fk-family-avatar" />
                      <span className="fk-family-member-info">
                        <strong>{connectionState.connection.name}</strong>
                        <small>{connectionState.connection.relationship}</small>
                        <small className="fk-family-status fk-family-status--connected">
                          <CircleCheck size={14} aria-hidden="true" /> Securely connected
                        </small>
                      </span>
                      <ChevronRight className="fk-family-chevron" size={20} aria-hidden="true" />
                    </button>
                  </article>
                )}
                {connectionState?.invitation?.shared && (
                  <article className="fk-family-member-card">
                    <div className="fk-family-member-details">
                      <span className="fk-family-avatar"><Send size={18} aria-hidden="true" /></span>
                      <span className="fk-family-member-info">
                        <strong>{connectionState.invitation.relationship}</strong>
                        <small className="fk-family-status fk-family-status--pending">
                          <Send size={14} aria-hidden="true" /> Invitation sent
                        </small>
                      </span>
                    </div>
                  </article>
                )}

                {/* ADDITIONAL FAMILY MEMBERS */}

                {members.filter((member) => member.memberId !== connectionState?.connection?.linkedMemberId).map((member) => (
                  <article className="fk-family-member-card" key={member.memberId}>
                    <button type="button" className="fk-family-member-details"
                      onClick={() => openMember(member.memberId)}>
                      <ProfileAvatar memberId={member.memberId} name={member.name || ""}
                        className="fk-family-avatar">
                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                      </ProfileAvatar>
                      <span className="fk-family-member-info">
                        <strong>{member.name}</strong>
                        <small>{familyRelationshipLabel(member) || "Family Member"}</small>
                      </span>
                    </button>
                    <div className="fk-family-member-trailing">
                      {member.mobile && (
                        <div className="fk-family-contact-actions">
                          <button type="button" onClick={(event) => openPhone(event, member.mobile)}
                            aria-label={`Call ${member.name}`}><Phone size={18} /></button>
                          <button type="button" className="fk-family-whatsapp"
                            onClick={(event) => openWhatsApp(event, member.mobile)}
                            aria-label={`WhatsApp ${member.name}`}><WhatsAppLogo size={18} aria-hidden="true" /></button>
                        </div>
                      )}
                      <button type="button" className="fk-family-chevron-button"
                        onClick={() => openMember(member.memberId)} aria-label={`Open ${member.name} profile`}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {connectionState?.connection && !connectionState.connection.linkedMemberId && members.length > 0 && (
                <form className="fk-family-invitation-controls" onSubmit={async (event) => {
                  event.preventDefault();
                  const memberId = new FormData(event.currentTarget).get("memberId");
                  if (!memberId || linkBusy || !window.confirm("Link this profile to the connected account?")) return;
                  setLinkBusy(true);
                  setLinkError("");
                  try {
                    await linkConnectionProfile(memberId);
                    refreshConnection();
                  } catch (failure) {
                    setLinkError(failure.message);
                  } finally {
                    setLinkBusy(false);
                  }
                }}>
                  <label>Link existing profile to {connectionState.connection.name}
                    <select name="memberId" defaultValue="" required>
                      <option value="">Choose a profile</option>
                      {members.map((member) => <option key={member.memberId} value={member.memberId}>
                        {member.name} ({familyRelationshipLabel(member)})
                      </option>)}
                    </select>
                  </label>
                  <button type="submit" disabled={linkBusy}>Link existing profile</button>
                  {linkError && <p role="alert">{linkError}</p>}
                </form>
              )}

              {/* NO ADDITIONAL MEMBERS */}

              {members.length === 0 && !connectionState?.connection && !connectionState?.invitation?.shared && (
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

      <FamilyBottomNav />
    </div>
  );
}
