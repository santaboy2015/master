
// Simulated Firebase Module
// This module provides empty exports to satisfy imports while the app uses the Local Persistence Layer.
export const auth = {} as any;
export const db = {} as any;
export const functions = {} as any;

export const initializeApp = () => ({});
export const getAuth = () => auth;
export const getFirestore = () => db;
export const getFunctions = () => functions;
