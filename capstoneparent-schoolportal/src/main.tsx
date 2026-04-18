import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

{
  /*General Pages */
}
import { Announcements } from "./Pages/general-pages/Announcements";
import { ForgotPassword } from "./Pages/general-pages/ForgotPassword";
import { HomePage } from "./Pages/general-pages/HomePage";
import { Login } from "./Pages/general-pages/Login";
import { PartnershipAndEvents } from "./Pages/general-pages/PartnershipAndEvents";
import { PartnershipAndEventsCard } from "./Pages/general-pages/PartnershipAndEventsCard";
import { Register } from "./Pages/general-pages/Register";
import { ResetPassword } from "./Pages/general-pages/ResetPassword";

{
  /*General Sub Pages */
}
import { ContactUs } from "./Pages/general-pages/sub-pages/ContactUs";
import { History } from "./Pages/general-pages/sub-pages/History";
import { OrganizationalChart } from "./Pages/general-pages/sub-pages/OrganizationalChart";
import { SchoolCalendar } from "./Pages/general-pages/sub-pages/SchoolCalendar";
import { Transparency } from "./Pages/general-pages/sub-pages/Transparency";
import { VisionAndMission } from "./Pages/general-pages/sub-pages/VisionAndMission";

{
  /*Parent Pages */
}
import { ParentView } from "./Pages/parent-pages/ParentView";
import { ClassSchedule } from "./Pages/parent-pages/ClassSchedule";
import { QuarterlyGrades } from "./Pages/parent-pages/QuarterlyGrades";
import { LibraryRecords } from "./Pages/parent-pages/LibraryRecords";

{
  /*Admin Sub Pages */
}
import { ManageParentVerification } from "./Pages/admin-pages/ManageParentVerification";
import { ManageSection } from "./Pages/admin-pages/ManageSection";
import { ManageStaffAccounts } from "./Pages/admin-pages/ManageStaffAccounts";
import { ManageStudents } from "./Pages/admin-pages/ManageStudents";
import { ManageSubjects } from "./Pages/admin-pages/ManageSubjects";
import { ManagePartnershipAndEvents } from "./Pages/admin-pages/ManagePartnershipAndEvents";
import { EditContactUs } from "./Pages/admin-pages/edit-pages/EditContactUs";
import { EditHistory } from "./Pages/admin-pages/edit-pages/EditHistory";
import { EditPartnershipAndEventsDetails } from "./Pages/admin-pages/edit-pages/EditPartnershipAndEventsDetails";

{
  /*Teacher Sub Pages */
}
import { ClassList } from "./Pages/teacher-pages/ClassList";

{
  /*Staff Sub Pages */
}

{
  /*Librarian Sub Pages */
}
import { ManageBooks } from "./Pages/librarian-pages/ManageBooks";
import { ManageLearningResources } from "./Pages/librarian-pages/ManageLearningResources";
import { BorrowedResources } from "./Pages/librarian-pages/BorrowedResources";
import { ManageCategories } from "./Pages/librarian-pages/ManageCategories";

{
  /*Principal Pages*/
}
import { ManageClassLists } from "./Pages/principal-pages/ManageClassLists";

import { usePageTitle } from "./hooks/usePageTitle";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { GlobalApiFeedback } from "./components/ui/GlobalApiFeedback";
import { PrivacyPolicyGuard } from "./components/auth/PrivacyPolicyGuard";
import "./styles/index.css";

const App = () => {
  usePageTitle();

  return (
    <>
      <GlobalApiFeedback />
      <PrivacyPolicyGuard />
      <Routes>
        {/*General Pages */}
        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generalannouncement"
          element={
            <ProtectedRoute>
              <Navigate to="/announcements" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staffannouncement"
          element={
            <ProtectedRoute>
              <Navigate to="/announcements" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memorandumannouncement"
          element={
            <ProtectedRoute>
              <Navigate to="/announcements" replace />
            </ProtectedRoute>
          }
        />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/partnership&events" element={<PartnershipAndEvents />} />
        <Route
          path="/partnership&events/:eventSlug"
          element={<PartnershipAndEventsCard />}
        />

        {/*General Sub Pages */}
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/history" element={<History />} />
        <Route path="/organizationalchart" element={<OrganizationalChart />} />
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
          path="/manageparentverification"
          element={
            <ProtectedRoute allowedRoles={["admin", "teacher"]}>
              <ManageParentVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managestudents"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "teacher", "principal"]}
            >
              <ManageStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managesections"
          element={
            <ProtectedRoute allowedRoles={["admin", "principal"]}>
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
        <Route
          path="/managesubjects"
          element={
            <ProtectedRoute allowedRoles={["admin", "principal"]}>
              <ManageSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managepartnershipandevents"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManagePartnershipAndEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-edit-event/:eventId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditPartnershipAndEventsDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editcontactus"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditContactUs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-org-chart"
          element={<Navigate to="/organizationalchart" replace />}
        />
        <Route
          path="/edithistory"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditHistory />
            </ProtectedRoute>
          }
        />

        {/*Teacher Sub Pages (Some routes are in admin)*/}
        <Route
          path="/classlist"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <ClassList />
            </ProtectedRoute>
          }
        />

        {/*Librarian Sub Pages */}
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

        {/* Principal Pages */}
        <Route
          path="/manageclasslists"
          element={
            <ProtectedRoute allowedRoles={["principal"]}>
              <ManageClassLists />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
