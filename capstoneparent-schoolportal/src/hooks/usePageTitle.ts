import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Home | Parent-School Portal',
  '/announcements': 'Announcements | Parent-School Portal',
  '/forgotpassword': 'Forgot Password | Parent-School Portal',
  '/login': 'Login | Parent-School Portal',
  '/register': 'Register | Parent-School Portal',
  '/partnership&events' : 'Partnership & Events | Parent-School Portal',

  '/contactus': 'Contact Us | Parent-School Portal',
  '/history': 'History | Parent-School Portal',
  '/orginizationalchart': 'Orginizational Chart | Parent-School Portal',
  '/schoolcalendar': 'School Calendar | Parent-School Portal',
  '/transparency': 'Transparency | Parent-School Portal',
  '/visionandmission': 'Vision And Mission | Parent-School Portal',

  '/parentview': 'Parent View | Parent-School Portal',
  '/classschedule': 'Class Schedule | Parent-School Portal',
  '/quarterlygrades': 'Quarterly Grades | Parent-School Portal',
  '/libraryrecords': 'Library Records | Parent-School Portal',

  '/adminview': 'Admin Dashboard | Parent-School Portal',
  '/manageparentverification': 'Manage Parent Verification | Parent-School Portal',
  '/managestudents': 'Manage Students | Parent-School Portal',
  '/managesections': 'Manage Sections | Parent-School Portal',
  '/managestaffaccounts': 'Manage Staff Accounts | Parent-School Portal',

  '/teacherview': 'Teacher Dashboard | Parent-School Portal',
  '/classlist': 'Class List | Parent-School Portal',

  '/staffview': 'Staff Dashboard | Parent-School Portal',
  '/generalannouncement': 'General Announcement | Parent-School Portal',
  '/staffannouncement': 'Staff Announcement | Parent-School Portal',
  '/memorandumannouncement': 'Memorandum Announcement | Parent-School Portal',

  '/librarianview': 'Librarian Dashboard | Parent-School Portal',
  '/managebooks': 'Manage Books | Parent-School Portal',
  '/managelearningresources': 'Manage Learning Resources | Parent-School Portal',
  '/borrowedresources': 'Borrowed Resources | Parent-School Portal',
  '/managecategories': 'Manage Categories | Parent-School Portal',
  
  
}

export const usePageTitle = () => {
  const location = useLocation()

  useEffect(() => {
    const title = location.pathname.startsWith('/partnership&events/')
      ? 'Event Details | Parent-School Portal'
      : pageTitles[location.pathname] || 'Pagsabungan Elementary School | Parent-School Portal'
    document.title = title
  }, [location.pathname])
}
