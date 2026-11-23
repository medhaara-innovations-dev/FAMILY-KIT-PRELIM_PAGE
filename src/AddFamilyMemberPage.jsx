

import { useRef, useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";



import {


  ArrowRight,

  Camera,

  Check,

  CheckCircle2,

  ChevronLeft,

  UserRound,

  X,

} from "lucide-react";



import { addFamilyMember, getFamilyMembers } from "./api/familyMembersApi.js";

import { uploadProfilePicture } from "./api/profilePicturesApi.js";



import "./AddFamilyMemberPage.css";
import ProfilePhotoCropper from "./ProfilePhotoCropper.jsx";



import { BLOOD_GROUPS, canShareFamilyMobile, familyRelationshipLabel, normalizeFamilyMobile, RELATIONSHIPS, RELATIONSHIP_DETAIL_MAX_LENGTH } from "./familyMemberOptions.js";



const INITIAL_FORM = {

  name: "",

  relationship: "",
  relationshipDetail: "",

  mobile: "",

  email: "",

  bloodGroup: "",

  dateOfBirth: "",

  height: "",

  weight: "",

  address: "",

};



const STEP_TITLES = [

  "Basic Details",

  "Verification",

  "More Important Details & Address",

  "Review Details",

];



export default function AddFamilyMemberPage() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);



  const [step, setStep] = useState(1);

  const [form, setForm] = useState(INITIAL_FORM);
  const [familyMembers, setFamilyMembers] = useState(null);
  const [relationshipLoadError, setRelationshipLoadError] = useState("");
  const [relationshipRefresh, setRelationshipRefresh] = useState(0);



  const [photoFile, setPhotoFile] = useState(null);
  const [cropSourceFile, setCropSourceFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  const [photoError, setPhotoError] = useState("");



  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  const [photoWarning, setPhotoWarning] = useState("");

  const [createdMember, setCreatedMember] = useState(null);

  useEffect(() => {
    let active = true;
    setRelationshipLoadError("");
    getFamilyMembers().then((members) => {
      if (active) setFamilyMembers(members);
    }).catch(() => {
      if (active) setRelationshipLoadError("Unable to check existing relationships. Please try again.");
    });
    return () => { active = false; };
  }, [relationshipRefresh]);

  const usedRelationships = new Set(familyMembers?.map((member) =>
    String(member.relationship || "").trim().toLowerCase()));
  const relationshipOptions = RELATIONSHIPS.filter((relationship) =>
    !["Mother", "Father"].includes(relationship) || !usedRelationships.has(relationship.toLowerCase()));
  const latestBirthDate = new Date().toISOString().slice(0, 10);
  const mobileRequired = !canShareFamilyMobile(form.relationship, form.dateOfBirth);
  const mobile = form.mobile.trim();
  const validMobile = /^\+?[0-9]{10,15}$/.test(mobile);
  const normalizedMobile = normalizeFamilyMobile(mobile);
  const mobileMatch = validMobile && normalizedMobile && familyMembers?.find(
    (member) => normalizeFamilyMobile(member.mobile) === normalizedMobile
  );
  const mobileConflict = mobileMatch && mobileRequired
    ? "This mobile number is already used by a family member."
    : "";
  const existingMobileProfile = mobileConflict ? mobileMatch : errors.mobile && duplicateMatch;


  // =====================================================

  // CLEAN UP PHOTO PREVIEW

  // =====================================================



  useEffect(() => {

    return () => {

      if (photoPreview) {

        URL.revokeObjectURL(photoPreview);

      }

    };

  }, [photoPreview]);



  // =====================================================

  // UPDATE FORM FIELDS

  // =====================================================



  const updateField = (field, value) => {
    if (["name", "relationship", "dateOfBirth", "mobile"].includes(field)) {
      setDuplicateMatch(null);
    }

    setForm((previous) => ({

      ...previous,

      [field]: value,

    }));



    setErrors((previous) => ({

      ...previous,

      [field]: "",
      ...(["name", "relationship", "dateOfBirth"].includes(field) && { mobile: "" }),

    }));

  };



  // =====================================================

  // SELECT PROFILE PHOTO

  // =====================================================



  const handlePhotoChange = (event) => {

    const file = event.target.files?.[0];



    if (!file) return;



    setPhotoError("");

    setPhotoWarning("");



    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {

      setPhotoError("Only JPG, PNG and SVG images are allowed.");

      event.target.value = "";

      return;

    }



    if (file.size > 5 * 1024 * 1024) {

      setPhotoError("Image size must not exceed 5 MB.");

      event.target.value = "";

      return;

    }



    setCropSourceFile(file);
    event.target.value = "";

  };



  const confirmCroppedPhoto = (croppedFile) => {
    setPhotoFile(croppedFile);
    setPhotoPreview(URL.createObjectURL(croppedFile));
    setCropSourceFile(null);
    setPhotoError("");
  };

  // =====================================================

  // REMOVE SELECTED PHOTO

  // =====================================================



  const removeSelectedPhoto = () => {

    setPhotoFile(null);
    setCropSourceFile(null);

    setPhotoPreview(null);

    setPhotoError("");



    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };



  // =====================================================

  // VALIDATE BASIC DETAILS

  // =====================================================



  const validateBasicDetails = () => {

    const nextErrors = {};



    if (!form.name.trim()) {

      nextErrors.name = "Full name is required.";

    }



    if (!form.relationship) {

      nextErrors.relationship = "Select a relationship.";

    }
    if (form.relationship === "Other" && !form.relationshipDetail.trim()) {
      nextErrors.relationshipDetail = "Specify the relationship.";
    }

    if (!familyMembers) {
      nextErrors.relationship = relationshipLoadError || "Wait for relationships to load.";
    } else if (form.relationship && !relationshipOptions.includes(form.relationship)) {
      nextErrors.relationship = `A ${form.relationship} is already in your family.`;
    }

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    } else if (form.dateOfBirth > latestBirthDate) {
      nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
    }



    if ((mobileRequired || mobile) && !validMobile) {

      nextErrors.mobile =

        "Enter a valid mobile number (10–15 digits).";

    } else if (mobileConflict) {
      nextErrors.mobile = mobileConflict;
    }



    if (

      form.email.trim() &&

      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())

    ) {

      nextErrors.email = "Enter a valid email address.";

    }



    setErrors(nextErrors);



    return Object.keys(nextErrors).length === 0;

  };



  // =====================================================

  // STEP NAVIGATION

  // =====================================================



  const nextStep = () => {

    if (step === 1 && !validateBasicDetails()) return;



    setSaveError("");

    setStep((previous) => Math.min(previous + 1, STEP_TITLES.length));

  };



  const previousStep = () => {

    setSaveError("");
    setDuplicateMatch(null);

    setStep((previous) => Math.max(previous - 1, 1));

  };



  const discard = () => {

    navigate("/family");

  };



  // =====================================================

  // SAVE MEMBER + UPLOAD PHOTO

  // =====================================================



  const saveMember = async () => {

    if (saving || createdMember) return;



    if (!validateBasicDetails()) {

      setStep(1);

      return;

    }



    setSaving(true);

    setSaveError("");
    setDuplicateMatch(null);

    setPhotoWarning("");



    try {

      // STEP 1: CREATE MEMBER IN DYNAMODB



      const { relationshipDetail, ...details } = form;
      const member = await addFamilyMember(form.relationship === "Other"
        ? { ...details, relationshipDetail: relationshipDetail.trim() }
        : details);
      if (member === null) return;



      if (!member?.memberId) {

        throw new Error(

          "Member may have been created, but the server did not return a member ID. Check your family list before trying again."

        );

      }



      // Upload the optional photo after the member ID is available.



      if (photoFile) {

        setUploadingPhoto(true);



        try {

          await uploadProfilePicture(

            member.memberId,

            photoFile

          );

        } catch (photoUploadError) {

          setPhotoWarning(

            `Member created successfully, but photo upload failed: ${

              photoUploadError.message ||

              "Unknown error"

            }. You can upload the photo later from the member profile.`

          );

        } finally {

          setUploadingPhoto(false);

        }

      }



      // SHOW SUCCESS AFTER PHOTO UPLOAD FINISHES



      setCreatedMember(member);

    } catch (error) {
      if (error.code === "PARENT_RELATIONSHIP_TAKEN") {
        setFamilyMembers(null);
        setRelationshipRefresh((previous) => previous + 1);
        setStep(1);
        setErrors({ relationship: error.message });
      }
      if (error.code === "DUPLICATE_MEMBER") {
        setDuplicateMatch(error.matches[0] || null);
        if (mobile) {
          setStep(1);
          setErrors({ mobile: error.message });
          setRelationshipRefresh((previous) => previous + 1);
          return;
        }
      }

      setSaveError(

        error.message || "Unable to add family member."

      );

    } finally {

      setSaving(false);

    }

  };



  // =====================================================

  // REUSABLE INPUT

  // =====================================================



  const renderInput = (

    label,

    field,

    {

      type = "text",

      placeholder = "",

      required = false,
      maxLength,
      feedback = errors[field],

    } = {}

  ) => (

    <label className="fk-add-field" key={field}>

      <span>

        {label}

        {required && <b> *</b>}

      </span>



      <input

        type={type}
        max={type === "date" ? latestBirthDate : undefined}
        required={required}
        maxLength={maxLength}

        value={form[field]}

        placeholder={placeholder}

        onChange={(event) =>

          updateField(field, event.target.value)

        }

        aria-invalid={Boolean(feedback)}
        aria-describedby={feedback ? `fk-add-${field}-feedback` : undefined}

      />



      {feedback && (

        <small id={`fk-add-${field}-feedback`} className="fk-add-error" role="alert">

          {feedback}

        </small>

      )}

    </label>

  );



  // =====================================================

  // SUCCESS SCREEN

  // =====================================================



  if (createdMember) {

    return (

      <div className="fk-add-page">

        <header className="fk-add-header fk-glass-header">
          <button
            type="button"
            className="fk-add-back"
            onClick={() => navigate("/family")}
            aria-label="Back to My Family"
          >
            <ChevronLeft size={22} />
          </button>
          <h1>Add Family Member</h1>
          <span aria-hidden="true" />
        </header>

        <main className="fk-add-success">

          <CheckCircle2 size={82} />



          <h2>Member Added Successfully!</h2>



          <p>

            {createdMember.name} has been added

            to your family.

          </p>



          {photoWarning && (

            <p

              className="fk-add-save-error"

              role="alert"

            >

              {photoWarning}

            </p>

          )}



          <button

            type="button"

            className="fk-add-primary"

            onClick={() =>

              navigate(

                `/family/${encodeURIComponent(

                  createdMember.memberId

                )}`

              )

            }

          >

            View Profile

            <ArrowRight size={19} />

          </button>



          <button

            type="button"

            className="fk-add-secondary"

            onClick={() => navigate("/family")}

          >

            Back to My Family

          </button>

        </main>

      </div>

    );

  }



  // =====================================================

  // REGISTRATION FORM

  // =====================================================



  return (

    <div className="fk-add-page">
      {cropSourceFile && (
        <ProfilePhotoCropper
          file={cropSourceFile}
          onConfirm={confirmCroppedPhoto}
          onCancel={() => setCropSourceFile(null)}
        />
      )}

      <header className="fk-add-header fk-glass-header">

        <button

          type="button"

          className="fk-add-back"

          onClick={

            step === 1 ? discard : previousStep

          }

          aria-label="Go back"

          disabled={saving}

        >

          <ChevronLeft size={22} />

        </button>



        <h1>Add Family Member</h1>



        <button

          type="button"

          className="fk-add-skip"

          onClick={discard}

          disabled={saving}

        >

          Discard

        </button>

      </header>



      <main className="fk-add-main">

            <input

              ref={fileInputRef}

              type="file"

              accept="image/jpeg,image/png,image/svg+xml,.svg"

              onChange={handlePhotoChange}

              style={{ display: "none" }}

              disabled={saving}

            />

        {/* PROGRESS */}



        <div className="fk-add-progress-heading">

          <span>Step {step} of {STEP_TITLES.length}</span>

          <span>

            {Math.round((step / STEP_TITLES.length) * 100)}%

          </span>

        </div>



        <div className="fk-add-progress">

          <div

            style={{

              width: `${(step / STEP_TITLES.length) * 100}%`,

            }}

          />

        </div>



        <h2>{STEP_TITLES[step - 1]}</h2>



        {/* =========================================

            STEP 1: BASIC DETAILS

           ========================================= */}



        {step === 1 && (

          <section className="fk-add-section">

            <p className="fk-add-intro">

              Enter the basic information of your

              family member.

            </p>



            {renderInput(

              "Full Name",

              "name",

              {

                placeholder: "Enter full name",

                required: true,

              }

            )}



            <label className="fk-add-field">

              <span>

                Relationship <b>*</b>

              </span>



              <select

                value={form.relationship}
                disabled={!familyMembers}
                required

                onChange={(event) =>

                  updateField(

                    "relationship",

                    event.target.value

                  )

                }

              >

                <option value="">

                  Select relationship

                </option>



                {relationshipOptions.map((relation) => (

                  <option

                    value={relation}

                    key={relation}

                  >

                    {relation}

                  </option>

                ))}

              </select>

              {!familyMembers && !relationshipLoadError && <small>Checking existing relationships…</small>}
              {relationshipLoadError && (
                <button type="button" className="fk-add-secondary"
                  onClick={() => setRelationshipRefresh((previous) => previous + 1)}>
                  Retry loading relationships
                </button>
              )}



              {errors.relationship && (

                <small className="fk-add-error">

                  {errors.relationship}

                </small>

              )}

            </label>



            {form.relationship === "Other" && renderInput("Specify relationship", "relationshipDetail", {
              placeholder: "e.g. Guardian, Aunt, Uncle",
              required: true,
              maxLength: RELATIONSHIP_DETAIL_MAX_LENGTH,
            })}
            {renderInput("Date of Birth", "dateOfBirth", { type: "date", required: true })}

            {renderInput(

              "Mobile Number",

              "mobile",

              {

                type: "tel",

                placeholder: mobileRequired ? "9876543210" : "Optional",

                required: mobileRequired,
                feedback: mobileConflict || errors.mobile,

              }

            )}

            {existingMobileProfile && (
              <small><Link to={`/family/${encodeURIComponent(existingMobileProfile.memberId)}`}>Open existing profile</Link></small>
            )}


            {renderInput(

              "Email Address",

              "email",

              {

                type: "email",

                placeholder: "Optional",

              }

            )}

          </section>

        )}



        {/* =========================================

            STEP 2: VERIFICATION

           ========================================= */}



        {step === 2 && (

          <section className="fk-add-section fk-add-verify">

            <div className="fk-add-verify-icon">

              <Check size={42} />

            </div>



            <h3>Mobile Verification</h3>



            <p>

              OTP verification will be enabled when

              your SMS or WhatsApp verification service

              is integrated.

            </p>



            <div className="fk-add-demo-label">

              Demo mode — no OTP is sent

            </div>



            <p>

              Select Continue to proceed with

              family-member registration.

            </p>

          </section>

        )}



        {/* =========================================

            STEP 3: MORE DETAILS

           ========================================= */}



        {step === 3 && (

          <section className="fk-add-section">

            <p className="fk-add-intro">

              Add more details about your family member.

              These fields are optional.

            </p>



            <label className="fk-add-field">

              <span>Blood Group</span>



              <select

                value={form.bloodGroup}

                onChange={(event) =>

                  updateField(

                    "bloodGroup",

                    event.target.value

                  )

                }

              >

                <option value="">

                  Select blood group

                </option>



                {BLOOD_GROUPS.map((group) => (

                  <option

                    value={group}

                    key={group}

                  >

                    {group}

                  </option>

                ))}

              </select>

            </label>



            {renderInput(

              "Height (cm)",

              "height",

              { placeholder: "Optional" }

            )}



            {renderInput(

              "Weight (kg)",

              "weight",

              { placeholder: "Optional" }

            )}



            <label className="fk-add-field">

              <span>Address</span>



              <textarea

                rows={4}

                placeholder="Enter family member's address"

                value={form.address}

                onChange={(event) =>

                  updateField(

                    "address",

                    event.target.value

                  )

                }

              />

            </label>

          </section>

        )}



        {/* =========================================

            STEP 4: REVIEW DETAILS

           ========================================= */}



        {step === 4 && (

          <section className="fk-add-section">

            <p className="fk-add-intro">

              Review the details and add an optional profile photo before saving.

            </p>



            <div className="fk-add-review">

              {[

                ["Full Name", form.name],

                ["Relationship", familyRelationshipLabel(form)],

                ["Mobile", form.mobile],

                ["Email", form.email],

                ["Blood Group", form.bloodGroup],

                ["Date of Birth", form.dateOfBirth],

                ["Height", form.height],

                ["Weight", form.weight],

                ["Address", form.address],

              ].map(([label, value]) => (

                <div

                  className="fk-add-review-row"

                  key={label}

                >

                  <span>{label}</span>

                  <strong>

                    {value || "Not provided"}

                  </strong>

                </div>

              ))}

            </div>

            {/* PHOTO PREVIEW AND EDITING ON REVIEW STEP */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "18px 12px",
                marginBottom: 20,
                border: "1px solid #EDEAF3",
                borderRadius: 16,
                background: "#fff",
              }}
            >
              <h3 style={{ margin: 0, color: "#130438" }}>
                Profile Photo
              </h3>
              <div
                className="fk-add-photo"
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#EBE6F7",
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={`Selected profile photo for ${form.name || "family member"}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                ) : (
                  <UserRound size={64} color="#2D0B84" />
                )}
              </div>
              <p style={{ margin: 0, textAlign: "center" }}>
                {photoPreview
                  ? "This photo will appear on the member's profile."
                  : "No photo selected. You can add one now or later."}
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="fk-add-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <Camera size={18} />
                  {photoPreview ? "Change Photo" : "Choose Photo"}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    className="fk-add-secondary"
                    onClick={removeSelectedPhoto}
                    disabled={saving}
                  >
                    <X size={17} />
                    Remove Photo
                  </button>
                )}
              </div>
              <small>JPG, PNG or SVG · Maximum 5 MB</small>
              {photoError && (
                <p className="fk-add-save-error" role="alert">
                  {photoError}
                </p>
              )}
            </div>

            {saveError && (

              <p

                className="fk-add-save-error"

                role="alert"

              >

                {saveError}
                {duplicateMatch && (
                  <> <Link to={`/family/${encodeURIComponent(duplicateMatch.memberId)}`}>Open existing profile</Link></>
                )}

              </p>

            )}

          </section>

        )}



        {/* =========================================

            STEP NAVIGATION

           ========================================= */}



        <div className="fk-add-actions">

          {step > 1 && (

            <button

              type="button"

              className="fk-add-secondary"

              onClick={previousStep}

              disabled={saving}

            >

              <ChevronLeft size={19} />

              Back

            </button>

          )}



          {step < STEP_TITLES.length ? (

            <button

              type="button"

              className="fk-add-primary"

              onClick={nextStep}

              disabled={saving}

            >

              {step === 1

                ? "Continue (Demo — No OTP)"

                : "Next"}



              <ArrowRight size={19} />

            </button>

          ) : (

            <button

              type="button"

              className="fk-add-primary"

              onClick={saveMember}

              disabled={saving}

            >

              {saving

                ? uploadingPhoto

                  ? "Uploading Photo..."

                  : "Adding Member..."

                : "Add Member"}



              {!saving && <Check size={19} />}

            </button>

          )}

        </div>

      </main>

    </div>

  );

}
