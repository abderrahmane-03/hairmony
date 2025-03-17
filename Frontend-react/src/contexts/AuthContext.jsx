import { createContext, useContext, useReducer } from "react";
import { isAuthenticated, getRole, getUserId, logout as logoutService } from "../services/AuthService";

const AuthContext = createContext();

const initialState = {
    isAuthenticated: isAuthenticated(),
    role: getRole(),
    userId: getUserId(),
  };
  

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN": {
        return {
          ...state,
          isAuthenticated: true,
          role: action.payload.role,
          userId: action.payload.userId,
        };
      }
      
    case "LOGOUT": {
      return {
        ...state,
        isAuthenticated: false,
        role: null,
        userId: null,
      };
    }
    default:
      return state;
  }
}

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = (token, role, userId) => {
    dispatch({ type: "LOGIN", payload: { role, userId } });
  };

  const logout = () => {
    logoutService(); // Clears localStorage
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
