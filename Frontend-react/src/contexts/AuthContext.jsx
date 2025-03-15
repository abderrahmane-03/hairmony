// import { createContext, useEffect, useState } from 'react';
// import keycloak from '../services/KeycloakService';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [initialized, setInitialized] = useState(false);
//   const [authenticated, setAuthenticated] = useState(false);

//   useEffect(() => {
//     // Initialize keycloak with a login-required option if you want to force login,
//     // or use 'check-sso' to check existing SSO session.
//     keycloak
//       .init({ onLoad: 'check-sso', promiseType: 'native' })
//       .then((auth) => {
//         setAuthenticated(auth);
//         setInitialized(true);
//       })
//       .catch((err) => {
//         console.error('Keycloak initialization error:', err);
//       });
//   }, []);

//   if (!initialized) {
//     return <div>Loading authentication...</div>;
//   }

//   return (
//     <AuthContext.Provider value={{ keycloak, authenticated }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };