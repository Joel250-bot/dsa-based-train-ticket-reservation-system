/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore with specific database ID if provided in the config
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Initialize Authentication
const auth = getAuth(app);

export { app, db, auth };
export default app;
