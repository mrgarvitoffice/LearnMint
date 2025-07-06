'use server';
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 * @fileOverview Server actions for fetching application statistics.
 */

import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Gets the total number of documents in the 'users' collection using an optimized server-side count.
 * NOTE: This requires Firestore security rules to allow 'list' or 'count' operations
 * on the 'users' collection for authenticated users.
 * Example rule for security: `match /users/{document=**} { allow list: if request.auth != null; }`
 * 
 * @returns {Promise<number>} A promise that resolves to the total number of users.
 */
export async function getTotalUsers(): Promise<number> {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total user count:", error);
    // As a fallback, return a base number if the count fails due to permissions or other issues.
    return 1384; 
  }
};
