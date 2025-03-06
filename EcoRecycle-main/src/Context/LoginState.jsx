import { createContext, useState } from "react";

export const LoginStatee = createContext();

const LoginStateProvider = ({ children }) => {
  const [LoginState, setLoginState] = useState(false);
  return (
    <LoginStatee.Provider value={{ LoginState, setLoginState }}>
      {children}
    </LoginStatee.Provider>
  );
};

export default LoginStateProvider;
