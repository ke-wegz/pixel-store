import { Navigate, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AdminPage } from "./pages/AdminPage";
import { StorePage } from "./pages/StorePage";

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </LanguageProvider>
  );
}
