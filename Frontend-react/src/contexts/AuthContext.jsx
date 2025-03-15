// src/contexts/AuthContext.jsx
import  { createContext, useContext, useReducer } from "react";
import { isAuthenticated, getRole, logout as logoutService } from "../services/AuthService";

const AuthContext = createContext();

const initialState = {
  isAuthenticated: isAuthenticated(),
  role: getRole(),
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN": {
      return {
        ...state,
        isAuthenticated: true,
        role: action.payload.role,
      };
    }
    case "LOGOUT": {
      return {
        ...state,
        isAuthenticated: false,
        role: null,
      };
    }
    default:
      return state;
  }
}


// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // We call this after a successful login in the AuthService
  const login = (token, role) => {
    dispatch({ type: "LOGIN", payload: { role } });
  };

  const logout = () => {
    logoutService(); // Clears localStorage
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
