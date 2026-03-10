import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

{/*General Pages */}
import { Announcements } from "./Pages/general-pages/Announcements";
import { ForgotPassword } from "./Pages/general-pages/ForgotPassword";
import { HomePage } from "./Pages/general-pages/HomePage";
import { Login } from "./Pages/general-pages/Login";
import { PartnershipAndEvents } from "./Pages/general-pages/PartnershipAndEvents";
import { PartnershipAndEventsCard } from "./Pages/general-pages/PartnershipAndEventsCard";
import { Register } from "./Pages/general-pages/Register";

{/*General Sub Pages */}
import { ContactUs } from "./Pages/general-pages/sub-pages/ContactUs";
import { History } from "./Pages/general-pages/sub-pages/History";
import { OrginizationalChart } from "./Pages/general-pages/sub-pages/OrginizationalChart";
import { SchoolCalendar } from "./Pages/general-pages/sub-pages/SchoolCalendar";
import { Transparency } from "./Pages/general-pages/sub-pages/Transparency";
import { VisionAndMission } from "./Pages/general-pages/sub-pages/VisionAndMission";

{/*Parent Pages */}
import { ParentView } from "./Pages/parent-pages/ParentView";
import { ClassSchedule } from "./Pages/parent-pages/ClassSchedule";
import { QuarterlyGrades } from "./Pages/parent-pages/QuarterlyGrades";
import { LibraryRecords } from "./Pages/parent-pages/LibraryRecords";

{/*Admin Sub Pages */}
import { AdminView } from "./Pages/admin-pages/AdminView";
import { ManageParentVerification } from "./Pages/admin-pages/ManageParentVerification";
import { ManageSection } from "./Pages/admin-pages/ManageSection";
import { ManageStaffAccounts } from "./Pages/admin-pages/ManageStaffAccounts";
import { ManageStudents } from "./Pages/admin-pages/ManageStudents";

{/*Teacher Sub Pages */}
import { TeacherView } from "./Pages/teacher-pages/TeacherView";
import { ClassList } from "./Pages/teacher-pages/ClassList";

{/*Staff Sub Pages */}
import { StaffView } from "./Pages/staff-pages/StaffView";
import { EditGeneralAnnouncement } from "./Pages/staff-pages/edit-announcement-pages/EditGeneralAnnouncement";
import { EditStaffAnnouncement } from "./Pages/staff-pages/edit-announcement-pages/EditStaffAnnoucement";
import { EditMemorandumAnnouncement } from "./Pages/staff-pages/edit-announcement-pages/EditMemorandumAnnouncement";

{/*Librarian Sub Pages */}
import { LibrarianView } from "./Pages/librarian-pages/LibrarianView";
import { ManageBooks } from "./Pages/librarian-pages/ManageBooks";
import { ManageLearningResources } from "./Pages/librarian-pages/ManageLearningResources";
import { BorrowedResources } from "./Pages/librarian-pages/BorrowedResources";
import { ManageCategories } from "./Pages/librarian-pages/ManageCategories";

import { usePageTitle } from "./hooks/usePageTitle";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import "./styles/index.css";

const App = () => {
  usePageTitle();
  
  return (
    <Routes>
      {/*General Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/partnership&events" element={<PartnershipAndEvents />} />
      <Route path="/partnership&events/:eventSlug" element={<PartnershipAndEventsCard />} />

      {/*General Sub Pages */}
      <Route path="/contactus" element={<ContactUs />} />
      <Route path="/history" element={<History />} />
      <Route path="/orginizationalchart" element={<OrginizationalChart />} />
      <Route path="/schoolcalendar" element={<SchoolCalendar />} />
      <Route path="/transparency" element={<Transparency />} />
      <Route path="/visionandmission" element={<VisionAndMission />} />

      {/*Parent Pages */}
      <Route
        path="/parentview"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classschedule"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ClassSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quarterlygrades"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <QuarterlyGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraryrecords"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <LibraryRecords />
          </ProtectedRoute>
        }
      />

      {/*Admin Sub Pages */}
      <Route
        path="/adminview"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manageparentverification"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageParentVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managestudents"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managesections"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageSection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managestaffaccounts"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageStaffAccounts />
          </ProtectedRoute>
        }
      />

      {/*Teacher Sub Pages (Some routes are in admin)*/}
      <Route
        path="/teacherview"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classlist"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <ClassList />
          </ProtectedRoute>
        }
      />

      {/*Staff Sub Pages */}
      <Route
        path="/staffview"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generalannouncement"
        element={
          <ProtectedRoute allowedRoles={["admin", "teacher", "staff"]}>
            <EditGeneralAnnouncement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staffannouncement"
        element={
          <ProtectedRoute allowedRoles={["admin", "teacher", "staff"]}>
            <EditStaffAnnouncement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/memorandumannouncement"
        element={
          <ProtectedRoute allowedRoles={["admin", "teacher", "staff"]}>
            <EditMemorandumAnnouncement />
          </ProtectedRoute>
        }
      />

      {/*Librarian Sub Pages */}
      <Route
        path="/librarianview"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <LibrarianView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managebooks"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <ManageBooks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managelearningresources"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <ManageLearningResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/borrowedresources"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <BorrowedResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/managecategories"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <ManageCategories />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
