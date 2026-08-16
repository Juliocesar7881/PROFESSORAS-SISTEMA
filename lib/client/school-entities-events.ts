export const SCHOOL_ENTITIES_CHANGED_EVENT = "pequenos-passos:school-entities-changed";

export type SchoolEntitiesChangedDetail = {
  source?: string;
};

export function announceSchoolEntitiesChanged(source?: string) {
  window.dispatchEvent(new CustomEvent<SchoolEntitiesChangedDetail>(SCHOOL_ENTITIES_CHANGED_EVENT, {
    detail: { source },
  }));
}
