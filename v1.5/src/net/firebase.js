// Instalator: lazy Firebase (anonymous auth + RTDB on the shared gzowos-games project) used only for signaling and the relay fallback.

const SDK = "https://www.gstatic.com/firebasejs/10.12.5";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAaTuELH_mToxH3hRJ4WPIVTECSH7Z8-FY",
  authDomain: "gzowos-games.firebaseapp.com",
  databaseURL: "https://gzowos-games-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gzowos-games",
  storageBucket: "gzowos-games.firebasestorage.app",
  messagingSenderId: "658227201482",
  appId: "1:658227201482:web:627b44e3c4c2988bc4bb33"
};

export const ROOT = new URLSearchParams(location.search).get("realm") === "test" ? "instalatorTest" : "instalator";

let pending = null;

function timeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("firebase-timeout")), ms))]);
}

export function fb(ms = 10000) {
  if (pending) return pending;
  pending = (async () => {
    const [A, U, D] = await timeout(Promise.all([
      import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-database.js`)
    ]), ms);
    const app = A.getApps().length ? A.getApp() : A.initializeApp(FIREBASE_CONFIG);
    const auth = U.getAuth(app);
    await timeout(auth.authStateReady ? auth.authStateReady() : Promise.resolve(), ms);
    if (!auth.currentUser) await timeout(U.signInAnonymously(auth), ms);
    const db = D.getDatabase(app);
    return {
      ref: (path) => D.ref(db, `${ROOT}/${path}`),
      get: async (r) => (await D.get(r)).val(),
      set: (r, v) => D.set(r, v),
      remove: (r) => D.remove(r),
      push: (r, v) => D.push(r, v),
      onValue: (r, cb) => D.onValue(r, (s) => cb(s.val(), s.key)),
      onChildAdded: (r, cb) => D.onChildAdded(r, (s) => cb(s.val(), s.key)),
      onChildRemoved: (r, cb) => D.onChildRemoved(r, (s) => cb(s.val(), s.key)),
      runTransaction: async (r, fn) => {
        const res = await D.runTransaction(r, fn);
        return { committed: !!res.committed, value: res.snapshot ? res.snapshot.val() : null };
      },
      onDisconnectRemove: (r) => D.onDisconnect(r).remove(),
      cancelDisconnect: (r) => D.onDisconnect(r).cancel(),
      serverTimestamp: () => D.serverTimestamp()
    };
  })();
  pending.catch(() => { pending = null; });
  return pending;
}
