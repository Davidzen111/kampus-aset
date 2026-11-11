import { Navigate, Route, Routes } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/admin/Dashboard";
import KelolaAset from "./pages/admin/KelolaAset";
import KelolaUser from "./pages/admin/KelolaUser";
import VerifikasiAkun from "./pages/admin/VerifikasiAkun";
import Pengajuan from "./pages/admin/Pengajuan";
import Pengembalian from "./pages/admin/Pengembalian";
import Riwayat from "./pages/admin/Riwayat";
import Laporan from "./pages/admin/Laporan";

import Beranda from "./pages/user/Beranda";
import CariAset from "./pages/user/CariAset";
import DetailAset from "./pages/user/DetailAset";
import UserPengembalian from "./pages/user/Pengembalian";
import StatusRiwayat from "./pages/user/StatusRiwayat";
import Profil from "./pages/Profil";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={<RequireRole role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="aset" element={<KelolaAset />} />
          <Route path="user" element={<KelolaUser />} />
          <Route path="verifikasi" element={<VerifikasiAkun />} />
          <Route path="pengajuan" element={<Pengajuan />} />
          <Route path="pengembalian" element={<Pengembalian />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="profil" element={<Profil />} />
        </Route>
      </Route>

      <Route path="/user" element={<RequireRole role="user" />}>
        <Route element={<UserLayout />}>
          <Route index element={<Navigate to="beranda" replace />} />
          <Route path="beranda" element={<Beranda />} />
          <Route path="cari-aset" element={<CariAset />} />
          <Route path="detail-aset" element={<DetailAset />} />
          <Route path="pengembalian" element={<UserPengembalian />} />
          <Route path="status-riwayat" element={<StatusRiwayat />} />
          <Route path="profil" element={<Profil />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}