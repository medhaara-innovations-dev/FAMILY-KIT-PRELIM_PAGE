import FamilyInvitationForm from "./components/FamilyInvitationForm.jsx";
import { CONNECTED_PROFILE_ID, connectionsEnabled, familyConnection } from "./api/familyConnectionsApi.js";


import { useEffect, useRef, useState } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";



import {

  ChevronLeft,

  UserRound,

  Pencil,

  Save,

  X,

  Mail,

  Trash2,
  EllipsisVertical,
  Link2,
  ShieldCheck,

} from "lucide-react";
import { CameraIcon } from "./components/ReferenceIcons.jsx";



import {

  deleteFamilyMember,
  getFamilyMember,

  updateFamilyMember,

} from "./api/familyMembersApi.js";



import { SELF_PROFILE_ID, uploadProfilePicture } from "./api/profilePicturesApi.js";



import ProfileAvatar from "./components/ProfileAvatar.jsx";
import MobileProfileDetails, { MobileConnectedDocuments, MobileProfileActions } from "./components/MobileProfileDetails.jsx";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import ProfilePhotoCropper from "./ProfilePhotoCropper.jsx";



import ProfileFields, { SocialProfileFields } from "./components/ProfileFields.jsx";
import { getChangedSocialLinks, socialProfileFields, verifySavedSocialLinks } from "./socialProfileLinks.js";
import { canShareFamilyMobile, familyRelationshipLabel } from "./familyMemberOptions.js";
import "./FamilyMemberProfile.css";



const EDITABLE_FIELDS = [

  "name",

  "relationship",
  "relationshipDetail",

  "mobile",

  "email",

  "bloodGroup",

  "dateOfBirth",

  "height",

  "weight",

  "address",

];



const REQUIRED_FIELDS = ["name", "relationship"];
const FORM_FIELDS = [...EDITABLE_FIELDS, ...socialProfileFields.map(([field]) => field)];

export default function FamilyMemberProfile() {

  const navigate = useNavigate();
  const fromHome = useLocation().state?.fromHome === true;
  const backPath = fromHome ? "/my-family" : "/family";
  const backLabel = fromHome ? "Back to Home" : "Back to My Family";

  const { memberId } = useParams();
  const [linkedProfile, setLinkedProfile] = useState(null);
  const isConnectedProfile = memberId === CONNECTED_PROFILE_ID || linkedProfile?.linkedMemberId === memberId;



  const fileInputRef = useRef(null);



  const [member, setMember] = useState(null);

  const [form, setForm] = useState({});

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const profileActions = useRef(null);
  const [actionInfo, setActionInfo] = useState("");
  const [invitationState, setInvitationState] = useState(null);
  const [invitationError, setInvitationError] = useState("");
  const [invitationRevision, setInvitationRevision] = useState(0);

  useEffect(() => {
    if (actionInfo !== "invite" || !connectionsEnabled) return;
    let active = true;
    familyConnection().then((status) => {
      if (active) {
        setInvitationState(status);
        setInvitationError("");
      }
    }).catch((error) => {
      if (active) setInvitationError(error.message);
    });
    return () => { active = false; };
  }, [actionInfo, invitationRevision]);

  const [error, setError] = useState("");
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  const [success, setSuccess] = useState("");



  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);

  const [photoError, setPhotoError] = useState("");

  const [photoSuccess, setPhotoSuccess] = useState("");



  // =====================================================

  // LOAD MEMBER

  // =====================================================



  useEffect(() => {

    let active = true;



    async function loadMember() {

      setLoading(true);

      setError("");

      setEditing(false);



      try {

        const connection = connectionsEnabled ? (await familyConnection().catch((error) => {
          if (memberId === CONNECTED_PROFILE_ID) throw error;
          return null;
        }))?.connection : null;
        const connected = memberId === CONNECTED_PROFILE_ID || connection?.linkedMemberId === memberId;
        const result = connected ? connection : await getFamilyMember(memberId);
        if (active) setLinkedProfile(connected ? connection : null);
        if (!result) throw new Error("This connected profile is unavailable.");



        if (!active) return;



        setMember(result);



        const initialForm = {};



        FORM_FIELDS.forEach((field) => {

          initialForm[field] = result?.[field] || "";

        });



        setForm(initialForm);

      } catch (err) {

        if (active) {

          setMember(null);

          setError(err.message || "Unable to load member.");

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    }



    if (memberId) {

      loadMember();

    } else {

      setMember(null);

      setLoading(false);

      setError("Member ID is missing.");

    }



    return () => {

      active = false;

    };

  }, [memberId]);



  // =====================================================

  // PROFILE PHOTO — UPLOAD OR REPLACE

  // =====================================================



  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !memberId || photoBusy) return;
    setPhotoError("");
    setPhotoSuccess("");
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      setPhotoError("Only JPG, PNG and SVG images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Profile picture must not exceed 5 MB.");
      return;
    }
    setPhotoToCrop(file);
  };

  const handleCropConfirm = async (croppedFile) => {
    if (!memberId || photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoSuccess("");
    try {
      await uploadProfilePicture(memberId, croppedFile);
      setPhotoRefreshKey((previous) => previous + 1);
      setPhotoSuccess("Profile picture updated successfully.");
      setPhotoToCrop(null);
    } catch (err) {
      setPhotoError(err.message || "Unable to upload profile picture. Please try confirming again.");
    } finally {
      setPhotoBusy(false);
    }
  };


  // =====================================================

  // UPDATE FIELDS

  // =====================================================



  const updateField = (field, value) => {
    setDuplicateMatch(null);

    setForm((previous) => ({

      ...previous,

      [field]: value,

    }));



    setError("");

    setSuccess("");

  };



  // =====================================================

  // CANCEL EDIT

  // =====================================================



  const cancelEdit = () => {

    const original = {};



    FORM_FIELDS.forEach((field) => {

      original[field] = member?.[field] || "";

    });



    setForm(original);

    setEditing(false);

    setError("");

  };



  // =====================================================

  // SAVE MEMBER DETAILS

  // =====================================================



  const saveChanges = async (event) => {
    event.preventDefault();
    if (saving || photoBusy || removing) return;
    setDuplicateMatch(null);

    if (!form.name.trim()) {

      setError("Full name is required.");

      return;

    }



    if (!form.relationship.trim()) {

      setError("Relationship is required.");

      return;

    }
    if (form.relationship === "Other" && !form.relationshipDetail.trim()) {
      setError("Specify the relationship.");
      return;
    }



    const mobile = form.mobile.trim();
    if ((!canShareFamilyMobile(form.relationship, form.dateOfBirth) || mobile) && !/^\+?[0-9]{10,15}$/.test(mobile)) {

      setError("Enter a valid mobile number.");

      return;

    }



    if (

      form.email.trim() &&

      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())

    ) {

      setError("Enter a valid email address.");

      return;

    }



    setSaving(true);

    setError("");

    setSuccess("");



    try {

      const links = getChangedSocialLinks(form, member);
      const details = Object.fromEntries(EDITABLE_FIELDS
        .filter((field) => field !== "relationshipDetail" || form.relationship === "Other")
        .map((field) => [field, field === "relationshipDetail" ? form[field].trim() : form[field]]));
      const updated = await updateFamilyMember(

        memberId,

        { ...details, ...links }

      );



      if (updated === null) return;
      verifySavedSocialLinks(updated, links);
      setMember(updated);

      setEditing(false);

      setSuccess("Member details updated successfully.");

    } catch (err) {

      setError(err.message || "Unable to update member.");
      if (err.code === "DUPLICATE_MEMBER") {
        setDuplicateMatch(err.matches[0] || null);
      }

    } finally {

      setSaving(false);

    }

  };



  // =====================================================

  // UI

  // =====================================================



  function startEditing() {
    setEditing(true);
    setError("");
    setSuccess("");
    setRemoveError("");
    setDuplicateMatch(null);
  }

  async function removeMember() {
    if (!memberId || memberId === SELF_PROFILE_ID || !member || saving || photoBusy || removing) return;
    const message = `Are you sure you want to remove ${member.name} from your family?\n\nTheir profile will no longer be accessible through My Family. This action cannot be undone.`;
    if (!window.confirm(message)) return;

    setRemoving(true);
    setRemoveError("");
    try {
      await deleteFamilyMember(memberId);
      navigate("/family", { replace: true });
    } catch (err) {
      setRemoveError(err.message || "Unable to remove this family member.");
    } finally {
      setRemoving(false);
    }
  }

  return (

    <div className="fk-profile-page">

      <header className="fk-profile-header fk-glass-header">

        <button

          type="button"

          onClick={() => editing ? cancelEdit() : navigate(backPath, { replace: true })}

          aria-label={editing ? "Back to member profile" : backLabel}
          disabled={editing && (saving || photoBusy || removing)}

        >

          <ChevronLeft size={22} />

        </button>



        <h1>Family Member Profile</h1>



        {member && !loading && !editing && !isConnectedProfile && memberId !== SELF_PROFILE_ID ? (
          <button type="button" className="fk-profile-header-actions" aria-label="Profile actions" aria-haspopup="dialog" disabled={removing || photoBusy}
            onClick={() => { setActionInfo(""); profileActions.current?.showModal(); }}>
            <EllipsisVertical size={22} aria-hidden="true" />
          </button>
        ) : <span className="fk-profile-header-space" />}

      </header>
      <dialog ref={profileActions} className="fk-family-actions-dialog" aria-labelledby="fk-profile-actions-title">
        <header>
          <h2 id="fk-profile-actions-title">Profile actions</h2>
          <button type="button" onClick={() => profileActions.current?.close()} aria-label="Close"><X size={20} /></button>
        </header>
        <button type="button" className="fk-family-action-choice" onClick={() => {
          profileActions.current?.close();
          startEditing();
        }}>
          <Pencil size={20} aria-hidden="true" /><strong>Edit profile</strong>
        </button>
        <button type="button" className="fk-family-action-choice" onClick={() => setActionInfo("details")}
          aria-expanded={actionInfo === "details"} aria-controls="fk-profile-contact-info">
          <Mail size={20} aria-hidden="true" /><strong>Contact details</strong>
        </button>
        <div id="fk-profile-contact-info" className="fk-profile-contact-info" hidden={actionInfo !== "details"}>
          <dl>
            <dt>Email</dt>
            <dd>{member?.email || "Not provided"}</dd>
            <dt>Address</dt>
            <dd>{member?.address || "Not provided"}</dd>
          </dl>
        </div>
        <button type="button" className="fk-family-action-choice" onClick={() => setActionInfo("access")}
          aria-expanded={actionInfo === "access"} aria-controls="fk-profile-access-info">
          <ShieldCheck size={20} aria-hidden="true" /><strong>Access &amp; Permissions</strong>
        </button>
        <p id="fk-profile-access-info" hidden={actionInfo !== "access"}>
          You manage this profile. It is separate from a signed-in FamilyKit account.
        </p>
        <button type="button" className="fk-family-action-choice" onClick={() => setActionInfo("invite")}
          aria-expanded={actionInfo === "invite"} aria-controls="fk-profile-invite-info">
          <Link2 size={20} aria-hidden="true" /><strong>Invite to FamilyKit</strong>
        </button>
        {actionInfo === "invite" && (
          <div id="fk-profile-invite-info">
            {!connectionsEnabled ? <p>Invitations are currently unavailable.</p>
              : invitationError ? <p role="alert">{invitationError}</p>
              : !invitationState ? <p role="status">Checking invitation availability...</p>
              : <FamilyInvitationForm
                  canInvite={invitationState.canInvite}
                  existingInvitation={invitationState.invitation}
                  initialRelationship={member?.relationship}
                  memberId={memberId}
                  onChange={() => setInvitationRevision((value) => value + 1)}
                />}
          </div>
        )}
        <button type="button" className="fk-family-action-choice fk-profile-action-remove" onClick={() => {
          profileActions.current?.close();
          void removeMember();
        }}>
          <Trash2 size={20} aria-hidden="true" /><strong>Remove profile</strong>
        </button>
      </dialog>
      {photoToCrop && (
        <ProfilePhotoCropper
          file={photoToCrop}
          onConfirm={handleCropConfirm}
          onCancel={() => { if (!photoBusy) setPhotoToCrop(null); }}
        />
      )}



      {loading ? (

        <main className="fk-profile-state" role="status">

          Loading member profile...

        </main>

      ) : !member ? (

        <main className="fk-profile-state">

          <p>{error || "Member not found."}</p>



          <button

            type="button"

            onClick={() => navigate(backPath, { replace: true })}

          >

            {backLabel}

          </button>

        </main>

      ) : (

        <main className="fk-profile-main">

          {/* PROFILE HERO */}



          <section className={editing ? "fk-profile-hero" : "fk-profile-hero fk-profile-compact-view"}>
            <div className={editing ? "fk-profile-view-content" : "fk-profile-view-content fk-mobile-profile-card"}>

              <div className="fk-profile-avatar">
                {memberId === CONNECTED_PROFILE_ID ? <UserRound size={48} aria-hidden="true" /> :
                  <ProfileAvatar memberId={memberId} name={member.name} refreshKey={photoRefreshKey}>
                    <UserRound size={48} />
                  </ProfileAvatar>}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/svg+xml,.svg"
                  onChange={handlePhotoChange} disabled={photoBusy || saving} hidden />
                {editing && (
                  <button type="button" className="fk-profile-camera-button"
                    onClick={() => fileInputRef.current?.click()} disabled={photoBusy || saving || removing}
                    aria-label={photoBusy ? "Updating profile photo" : "Upload or change profile photo"}>
                    <CameraIcon size={16} aria-hidden="true" />
                  </button>
                )}
              </div>



            <div className="fk-mobile-profile-identity">
              <h2>{member.name}</h2>
              <div className="fk-profile-relation-row">
                <p>{familyRelationshipLabel(member)}</p>
              </div>
            </div>
            {!editing && <>
              <MobileProfileDetails member={member} />
              {isConnectedProfile && member.address && <dl className="fk-profile-contact-info">
                <dt>Address</dt><dd>{member.address}</dd>
              </dl>}
              <MobileProfileActions key={memberId} mobile={member.mobile} profile={member} canShare={!isConnectedProfile} />
            </>}
            </div>



            {photoError && <p className="fk-profile-error" role="alert">{photoError}</p>}
            {photoSuccess && <p className="fk-profile-success" role="status">{photoSuccess}</p>}
            {!editing && removeError && <p className="fk-profile-error" role="alert">{removeError}</p>}

          </section>



          {/* MEMBER UPDATE MESSAGES */}



          {error && (

            <p

              className="fk-profile-error"

              role="alert"

            >

              {error}
              {editing && duplicateMatch && (
                <> <Link to={`/family/${encodeURIComponent(duplicateMatch.memberId)}`}>Open existing profile</Link></>
              )}

            </p>

          )}



          {success && (

            <p

              className="fk-profile-success"

              role="status"

            >

              {success}

            </p>

          )}



          {/* EDIT OR VIEW */}



          {editing ? (

            <form className="fk-profile-card" onSubmit={saveChanges}>
              <h3>Edit Profile</h3>
              <ProfileFields fields={EDITABLE_FIELDS.filter((field) =>
                field !== "relationshipDetail" || form.relationship === "Other")}
                requiredFields={[
                  ...REQUIRED_FIELDS,
                  ...(form.relationship === "Other" ? ["relationshipDetail"] : []),
                  ...(canShareFamilyMobile(form.relationship, form.dateOfBirth) ? [] : ["mobile"]),
                ]}
                values={form} onChange={updateField} />
              <SocialProfileFields values={form} onChange={updateField} />
              <div className="fk-profile-actions">
                <button type="button" className="fk-profile-cancel" onClick={cancelEdit} disabled={saving || photoBusy || removing}>
                  <X size={17} /> Cancel
                </button>
                <button type="submit" className="fk-profile-save" disabled={saving || photoBusy || removing}>
                  <Save size={17} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

          ) : (
            <MobileConnectedDocuments key={memberId} memberId={memberId} accessEnabled={memberId !== CONNECTED_PROFILE_ID} />
          )}

        </main>

      )}

      {member && !loading && !editing && <FamilyBottomNav active={fromHome ? "home" : "family"} />}
    </div>

  );

}
