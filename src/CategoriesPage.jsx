import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  ScanLine,
  IdCard,
  Search,
  Plus,
  CalendarDays,
  Landmark,
  ReceiptText,
  BookMarked,
  FileText,
  Trash2,
  GraduationCap,
  HeartPulse,
  HandHeart,
  Houses,
  Scale,
  UserRoundCheck,
  BadgeCheck,
  } from "lucide-react";

import { ImportantContactsIcon, NotesIcon, VehiclesIcon } from "./components/ReferenceIcons.jsx";
import useDocuments from "./components/useDocuments.js";
import { scannerAvailable } from "./api/documentScannerApi.js";
import ScannedDocumentCard from "./components/ScannedDocumentCard.jsx";
import { deleteDocument, downloadDocument, OPEN_DOCUMENT_UPLOAD } from "./api/documentsApi.js";
import { CONNECTED_PROFILE_ID } from "./api/familyConnectionsApi.js";
import useConnectedFamilyMember from "./components/useConnectedFamilyMember.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";

import { getFamilyMembers } from "./api/familyMembersApi.js";
import { getDiaryEntries } from "./api/diaryApi.js";
import { listEvents } from "./api/eventsApi.js";
import { countEventEntries } from "./eventDates.js";
import { getImportantContacts } from "./api/importantContactsApi.js";
import { getNotes } from "./api/notesApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import "./CategoriesPage.css";
import emptyDocumentsArt from "./assets/images/first-document-folder.svg";

// ==========================================
// CATEGORY DATA
// ==========================================

const categories = [
  {
    name: "Bills & Renewals",
    Icon: ReceiptText,
    background: "#FAF7F0",
    color: "#B89C10",
  },
  {
    name: "Diary",
    Icon: BookMarked,
    background: "#F1ECFB",
    color: "#6528C6",
    route: "/diary",
    loadRecords: () => getDiaryEntries(),
  },
  {
    name: "Documents",
    Icon: FileText,
    background: "#F0F6FB",
    color: "#2882C6",
    route: "/documents",
  },
  {
    name: "Education",
    Icon: GraduationCap,
    background: "#effbef",
    color: "#29c329",
  },
  {
    name: "Events",
    Icon: CalendarDays,
    background: "#FAF3F0",
    color: "#C66728",
    route: "/events",
    loadRecords: (signal) => listEvents(signal),
    countRecords: (events) => countEventEntries(events,
      new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date())),
  },
  {
    name: "Finance",
    Icon: Landmark,
    background: "#EFF0FB",
    color: "#283DC6",
  },
  {
    name: "Health & Reports",
    Icon: HeartPulse,
    background: "#FAEFF6",
    color: "#C62882",
  },
  {
    name: "Important Contacts",
    Icon: ImportantContactsIcon,
    route: "/important-contacts",
    loadRecords: () => getImportantContacts(),
    background: "#FAEFF0",
    color: "#C62828",
  },
  {
    name: "Insurance",
    Icon: HandHeart,
    background: "#EFF9FA",
    color: "#13A699",
  },
  {
    name: "Legal",
    Icon: Scale,
    background: "#F5F1ED",
    color: "#844B06",
  },
  {
    name: "Nominees",
    Icon: UserRoundCheck,
    background: "#FAEFFB",
    color: "#C628C1",
  },
  {
    name: "Notes",
    Icon: NotesIcon,
    background: "#F5F9F0",
    color: "#78B219",
    route: "/notes",
    loadRecords: async () => (await getNotes()).notes || [],
  },
  {
    name: "Property",
    Icon: Houses,
    background: "#F7EFFB",
    color: "#9E28C6",
  },
  {
    name: "Vehicles",
    Icon: VehiclesIcon,
    background: "#eaf0f5",
    color: "#526f8b",
  },
  {
    name: "Warranties",
    Icon: BadgeCheck,
    background: "#F9EDF3",
    color: "#B31351",
  },
];

const documentSections = [
  ["Identity & Personal", IdCard, "Documents"],
  ["Education & Career", GraduationCap, "Education"],
  ["Finance & Tax", Landmark, "Finance"],
  ["Insurance", HandHeart, "Insurance"],
  ["Property & Home", Houses, "Property"],
  ["Health & Records", HeartPulse, "Health & Reports"],
  ["Legal & Family", Scale, "Legal"],
  ["Bills & Warranties", ReceiptText, "Bills & Renewals"],
  ["Other Documents", FileText, "Documents"],
];

function documentSection(document) {
  if (document.scanStatus) return "Other Documents";
  return documentSections.find(([name]) => name === document.category)?.[0] || "Other Documents";
}

function categoryCountLabel(category, count) {
  if ((!category.loadRecords && category.route !== "/documents") || count === 0) return "None";
  if (count === null) return "Unavailable";
  return count ?? "Loading…";
}

// ==========================================
// FAMILY FILTERS
// ==========================================

const DEFAULT_FAMILY_FILTERS = [
  { id: "all-family", label: "All Family" },
  { id: SELF_PROFILE_ID, label: "Me" },
];

function buildFamilyFilters(members) {
  const valid = (Array.isArray(members) ? members : []).filter(
    (member) => member?.memberId && member.memberId !== SELF_PROFILE_ID
  );
  const relationshipOf = (member) =>
    String(member.relationship || "Family Member").trim() || "Family Member";
  const counts = new Map();
  valid.forEach((member) => {
    const key = relationshipOf(member).toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...DEFAULT_FAMILY_FILTERS, ...valid.map((member) => {
    const relationship = relationshipOf(member);
    return {
      id: member.memberId,
      name: member.name,
      relationship,
      connectedPhotoUrl: member.isConnected ? member.photoUrl || null : undefined,
      label: (member.linkedMemberId || member.memberId === CONNECTED_PROFILE_ID || counts.get(relationship.toLowerCase()) > 1) && member.name
        ? `${relationship} (${member.name})`
        : relationship,
    };
  })];
}

// ==========================================
// CATEGORIES PAGE
// ==========================================

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const documentsOpen = pathname === "/documents";
  const [params, setParams] = useSearchParams();
  const section = documentSections.find(([name]) => name === params.get("section"));
  const recordId = documentsOpen ? params.get("record") : null;
  const showRecordDetails = params.get("view") === "1";
  const { documents, error: documentsError } = useDocuments(true, true, documentsOpen);
  const [downloadError, setDownloadError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [selectedFamily, setSelectedFamily] =
    useState(state?.selectedFamily || "all-family");
  const [managedMembers, setManagedMembers] = useState([]);
  const [familyError, setFamilyError] = useState("");
  const [familyRetry, setFamilyRetry] = useState(0);
  const connectedMember = useConnectedFamilyMember(true, familyRetry);
  const familyFilters = buildFamilyFilters(connectedMember ? [connectedMember, ...managedMembers.filter(({ memberId }) => memberId !== connectedMember.linkedMemberId)] : managedMembers);
  const [recordCounts, setRecordCounts] = useState({});

  useEffect(() => {
    if (documentsOpen) return;
    const controller = new AbortController();

    categories.forEach(({ route, loadRecords, countRecords }) => {
      if (!loadRecords) return;
      loadRecords(controller.signal).then((records) => {
        if (!controller.signal.aborted) {
          const count = countRecords ? countRecords(records) : records.length;
          setRecordCounts((previous) => ({ ...previous, [route]: count }));
        }
      }).catch(() => {
        if (!controller.signal.aborted) {
          setRecordCounts((previous) => ({ ...previous, [route]: null }));
        }
      });
    });

    return () => controller.abort();
  }, [documentsOpen]);

  useEffect(() => {
    let cancelled = false;
    setFamilyError("");
    getFamilyMembers().then((members) => {
      if (cancelled) return;
      const filters = buildFamilyFilters(members);
      setManagedMembers(members);
      setSelectedFamily((previous) =>
        previous === CONNECTED_PROFILE_ID || filters.some((filter) => filter.id === previous) ? previous : "all-family"
      );
    }).catch(() => {
      if (!cancelled) setFamilyError("Unable to load family members.");
    });
    return () => { cancelled = true; };
  }, [familyRetry]);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [showAddMessage, setShowAddMessage] =
    useState(false);

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredCategories = categories.filter(
    (category) =>
      category.name
        .toLowerCase()
        .includes(searchText.toLowerCase())
  );

  // ==========================================
  // CATEGORY NAVIGATION
  // ==========================================

  const selectedDocuments = documents?.filter(
    ({ memberId }) => selectedFamily === "all-family" || (selectedFamily !== CONNECTED_PROFILE_ID && memberId === selectedFamily)
  );
  const documentCount = documentsError ? null : selectedDocuments?.length;
  const query = searchText.trim().toLowerCase();
  const matches = selectedDocuments?.filter(({ fileName }) => fileName.toLowerCase().includes(query));
  const sectionDocuments = matches?.filter((document) => documentSection(document) === section?.[0]);
  const record = selectedDocuments?.find(({ documentId, scanStatus }) => !scanStatus && documentId === recordId);
  const selectedLabel = familyFilters.find(({ id }) => id === selectedFamily)?.label || "All Family";
  const openUpload = () => window.dispatchEvent(new Event(OPEN_DOCUMENT_UPLOAD));

  function openSection(name, id) {
    const next = {};
    if (name) next.section = name;
    if (id) next.record = id;
    setDownloadError("");
    setParams(next);
  }

  function toggleRecordDetails() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (showRecordDetails) next.delete("view");
      else next.set("view", "1");
      return next;
    }, { replace: true });
  }

  function goBack() {
    setDownloadError("");
    if (!documentsOpen) navigate("/my-family");
    else if (recordId) openSection(section?.[0]);
    else if (section) openSection();
    else navigate("/categories", { state: { selectedFamily } });
  }

  function profileLabel(memberId) {
    const profile = familyFilters.find(({ id }) => id === memberId);
    return profile?.name ? `${profile.name} ? ${profile.label}` : profile?.label || "Profile unavailable";
  }

  async function openDocument(documentId) {
    setDownloadError("");
    try {
      window.location.assign(await downloadDocument(documentId));
    } catch (error) {
      setDownloadError(error.message);
    }
  }

  async function removeDocument({ documentId, fileName }) {
    if (deletingId || !window.confirm(`Permanently delete "${fileName}" from FamilyKit?`)) return;
    setDeletingId(documentId);
    setDownloadError("");
    try {
      await deleteDocument(documentId);
      openSection(section?.[0]);
    } catch (error) {
      setDownloadError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  const handleCategoryClick = (category) => {
    if (category.route === "/documents") {
      setSearchOpen(false);
      setSearchText("");
      navigate("/documents", { state: { selectedFamily } });
      return;
    }
    if (category.route) {
      const state = ["/important-contacts", "/diary", "/notes", "/events"].includes(category.route)
        ? { fromCategories: true } : undefined;
      navigate(category.route, { state });
    }

    // Remaining category pages will be connected
    // when their respective screens are created.
  };

  return (
    <main className={documentsOpen ? "fk-cat-page fk-cat-page--documents" : "fk-cat-page"}>
      <div className="fk-cat-container">
        <div className="fk-cat-top fk-glass-header">

          {/* ==========================================
              HEADER
              ========================================== */}

          <header className="fk-cat-header">
            <button
              type="button"
              className="fk-cat-back"
              onClick={goBack}
              aria-label={documentsOpen ? "Back" : "Back to dashboard"}
            >
              <ChevronLeft size={19} />
            </button>

            <h1>{documentsOpen ? record?.fileName || section?.[0] || "Documents" : "Categories"}</h1>

            <div className="fk-cat-header-actions">
              {!recordId && <button
                type="button"
                className="fk-cat-search-btn"
                onClick={() => {
                  setSearchOpen((previous) => !previous);
                  setSearchText("");
                }}
                aria-label={documentsOpen ? "Search documents" : "Search categories"}
              >
                <Search size={17} />
              </button>}

              <button
                type="button"
                className="fk-cat-add-btn"
                onClick={() => documentsOpen
                  ? openUpload() : setShowAddMessage(true)}
                aria-label={documentsOpen ? "Add document" : "Add category"}
              >
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* ==========================================
              SEARCH
              ========================================== */}

          {!recordId && searchOpen && (
            <div className="fk-cat-search-panel">
              <Search size={17} />

              <input
                type="search"
                placeholder={documentsOpen ? "Search documents..." : "Search categories..."}
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                autoFocus
              />
            </div>
          )}

          {/* ==========================================
              FAMILY FILTERS
              ========================================== */}

          <section className="fk-cat-filter-section">
            <p className="fk-cat-filter-label">
              View Records of
            </p>

            <div className="fk-cat-filter-scroll">
              {familyFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`fk-cat-filter ${
                    selectedFamily === filter.id
                      ? "fk-cat-filter-active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedFamily(filter.id)
                  }
                  aria-pressed={
                    selectedFamily === filter.id
                  }
                >
                  {/*
                    All Family: Never display circle.

                    All other filters:
                    Always display circle,
                    even when selected.
                  */}

                  {filter.id !== "all-family" && (
                    <span className="fk-cat-radio" aria-hidden="true">
                      <ProfileAvatar memberId={filter.id} connectedPhotoUrl={filter.connectedPhotoUrl}
                        name={filter.connectedPhotoUrl !== undefined ? filter.name : undefined} className="fk-cat-filter-avatar">
                        {filter.connectedPhotoUrl === undefined ? <span /> : null}
                      </ProfileAvatar>
                    </span>
                  )}

                  <span>{documentsOpen ? filter.label : filter.relationship || filter.label}</span>
                </button>
              ))}
            </div>
            {familyError && (
              <p className="fk-cat-filter-label" role="alert">
                {familyError}{" "}
                <button type="button" onClick={() => setFamilyRetry((n) => n + 1)}>Retry</button>
              </p>
            )}
          </section>

          <h2 id="all-categories-heading" className="fk-cat-grid-heading">
            {documentsOpen ? (!recordId && <>Results for {selectedLabel}
              <small className="fk-cat-doc-total">{(section ? sectionDocuments : matches)?.length ?? ""}{matches && " documents"}</small>
            </>) : "All Categories"}
          </h2>
        </div>

        {/* ==========================================
            CATEGORY GRID
            ========================================== */}

        <section className="fk-cat-content" tabIndex={documentsOpen ? 0 : undefined}
          aria-labelledby={recordId ? undefined : "all-categories-heading"} aria-label={recordId ? "Document details" : undefined}>
          {documentsOpen ? (
            <div className="fk-cat-document-groups">
              {documentsError ? <p role="alert">{documentsError}</p>
                : !matches ? <p role="status">Loading documents...</p>
                : recordId ? (record ? (
                  <section className="fk-cat-document-group fk-cat-document-detail">
                    <FileText size={32} aria-hidden="true" />
                    <h3>{record.fileName}</h3>
                    <p>{profileLabel(record.memberId)}</p>
                    <div className="fk-cat-document-actions fk-cat-document-actions--with-view">
                      <button type="button" aria-expanded={showRecordDetails} aria-controls="fk-document-record-details"
                        onClick={toggleRecordDetails}>
                        <FileText size={18} aria-hidden="true" /> {showRecordDetails ? "Hide" : "View"}
                      </button>
                      <button type="button" onClick={() => openDocument(record.documentId)}>
                        <Download size={18} aria-hidden="true" /> Download
                      </button>
                      <button type="button" disabled={Boolean(deletingId)} onClick={() => removeDocument(record)}>
                        <Trash2 size={18} aria-hidden="true" /> Delete
                      </button>
                    </div>
                    <div id="fk-document-record-details" className="fk-cat-record-details" hidden={!showRecordDetails}>
                      <h4>Document details</h4>
                      <dl>
                        <div><dt>File name</dt><dd>{record.fileName}</dd></div>
                        <div><dt>Family profile</dt><dd>{profileLabel(record.memberId)}</dd></div>
                        {record.contentType && <div><dt>File type</dt><dd>{record.contentType}</dd></div>}
                        {Number.isFinite(record.sizeBytes) && <div><dt>File size</dt><dd>{new Intl.NumberFormat().format(record.sizeBytes)} bytes</dd></div>}
                        {record.createdAt && Number.isFinite(Date.parse(record.createdAt)) &&
                          <div><dt>Uploaded</dt><dd>{new Date(record.createdAt).toLocaleDateString()}</dd></div>}
                      </dl>
                      <p>This upload has no saved scan results.</p>
                      {scannerAvailable && <Link to="/documents/scanner">Open Document Scanner</Link>}
                    </div>
                  </section>
                ) : <p role="status">This document is unavailable for the selected profile.</p>)
                : !(section ? sectionDocuments : matches).length ? (
                  <div className="fk-cat-doc-empty">
                    <img src={emptyDocumentsArt} alt="" />
                    <p role="status">No Results</p>
                    <button type="button" className="fk-cat-doc-scan" onClick={openUpload}>
                      <ScanLine size={16} aria-hidden="true" /> Scan Documents
                    </button>
                  </div>
                ) : section ? sectionDocuments.map((document) => {
                  if (document.scanStatus) {
                    return <ScannedDocumentCard key={document.documentId} item={document}
                      profileName={profileLabel(document.memberId)} />;
                  }
                  const Icon = section[1];
                  return <button className="fk-cat-document-tile" type="button" key={document.documentId}
                    onClick={() => openSection(section[0], document.documentId)}>
                    <span className="fk-cat-document-tile-icon"><Icon size={20} aria-hidden="true" /></span>
                    <span><strong>{document.fileName}</strong><small>{profileLabel(document.memberId)}</small></span>
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>;
                }) : documentSections.map(([name, Icon, theme]) => {
                  const count = matches.filter((document) => documentSection(document) === name).length;
                  const colors = categories.find((category) => category.name === theme);
                  return <button className="fk-cat-document-tile" type="button" key={name} onClick={() => openSection(name)}>
                    <span className="fk-cat-document-tile-icon" style={{ background: colors.background, color: colors.color }}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span><strong>{name}</strong><small>{count} {count === 1 ? "document" : "documents"}</small></span>
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>;
                })}
              {downloadError && <p role="alert">{downloadError}</p>}
            </div>
          ) : <>
          <div className="fk-cat-grid">
            {filteredCategories.map((category) => {
              const Icon = category.Icon;

              return (
                <button
                  key={category.name}
                  type="button"
                  className="fk-cat-card"
                  onClick={() =>
                    handleCategoryClick(category)
                  }
                >
                  <span
                    className="fk-cat-icon-box"
                    style={{
                      background: category.background,
                      color: category.color,
                    }}
                  >
                    <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <span className="fk-cat-card-name">
                    {category.name}
                  </span>

                  <span className="fk-cat-card-count">
                    {categoryCountLabel(category, category.route === "/documents" ? documentCount : recordCounts[category.route])}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <p className="fk-cat-no-results">
              No matching categories found.
            </p>
          )}
          </>}
        </section>
      </div>

      {/* ==========================================
          BOTTOM NAVIGATION
          ========================================== */}

      <FamilyBottomNav active="category" />

      {/* ==========================================
          ADD PLACEHOLDER MODAL
          ========================================== */}

      {showAddMessage && (
        <div
          className="fk-cat-modal-overlay"
          onClick={() =>
            setShowAddMessage(false)
          }
        >
          <div
            className="fk-cat-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Add New Item</h2>

            <p>
              Category creation will be connected
              in the next development step.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowAddMessage(false)
              }
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
