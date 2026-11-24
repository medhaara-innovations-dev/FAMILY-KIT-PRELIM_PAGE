import { Plus } from "lucide-react";

export default function DesktopNavHeader({ onAdd }) {
  return (
    <div className="fk-desktop-nav-header">
      <strong>FamilyKit</strong>
      <button type="button" onClick={onAdd} aria-label="Add family member">
        <Plus size={20} aria-hidden="true" />
        Add
      </button>
    </div>
  );
}
