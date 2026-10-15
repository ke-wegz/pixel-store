import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
import dotenv from "dotenv";
import { seedGames } from "../src/data/seedGames.js";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

console.log("Connecting to Firebase project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log(`Writing ${seedGames.length} games to Firestore collection 'games'...`);
    for (const game of seedGames) {
      await setDoc(doc(db, "games", game.id), game, { merge: true });
      console.log(`✓ Seeded game: ${game.id} (${game.title})`);
    }

    console.log("Verifying games in Firestore...");
    const snap = await getDocs(collection(db, "games"));
    console.log(`🎉 SUCCESS: Found ${snap.docs.length} documents in Firestore 'games' collection!`);
  } catch (error) {
    console.error("❌ Firebase error:", error);
  }
  process.exit(0);
}

run();
