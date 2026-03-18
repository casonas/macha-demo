// Central data-service barrel. The app currently imports the local/mock-backed
// assessment/profile APIs from here, while Firestore sync happens inside that
// implementation rather than via a separate exported provider layer.
export * from './mockDb';
