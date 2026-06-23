import { createContext, useContext, useState } from "react";
import AlertToast from "../components/common/AlertToast";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message, title = "") => {
    setAlert({ type, message, title });

    setTimeout(() => {
      setAlert(null);
    }, 3500);
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    //Adding .
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <AlertToast
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}