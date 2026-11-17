

import { useRef, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";



import {

  ArrowLeft,

  ArrowRight,

  Camera,

  Check,

  CheckCircle2,

  ChevronLeft,

  UserRound,

  X,

} from "lucide-react";



import { addFamilyMember } from "./api/familyMembersApi.js";

import { uploadProfilePicture } from "./api/profilePicturesApi.js";



import "./AddFamilyMemberPage.css";



const RELATIONSHIPS = [

  "Father",

  "Mother",

  "Spouse",

  "Son",

  "Daughter",

  "Brother",

  "Sister",

  "Grandfather",

  "Grandmother",

  "Other",

];



const BLOOD_GROUPS = [

  "A+",

  "A-",

  "B+",

  "B-",

  "AB+",

  "AB-",

  "O+",

  "O-",

];



const INITIAL_FORM = {

  name: "",

  relationship: "",

  mobile: "",

  email: "",

  bloodGroup: "",

  dateOfBirth: "",

  height: "",

  weight: "",

  address: "",

};



const STEP_TITLES = [

  "Add Person Details",

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



  const [photoFile, setPhotoFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  const [photoError, setPhotoError] = useState("");



  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saveError, setSaveError] = useState("");

  const [photoWarning, setPhotoWarning] = useState("");

  const [createdMember, setCreatedMember] = useState(null);



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

    setForm((previous) => ({

      ...previous,

      [field]: value,

    }));



    setErrors((previous) => ({

      ...previous,

      [field]: "",

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



    if (!["image/jpeg", "image/png"].includes(file.type)) {

      setPhotoError("Only JPG and PNG images are allowed.");

      event.target.value = "";

      return;

    }



    if (file.size > 5 * 1024 * 1024) {

      setPhotoError("Image size must not exceed 5 MB.");

      event.target.value = "";

      return;

    }



    setPhotoFile(file);

    setPhotoPreview(URL.createObjectURL(file));
    event.target.value = "";

  };



  // =====================================================

  // REMOVE SELECTED PHOTO

  // =====================================================



  const removeSelectedPhoto = () => {

    setPhotoFile(null);

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



    if (!/^\+?[0-9]{10,15}$/.test(form.mobile.trim())) {

      nextErrors.mobile =

        "Enter a valid mobile number (10–15 digits).";

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

    if (step === 2 && !validateBasicDetails()) return;



    setSaveError("");

    setStep((previous) => Math.min(previous + 1, 5));

  };



  const previousStep = () => {

    setSaveError("");

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

      setStep(2);

      return;

    }



    setSaving(true);

    setSaveError("");

    setPhotoWarning("");



    try {

      // STEP 1: CREATE MEMBER IN DYNAMODB



      const member = await addFamilyMember(form);



      if (!member?.memberId) {

        throw new Error(

          "Member may have been created, but the server did not return a member ID. Check your family list before trying again."

        );

      }



      // STEP 2: UPLOAD PHOTO TO S3 USING MEMBER ID



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

    } = {}

  ) => (

    <label className="fk-add-field" key={field}>

      <span>

        {label}

        {required && <b> *</b>}

      </span>



      <input

        type={type}

        value={form[field]}

        placeholder={placeholder}

        onChange={(event) =>

          updateField(field, event.target.value)

        }

        aria-invalid={Boolean(errors[field])}

      />



      {errors[field] && (

        <small className="fk-add-error">

          {errors[field]}

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

        <main className="fk-add-success">

          <CheckCircle2 size={82} />



          <h1>Member Added Successfully!</h1>



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

      <header className="fk-add-header">

        <button

          type="button"

          className="fk-add-back"

          onClick={

            step === 1 ? discard : previousStep

          }

          aria-label="Go back"

          disabled={saving}

        >

          <ArrowLeft size={22} />

        </button>



        <h1>Add Family Member</h1>



        <button

          type="button"

          className="fk-add-skip"

          onClick={

            step === 1 ? nextStep : discard

          }

          disabled={saving}

        >

          {step === 1 ? "Skip" : "Discard"}

        </button>

      </header>



      <main className="fk-add-main">

            <input

              ref={fileInputRef}

              type="file"

              accept="image/png,image/jpeg"

              onChange={handlePhotoChange}

              style={{ display: "none" }}

              disabled={saving}

            />

        {/* PROGRESS */}



        <div className="fk-add-progress-heading">

          <span>Step {step} of 5</span>

          <span>

            {Math.round((step / 5) * 100)}%

          </span>

        </div>



        <div className="fk-add-progress">

          <div

            style={{

              width: `${(step / 5) * 100}%`,

            }}

          />

        </div>



        <h2>{STEP_TITLES[step - 1]}</h2>



        {/* =========================================

            STEP 1: PROFILE PICTURE

           ========================================= */}



        {step === 1 && (

          <section className="fk-add-section">

            <div

              className="fk-add-photo"

              style={{

                overflow: "hidden",

                position: "relative",

              }}

            >

              {photoPreview ? (

                <img

                  src={photoPreview}

                  alt="Selected profile"

                  style={{

                    width: "100%",

                    height: "100%",

                    objectFit: "cover",

                    borderRadius: "inherit",

                  }}

                />

              ) : (

                <UserRound size={64} />

              )}

            </div>



            <h3>Add a profile picture</h3>



            <p>

              Choose a picture for your family member.

              You can also upload it later.

            </p>







            <div

              style={{

                display: "flex",

                justifyContent: "center",

                gap: "10px",

                flexWrap: "wrap",

              }}

            >

              <button

                type="button"

                className="fk-add-primary"

                onClick={() =>

                  fileInputRef.current?.click()

                }

                disabled={saving}

              >

                <Camera size={19} />

                {photoPreview

                  ? "Change Photo"

                  : "Choose Photo"}

              </button>



              {photoPreview && (

                <button

                  type="button"

                  className="fk-add-secondary"

                  onClick={removeSelectedPhoto}

                  disabled={saving}

                >

                  <X size={17} />

                  Remove

                </button>

              )}

            </div>



            <small>

              JPG or PNG · Maximum 5 MB

            </small>



            {photoError && (

              <p

                className="fk-add-save-error"

                role="alert"

              >

                {photoError}

              </p>

            )}

          </section>

        )}



        {/* =========================================

            STEP 2: BASIC DETAILS

           ========================================= */}



        {step === 2 && (

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



                {RELATIONSHIPS.map((relation) => (

                  <option

                    value={relation}

                    key={relation}

                  >

                    {relation}

                  </option>

                ))}

              </select>



              {errors.relationship && (

                <small className="fk-add-error">

                  {errors.relationship}

                </small>

              )}

            </label>



            {renderInput(

              "Mobile Number",

              "mobile",

              {

                type: "tel",

                placeholder: "9876543210",

                required: true,

              }

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

            STEP 3: VERIFICATION

           ========================================= */}



        {step === 3 && (

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

            STEP 4: MORE DETAILS

           ========================================= */}



        {step === 4 && (

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

              "Date of Birth",

              "dateOfBirth",

              { type: "date" }

            )}



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

            STEP 5: REVIEW DETAILS

           ========================================= */}



        {step === 5 && (

          <section className="fk-add-section">

            <p className="fk-add-intro">

              Review the details before adding this member.

            </p>



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
              <small>JPG or PNG · Maximum 5 MB</small>
              {photoError && (
                <p className="fk-add-save-error" role="alert">
                  {photoError}
                </p>
              )}
            </div>



            <div className="fk-add-review">

              {[

                ["Full Name", form.name],

                ["Relationship", form.relationship],

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



                        {saveError && (

              <p

                className="fk-add-save-error"

                role="alert"

              >

                {saveError}

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



          {step < 5 ? (

            <button

              type="button"

              className="fk-add-primary"

              onClick={nextStep}

              disabled={saving}

            >

              {step === 2

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
